import { Router } from 'express'
import { query } from '../../db/index.js'

const router = Router()

const ERRORS = {
  INVALID_AMOUNT:        { code: -31001, message: { ru: 'Неверная сумма',                  uz: "Noto'g'ri summa",         en: 'Invalid amount' } },
  ORDER_NOT_FOUND:       { code: -31050, message: { ru: 'Заказ не найден',                  uz: 'Buyurtma topilmadi',       en: 'Order not found' } },
  CANT_DO_OPERATION:     { code: -31008, message: { ru: 'Невозможно выполнить операцию',     uz: "Amal bajarib bo'lmaydi",  en: 'Cannot perform operation' } },
  TRANSACTION_NOT_FOUND: { code: -31003, message: { ru: 'Транзакция не найдена',             uz: 'Tranzaksiya topilmadi',    en: 'Transaction not found' } },
  AUTH_FAILED:           { code: -32504, message: { ru: 'Ошибка авторизации',                uz: 'Avtorizatsiya xatosi',     en: 'Authentication failed' } },
  METHOD_NOT_FOUND:      { code: -32601, message: { ru: 'Метод не найден',                   uz: 'Metod topilmadi',          en: 'Method not found' } },
}

const ok  = (id, result) => ({ jsonrpc: '2.0', id, result })
const err = (id, e)      => ({ jsonrpc: '2.0', id, error: e })

async function getOrder(orderId) {
  const r = await query(
    `SELECT o.*, s.payment_secret
     FROM orders o JOIN shops s ON s.id = o.shop_id
     WHERE o.id = $1`,
    [orderId]
  )
  return r.rows[0] || null
}

router.post('/', async (req, res) => {
  const { method, params = {}, id } = req.body || {}

  const orderId = params?.account?.order_id
  const order = orderId ? await getOrder(orderId) : null

  const expectedAuth = order
    ? 'Basic ' + Buffer.from(`Paycom:${order.payment_secret}`).toString('base64')
    : null

  if (!expectedAuth || (req.headers['authorization'] || '') !== expectedAuth) {
    return res.json(err(id, ERRORS.AUTH_FAILED))
  }

  switch (method) {
    case 'CheckPerformTransaction': {
      if (!order) return res.json(err(id, ERRORS.ORDER_NOT_FOUND))
      if (params.amount !== Math.round(Number(order.total) * 100))
        return res.json(err(id, ERRORS.INVALID_AMOUNT))
      return res.json(ok(id, { allow: true }))
    }

    case 'CreateTransaction': {
      if (!order) return res.json(err(id, ERRORS.ORDER_NOT_FOUND))
      if (order.payment_state === '2') return res.json(err(id, ERRORS.CANT_DO_OPERATION))

      await query(
        `UPDATE orders SET payment_transaction_id = $1, payme_create_time = $2, payment_state = '1' WHERE id = $3`,
        [params.id, Date.now(), order.id]
      )

      return res.json(ok(id, { create_time: Date.now(), transaction: String(order.id), state: 1 }))
    }

    case 'PerformTransaction': {
      if (!order) return res.json(err(id, ERRORS.TRANSACTION_NOT_FOUND))
      if (order.payment_state !== '1') return res.json(err(id, ERRORS.CANT_DO_OPERATION))

      const performTime = Date.now()
      await query(
        `UPDATE orders SET payment_state = '2', paid_at = NOW(), status = 'confirmed' WHERE id = $1`,
        [order.id]
      )

      return res.json(ok(id, { transaction: String(order.id), perform_time: performTime, state: 2 }))
    }

    case 'CancelTransaction': {
      if (!order) return res.json(err(id, ERRORS.TRANSACTION_NOT_FOUND))

      const cancelState = order.payment_state === '2' ? '-2' : '-1'
      await query(`UPDATE orders SET payment_state = $1 WHERE id = $2`, [cancelState, order.id])

      return res.json(ok(id, { transaction: String(order.id), cancel_time: Date.now(), state: Number(cancelState) }))
    }

    case 'CheckTransaction': {
      if (!order || !order.payment_transaction_id)
        return res.json(err(id, ERRORS.TRANSACTION_NOT_FOUND))

      return res.json(ok(id, {
        create_time:  order.payme_create_time || 0,
        perform_time: order.paid_at ? new Date(order.paid_at).getTime() : 0,
        cancel_time:  0,
        transaction:  String(order.id),
        state:        Number(order.payment_state) || 0,
        reason:       null,
      }))
    }

    default:
      return res.json(err(id, ERRORS.METHOD_NOT_FOUND))
  }
})

export default router
