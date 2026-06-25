import { ORDER_STATUS_LABELS, formatPrice } from './constants.js'

const API_BASE = 'https://api.telegram.org/bot'

// Escapes text inserted into messages sent with parse_mode: 'HTML', so that
// customer/admin-provided values can't break formatting or be misread as tags.
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]))
}

export async function sendTelegramMessage(chatId, text, botToken, replyMarkup = null) {
  if (!botToken || !chatId) return null

  try {
    const body = { chat_id: chatId, text, parse_mode: 'HTML' }
    if (replyMarkup) body.reply_markup = replyMarkup

    const res = await fetch(`${API_BASE}${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!data.ok) {
      console.error('Telegram API error:', data.description)
    }
    return data
  } catch (err) {
    console.error('Failed to send Telegram message:', err.message)
    return null
  }
}

export async function sendTelegramPhoto(chatId, fileId, botToken, caption = '') {
  if (!botToken || !chatId) return null

  try {
    const res = await fetch(`${API_BASE}${botToken}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, photo: fileId, caption, parse_mode: 'HTML' }),
    })
    const data = await res.json()
    if (!data.ok) {
      console.error('Telegram API error:', data.description)
    }
    return data
  } catch (err) {
    console.error('Failed to send Telegram photo:', err.message)
    return null
  }
}

// Downloads a file sent to the bot (e.g. a photo) via Telegram's getFile API
// and returns its bytes as base64 plus its content type, so it can be
// forwarded to other APIs (ImgBB, Claude vision).
export async function downloadTelegramFile(fileId, botToken) {
  const fileRes = await fetch(`${API_BASE}${botToken}/getFile?file_id=${fileId}`)
  const fileData = await fileRes.json()
  if (!fileData.ok) throw new Error(fileData.description || 'getFile failed')

  const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`
  const downloadRes = await fetch(fileUrl)
  if (!downloadRes.ok) throw new Error(`Failed to download file: ${downloadRes.status}`)

  const arrayBuffer = await downloadRes.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')
  const mimeType = (downloadRes.headers.get('content-type') || 'image/jpeg').split(';')[0].trim()

  return { base64, mimeType }
}

export async function editMessageText(chatId, messageId, text, botToken, replyMarkup = null) {
  if (!botToken || !chatId || !messageId) return null

  try {
    const res = await fetch(`${API_BASE}${botToken}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup || { inline_keyboard: [] },
      }),
    })
    const data = await res.json()
    if (!data.ok) {
      console.error('Telegram API error:', data.description)
    }
    return data
  } catch (err) {
    console.error('Failed to edit Telegram message:', err.message)
    return null
  }
}

export async function answerCallbackQuery(callbackQueryId, botToken, text = '') {
  if (!botToken || !callbackQueryId) return null

  try {
    const res = await fetch(`${API_BASE}${botToken}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
    })
    const data = await res.json()
    if (!data.ok) {
      console.error('Telegram API error:', data.description)
    }
    return data
  } catch (err) {
    console.error('Failed to answer callback query:', err.message)
    return null
  }
}

export async function notifyOwnerNewOrder(order, items, shop) {
  if (!shop?.bot_token || !shop?.owner_telegram_id) return

  const orderNum = order.shop_order_number || order.id
  const isCredit = order.payment_type === 'credit'

  const itemsText = items
    .map((item) => {
      const parts = [escapeHtml(item.product_name)]
      if (item.size) parts.push(`размер ${escapeHtml(item.size)}`)
      if (item.color) parts.push(escapeHtml(item.color))
      parts.push(`${item.quantity} шт.`)
      return `• ${parts.join(', ')}`
    })
    .join('\n')

  const paymentLine = isCredit
    ? `📅 РАССРОЧКА! Оплата до: <b>${order.payment_due_date ? new Date(order.payment_due_date).toLocaleDateString('ru-RU') : '—'}</b>`
    : `💳 Реквизиты отправлены клиенту`

  const text = [
    `🛍 <b>Новый заказ #${orderNum}</b>`,
    '',
    `👤 Имя: ${escapeHtml(order.customer_name)}`,
    `👤 @${order.telegram_username ? escapeHtml(order.telegram_username) : 'не указан'}`,
    `📱 Телефон: ${escapeHtml(order.phone)}`,
    (() => {
      const coordsMatch = order.address.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/)
      if (coordsMatch) {
        const [, lat, lng] = coordsMatch
        return `📍 Адрес: <a href="https://maps.google.com/?q=${lat},${lng}">Открыть на карте</a>`
      }
      return `📍 Адрес: ${escapeHtml(order.address)}`
    })(),
    order.comment ? `💬 Комментарий: ${escapeHtml(order.comment)}` : null,
    '',
    `🛒 Товары:`,
    itemsText,
    '',
    `💰 Итого: <b>${formatPrice(order.total)}</b>`,
    '',
    paymentLine,
  ]
    .filter((line) => line !== null)
    .join('\n')

  const replyMarkup = {
    inline_keyboard: [
      [
        { text: '✅ Подтвердить', callback_data: `confirm_order_${order.id}` },
        { text: '❌ Отменить', callback_data: `cancel_order_${order.id}` },
      ],
    ],
  }

  return sendTelegramMessage(shop.owner_telegram_id, text, shop.bot_token, replyMarkup)
}

export async function notifyCustomerStatusChange(order, shop) {
  if (!order.telegram_user_id || !shop?.bot_token) return

  const label = ORDER_STATUS_LABELS[order.status] || order.status
  const text = `📦 Статус вашего заказа <b>#${order.id}</b> изменён:\n<b>${label}</b>`

  return sendTelegramMessage(order.telegram_user_id, text, shop.bot_token)
}

export async function notifyCustomerOrderConfirmed(order, shop) {
  if (!order.telegram_user_id || !shop?.bot_token) return

  const text = `✅ Ваш заказ <b>#${order.id}</b> подтверждён! Ожидайте доставку.`
  return sendTelegramMessage(order.telegram_user_id, text, shop.bot_token)
}

export async function notifyCustomerOrderCancelled(order, shop) {
  if (!order.telegram_user_id || !shop?.bot_token) return

  const text = `❌ Ваш заказ <b>#${order.id}</b> отменён.`
  return sendTelegramMessage(order.telegram_user_id, text, shop.bot_token)
}

export async function notifyCustomerOrderExpired(order, shop) {
  if (!order.telegram_user_id || !shop?.bot_token) return

  const text = `⏱ Ваш заказ <b>#${order.id}</b> отменён — время оплаты истекло.`
  return sendTelegramMessage(order.telegram_user_id, text, shop.bot_token)
}
