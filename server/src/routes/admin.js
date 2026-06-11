import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { pool, query } from '../db/index.js'
import { requireAdmin } from '../middleware/auth.js'
import { ORDER_STATUSES } from '../constants.js'
import { notifyCustomerStatusChange } from '../telegram.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { password } = req.body

  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD не настроен на сервере' })
  }

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Неверный пароль' })
  }

  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET || 'dev-secret', {
    expiresIn: '7d',
  })
  res.json({ token })
})

router.use(requireAdmin)

/* ---------------------------- Products ---------------------------- */

router.get(
  '/products',
  asyncHandler(async (req, res) => {
    const result = await query('SELECT * FROM products ORDER BY sort_order ASC, id ASC')
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
      in_stock = true,
      sort_order = 0,
    } = req.body

    if (!name || price === undefined || !image_url) {
      return res.status(400).json({ error: 'name, price и image_url обязательны' })
    }

    const result = await query(
      `INSERT INTO products
        (name, description, price, old_price, image_url, category_id, sizes, colors, in_stock, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [name, description, price, old_price, image_url, category_id, sizes, colors, in_stock, sort_order]
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
      in_stock = true,
      sort_order = 0,
    } = req.body

    if (!name || price === undefined || !image_url) {
      return res.status(400).json({ error: 'name, price и image_url обязательны' })
    }

    const result = await query(
      `UPDATE products
       SET name = $1, description = $2, price = $3, old_price = $4, image_url = $5,
           category_id = $6, sizes = $7, colors = $8, in_stock = $9, sort_order = $10
       WHERE id = $11
       RETURNING *`,
      [name, description, price, old_price, image_url, category_id, sizes, colors, in_stock, sort_order, req.params.id]
    )

    if (!result.rows.length) return res.status(404).json({ error: 'Товар не найден' })
    res.json(result.rows[0])
  })
)

router.delete(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const result = await query('DELETE FROM products WHERE id = $1 RETURNING id', [req.params.id])
    if (!result.rows.length) return res.status(404).json({ error: 'Товар не найден' })
    res.json({ success: true })
  })
)

/* --------------------------- Categories ---------------------------- */

router.get(
  '/categories',
  asyncHandler(async (req, res) => {
    const result = await query('SELECT * FROM categories ORDER BY sort_order ASC, id ASC')
    res.json(result.rows)
  })
)

router.post(
  '/categories',
  asyncHandler(async (req, res) => {
    const { name, icon = '👟', sort_order = 0 } = req.body
    if (!name) return res.status(400).json({ error: 'name обязателен' })

    const result = await query(
      'INSERT INTO categories (name, icon, sort_order) VALUES ($1, $2, $3) RETURNING *',
      [name, icon, sort_order]
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
      'UPDATE categories SET name = $1, icon = $2, sort_order = $3 WHERE id = $4 RETURNING *',
      [name, icon, sort_order, req.params.id]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Категория не найдена' })
    res.json(result.rows[0])
  })
)

router.delete(
  '/categories/:id',
  asyncHandler(async (req, res) => {
    const result = await query('DELETE FROM categories WHERE id = $1 RETURNING id', [req.params.id])
    if (!result.rows.length) return res.status(404).json({ error: 'Категория не найдена' })
    res.json({ success: true })
  })
)

/* ----------------------------- Banners ------------------------------ */

router.get(
  '/banners',
  asyncHandler(async (req, res) => {
    const result = await query('SELECT * FROM banners ORDER BY sort_order ASC, id ASC')
    res.json(result.rows)
  })
)

router.post(
  '/banners',
  asyncHandler(async (req, res) => {
    const { image_url, title = '', subtitle = '', sort_order = 0, active = true } = req.body
    if (!image_url) return res.status(400).json({ error: 'image_url обязателен' })

    const result = await query(
      'INSERT INTO banners (image_url, title, subtitle, sort_order, active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [image_url, title, subtitle, sort_order, active]
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
      'UPDATE banners SET image_url = $1, title = $2, subtitle = $3, sort_order = $4, active = $5 WHERE id = $6 RETURNING *',
      [image_url, title, subtitle, sort_order, active, req.params.id]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Баннер не найден' })
    res.json(result.rows[0])
  })
)

router.delete(
  '/banners/:id',
  asyncHandler(async (req, res) => {
    const result = await query('DELETE FROM banners WHERE id = $1 RETURNING id', [req.params.id])
    if (!result.rows.length) return res.status(404).json({ error: 'Баннер не найден' })
    res.json({ success: true })
  })
)

/* ------------------------------ Orders ------------------------------- */

router.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const ordersResult = await query('SELECT * FROM orders ORDER BY created_at DESC')
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
      'UPDATE orders SET status = $1, updated_at = now() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Заказ не найден' })

    const order = result.rows[0]
    notifyCustomerStatusChange(order).catch((err) =>
      console.error('Customer notification failed:', err)
    )

    res.json(order)
  })
)

/* ----------------------------- Settings ------------------------------ */

router.get(
  '/settings',
  asyncHandler(async (req, res) => {
    const result = await query('SELECT key, value FROM settings')
    const settings = {}
    for (const row of result.rows) {
      settings[row.key] = row.value
    }
    res.json(settings)
  })
)

router.put(
  '/settings',
  asyncHandler(async (req, res) => {
    const entries = Object.entries(req.body || {})
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      for (const [key, value] of entries) {
        await client.query(
          `INSERT INTO settings (key, value) VALUES ($1, $2)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
          [key, String(value ?? '')]
        )
      }
      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }

    const result = await query('SELECT key, value FROM settings')
    const settings = {}
    for (const row of result.rows) {
      settings[row.key] = row.value
    }
    res.json(settings)
  })
)

export default router
