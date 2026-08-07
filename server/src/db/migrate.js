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
  await pool.query(
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS auto_cancel_minutes INTEGER DEFAULT 15`
  )
  await pool.query(
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'prepaid'`
  )
  await pool.query(
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_due_date DATE`
  )
  await pool.query(
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'paid'`
  )
  await pool.query(
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS credit_enabled BOOLEAN DEFAULT false`
  )
  await pool.query(
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS shop_order_number INTEGER DEFAULT 1`
  )
  await pool.query(`ALTER TABLE partners ADD COLUMN IF NOT EXISTS photo_url TEXT`)
  await pool.query(`ALTER TABLE partners ADD COLUMN IF NOT EXISTS description TEXT`)
  await pool.query(`ALTER TABLE partners ADD COLUMN IF NOT EXISTS monthly_turnover DECIMAL(15,2)`)
  await pool.query(`ALTER TABLE partners ADD COLUMN IF NOT EXISTS contact_person TEXT`)
  await pool.query(`ALTER TABLE partners ADD COLUMN IF NOT EXISTS working_hours TEXT`)
  await pool.query(`ALTER TABLE ad_orders ADD COLUMN IF NOT EXISTS ad_placement TEXT`)
  await pool.query(`ALTER TABLE ad_orders ADD COLUMN IF NOT EXISTS customer_phone TEXT`)
  await pool.query(`ALTER TABLE ad_orders ADD COLUMN IF NOT EXISTS customer_comment TEXT`)
  await pool.query(`ALTER TABLE ad_orders ADD COLUMN IF NOT EXISTS request_type VARCHAR(50)`)
  await pool.query(`ALTER TABLE shops ADD COLUMN IF NOT EXISTS ads_enabled BOOLEAN DEFAULT false`)
  await pool.query(`ALTER TABLE shops ADD COLUMN IF NOT EXISTS ad_channel_id TEXT`)
  await pool.query(`ALTER TABLE shops ADD COLUMN IF NOT EXISTS ad_prices JSONB DEFAULT '{}'`)
  await pool.query(`ALTER TABLE shops ADD COLUMN IF NOT EXISTS web_admin_login TEXT`)
  await pool.query(`ALTER TABLE shops ADD COLUMN IF NOT EXISTS web_admin_password TEXT`)
  await pool.query(
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'`
  )
  await pool.query(
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'`
  )
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'card'`)
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT`)
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP`)
  await pool.query(`ALTER TABLE shops ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(20)`)
  await pool.query(`ALTER TABLE shops ADD COLUMN IF NOT EXISTS payment_merchant_id TEXT`)
  await pool.query(`ALTER TABLE shops ADD COLUMN IF NOT EXISTS payment_service_id TEXT`)
  await pool.query(`ALTER TABLE shops ADD COLUMN IF NOT EXISTS payment_secret TEXT`)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ad_orders (
      id SERIAL PRIMARY KEY,
      shop_id INTEGER REFERENCES shops(id),
      customer_telegram_id BIGINT,
      customer_username TEXT,
      ad_text TEXT,
      ad_photo_file_id TEXT,
      duration_hours INTEGER,
      price DECIMAL(10,2),
      payment_status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)
  await pool.query(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT`)
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT false`)
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) DEFAULT NULL`)
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0`)
  await pool.query(`ALTER TABLE shops ADD COLUMN IF NOT EXISTS tariff VARCHAR(30) DEFAULT 'trial'`)
  await pool.query(`ALTER TABLE shops ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP`)
  await pool.query(`ALTER TABLE shops ADD COLUMN IF NOT EXISTS trial_reminder_sent_at TIMESTAMP`)
  await pool.query(`ALTER TABLE shops ADD COLUMN IF NOT EXISTS next_payment_due DATE`)
  await pool.query(`ALTER TABLE shops ADD COLUMN IF NOT EXISTS payment_reminder_sent_at TIMESTAMP`)
  await pool.query(`ALTER TABLE products ALTER COLUMN price DROP NOT NULL`)
  // Safety net: prevents duplicate shop_order_number under any remaining race condition
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uniq_orders_shop_order_number
    ON orders(shop_id, shop_order_number)
  `)
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
