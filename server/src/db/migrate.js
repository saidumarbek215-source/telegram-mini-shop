import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { pool } from './index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export async function migrate() {
  const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf-8')
  await pool.query(sql)
  await pool.query(
    `ALTER TABLE shops DROP CONSTRAINT IF EXISTS shops_owner_telegram_id_key`
  )
  console.log('Migration applied successfully')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrate()
    .then(() => pool.end())
    .catch((err) => {
      console.error('Migration failed:', err)
      process.exit(1)
    })
}
