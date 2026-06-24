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
      `INSERT INTO shops (name, owner_telegram_id, bot_token, bot_username)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [String(name).trim(), ownerId, bot_token, null]
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

// GET /api/shops/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await query(
      'SELECT * FROM shops WHERE id = $1',
      [id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shop not found' })
    }
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
