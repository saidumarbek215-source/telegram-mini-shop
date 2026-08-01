import TelegramBot from 'node-telegram-bot-api'
import { query } from '../db/index.js'
import { handleCallbackQuery, handleMessage } from './botHandlers.js'

// shopId -> { bot, token }. Holds the running long-polling bot instance for
// each shop so it can be stopped/replaced if the shop's token changes.
const bots = new Map()

// Clears any webhook left over from a previous configuration — a bot can't
// use getUpdates (polling) while a webhook is set, Telegram replies 409.
async function deleteWebhook(botToken) {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`, { method: 'POST' })
  } catch (err) {
    console.error('deleteWebhook failed:', err.message)
  }
}

// Starts (or restarts, if the token changed) a long-polling bot instance for
// a shop. Safe to call multiple times — no-ops if a bot with the same token
// is already running.
export async function startBotForShop(shop) {
  if (!shop?.bot_token) return

  const existing = bots.get(shop.id)
  if (existing) {
    if (existing.token === shop.bot_token) return
    await stopBotForShop(shop.id)
  }

  try {
    await deleteWebhook(shop.bot_token)

    const bot = new TelegramBot(shop.bot_token, { polling: true })

    bot.on('message', (msg) => {
      handleMessage(msg, shop).catch((err) =>
        console.error(`[bot ${shop.id}] message handler error:`, err.message)
      )
    })

    bot.on('callback_query', (callbackQuery) => {
      handleCallbackQuery(callbackQuery, shop).catch((err) =>
        console.error(`[bot ${shop.id}] callback handler error:`, err.message)
      )
    })

    bot.on('polling_error', (err) => {
      const is409 = err.message?.includes('409') || (err.code === 'ETELEGRAM' && err.message?.includes('Conflict'))
      if (is409) {
        // Ожидаемо при деплое (старый/новый инстанс временно работают одновременно) — не шум для реальных ошибок
        console.log(`[bot ${shop.id}] polling 409 (deploy overlap, ignorable)`)
      } else {
        console.error(`[bot ${shop.id}] polling error:`, err.message)
      }
    })

    bots.set(shop.id, { bot, token: shop.bot_token })
    console.log(`Bot started for shop ${shop.id} (${shop.name || 'без названия'})`)
  } catch (err) {
    console.error(`Failed to start bot for shop ${shop.id}:`, err.message)
  }
}

export async function stopBotForShop(shopId) {
  const existing = bots.get(shopId)
  if (!existing) return

  await existing.bot.stopPolling()
  bots.delete(shopId)
}

// Starts a polling bot for every shop that has a bot token. Called once on
// server startup.
export async function startAllBots() {
  const result = await query('SELECT * FROM shops WHERE bot_token IS NOT NULL AND is_active = true')
  for (const shop of result.rows) {
    await startBotForShop(shop)
  }
}

// Stops all running bots — called on graceful shutdown so the new process
// doesn't hit 409 Conflict from overlapping getUpdates polling sessions.
export async function stopAllBots() {
  console.log(`Stopping all bot polling (${bots.size} bots)...`)
  await Promise.all(
    [...bots.entries()].map(([shopId, { bot }]) =>
      bot.stopPolling().catch(err =>
        console.error(`Error stopping bot for shop ${shopId}:`, err.message)
      )
    )
  )
  bots.clear()
  console.log('All bots stopped.')
}

// (Re)starts the bot for a single shop, e.g. after registration or a
// bot_token change. Stops the bot if the shop has no token or is inactive.
export async function restartBotForShop(shopId) {
  const result = await query('SELECT * FROM shops WHERE id = $1', [shopId])
  const shop = result.rows[0]

  if (!shop?.bot_token || !shop.is_active) {
    await stopBotForShop(shopId)
    return
  }

  await startBotForShop(shop)
}
