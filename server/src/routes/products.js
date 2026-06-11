import { Router } from 'express'
import { query } from '../db/index.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireShopId } from '../middleware/shop.js'

const router = Router()

router.use(requireShopId)

// GET /api/products?shop_id=1&category=1&search=nike
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { category, search } = req.query
    const conditions = ['shop_id = $1']
    const params = [req.shopId]

    if (category) {
      params.push(category)
      conditions.push(`category_id = $${params.length}`)
    }
    if (search) {
      params.push(`%${search}%`)
      conditions.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`)
    }

    const result = await query(
      `SELECT * FROM products WHERE ${conditions.join(' AND ')} ORDER BY sort_order ASC, id ASC`,
      params
    )
    res.json(result.rows)
  })
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await query('SELECT * FROM products WHERE id = $1 AND shop_id = $2', [
      req.params.id,
      req.shopId,
    ])
    if (!result.rows.length) return res.status(404).json({ error: 'Product not found' })
    res.json(result.rows[0])
  })
)

export default router
