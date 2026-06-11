import jwt from 'jsonwebtoken'

export function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret')
    if (payload.role !== 'admin') throw new Error('Invalid role')
    req.admin = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Unauthorized' })
  }
}
