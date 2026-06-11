import { parseInitData } from '../utils/telegramAuth.js'

// Authorizes the store owner using Telegram WebApp initData (sent via the
// X-Telegram-Init-Data header) and OWNER_TELEGRAM_ID from the environment.
export function requireOwner(req, res, next) {
  const ownerId = process.env.OWNER_TELEGRAM_ID
  if (!ownerId) return res.status(401).json({ error: 'Unauthorized' })

  const initData = req.headers['x-telegram-init-data']
  const user = parseInitData(initData)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  if (String(user.id) !== String(ownerId)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  req.owner = user
  next()
}
