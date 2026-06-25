import { pool } from '../db/index.js'

let lastSentDate = ''

async function sendCreditReminders() {
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const today = now.toISOString().split('T')[0]

  if (hour !== 9 || minute > 9) return
  if (lastSentDate === today) return
  lastSentDate = today

  const { rows: orders } = await pool.query(
    `SELECT o.*, s.bot_token, s.owner_telegram_id, s.currency
     FROM orders o
     JOIN shops s ON s.id = o.shop_id
     WHERE o.payment_type = 'credit'
       AND o.payment_status = 'pending'
       AND o.payment_due_date = CURRENT_DATE + INTERVAL '1 day'
       AND s.bot_token IS NOT NULL
       AND s.owner_telegram_id IS NOT NULL
       AND s.credit_enabled = true`
  )

  for (const order of orders) {
    const dueDate = new Date(order.payment_due_date).toLocaleDateString('ru-RU')
    const currency = order.currency || 'сум'
    const text =
      `⚠️ Напоминание о долге!\n` +
      `Клиент: ${order.customer_name} ${order.phone}\n` +
      `Сумма: ${order.total} ${currency}\n` +
      `Дата оплаты: ${dueDate}`

    try {
      await fetch(`https://api.telegram.org/bot${order.bot_token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: order.owner_telegram_id, text }),
      })
    } catch (err) {
      console.error(`Credit reminder failed for order #${order.id}:`, err)
    }
  }
}

export function startCreditReminderJob() {
  setInterval(() => {
    sendCreditReminders().catch((err) => console.error('Credit reminder job error:', err))
  }, 60 * 1000)
}
