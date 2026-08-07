import { Router } from 'express'
import { pool, query } from '../db/index.js'
import { notifyOwnerNewOrder } from '../telegram.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireShopId } from '../middleware/shop.js'

const router = Router()

router.use(requireShopId)

// Retryable error codes: deadlock (40P01), serialization failure (40001),
// connection timeout (57014), pool timeout (ECONNREFUSED-like from pg)
function isRetryable(err) {
  return ['40P01', '40001', '57014'].includes(err.code) || err.message?.includes('timeout')
}

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
      payment_type = 'prepaid',
      payment_due_date = null,
      payment_method = 'card',
    } = req.body

    if (!customer_name || !phone || !address || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Заполните все обязательные поля и добавьте товары' })
    }

    const safePaymentType = ['prepaid', 'credit'].includes(payment_type) ? payment_type : 'prepaid'
    const paymentStatus = safePaymentType === 'credit' ? 'pending' : 'paid'
    const safePaymentMethod = ['cash', 'card', 'click', 'payme', 'uzum'].includes(payment_method)
      ? payment_method
      : 'card'

    const total = items.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    )

    // Collect product ids that need stock updates, sorted ascending to prevent deadlocks
    const productIdsForStock = [
      ...new Set(items.filter((i) => i.product_id && i.size).map((i) => i.product_id)),
    ].sort((a, b) => a - b)

    const MAX_ATTEMPTS = 3
    let lastErr

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')

        // Lock the shop row to serialize shop_order_number generation — prevents
        // two concurrent transactions from reading the same MAX and producing duplicates
        await client.query('SELECT id FROM shops WHERE id = $1 FOR UPDATE', [req.shopId])

        const numResult = await client.query(
          'SELECT COALESCE(MAX(shop_order_number), 0) + 1 AS next FROM orders WHERE shop_id = $1',
          [req.shopId]
        )
        const shopOrderNumber = numResult.rows[0].next

        const orderResult = await client.query(
          `INSERT INTO orders
            (shop_id, telegram_user_id, telegram_username, customer_name, phone, address, comment, total, status, payment_type, payment_due_date, payment_status, shop_order_number, payment_method)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'new', $9, $10, $11, $12, $13)
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
            safePaymentType,
            payment_due_date || null,
            paymentStatus,
            shopOrderNumber,
            safePaymentMethod,
          ]
        )
        const order = orderResult.rows[0]

        // Pre-lock all products in consistent (ascending id) order to prevent deadlocks
        if (productIdsForStock.length > 0) {
          await client.query(
            'SELECT id, sizes_stock FROM products WHERE id = ANY($1) FOR UPDATE',
            [productIdsForStock]
          )
        }

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
              'SELECT sizes_stock FROM products WHERE id = $1',
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

        return res.status(201).json({ ...order, items: insertedItems })
      } catch (err) {
        await client.query('ROLLBACK')
        if (isRetryable(err) && attempt < MAX_ATTEMPTS) {
          lastErr = err
          await new Promise((r) => setTimeout(r, 50 * attempt))
          continue
        }
        throw err
      } finally {
        client.release()
      }
    }

    throw lastErr
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
