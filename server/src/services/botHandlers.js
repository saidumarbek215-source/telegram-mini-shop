import { pool, query } from '../db/index.js'
import { restoreOrderStock } from './orderStock.js'
import { uploadImageToImgbb } from './imgbb.js'
import { analyzeProductImage, getShopAssistantReply } from './anthropic.js'
import { formatPrice, getMiniAppUrl } from '../constants.js'
import {
  answerCallbackQuery,
  downloadTelegramFile,
  editMessageText,
  escapeHtml,
  notifyCustomerOrderCancelled,
  notifyCustomerOrderConfirmed,
  sendTelegramMessage,
  sendTelegramPhoto,
} from '../telegram.js'

// Telegram user id -> { shopId, orderId, expiresAt }
const pendingReceipts = new Map()
const PENDING_RECEIPT_TTL_MS = 60 * 60 * 1000

// Telegram user id -> { shopId, step, adText, adPhotoFileId, durationHours, price, expiresAt }
// steps: 'text' | 'photo' | 'duration' | 'confirm'
const pendingAdOrders = new Map()
const PENDING_AD_TTL_MS = 30 * 60 * 1000

export async function handleCallbackQuery(callbackQuery, shop) {
  const data = callbackQuery.data || ''
  const fromId = callbackQuery.from?.id
  const chatId = callbackQuery.message?.chat?.id
  const messageId = callbackQuery.message?.message_id
  const originalText = callbackQuery.message?.text || ''

  // --- Ad: skip photo ---
  if (data === 'ad_skip_photo') {
    const pending = pendingAdOrders.get(fromId)
    if (pending && pending.shopId === shop.id && pending.step === 'photo') {
      pending.step = 'duration'
      pendingAdOrders.set(fromId, pending)
      await sendAdDurationKeyboard(fromId, shop)
    }
    await answerCallbackQuery(callbackQuery.id, shop.bot_token)
    return
  }

  // --- Ad: select duration ---
  const durMatch = data.match(/^ad_dur_(\d+)$/)
  if (durMatch) {
    const pending = pendingAdOrders.get(fromId)
    const hours = Number(durMatch[1])
    const price = (shop.ad_prices || {})[String(hours)]
    if (pending && pending.shopId === shop.id && pending.step === 'duration' && price != null) {
      pending.durationHours = hours
      pending.price = price
      pending.step = 'confirm'
      pendingAdOrders.set(fromId, pending)
      const payInfo = shop.card_number
        ? `\n💳 Карта для оплаты: <code>${escapeHtml(shop.card_number)}</code>`
        : ''
      const summary = [
        '📋 <b>Ваша заявка:</b>',
        '',
        `📝 Текст: ${escapeHtml(pending.adText)}`,
        `🖼 Фото: ${pending.adPhotoFileId ? 'Да' : 'Нет'}`,
        `⏱ Длительность: ${hours} ч`,
        `💰 Стоимость: ${formatPrice(price)}`,
        payInfo,
        '',
        'После оплаты нажмите кнопку ниже:',
      ].join('\n')
      await sendTelegramMessage(fromId, summary, shop.bot_token, {
        inline_keyboard: [
          [{ text: '✅ Оформить заявку', callback_data: 'ad_pay_confirm' }],
          [{ text: '❌ Отмена', callback_data: 'ad_pay_cancel' }],
        ],
      })
    }
    await answerCallbackQuery(callbackQuery.id, shop.bot_token)
    return
  }

  // --- Ad: confirm payment ---
  if (data === 'ad_pay_confirm') {
    const pending = pendingAdOrders.get(fromId)
    if (pending && pending.shopId === shop.id && pending.step === 'confirm') {
      const username = callbackQuery.from?.username || null
      const result = await query(
        `INSERT INTO ad_orders
           (shop_id, customer_telegram_id, customer_username, ad_text, ad_photo_file_id, duration_hours, price, payment_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') RETURNING *`,
        [shop.id, fromId, username, pending.adText, pending.adPhotoFileId,
         pending.durationHours, pending.price]
      )
      const adOrder = result.rows[0]
      pendingAdOrders.delete(fromId)

      await sendTelegramMessage(
        fromId,
        `✅ Заявка <b>#${adOrder.id}</b> принята! Ожидайте подтверждения.`,
        shop.bot_token
      )

      const ownerText = [
        `📢 <b>Новая заявка на рекламу #${adOrder.id}</b>`,
        '',
        `👤 ${username ? `@${escapeHtml(username)}` : String(fromId)}`,
        `📝 ${escapeHtml(pending.adText)}`,
        `🖼 Фото: ${pending.adPhotoFileId ? 'Да' : 'Нет'}`,
        `⏱ ${pending.durationHours} ч — ${formatPrice(pending.price)}`,
      ].join('\n')

      await sendTelegramMessage(shop.owner_telegram_id, ownerText, shop.bot_token, {
        inline_keyboard: [[
          { text: '✅ Одобрить', callback_data: `approve_ad_${adOrder.id}` },
          { text: '❌ Отклонить', callback_data: `reject_ad_${adOrder.id}` },
        ]],
      })
    }
    await answerCallbackQuery(callbackQuery.id, shop.bot_token)
    return
  }

  // --- Ad: cancel ---
  if (data === 'ad_pay_cancel') {
    pendingAdOrders.delete(fromId)
    await sendTelegramMessage(fromId, 'Заявка отменена.', shop.bot_token)
    await answerCallbackQuery(callbackQuery.id, shop.bot_token)
    return
  }

  // --- Owner: approve / reject ad ---
  const adActionMatch = data.match(/^(approve|reject)_ad_(\d+)$/)
  if (adActionMatch) {
    const [, action, adIdStr] = adActionMatch
    const adId = Number(adIdStr)
    const adResult = await query(
      'SELECT * FROM ad_orders WHERE id = $1 AND shop_id = $2', [adId, shop.id]
    )
    const adOrder = adResult.rows[0]
    if (!adOrder) {
      await answerCallbackQuery(callbackQuery.id, shop.bot_token, 'Заявка не найдена')
      return
    }
    if (adOrder.payment_status !== 'pending') {
      await answerCallbackQuery(callbackQuery.id, shop.bot_token, 'Заявка уже обработана')
      return
    }

    if (action === 'approve') {
      await query(`UPDATE ad_orders SET payment_status = 'approved' WHERE id = $1`, [adId])
      if (shop.ad_channel_id) {
        if (adOrder.ad_photo_file_id) {
          await sendTelegramPhoto(
            shop.ad_channel_id, adOrder.ad_photo_file_id, shop.bot_token,
            escapeHtml(adOrder.ad_text || '')
          )
        } else {
          await sendTelegramMessage(
            shop.ad_channel_id, escapeHtml(adOrder.ad_text || ''), shop.bot_token
          )
        }
      }
      await sendTelegramMessage(
        adOrder.customer_telegram_id,
        `✅ Ваша реклама <b>#${adId}</b> одобрена и опубликована!`,
        shop.bot_token
      )
      await answerCallbackQuery(callbackQuery.id, shop.bot_token, 'Одобрено')
      await editMessageText(chatId, messageId, `${originalText}\n\n✅ Одобрено`, shop.bot_token)
    } else {
      await query(`UPDATE ad_orders SET payment_status = 'rejected' WHERE id = $1`, [adId])
      await sendTelegramMessage(
        adOrder.customer_telegram_id,
        `❌ Ваша реклама <b>#${adId}</b> отклонена.`,
        shop.bot_token
      )
      await answerCallbackQuery(callbackQuery.id, shop.bot_token, 'Отклонено')
      await editMessageText(chatId, messageId, `${originalText}\n\n❌ Отклонено`, shop.bot_token)
    }
    return
  }

  // --- Order: confirm / cancel ---
  const orderMatch = data.match(/^(confirm|cancel)_order_(\d+)$/)
  if (!orderMatch) {
    await answerCallbackQuery(callbackQuery.id, shop.bot_token)
    return
  }

  const [, action, orderIdStr] = orderMatch
  const orderId = Number(orderIdStr)
  const orderResult = await query('SELECT * FROM orders WHERE id = $1 AND shop_id = $2', [
    orderId, shop.id,
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
      `UPDATE orders SET status = 'cancelled', updated_at = now() WHERE id = $1`, [orderId]
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

export async function handleMessage(message, shop) {
  const fromId = message.from?.id
  const text = message.text || ''
  const startMatch = text.match(/^\/start(?:@\w+)?(?:\s+order_(\d+))?/)

  if (startMatch) {
    if (startMatch[1]) {
      await forwardOrderContact(Number(startMatch[1]), message, shop)
    } else {
      await sendWelcomeMessage(message, shop)
    }
    return
  }

  if (!fromId) return

  const isOwner = shop.owner_telegram_id != null && Number(fromId) === Number(shop.owner_telegram_id)

  // /reklama command
  if (/^\/reklama(?:@\w+)?$/.test(text)) {
    await handleReklamaCommand(message, shop)
    return
  }

  if (message.photo?.length) {
    if (isOwner) {
      await handleOwnerProductPhoto(message, shop)
      return
    }

    // Ad flow: waiting for photo
    const adPending = pendingAdOrders.get(fromId)
    if (adPending && adPending.shopId === shop.id && adPending.step === 'photo' && adPending.expiresAt > Date.now()) {
      adPending.adPhotoFileId = message.photo[message.photo.length - 1].file_id
      adPending.step = 'duration'
      pendingAdOrders.set(fromId, adPending)
      await sendAdDurationKeyboard(fromId, shop)
      return
    }

    // Receipt forwarding
    const pending = pendingReceipts.get(fromId)
    if (pending && pending.shopId === shop.id && pending.expiresAt > Date.now()) {
      const fileId = message.photo[message.photo.length - 1].file_id
      await sendTelegramPhoto(
        shop.owner_telegram_id, fileId, shop.bot_token,
        `📎 Чек об оплате к заказу #${pending.orderId}`
      )
      await sendTelegramMessage(fromId, 'Спасибо! Чек отправлен продавцу.', shop.bot_token)
    }
    return
  }

  if (text && !isOwner) {
    // Ad flow: waiting for text
    const adPending = pendingAdOrders.get(fromId)
    if (adPending && adPending.shopId === shop.id && adPending.step === 'text' && adPending.expiresAt > Date.now()) {
      adPending.adText = text
      adPending.step = 'photo'
      pendingAdOrders.set(fromId, adPending)
      await sendTelegramMessage(fromId, 'Отправьте фото для рекламы:', shop.bot_token, {
        inline_keyboard: [[{ text: '🚫 Без фото', callback_data: 'ad_skip_photo' }]],
      })
      return
    }

    await handleCustomerChatMessage(text, fromId, shop)
  }
}

const CATEGORY_ICONS = {
  Одежда: '👕',
  Обувь: '👟',
  Аксессуары: '👜',
  Электроника: '📱',
  Другое: '📦',
}

// Resolves an AI-suggested category name to a category id for the shop,
// creating the category if it doesn't exist yet.
async function getOrCreateCategory(shopId, categoryName) {
  const name = CATEGORY_ICONS[categoryName] ? categoryName : 'Другое'

  const existing = await query('SELECT id FROM categories WHERE shop_id = $1 AND name = $2', [
    shopId,
    name,
  ])
  if (existing.rows.length) return existing.rows[0].id

  const created = await query(
    'INSERT INTO categories (shop_id, name, icon) VALUES ($1, $2, $3) RETURNING id',
    [shopId, name, CATEGORY_ICONS[name]]
  )
  return created.rows[0].id
}

// Handles a product photo sent by the shop owner: uploads it to ImgBB, asks
// Claude to describe the product, and adds it to the catalog.
async function handleOwnerProductPhoto(message, shop) {
  const fromId = message.from.id
  const fileId = message.photo[message.photo.length - 1].file_id

  if (!shop.ai_connected) {
    await sendTelegramMessage(
      fromId,
      [
        'Эта функция доступна только для подписчиков Finexia AI.',
        'Подключите AI в Управление → AI Ассистент.',
        'Первые 10 дней бесплатно! 🎁',
        'finexia.uz',
      ].join('\n'),
      shop.bot_token
    )
    return
  }

  await sendTelegramMessage(fromId, '⏳ Распознаю товар на фото...', shop.bot_token)

  try {
    const { base64, mimeType } = await downloadTelegramFile(fileId, shop.bot_token)
    const imageUrl = await uploadImageToImgbb(base64)
    const product = await analyzeProductImage(base64, mimeType)

    const categoryId = await getOrCreateCategory(shop.id, product.category)
    const price = Math.max(0, Math.round(Number(product.price_hint)) || 0)
    const colors = Array.isArray(product.colors) ? product.colors : []
    const sizes = Array.isArray(product.sizes) ? product.sizes : []

    await query(
      `INSERT INTO products (shop_id, name, description, price, image_url, category_id, sizes, colors)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [shop.id, product.name, product.description ?? '', price, imageUrl, categoryId, sizes, colors]
    )

    const text = [
      '✅ Товар добавлен!',
      `Название: ${escapeHtml(product.name)}`,
      `Категория: ${escapeHtml(product.category)}`,
      `Цвета: ${escapeHtml(colors.join(', '))}`,
      `Цена: ${formatPrice(price)}`,
      '',
      'Открой каталог чтобы проверить и изменить цену если нужно.',
    ].join('\n')

    await sendTelegramMessage(fromId, text, shop.bot_token)
  } catch (err) {
    console.error('Product auto-create failed:', err.message)
    await sendTelegramMessage(
      fromId,
      '❌ Не удалось распознать товар на фото. Попробуйте отправить фото ещё раз.',
      shop.bot_token
    )
  }
}

// Handles a free-text message from a customer using Claude as a shop assistant.
async function handleCustomerChatMessage(text, fromId, shop) {
  try {
    const productsResult = await query(
      `SELECT p.name, p.description, p.price, p.colors, p.sizes, c.name AS category
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.shop_id = $1 AND p.in_stock = true
       ORDER BY p.sort_order ASC, p.id ASC
       LIMIT 100`,
      [shop.id]
    )

    const reply = await getShopAssistantReply({
      shopName: shop.name || 'магазин',
      products: productsResult.rows,
      miniAppUrl: getMiniAppUrl(shop.id),
      userMessage: text,
    })

    if (reply) await sendTelegramMessage(fromId, escapeHtml(reply), shop.bot_token)
  } catch (err) {
    console.error('Shop assistant failed:', err.message)
  }
}

// Handles a plain "/start" — greets the user and offers a button to open
// the shop's Mini App catalog.
async function sendWelcomeMessage(message, shop) {
  const fromId = message.from?.id
  if (!fromId) return

  const text = [
    `Добро пожаловать в ${escapeHtml(shop.name || 'магазин')}! 🛍`,
    '',
    escapeHtml(shop.description || ''),
    '',
    'Нажмите кнопку ниже чтобы открыть каталог товаров 👇',
  ].join('\n')

  const replyMarkup = {
    inline_keyboard: [[{ text: '🛍 Открыть каталог', web_app: { url: getMiniAppUrl(shop.id) } }]],
  }

  await sendTelegramMessage(fromId, text, shop.bot_token, replyMarkup)
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
