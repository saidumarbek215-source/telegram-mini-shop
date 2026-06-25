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
  await pool.query(
    `ALTER TABLE products ALTER COLUMN price TYPE DECIMAL(10,2) USING price::DECIMAL(10,2)`
  )
  await pool.query(
    `ALTER TABLE products ALTER COLUMN old_price TYPE DECIMAL(10,2) USING old_price::DECIMAL(10,2)`
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
