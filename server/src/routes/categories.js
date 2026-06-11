import { Router } from 'express'
import { query } from '../db/index.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const result = await query('SELECT * FROM categories ORDER BY sort_order ASC, id ASC')
    res.json(result.rows)
  })
)

export default router
