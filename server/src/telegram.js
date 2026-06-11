import { ORDER_STATUS_LABELS, formatPrice } from './constants.js'

const API_BASE = 'https://api.telegram.org/bot'

export async function sendTelegramMessage(chatId, text) {
  const token = process.env.BOT_TOKEN
  if (!token || !chatId) return null

  try {
    const res = await fetch(`${API_BASE}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
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

export async function notifyOwnerNewOrder(order, items) {
  const ownerId = process.env.OWNER_TELEGRAM_ID
  if (!ownerId) return

  const itemsText = items
    .map((item) => {
      const parts = [item.product_name]
      if (item.size) parts.push(`размер ${item.size}`)
      if (item.color) parts.push(item.color)
      return `• ${parts.join(', ')} × ${item.quantity} — ${formatPrice(item.price * item.quantity)}`
    })
    .join('\n')

  const text = [
    `🆕 <b>Новый заказ #${order.id}</b>`,
    '',
    `👤 ${order.customer_name}`,
    `📞 ${order.phone}`,
    `📍 ${order.address}`,
    order.comment ? `💬 ${order.comment}` : null,
    '',
    itemsText,
    '',
    `💰 Итого: <b>${formatPrice(order.total)}</b>`,
  ]
    .filter((line) => line !== null)
    .join('\n')

  return sendTelegramMessage(ownerId, text)
}

export async function notifyCustomerStatusChange(order) {
  if (!order.telegram_user_id) return

  const label = ORDER_STATUS_LABELS[order.status] || order.status
  const text = `📦 Статус вашего заказа <b>#${order.id}</b> изменён:\n<b>${label}</b>`

  return sendTelegramMessage(order.telegram_user_id, text)
}
