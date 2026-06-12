import { Router } from 'express'
import { query } from '../db/index.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { restartBotForShop } from '../services/botManager.js'

const router = Router()

// POST /api/shops/register { owner_telegram_id, name, bot_token }
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { owner_telegram_id, name, bot_token = null } = req.body || {}

    const ownerId = Number(owner_telegram_id)
    if (!Number.isInteger(ownerId) || ownerId <= 0) {
      return res.status(400).json({ error: 'owner_telegram_id обязателен' })
    }
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'name обязателен' })
    }

    const result = await query(
      `INSERT INTO shops (name, owner_telegram_id, bot_token)
       VALUES ($1, $2, $3)
       ON CONFLICT (owner_telegram_id) DO UPDATE
         SET name = EXCLUDED.name,
             bot_token = COALESCE(EXCLUDED.bot_token, shops.bot_token)
       RETURNING id`,
      [String(name).trim(), ownerId, bot_token]
    )

    const shopId = result.rows[0].id
    const baseUrl = process.env.WEBAPP_URL || 'https://telegram-mini-shop.netlify.app'

    try {
      await restartBotForShop(shopId)
    } catch (err) {
      console.error(`Failed to start bot for shop ${shopId}:`, err.message)
    }

    res.status(201).json({ shop_id: shopId, mini_app_url: `${baseUrl}?shop=${shopId}` })
  })
)

export default router
