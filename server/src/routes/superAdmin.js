import { Router } from 'express'
import { query } from '../db/index.js'
import { sendTelegramMessage } from '../telegram.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

const SUPER_ADMIN_KEY = 'finexia2026'

function superAdminAuth(req, res, next) {
  if (req.headers['x-super-admin'] !== SUPER_ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

router.use(superAdminAuth)

router.get(
  '/shops',
  asyncHandler(async (req, res) => {
    const result = await query(`
      SELECT s.*,
        COUNT(o.id) as orders_count,
        MAX(o.created_at) as last_order
      FROM shops s
      LEFT JOIN orders o ON o.shop_id = s.id
      GROUP BY s.id
      ORDER BY s.id
    `)
    res.json(result.rows)
  })
)

router.put(
  '/shops/:id/block',
  asyncHandler(async (req, res) => {
    const { blocked } = req.body
    await query('UPDATE shops SET blocked = $1 WHERE id = $2', [blocked, req.params.id])
    res.json({ success: true })
  })
)

router.put(
  '/shops/:id/sale-price',
  asyncHandler(async (req, res) => {
    const { sale_price } = req.body
    await query('UPDATE shops SET sale_price = $1 WHERE id = $2', [sale_price, req.params.id])
    res.json({ success: true })
  })
)

router.put(
  '/shops/:id/payment',
  asyncHandler(async (req, res) => {
    const { payment_status, payment_date } = req.body
    if (payment_status === 'paid') {
      await query(
        `UPDATE shops
         SET payment_status = $1, payment_date = $2,
             next_payment_due = CURRENT_DATE + INTERVAL '30 days',
             payment_reminder_sent_at = NULL
         WHERE id = $3`,
        [payment_status, payment_date, req.params.id]
      )
    } else {
      await query(
        'UPDATE shops SET payment_status = $1, payment_date = $2 WHERE id = $3',
        [payment_status, payment_date, req.params.id]
      )
    }
    res.json({ success: true })
  })
)

router.post(
  '/shops/:id/remind',
  asyncHandler(async (req, res) => {
    const shop = await query('SELECT * FROM shops WHERE id = $1', [req.params.id])
    const s = shop.rows[0]
    if (s && s.owner_telegram_id && s.bot_token) {
      const amount = s.sale_price
        ? `${Number(s.sale_price).toLocaleString('ru-RU')} so'm`
        : 'aniqlanmagan'
      await sendTelegramMessage(
        s.owner_telegram_id,
        `⚠️ Hurmatli do'kon egasi!\n\nFinexia xizmati uchun to'lov muddati keldi.\nMiqdor: ${amount}\n\nTo'lov uchun: @finexia_uz`,
        s.bot_token
      )
    }
    res.json({ success: true })
  })
)

router.post(
  '/shops/:id/send-reminder',
  asyncHandler(async (req, res) => {
    const { rows } = await query('SELECT * FROM shops WHERE id = $1', [req.params.id])
    const s = rows[0]
    if (!s || !s.owner_telegram_id || !s.bot_token) {
      return res.status(400).json({ error: 'Owner yoki bot topilmadi' })
    }
    await sendTelegramMessage(
      s.owner_telegram_id,
      `⏰ Hurmatli ${s.name}!\n\nObuna holatingizni tekshirish uchun @finexia_uz bilan bog'laning.`,
      s.bot_token
    )
    await query('UPDATE shops SET payment_reminder_sent_at = NOW() WHERE id = $1', [s.id])
    res.json({ success: true })
  })
)

router.patch(
  '/shops/:id/subscription',
  asyncHandler(async (req, res) => {
    const { tariff, trial_ends_at, next_payment_due, sale_price } = req.body
    const result = await query(
      `UPDATE shops
       SET tariff = $1, trial_ends_at = $2, next_payment_due = $3, sale_price = $4
       WHERE id = $5 RETURNING *`,
      [tariff, trial_ends_at || null, next_payment_due || null, sale_price || null, req.params.id]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Shop not found' })
    res.json(result.rows[0])
  })
)

router.put(
  '/shops/:id/payment-provider',
  asyncHandler(async (req, res) => {
    const { payment_provider, payment_merchant_id, payment_service_id, payment_secret } = req.body
    await query(
      `UPDATE shops
       SET payment_provider = $1, payment_merchant_id = $2, payment_service_id = $3, payment_secret = $4
       WHERE id = $5`,
      [
        payment_provider || null,
        payment_merchant_id || null,
        payment_service_id || null,
        payment_secret || null,
        req.params.id,
      ]
    )
    res.json({ success: true })
  })
)

router.get(
  '/analytics/gmv',
  asyncHandler(async (req, res) => {
    const result = await query(`
      SELECT
        COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE THEN total ELSE 0 END), 0)                            AS today,
        COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN total ELSE 0 END), 0)        AS week,
        COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN total ELSE 0 END), 0)       AS month,
        COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('year',  CURRENT_DATE) THEN total ELSE 0 END), 0)       AS year,
        COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END)                                                   AS orders_today,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END)                              AS orders_week,
        COUNT(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END)                             AS orders_month,
        COUNT(*)                                                                                                  AS orders_total
      FROM orders
      WHERE status NOT IN ('cancelled', 'expired')
    `)
    res.json(result.rows[0])
  })
)

export default router
