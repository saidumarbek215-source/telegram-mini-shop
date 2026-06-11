import { Router } from 'express'
import { pool, query } from '../db/index.js'
import { notifyOwnerNewOrder } from '../telegram.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireShopId } from '../middleware/shop.js'

const router = Router()

router.use(requireShopId)

// POST /api/orders?shop_id=1 - place a new order
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const {
      telegram_user_id,
      telegram_username,
      customer_name,
      phone,
      address,
      comment,
      items,
    } = req.body

    if (!customer_name || !phone || !address || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Заполните все обязательные поля и добавьте товары' })
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const total = items.reduce(
        (sum, item) => sum + Number(item.price) * Number(item.quantity),
        0
      )

      const orderResult = await client.query(
        `INSERT INTO orders
          (shop_id, telegram_user_id, telegram_username, customer_name, phone, address, comment, total, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'new')
         RETURNING *`,
        [
          req.shopId,
          telegram_user_id || null,
          telegram_username || null,
          customer_name,
          phone,
          address,
          comment || '',
          total,
        ]
      )
      const order = orderResult.rows[0]

      const insertedItems = []
      for (const item of items) {
        const itemResult = await client.query(
          `INSERT INTO order_items
            (order_id, product_id, product_name, image_url, price, quantity, size, color)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [
            order.id,
            item.product_id || null,
            item.product_name,
            item.image_url || '',
            item.price,
            item.quantity,
            item.size || null,
            item.color || null,
          ]
        )
        insertedItems.push(itemResult.rows[0])

        if (item.product_id && item.size) {
          const productResult = await client.query(
            'SELECT sizes_stock FROM products WHERE id = $1 FOR UPDATE',
            [item.product_id]
          )
          const sizesStock = productResult.rows[0]?.sizes_stock
          if (sizesStock && Object.prototype.hasOwnProperty.call(sizesStock, item.size)) {
            sizesStock[item.size] = Math.max(
              0,
              Number(sizesStock[item.size] || 0) - Number(item.quantity || 1)
            )
            await client.query('UPDATE products SET sizes_stock = $1 WHERE id = $2', [
              sizesStock,
              item.product_id,
            ])
          }
        }
      }

      await client.query('COMMIT')

      const shopResult = await client.query('SELECT * FROM shops WHERE id = $1', [req.shopId])
      notifyOwnerNewOrder(order, insertedItems, shopResult.rows[0]).catch((err) =>
        console.error('Owner notification failed:', err)
      )

      res.status(201).json({ ...order, items: insertedItems })
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  })
)

// GET /api/orders/user/:telegramUserId?shop_id=1 - order history for a customer
router.get(
  '/user/:telegramUserId',
  asyncHandler(async (req, res) => {
    const { telegramUserId } = req.params
    const ordersResult = await query(
      'SELECT * FROM orders WHERE telegram_user_id = $1 AND shop_id = $2 ORDER BY created_at DESC',
      [telegramUserId, req.shopId]
    )
    const orders = ordersResult.rows

    for (const order of orders) {
      const itemsResult = await query('SELECT * FROM order_items WHERE order_id = $1', [
        order.id,
      ])
      order.items = itemsResult.rows
    }

    res.json(orders)
  })
)

export default router
