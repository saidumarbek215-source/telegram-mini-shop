import { Router } from 'express'
import bcrypt from 'bcrypt'
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
    shop: {
      id: req.shop.id,
      name: req.shop.name,
      currency: req.shop.currency,
      ai_connected: req.shop.ai_connected,
      features: req.shop.features || {},
    },
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
      images = [],
      variants = [],
      is_bestseller = false,
      rating = null,
      review_count = 0,
    } = req.body

    if (!name || !image_url) {
      return res.status(400).json({ error: 'name и image_url обязательны' })
    }

    const parsedPrice = (() => { const n = parseFloat(String(price ?? '').replace(',', '.')); return isNaN(n) ? null : n })()

    const result = await query(
      `INSERT INTO products
        (shop_id, name, description, price, old_price, image_url, category_id, sizes, colors, sizes_stock, in_stock, sort_order, images, variants, is_bestseller, rating, review_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [req.shop.id, name, description, parsedPrice, old_price != null ? parseFloat(String(old_price).replace(',', '.')) : null, image_url, category_id, sizes, colors, sizes_stock, in_stock, sort_order, JSON.stringify(images), JSON.stringify(variants), is_bestseller, rating != null ? parseFloat(rating) : null, Number(review_count) || 0]
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
      images = [],
      variants = [],
      is_bestseller = false,
      rating = null,
      review_count = 0,
    } = req.body

    if (!name || !image_url) {
      return res.status(400).json({ error: 'name и image_url обязательны' })
    }

    const parsedPrice = (() => { const n = parseFloat(String(price ?? '').replace(',', '.')); return isNaN(n) ? null : n })()

    const result = await query(
      `UPDATE products
       SET name = $1, description = $2, price = $3, old_price = $4, image_url = $5,
           category_id = $6, sizes = $7, colors = $8, sizes_stock = $9, in_stock = $10, sort_order = $11,
           images = $12, variants = $13, is_bestseller = $14, rating = $15, review_count = $16
       WHERE id = $17 AND shop_id = $18
       RETURNING *`,
      [name, description, parsedPrice, old_price != null ? parseFloat(String(old_price).replace(',', '.')) : null, image_url, category_id, sizes, colors, sizes_stock, in_stock, sort_order, JSON.stringify(images), JSON.stringify(variants), is_bestseller, rating != null ? parseFloat(rating) : null, Number(review_count) || 0, req.params.id, req.shop.id]
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
    const { name, icon = '', sort_order = 0, image_url = null } = req.body
    if (!name) return res.status(400).json({ error: 'name обязателен' })

    const result = await query(
      'INSERT INTO categories (shop_id, name, icon, sort_order, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.shop.id, name, icon, sort_order, image_url]
    )
    res.status(201).json(result.rows[0])
  })
)

router.put(
  '/categories/:id',
  asyncHandler(async (req, res) => {
    const { name, icon = '', sort_order = 0, image_url = null } = req.body
    if (!name) return res.status(400).json({ error: 'name обязателен' })

    const result = await query(
      'UPDATE categories SET name = $1, icon = $2, sort_order = $3, image_url = $4 WHERE id = $5 AND shop_id = $6 RETURNING *',
      [name, icon, sort_order, image_url, req.params.id, req.shop.id]
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
    admin_username: shop.admin_username || '',
    features: shop.features || {},
    product_unit_type: shop.product_unit_type || 'size',
    auto_cancel_minutes: shop.auto_cancel_minutes ?? 15,
    credit_enabled: shop.credit_enabled || false,
    ads_enabled: shop.ads_enabled || false,
    ad_channel_id: shop.ad_channel_id || '',
    ad_prices: shop.ad_prices || {},
    web_admin_login: shop.web_admin_login || '',
    payment_provider: shop.payment_provider || '',
    tariff: shop.tariff || 'trial',
    trial_ends_at: shop.trial_ends_at || null,
    next_payment_due: shop.next_payment_due || null,
  }
}

router.get('/settings', (req, res) => {
  res.json(shopToSettings(req.shop))
})

router.put(
  '/settings',
  asyncHandler(async (req, res) => {
    const {
      store_name,
      store_description,
      card_number,
      card_holder,
      click_number,
      currency,
      admin_username,
      product_unit_type,
      auto_cancel_minutes,
      credit_enabled,
      theme,
      language,
      ad_channel_id,
      ad_prices,
      web_admin_login,
      web_admin_password,
      payment_provider,
    } = req.body || {}

    const validUnitTypes = ['size', 'weight', 'volume', 'piece']
    const unitType = validUnitTypes.includes(product_unit_type) ? product_unit_type : 'size'
    const validThemes = ['dark', 'light']
    const validLanguages = ['ru', 'uz', 'en']
    const safeTheme = validThemes.includes(theme) ? theme : 'dark'
    const safeLanguage = validLanguages.includes(language) ? language : 'ru'

    const cancelMinutes = [0, 15, 30, 60, 120, 1440].includes(Number(auto_cancel_minutes))
      ? Number(auto_cancel_minutes)
      : 15

    const safePrices = (() => {
      if (!ad_prices || typeof ad_prices !== 'object') return {}
      if (Array.isArray(ad_prices.channels)) {
        return {
          channels: ad_prices.channels
            .filter((ch) => ch && typeof ch.name === 'string' && ch.name.trim())
            .map((ch) => ({
              name: ch.name.trim(),
              username: String(ch.username || '').trim(),
              subscribers: Number(ch.subscribers) || 0,
              price: Number(ch.price) || 0,
            })),
        }
      }
      return {}
    })()

    const validProviders = ['', 'payme', 'click', 'uzum']
    const safeProvider = validProviders.includes(payment_provider) ? (payment_provider ?? '') : ''

    const updatePasswordSql = web_admin_password
      ? ', web_admin_password = $18'
      : ''
    const params = [
      store_name ?? '',
      store_description ?? '',
      card_number ?? '',
      card_holder ?? '',
      click_number ?? '',
      currency ?? '',
      admin_username ?? '',
      unitType,
      cancelMinutes,
      credit_enabled === true || credit_enabled === 'true',
      safeTheme,
      safeLanguage,
      req.shop.id,
      ad_channel_id ?? '',
      JSON.stringify(safePrices),
      web_admin_login ?? '',
      safeProvider,
    ]
    if (web_admin_password) params.push(await bcrypt.hash(web_admin_password, 10))

    const result = await query(
      `UPDATE shops
       SET name = $1, description = $2, card_number = $3, card_holder = $4, click_number = $5,
           currency = $6, admin_username = $7, product_unit_type = $8, auto_cancel_minutes = $9,
           credit_enabled = $10,
           features = jsonb_set(jsonb_set(COALESCE(features, '{}'::jsonb), '{theme}', to_jsonb($11::text)), '{language}', to_jsonb($12::text)),
           ad_channel_id = $14, ad_prices = $15, web_admin_login = $16, payment_provider = $17${updatePasswordSql}
       WHERE id = $13
       RETURNING *`,
      params
    )

    res.json(shopToSettings(result.rows[0]))
  })
)

/* ---------------------------- Analytics ------------------------------ */

router.get(
  '/analytics',
  asyncHandler(async (req, res) => {
    const days = Math.min(Math.max(Number(req.query.days) || 30, 7), 90)
    const result = await query(
      `SELECT
         (created_at::date)::text AS date,
         COUNT(*)::int            AS orders,
         COALESCE(SUM(CASE WHEN status = 'delivered' THEN total_price ELSE 0 END), 0)::numeric AS revenue
       FROM orders
       WHERE shop_id = $1
         AND created_at >= NOW() - ($2 * INTERVAL '1 day')
       GROUP BY 1
       ORDER BY 1 ASC`,
      [req.shop.id, days]
    )
    res.json(result.rows)
  })
)

/* ----------------------------- Credits ------------------------------- */

router.get(
  '/credits',
  asyncHandler(async (req, res) => {
    const ordersResult = await query(
      `SELECT * FROM orders
       WHERE shop_id = $1 AND payment_type = 'credit' AND payment_status = 'pending'
       ORDER BY payment_due_date ASC NULLS LAST`,
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
  '/credits/:id/paid',
  asyncHandler(async (req, res) => {
    const result = await query(
      `UPDATE orders SET payment_status = 'paid', updated_at = now()
       WHERE id = $1 AND shop_id = $2 AND payment_type = 'credit'
       RETURNING *`,
      [req.params.id, req.shop.id]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Заказ не найден' })
    res.json(result.rows[0])
  })
)

/* ----------------------------- Partners ------------------------------ */

router.get(
  '/partners',
  asyncHandler(async (req, res) => {
    const result = await query(
      'SELECT * FROM partners WHERE shop_id = $1 ORDER BY created_at DESC',
      [req.shop.id]
    )
    res.json(result.rows)
  })
)

router.post(
  '/partners',
  asyncHandler(async (req, res) => {
    const {
      name, phone = '', address = '', latitude = null, longitude = null, status = 'active',
      photo_url = null, description = null, monthly_turnover = null, contact_person = null, working_hours = null,
    } = req.body
    if (!name) return res.status(400).json({ error: 'name обязателен' })

    const result = await query(
      `INSERT INTO partners (shop_id, name, phone, address, latitude, longitude, status, photo_url, description, monthly_turnover, contact_person, working_hours)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [req.shop.id, name, phone, address, latitude, longitude, status, photo_url, description,
       monthly_turnover != null ? parseFloat(monthly_turnover) : null, contact_person, working_hours]
    )
    res.status(201).json(result.rows[0])
  })
)

router.put(
  '/partners/:id',
  asyncHandler(async (req, res) => {
    const {
      name, phone = '', address = '', latitude = null, longitude = null, status = 'active',
      photo_url = null, description = null, monthly_turnover = null, contact_person = null, working_hours = null,
    } = req.body
    if (!name) return res.status(400).json({ error: 'name обязателен' })

    const result = await query(
      `UPDATE partners SET name = $1, phone = $2, address = $3, latitude = $4, longitude = $5, status = $6,
        photo_url = $7, description = $8, monthly_turnover = $9, contact_person = $10, working_hours = $11
       WHERE id = $12 AND shop_id = $13 RETURNING *`,
      [name, phone, address, latitude, longitude, status, photo_url, description,
       monthly_turnover != null ? parseFloat(monthly_turnover) : null, contact_person, working_hours,
       req.params.id, req.shop.id]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Партнёр не найден' })
    res.json(result.rows[0])
  })
)

router.delete(
  '/partners/:id',
  asyncHandler(async (req, res) => {
    const result = await query(
      'DELETE FROM partners WHERE id = $1 AND shop_id = $2 RETURNING id',
      [req.params.id, req.shop.id]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Партнёр не найден' })
    res.json({ success: true })
  })
)

export default router
