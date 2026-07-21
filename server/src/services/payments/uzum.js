import { Router } from 'express'
import { query } from '../../db/index.js'

const router = Router()

// TODO: Replace with real Uzum Bank API base URL once sandbox access is received
const UZUM_API_BASE = process.env.UZUM_API_URL || 'https://api.uzumbank.uz/payment'

router.post('/create/:orderId', async (req, res) => {
  try {
    const orderResult = await query(
      `SELECT o.*, s.payment_merchant_id, s.payment_secret
       FROM orders o JOIN shops s ON s.id = o.shop_id
       WHERE o.id = $1`,
      [req.params.orderId]
    )

    if (!orderResult.rows.length) return res.status(404).json({ error: 'Order not found' })

    const order = orderResult.rows[0]
    const auth = Buffer.from(`${order.payment_merchant_id}:${order.payment_secret}`).toString('base64')

    // TODO: Adjust request body fields to match actual Uzum Bank API spec
    const uzumRes = await fetch(`${UZUM_API_BASE}/create`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // TODO: Confirm exact field names from Uzum Bank sandbox docs
        orderId:     String(order.id),
        amount:      Math.round(Number(order.total) * 100),
        currency:    'UZS',
        description: `Order #${order.id}`,
      }),
    })

    const data = await uzumRes.json()

    // TODO: Confirm response field name for payment ID (may be paymentId / id / payment_id)
    const paymentId = data.paymentId || data.id || data.payment_id

    await query(
      `UPDATE orders SET payment_transaction_id = $1, payment_state = 'pending' WHERE id = $2`,
      [String(paymentId), order.id]
    )

    res.json({ success: true, paymentId, data })
  } catch (e) {
    console.error('Uzum create error:', e)
    res.status(500).json({ error: e.message })
  }
})

router.post('/webhook', async (req, res) => {
  try {
    // TODO: Add webhook signature verification once Uzum Bank provides signing details
    const { orderId, status } = req.body

    if (!orderId || !status) return res.status(400).json({ error: 'orderId and status are required' })

    if (['PAID', 'SUCCESS'].includes(status)) {
      await query(
        `UPDATE orders SET payment_state = 'paid', paid_at = NOW(), status = 'confirmed' WHERE id = $1`,
        [orderId]
      )
    } else if (['CANCELLED', 'FAILED'].includes(status)) {
      await query(`UPDATE orders SET payment_state = 'cancelled' WHERE id = $1`, [orderId])
    }

    res.json({ success: true })
  } catch (e) {
    console.error('Uzum webhook error:', e)
    res.status(500).json({ error: e.message })
  }
})

export default router
