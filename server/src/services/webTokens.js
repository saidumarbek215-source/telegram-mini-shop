// In-memory store for web admin tokens.
// Tokens are lost on server restart — web admins re-login on next visit.
export const activeTokens = new Map()
