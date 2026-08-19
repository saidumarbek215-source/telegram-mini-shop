// In-memory store for web admin tokens.
// Tokens are lost on server restart — web admins re-login on next visit.
export const activeTokens = new Map()

export const TOKEN_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days in ms

// Purge expired tokens once per hour
setInterval(() => {
  const cutoff = Date.now() - TOKEN_TTL
  for (const [token, data] of activeTokens) {
    if (data.createdAt < cutoff) activeTokens.delete(token)
  }
}, 60 * 60 * 1000).unref()
