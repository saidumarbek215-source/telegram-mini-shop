import { query } from '../db/index.js'
import { parseInitData } from '../utils/telegramAuth.js'

// Authorizes the store owner of the shop identified by `shop_id` (query
// param) using Telegram WebApp initData (sent via the X-Telegram-Init-Data
// header), validated against that shop's own bot token.
export async function requireOwner(req, res, next) {
  const shopId = Number(req.query.shop_id)
  if (!Number.isInteger(shopId) || shopId <= 0) {
    return res.status(400).json({ error: 'shop_id обязателен' })
  }

  const result = await query('SELECT * FROM shops WHERE id = $1', [shopId])
  const shop = result.rows[0]
  if (!shop) return res.status(404).json({ error: 'Магазин не найден' })
  if (!shop.bot_token) return res.status(401).json({ error: 'Unauthorized' })

  const initData = req.headers['x-telegram-init-data']
  const user = parseInitData(initData, shop.bot_token)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  if (String(user.id) !== String(shop.owner_telegram_id)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  req.shop = shop
  req.owner = user
  next()
}
