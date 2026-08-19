/**
 * One-time migration: hash plaintext web_admin_password values in the shops table.
 * Safe to re-run — already-hashed passwords (starting with $2b$ or $2a$) are skipped.
 *
 * Usage:
 *   cd server
 *   node scripts/hash-existing-passwords.mjs
 */

import 'dotenv/config'
import bcrypt from 'bcrypt'
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const { rows } = await pool.query(
  `SELECT id, web_admin_password FROM shops WHERE web_admin_password IS NOT NULL AND web_admin_password <> ''`
)

let hashed = 0
let skipped = 0

for (const shop of rows) {
  const pwd = shop.web_admin_password
  if (pwd.startsWith('$2b$') || pwd.startsWith('$2a$')) {
    skipped++
    continue
  }
  const hash = await bcrypt.hash(pwd, 10)
  await pool.query('UPDATE shops SET web_admin_password = $1 WHERE id = $2', [hash, shop.id])
  console.log(`shop ${shop.id}: hashed`)
  hashed++
}

console.log(`Done. Hashed: ${hashed}, already hashed (skipped): ${skipped}`)
await pool.end()
