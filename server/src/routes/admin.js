import { Router } from 'express'
import { query } from '../db/index.js'
import { requireOwner } from '../middleware/auth.js'
import { ORDER_STATUSES } from '../constants.js'
import { notifyCustomerStatusChange } from '../telegram.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.use(asyncHandler(requireOwner))

// GET /api/admin/check - used by the Mini App to decide whether to show the admin UI
router.get('/check', (req, res) => {
  res.json({
    isOwner: true,
    shop: { id: req.shop.id, name: req.shop.name, currency: req.shop.currency },
  })
})

/* ---------------------------- Products ---------------------------- */

router.get(
  '/products',
  asyncHandler(async (req, res) => {
    const result = await query(
      'SELECT * FROM products WHERE shop_id = $1 ORDER BY sort_order ASC, id ASC',
      [req.shop.id]
    )
    res.json(result.rows)
  })
)

router.post(
  '/products',
  asyncHandler(async (req, res) => {
    const {
      name,
      description = '',
      price,
      old_price = null,
      image_url,
      category_id = null,
      sizes = [],
      colors = [],
      sizes_stock = {},
      in_stock = true,
      sort_order = 0,
    } = req.body

    if (!name || price === undefined || !image_url) {
      return res.status(400).json({ error: 'name, price и image_url обязательны' })
    }

    const result = await query(
      `INSERT INTO products
        (shop_id, name, description, price, old_price, image_url, category_id, sizes, colors, sizes_stock, in_stock, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [req.shop.id, name, description, price, old_price, image_url, category_id, sizes, colors, sizes_stock, in_stock, sort_order]
    )
    res.status(201).json(result.rows[0])
  })
)

router.put(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const {
      name,
      description = '',
      price,
      old_price = null,
      image_url,
      category_id = null,
      sizes = [],
      colors = [],
      sizes_stock = {},
      in_stock = true,
      sort_order = 0,
    } = req.body

    if (!name || price === undefined || !image_url) {
      return res.status(400).json({ error: 'name, price и image_url обязательны' })
    }

    const result = await query(
      `UPDATE products
       SET name = $1, description = $2, price = $3, old_price = $4, image_url = $5,
           category_id = $6, sizes = $7, colors = $8, sizes_stock = $9, in_stock = $10, sort_order = $11
       WHERE id = $12 AND shop_id = $13
       RETURNING *`,
      [name, description, price, old_price, image_url, category_id, sizes, colors, sizes_stock, in_stock, sort_order, req.params.id, req.shop.id]
    )

    if (!result.rows.length) return res.status(404).json({ error: 'Товар не найден' })
    res.json(result.rows[0])
  })
)

router.delete(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const result = await query('DELETE FROM products WHERE id = $1 AND shop_id = $2 RETURNING id', [
      req.params.id,
      req.shop.id,
    ])
    if (!result.rows.length) return res.status(404).json({ error: 'Товар не найден' })
    res.json({ success: true })
  })
)

/* --------------------------- Categories ---------------------------- */

router.get(
  '/categories',
  asyncHandler(async (req, res) => {
    const result = await query(
      'SELECT * FROM categories WHERE shop_id = $1 ORDER BY sort_order ASC, id ASC',
      [req.shop.id]
    )
    res.json(result.rows)
  })
)

router.post(
  '/categories',
  asyncHandler(async (req, res) => {
    const { name, icon = '👟', sort_order = 0 } = req.body
    if (!name) return res.status(400).json({ error: 'name обязателен' })

    const result = await query(
      'INSERT INTO categories (shop_id, name, icon, sort_order) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.shop.id, name, icon, sort_order]
    )
    res.status(201).json(result.rows[0])
  })
)

router.put(
  '/categories/:id',
  asyncHandler(async (req, res) => {
    const { name, icon = '👟', sort_order = 0 } = req.body
    if (!name) return res.status(400).json({ error: 'name обязателен' })

    const result = await query(
      'UPDATE categories SET name = $1, icon = $2, sort_order = $3 WHERE id = $4 AND shop_id = $5 RETURNING *',
      [name, icon, sort_order, req.params.id, req.shop.id]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Категория не найдена' })
    res.json(result.rows[0])
  })
)

router.delete(
  '/categories/:id',
  asyncHandler(async (req, res) => {
    const result = await query(
      'DELETE FROM categories WHERE id = $1 AND shop_id = $2 RETURNING id',
      [req.params.id, req.shop.id]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Категория не найдена' })
    res.json({ success: true })
  })
)

/* ----------------------------- Banners ------------------------------ */

router.get(
  '/banners',
  asyncHandler(async (req, res) => {
    const result = await query(
      'SELECT * FROM banners WHERE shop_id = $1 ORDER BY sort_order ASC, id ASC',
      [req.shop.id]
    )
    res.json(result.rows)
  })
)

router.post(
  '/banners',
  asyncHandler(async (req, res) => {
    const { image_url, title = '', subtitle = '', sort_order = 0, active = true } = req.body
    if (!image_url) return res.status(400).json({ error: 'image_url обязателен' })

    const result = await query(
      'INSERT INTO banners (shop_id, image_url, title, subtitle, sort_order, active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.shop.id, image_url, title, subtitle, sort_order, active]
    )
    res.status(201).json(result.rows[0])
  })
)

router.put(
  '/banners/:id',
  asyncHandler(async (req, res) => {
    const { image_url, title = '', subtitle = '', sort_order = 0, active = true } = req.body
    if (!image_url) return res.status(400).json({ error: 'image_url обязателен' })

    const result = await query(
      'UPDATE banners SET image_url = $1, title = $2, subtitle = $3, sort_order = $4, active = $5 WHERE id = $6 AND shop_id = $7 RETURNING *',
      [image_url, title, subtitle, sort_order, active, req.params.id, req.shop.id]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Баннер не найден' })
    res.json(result.rows[0])
  })
)

router.delete(
  '/banners/:id',
  asyncHandler(async (req, res) => {
    const result = await query('DELETE FROM banners WHERE id = $1 AND shop_id = $2 RETURNING id', [
      req.params.id,
      req.shop.id,
    ])
    if (!result.rows.length) return res.status(404).json({ error: 'Баннер не найден' })
    res.json({ success: true })
  })
)

/* ------------------------------ Orders ------------------------------- */

router.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const ordersResult = await query(
      'SELECT * FROM orders WHERE shop_id = $1 ORDER BY created_at DESC',
      [req.shop.id]
    )
    const orders = ordersResult.rows

    for (const order of orders) {
      const itemsResult = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id])
      order.items = itemsResult.rows
    }

    res.json(orders)
  })
)

router.put(
  '/orders/:id/status',
  asyncHandler(async (req, res) => {
    const { status } = req.body
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Недопустимый статус' })
    }

    const result = await query(
      'UPDATE orders SET status = $1, updated_at = now() WHERE id = $2 AND shop_id = $3 RETURNING *',
      [status, req.params.id, req.shop.id]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Заказ не найден' })

    const order = result.rows[0]
    notifyCustomerStatusChange(order, req.shop).catch((err) =>
      console.error('Customer notification failed:', err)
    )

    res.json(order)
  })
)

/* ----------------------------- Settings ------------------------------ */

function shopToSettings(shop) {
  return {
    store_name: shop.name || '',
    store_description: shop.description || '',
    card_number: shop.card_number || '',
    card_holder: shop.card_holder || '',
    click_number: shop.click_number || '',
    currency: shop.currency || '',
  }
}

router.get('/settings', (req, res) => {
  res.json(shopToSettings(req.shop))
})

router.put(
  '/settings',
  asyncHandler(async (req, res) => {
    const { store_name, store_description, card_number, card_holder, click_number, currency } =
      req.body || {}

    const result = await query(
      `UPDATE shops
       SET name = $1, description = $2, card_number = $3, card_holder = $4, click_number = $5, currency = $6
       WHERE id = $7
       RETURNING *`,
      [
        store_name ?? '',
        store_description ?? '',
        card_number ?? '',
        card_holder ?? '',
        click_number ?? '',
        currency ?? '',
        req.shop.id,
      ]
    )

    res.json(shopToSettings(result.rows[0]))
  })
)

export default router
