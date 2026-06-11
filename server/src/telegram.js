import { ORDER_STATUS_LABELS, formatPrice } from './constants.js'

const API_BASE = 'https://api.telegram.org/bot'

export async function sendTelegramMessage(chatId, text, botToken) {
  if (!botToken || !chatId) return null

  try {
    const res = await fetch(`${API_BASE}${botToken}/sendMessage`, {
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

export async function notifyOwnerNewOrder(order, items, shop) {
  if (!shop?.bot_token || !shop?.owner_telegram_id) return

  const itemsText = items
    .map((item) => {
      const parts = [item.product_name]
      if (item.size) parts.push(`размер ${item.size}`)
      if (item.color) parts.push(item.color)
      parts.push(`${item.quantity} шт.`)
      return `• ${parts.join(', ')}`
    })
    .join('\n')

  const text = [
    `🛍 <b>Новый заказ #${order.id}</b>`,
    '',
    `👤 Имя: ${order.customer_name}`,
    `📱 Телефон: ${order.phone}`,
    `📍 Адрес: ${order.address}`,
    order.comment ? `💬 Комментарий: ${order.comment}` : null,
    '',
    `🛒 Товары:`,
    itemsText,
    '',
    `💰 Итого: <b>${formatPrice(order.total)}</b>`,
    '',
    `💳 Реквизиты отправлены клиенту`,
  ]
    .filter((line) => line !== null)
    .join('\n')

  return sendTelegramMessage(shop.owner_telegram_id, text, shop.bot_token)
}

export async function notifyCustomerStatusChange(order, shop) {
  if (!order.telegram_user_id || !shop?.bot_token) return

  const label = ORDER_STATUS_LABELS[order.status] || order.status
  const text = `📦 Статус вашего заказа <b>#${order.id}</b> изменён:\n<b>${label}</b>`

  return sendTelegramMessage(order.telegram_user_id, text, shop.bot_token)
}
