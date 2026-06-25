import { pool } from '../db/index.js'
import { restoreOrderStock } from '../services/orderStock.js'
import { notifyCustomerOrderExpired } from '../telegram.js'

const CHECK_INTERVAL_MS = 60 * 1000

async function cancelExpiredOrders() {
  const { rows: expiredOrders } = await pool.query(
    `SELECT o.*, s.auto_cancel_minutes, s.bot_token, s.owner_telegram_id
     FROM orders o
     JOIN shops s ON s.id = o.shop_id
     WHERE o.status = 'new'
       AND (s.auto_cancel_minutes IS NULL OR s.auto_cancel_minutes > 0)
       AND o.created_at < NOW() - (COALESCE(s.auto_cancel_minutes, 15) || ' minutes')::INTERVAL`
  )

  for (const order of expiredOrders) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await restoreOrderStock(client, order.id)
      await client.query(
        `UPDATE orders SET status = 'expired', updated_at = now() WHERE id = $1`,
        [order.id]
      )
      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      console.error(`Failed to auto-cancel order #${order.id}:`, err)
      continue
    } finally {
      client.release()
    }

    const shopResult = await pool.query('SELECT * FROM shops WHERE id = $1', [order.shop_id])
    notifyCustomerOrderExpired(order, shopResult.rows[0]).catch((err) =>
      console.error('Expiry notification failed:', err)
    )
  }
}

export function startAutoCancelJob() {
  setInterval(() => {
    cancelExpiredOrders().catch((err) => console.error('Auto-cancel job failed:', err))
  }, CHECK_INTERVAL_MS)
}
