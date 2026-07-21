import { Router } from 'express'
import { createHash } from 'crypto'
import { query } from '../../db/index.js'

const router = Router()

const ERRORS = {
  SUCCESS: 0,
  SIGN_FAILED: -1,
  AMOUNT_INVALID: -2,
  ACTION_INVALID: -3,
  ALREADY_PAID: -4,
  USER_NOT_FOUND: -5,
  TRANSACTION_NOT_FOUND: -6,
  TRANSACTION_CANCELLED: -9,
}

function md5(str) {
  return createHash('md5').update(str).digest('hex')
}

router.post('/webhook', async (req, res) => {
  const {
    click_trans_id,
    service_id,
    merchant_trans_id,
    merchant_prepare_id,
    amount,
    action,
    error,
    sign_time,
    sign_string,
  } = req.body

  const orderResult = await query(
    `SELECT o.*, s.payment_secret, s.payment_service_id
     FROM orders o
     JOIN shops s ON s.id = o.shop_id
     WHERE o.id = $1`,
    [merchant_trans_id]
  )

  if (!orderResult.rows.length) {
    return res.json({
      click_trans_id,
      merchant_trans_id,
      error: ERRORS.TRANSACTION_NOT_FOUND,
      error_note: 'Order not found',
    })
  }

  const order = orderResult.rows[0]
  const secret = order.payment_secret
  const svcId = order.payment_service_id

  const signSource =
    Number(action) === 0
      ? `${click_trans_id}${svcId}${secret}${merchant_trans_id}${amount}${action}${sign_time}`
      : `${click_trans_id}${svcId}${secret}${merchant_trans_id}${merchant_prepare_id}${amount}${action}${sign_time}`

  if (sign_string !== md5(signSource)) {
    return res.json({
      click_trans_id,
      merchant_trans_id,
      error: ERRORS.SIGN_FAILED,
      error_note: 'Invalid sign',
    })
  }

  if (Number(action) === 0) {
    if (order.payment_state === 'paid' || order.status === 'confirmed') {
      return res.json({
        click_trans_id,
        merchant_trans_id,
        error: ERRORS.ALREADY_PAID,
        error_note: 'Already paid',
      })
    }

    await query(
      `UPDATE orders SET payment_transaction_id = $1, payment_state = 'pending' WHERE id = $2`,
      [String(click_trans_id), order.id]
    )

    return res.json({
      click_trans_id,
      merchant_trans_id,
      merchant_prepare_id: order.id,
      error: ERRORS.SUCCESS,
      error_note: 'Success',
    })
  }

  if (Number(action) === 1) {
    if (Number(error) < 0) {
      await query(`UPDATE orders SET payment_state = 'cancelled' WHERE id = $1`, [order.id])
      return res.json({
        click_trans_id,
        merchant_trans_id,
        merchant_confirm_id: order.id,
        error: ERRORS.SUCCESS,
        error_note: 'Cancelled',
      })
    }

    await query(
      `UPDATE orders SET payment_state = 'paid', paid_at = NOW(), status = 'confirmed' WHERE id = $1`,
      [order.id]
    )

    return res.json({
      click_trans_id,
      merchant_trans_id,
      merchant_confirm_id: order.id,
      error: ERRORS.SUCCESS,
      error_note: 'Success',
    })
  }

  return res.json({
    click_trans_id,
    merchant_trans_id,
    error: ERRORS.ACTION_INVALID,
    error_note: 'Invalid action',
  })
})

export default router
