import crypto from 'crypto'

const MAX_AUTH_AGE_SECONDS = 24 * 60 * 60

// Validates Telegram WebApp initData per https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
// Returns the parsed `user` object if the signature is valid and fresh, otherwise null.
export function parseInitData(initData, botToken) {
  if (!initData || !botToken) { console.log('parseInitData: no initData or botToken'); return null }

  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) { console.log('parseInitData: no hash in params'); return null }
  params.delete('hash')

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

  if (computedHash !== hash) { console.log('parseInitData: hash mismatch | computed:', computedHash.slice(0, 10), '| received:', hash.slice(0, 10)); return null }

  const authDate = Number(params.get('auth_date'))
  const now = Date.now() / 1000
  const diffSeconds = now - authDate
  if (!authDate || diffSeconds > MAX_AUTH_AGE_SECONDS) { console.log('parseInitData: auth_date expired | authDate:', authDate, '| now:', Math.floor(now), '| diff:', Math.floor(diffSeconds), 's | MAX:', MAX_AUTH_AGE_SECONDS); return null }

  const userJson = params.get('user')
  if (!userJson) { console.log('parseInitData: no user in params'); return null }

  try {
    return JSON.parse(userJson)
  } catch {
    return null
  }
}
