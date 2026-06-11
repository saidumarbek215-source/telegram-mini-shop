import { Router } from 'express'
import { query } from '../db/index.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireShopId } from '../middleware/shop.js'

const router = Router()

router.use(requireShopId)

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const result = await query(
      'SELECT * FROM banners WHERE shop_id = $1 AND active = true ORDER BY sort_order ASC, id ASC',
      [req.shopId]
    )
    res.json(result.rows)
  })
)

export default router
