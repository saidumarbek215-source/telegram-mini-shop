import { Router } from 'express'
import { query } from '../db/index.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireShopId } from '../middleware/shop.js'

const router = Router()

router.use(requireShopId)

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const result = await query('SELECT * FROM shops WHERE id = $1 AND is_active = true', [
      req.shopId,
    ])
    const shop = result.rows[0]
    if (!shop) return res.status(404).json({ error: 'Магазин не найден' })

    res.json({
      shop_id: shop.id,
      store_name: shop.name || '',
      store_description: shop.description || '',
      card_number: shop.card_number || '',
      card_holder: shop.card_holder || '',
      click_number: shop.click_number || '',
      currency: shop.currency || '',
      owner_telegram_id: shop.owner_telegram_id || '',
      bot_username: shop.bot_username || '',
      admin_username: shop.admin_username || '',
      features: shop.features || {},
    })
  })
)

export default router
