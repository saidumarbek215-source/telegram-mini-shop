import { pool } from '../db/index.js'
import { restoreOrderStock } from '../services/orderStock.js'
import { notifyCustomerOrderExpired } from '../telegram.js'

const CHECK_INTERVAL_MS = 60 * 1000
const ORDER_TIMEOUT = '15 minutes'

// Cancels orders that have stayed in 'new' status for longer than
// ORDER_TIMEOUT (payment was never confirmed), returns their items to stock
// and notifies the customer.
async function cancelExpiredOrders() {
  const { rows: expiredOrders } = await pool.query(
    `SELECT * FROM orders WHERE status = 'new' AND created_at < NOW() - INTERVAL '${ORDER_TIMEOUT}'`
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
