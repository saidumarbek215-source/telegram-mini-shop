import { query } from '../db/index.js'
import { parseInitData } from '../utils/telegramAuth.js'
import { activeTokens, TOKEN_TTL } from '../services/webTokens.js'

// Authorizes the store owner via Telegram WebApp initData OR a web admin token.
export async function requireOwner(req, res, next) {
  const shopId = Number(req.query.shop_id)
  if (!Number.isInteger(shopId) || shopId <= 0) {
    return res.status(400).json({ error: 'shop_id обязателен' })
  }

  const result = await query('SELECT * FROM shops WHERE id = $1', [shopId])
  const shop = result.rows[0]
  if (!shop) return res.status(404).json({ error: 'Магазин не найден' })

  // Web admin token auth
  const webToken = req.headers['x-web-admin-token']
  if (webToken) {
    const tokenData = activeTokens.get(webToken)
    if (!tokenData || tokenData.shopId !== shopId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    if (Date.now() - tokenData.createdAt > TOKEN_TTL) {
      activeTokens.delete(webToken)
      return res.status(401).json({ error: 'Token expired' })
    }
    req.shop = shop
    req.owner = { web: true }
    return next()
  }

  // Telegram initData auth
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
