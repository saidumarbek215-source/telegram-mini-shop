import { Router } from 'express'
import { pool, query } from '../db/index.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getWebhookSecretToken } from '../utils/telegramAuth.js'
import { restoreOrderStock } from '../services/orderStock.js'
import { formatPrice } from '../constants.js'
import {
  answerCallbackQuery,
  editMessageText,
  escapeHtml,
  notifyCustomerOrderCancelled,
  notifyCustomerOrderConfirmed,
  sendTelegramMessage,
  sendTelegramPhoto,
} from '../telegram.js'

const router = Router()

// Telegram user id -> { shopId, orderId, expiresAt }. Set when a customer
// opens a chat via the "Написать продавцу" deep link (/start order_<id>), so
// the next photo they send (the payment receipt) can be forwarded to the
// shop owner with the right order context.
const pendingReceipts = new Map()
const PENDING_RECEIPT_TTL_MS = 60 * 60 * 1000

// POST /api/telegram/webhook/:shopId - Telegram Bot API webhook for a shop's bot.
// Configure with: setWebhook(url=".../api/telegram/webhook/<shopId>", secret_token=getWebhookSecretToken(bot_token))
router.post(
  '/webhook/:shopId',
  asyncHandler(async (req, res) => {
    const shopId = Number(req.params.shopId)
    const shopResult = await query('SELECT * FROM shops WHERE id = $1', [shopId])
    const shop = shopResult.rows[0]

    if (!shop?.bot_token) return res.sendStatus(200)

    const secret = req.headers['x-telegram-bot-api-secret-token']
    if (secret !== getWebhookSecretToken(shop.bot_token)) return res.sendStatus(401)

    const update = req.body || {}

    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query, shop)
    } else if (update.message) {
      await handleMessage(update.message, shop)
    }

    res.sendStatus(200)
  })
)

async function handleCallbackQuery(callbackQuery, shop) {
  const match = (callbackQuery.data || '').match(/^(confirm|cancel)_order_(\d+)$/)
  if (!match) {
    await answerCallbackQuery(callbackQuery.id, shop.bot_token)
    return
  }

  const [, action, orderIdStr] = match
  const orderId = Number(orderIdStr)
  const chatId = callbackQuery.message?.chat?.id
  const messageId = callbackQuery.message?.message_id
  const originalText = callbackQuery.message?.text || ''

  const orderResult = await query('SELECT * FROM orders WHERE id = $1 AND shop_id = $2', [
    orderId,
    shop.id,
  ])
  const order = orderResult.rows[0]

  if (!order) {
    await answerCallbackQuery(callbackQuery.id, shop.bot_token, 'Заказ не найден')
    return
  }

  if (order.status !== 'new') {
    await answerCallbackQuery(callbackQuery.id, shop.bot_token, 'Заказ уже обработан')
    return
  }

  if (action === 'confirm') {
    const result = await query(
      `UPDATE orders SET status = 'accepted', updated_at = now() WHERE id = $1 RETURNING *`,
      [orderId]
    )
    await notifyCustomerOrderConfirmed(result.rows[0], shop)
    await answerCallbackQuery(callbackQuery.id, shop.bot_token, 'Заказ подтверждён')
    await editMessageText(chatId, messageId, `${originalText}\n\n✅ Подтверждён`, shop.bot_token)
    return
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await restoreOrderStock(client, orderId)
    await client.query(
      `UPDATE orders SET status = 'cancelled', updated_at = now() WHERE id = $1`,
      [orderId]
    )
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  const updatedResult = await query('SELECT * FROM orders WHERE id = $1', [orderId])
  await notifyCustomerOrderCancelled(updatedResult.rows[0], shop)
  await answerCallbackQuery(callbackQuery.id, shop.bot_token, 'Заказ отменён')
  await editMessageText(chatId, messageId, `${originalText}\n\n❌ Отменён`, shop.bot_token)
}

async function handleMessage(message, shop) {
  const fromId = message.from?.id
  const text = message.text || ''
  const startMatch = text.match(/^\/start(?:@\w+)?(?:\s+order_(\d+))?/)

  if (startMatch) {
    if (startMatch[1]) await forwardOrderContact(Number(startMatch[1]), message, shop)
    return
  }

  if (message.photo?.length && fromId) {
    const pending = pendingReceipts.get(fromId)
    if (pending && pending.shopId === shop.id && pending.expiresAt > Date.now()) {
      const fileId = message.photo[message.photo.length - 1].file_id
      await sendTelegramPhoto(
        shop.owner_telegram_id,
        fileId,
        shop.bot_token,
        `📎 Чек об оплате к заказу #${pending.orderId}`
      )
      await sendTelegramMessage(fromId, 'Спасибо! Чек отправлен продавцу.', shop.bot_token)
    }
  }
}

// Handles "/start order_<id>" sent when a customer taps "Написать продавцу"
// (Telegram.WebApp.openTelegramLink with a `start` deep link). Forwards the
// order summary to the shop owner and asks the customer for the receipt photo.
async function forwardOrderContact(orderId, message, shop) {
  const fromId = message.from?.id
  if (!fromId) return

  const orderResult = await query('SELECT * FROM orders WHERE id = $1 AND shop_id = $2', [
    orderId,
    shop.id,
  ])
  const order = orderResult.rows[0]
  if (!order) return

  const itemsResult = await query('SELECT * FROM order_items WHERE order_id = $1', [orderId])
  const itemsText = itemsResult.rows
    .map((item) =>
      [escapeHtml(item.product_name), item.size && `размер ${escapeHtml(item.size)}`, item.color && escapeHtml(item.color)]
        .filter(Boolean)
        .join(', ')
    )
    .join('\n')

  const username = message.from?.username ? ` (@${escapeHtml(message.from.username)})` : ''

  const text = [
    `💬 Покупатель открыл чат по заказу <b>#${order.id}</b>`,
    '',
    `Товар: ${itemsText}`,
    `Сумма: <b>${formatPrice(order.total)}</b>`,
    `👤 ${escapeHtml(order.customer_name)}${username}`,
    `📱 ${escapeHtml(order.phone)}`,
    '',
    '📎 Фото чека: клиент отправит следующим сообщением',
  ].join('\n')

  await sendTelegramMessage(shop.owner_telegram_id, text, shop.bot_token)
  await sendTelegramMessage(
    fromId,
    `Информация о заказе #${order.id} передана продавцу.\nОтправьте сюда фото чека об оплате — мы передадим его продавцу.`,
    shop.bot_token
  )

  pendingReceipts.set(fromId, {
    shopId: shop.id,
    orderId: order.id,
    expiresAt: Date.now() + PENDING_RECEIPT_TTL_MS,
  })
}

export default router
