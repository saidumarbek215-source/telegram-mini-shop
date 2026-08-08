/**
 * Renumber shop_order_number for all shops that have duplicates,
 * assigning sequential numbers (1, 2, 3...) ordered by created_at.
 *
 * Usage:
 *   node scripts/renumber-orders.mjs          # dry-run (shows SQL, no writes)
 *   node scripts/renumber-orders.mjs --apply  # executes the migration
 */

import 'dotenv/config'
import pg from 'pg'
import { fileURLToPath } from 'url'

const DRY_RUN = !process.argv.includes('--apply')

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false,
  max: 3,
})

async function main() {
  const client = await pool.connect()
  try {
    // 1. Find shops with duplicate shop_order_numbers
    const dupResult = await client.query(`
      SELECT DISTINCT shop_id
      FROM orders
      GROUP BY shop_id, shop_order_number
      HAVING COUNT(*) > 1
      ORDER BY shop_id
    `)

    const shopIds = dupResult.rows.map((r) => r.shop_id)

    if (shopIds.length === 0) {
      console.log('✅ No duplicate shop_order_numbers found. Nothing to do.')
      return
    }

    console.log(`Found duplicate shop_order_numbers in shop_id(s): ${shopIds.join(', ')}\n`)

    // 2. For each shop, compute the new numbering ordered by created_at
    const allUpdates = [] // { shop_id, order_id, old_num, new_num, created_at }

    for (const shopId of shopIds) {
      const ordersResult = await client.query(
        `SELECT id, shop_order_number, created_at
         FROM orders
         WHERE shop_id = $1
         ORDER BY created_at ASC, id ASC`,
        [shopId]
      )

      ordersResult.rows.forEach((row, idx) => {
        allUpdates.push({
          shop_id: shopId,
          order_id: row.id,
          old_num: row.shop_order_number,
          new_num: idx + 1,
          created_at: row.created_at,
        })
      })
    }

    // 3. Print the planned SQL (one UPDATE per row)
    console.log('=== SQL to be executed (inside a single transaction) ===\n')
    console.log('BEGIN;\n')

    // First pass: set negatives to avoid unique constraint conflicts mid-update
    console.log('-- Pass 1: move to negative temp values to avoid conflicts')
    for (const u of allUpdates) {
      console.log(
        `UPDATE orders SET shop_order_number = ${-u.order_id} WHERE id = ${u.order_id};` +
        `  -- shop ${u.shop_id}, was ${u.old_num}, created_at ${u.created_at.toISOString()}`
      )
    }

    console.log('\n-- Pass 2: set final sequential values')
    for (const u of allUpdates) {
      console.log(
        `UPDATE orders SET shop_order_number = ${u.new_num} WHERE id = ${u.order_id};` +
        `  -- shop ${u.shop_id}, was ${u.old_num} → now ${u.new_num}`
      )
    }

    console.log('\nCOMMIT;\n')
    console.log(`=== Total rows to update: ${allUpdates.length} ===\n`)

    if (DRY_RUN) {
      console.log('🔍 DRY RUN — nothing was written. Re-run with --apply to execute.')
      return
    }

    // 4. Execute inside a single transaction
    console.log('Applying migration...')
    await client.query('BEGIN')

    try {
      // Pass 1: set negative temp values (avoids any unique constraint violation mid-update)
      for (const u of allUpdates) {
        await client.query('UPDATE orders SET shop_order_number = $1 WHERE id = $2', [
          -u.order_id,
          u.order_id,
        ])
      }

      // Pass 2: set final sequential values
      for (const u of allUpdates) {
        await client.query('UPDATE orders SET shop_order_number = $1 WHERE id = $2', [
          u.new_num,
          u.order_id,
        ])
      }

      await client.query('COMMIT')
      console.log(`✅ Renumbered ${allUpdates.length} orders successfully.\n`)
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    }

    // 5. Run existing migrate.js to create the UNIQUE INDEX
    console.log('Running migrate.js to create UNIQUE INDEX...')
    const { migrate } = await import('../src/db/migrate.js')
    await migrate()
    console.log('✅ UNIQUE INDEX created (or already exists).')
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error('❌ Migration failed:', err.message)
  process.exit(1)
})
