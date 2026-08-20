import { query } from '../db/index.js'

const CHECK_INTERVAL_MS = 60 * 60 * 1000

async function blockExpiredShops() {
  const { rows } = await query(`
    SELECT id FROM shops
    WHERE is_active = true
      AND blocked = false
      AND payment_status IS DISTINCT FROM 'paid'
      AND (
        (trial_ends_at IS NOT NULL AND trial_ends_at < NOW())
        OR
        (next_payment_due IS NOT NULL AND next_payment_due < CURRENT_DATE)
      )
  `)

  if (!rows.length) return

  const ids = rows.map((r) => r.id)
  await query(
    `UPDATE shops SET blocked = true, payment_status = 'expired' WHERE id = ANY($1)`,
    [ids]
  )
  console.log(`[checkExpiredSubscriptions] Blocked ${ids.length} shop(s): ${ids.join(', ')}`)
}

export function startCheckExpiredSubscriptionsJob() {
  blockExpiredShops().catch((err) =>
    console.error('[checkExpiredSubscriptions] Startup check failed:', err)
  )
  setInterval(() => {
    blockExpiredShops().catch((err) =>
      console.error('[checkExpiredSubscriptions] Job failed:', err)
    )
  }, CHECK_INTERVAL_MS)
}
