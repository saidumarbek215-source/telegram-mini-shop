import { Router } from 'express'
import { query } from '../db/index.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

// GET /api/products?category=1&search=nike
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { category, search } = req.query
    const conditions = []
    const params = []

    if (category) {
      params.push(category)
      conditions.push(`category_id = $${params.length}`)
    }
    if (search) {
      params.push(`%${search}%`)
      conditions.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const result = await query(
      `SELECT * FROM products ${where} ORDER BY sort_order ASC, id ASC`,
      params
    )
    res.json(result.rows)
  })
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await query('SELECT * FROM products WHERE id = $1', [req.params.id])
    if (!result.rows.length) return res.status(404).json({ error: 'Product not found' })
    res.json(result.rows[0])
  })
)

export default router
