import { Router } from 'express'
import { query } from '../db/index.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const result = await query('SELECT key, value FROM settings')
    const settings = {}
    for (const row of result.rows) {
      settings[row.key] = row.value
    }
    res.json(settings)
  })
)

export default router
