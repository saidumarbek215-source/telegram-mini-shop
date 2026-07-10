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
    await query(
      'UPDATE shops SET payment_status = $1, payment_date = $2 WHERE id = $3',
      [payment_status, payment_date, req.params.id]
    )
    res.json({ success: true })
  })
)

router.post(
  '/shops/:id/remind',
  asyncHandler(async (req, res) => {
    const shop = await query('SELECT * FROM shops WHERE id = $1', [req.params.id])
    const s = shop.rows[0]
    if (s && s.owner_telegram_id && s.bot_token) {
      await sendTelegramMessage(
        s.owner_telegram_id,
        `⚠️ Hurmatli do'kon egasi!\n\nFinexia xizmati uchun to'lov muddati keldi.\nMiqdor: 50,000 so'm\n\nTo'lov uchun: @finexia_uz`,
        s.bot_token
      )
    }
    res.json({ success: true })
  })
)

export default router
