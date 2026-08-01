import { query } from '../db/index.js'
import { sendTelegramMessage } from '../telegram.js'

let lastRunDate = ''

async function checkSubscriptionReminders() {
  const today = new Date().toISOString().split('T')[0]
  if (lastRunDate === today) return
  lastRunDate = today

  // Trial ending reminder — fires when 2 days remain (day 5 of 7)
  const { rows: trialShops } = await query(`
    SELECT * FROM shops
    WHERE trial_ends_at IS NOT NULL
      AND trial_ends_at BETWEEN NOW() + INTERVAL '1 day' AND NOW() + INTERVAL '3 days'
      AND trial_reminder_sent_at IS NULL
      AND (payment_status IS NULL OR payment_status != 'paid')
  `)

  for (const shop of trialShops) {
    if (!shop.owner_telegram_id || !shop.bot_token) continue
    const daysLeft = Math.ceil((new Date(shop.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24))
    try {
      await sendTelegramMessage(
        shop.owner_telegram_id,
        `⏰ Hurmatli ${shop.name}!\n\nSizning sinov davringiz ${daysLeft} kundan keyin tugaydi. Xizmatdan foydalanishni davom ettirish uchun tarifni tanlang.\n\nBatafsil: @finexia_uz`,
        shop.bot_token
      )
      await query('UPDATE shops SET trial_reminder_sent_at = NOW() WHERE id = $1', [shop.id])
    } catch (err) {
      console.error(`Trial reminder failed for shop #${shop.id}:`, err.message)
    }
  }

  // Paid subscription expiry reminder — fires 5 days before next_payment_due
  const { rows: dueShops } = await query(`
    SELECT * FROM shops
    WHERE next_payment_due IS NOT NULL
      AND next_payment_due BETWEEN CURRENT_DATE + INTERVAL '4 days' AND CURRENT_DATE + INTERVAL '6 days'
      AND (payment_reminder_sent_at IS NULL OR payment_reminder_sent_at < NOW() - INTERVAL '25 days')
  `)

  for (const shop of dueShops) {
    if (!shop.owner_telegram_id || !shop.bot_token) continue
    try {
      await sendTelegramMessage(
        shop.owner_telegram_id,
        `⏰ Hurmatli ${shop.name}!\n\nObunangiz 5 kundan keyin tugaydi. To'lovni amalga oshirish uchun @finexia_uz bilan bog'laning.`,
        shop.bot_token
      )
      await query('UPDATE shops SET payment_reminder_sent_at = NOW() WHERE id = $1', [shop.id])
    } catch (err) {
      console.error(`Payment reminder failed for shop #${shop.id}:`, err.message)
    }
  }
}

export function startSubscriptionReminderJob() {
  // Check once at startup, then every hour (daily dedup via lastRunDate)
  checkSubscriptionReminders().catch(err =>
    console.error('Subscription reminder startup error:', err)
  )
  setInterval(() => {
    checkSubscriptionReminders().catch(err =>
      console.error('Subscription reminder error:', err)
    )
  }, 60 * 60 * 1000)
}
