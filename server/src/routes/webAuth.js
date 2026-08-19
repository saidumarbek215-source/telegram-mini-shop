import { randomBytes } from 'crypto'
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcrypt'
import { query } from '../db/index.js'
import { activeTokens } from '../services/webTokens.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
})

// POST /api/web-auth/login
router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { login, password, shop_id } = req.body || {}
    if (!login || !password || !shop_id) {
      return res.status(400).json({ error: 'login, password и shop_id обязательны' })
    }

    const result = await query('SELECT * FROM shops WHERE id = $1', [Number(shop_id)])
    const shop = result.rows[0]
    if (!shop) return res.status(404).json({ error: 'Магазин не найден' })

    if (!shop.web_admin_login || !shop.web_admin_password) {
      return res.status(401).json({ error: 'Veb-sayt kirishi sozlanmagan' })
    }

    const loginMatch = shop.web_admin_login === login
    const passwordMatch = await bcrypt.compare(password, shop.web_admin_password)
    if (!loginMatch || !passwordMatch) {
      return res.status(401).json({ error: "Login yoki parol noto'g'ri" })
    }

    const token = randomBytes(32).toString('hex')
    activeTokens.set(token, { shopId: shop.id, createdAt: Date.now() })

    res.json({ token, shop_id: shop.id })
  })
)

// POST /api/web-auth/verify
router.post(
  '/verify',
  asyncHandler(async (req, res) => {
    const { token } = req.body || {}
    if (!token) return res.status(400).json({ error: 'token обязателен' })

    const data = activeTokens.get(token)
    if (!data) return res.json({ valid: false })

    res.json({ valid: true, shop_id: data.shopId })
  })
)

export default router
