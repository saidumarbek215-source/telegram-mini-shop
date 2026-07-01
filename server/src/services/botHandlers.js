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

// Telegram user id -> { shopId, step, requestType, channel, field1, field2, adPhotoFileId, customerPhone, expiresAt }
// requestType: 'reklama' | 'hamkorlik' | 'optom' | 'boshqa'
// steps: 'type_sel' | 'channel' | 'r_text' | 'r_photo' | 'h_company' | 'h_desc' | 'o_product' | 'o_qty' | 'b_msg' | 'phone' | 'confirm'
const pendingAdOrders = new Map()
const PENDING_AD_TTL_MS = 30 * 60 * 1000

export async function handleCallbackQuery(callbackQuery, shop) {
  const data = callbackQuery.data || ''
  const fromId = callbackQuery.from?.id
  const chatId = callbackQuery.message?.chat?.id
  const messageId = callbackQuery.message?.message_id
  const originalText = callbackQuery.message?.text || ''

  // --- Contact button from /start menu ---
  if (data === 'start_contact') {
    await showTypeMenu(fromId, shop)
    await answerCallbackQuery(callbackQuery.id, shop.bot_token)
    return
  }

  // --- Ad: type selection ---
  const typeMatch = data.match(/^ad_type_(reklama|hamkorlik|optom|boshqa)$/)
  if (typeMatch) {
    const pending = pendingAdOrders.get(fromId)
    if (pending && pending.shopId === shop.id && pending.step === 'type_sel') {
      const type = typeMatch[1]
      pending.requestType = type

      if (type === 'reklama') {
        const channels = (shop.ad_prices || {}).channels || []
        if (channels.length === 0) {
          pendingAdOrders.delete(fromId)
          await sendTelegramMessage(fromId, 'Reklama vaqtincha mavjud emas.', shop.bot_token)
          await answerCallbackQuery(callbackQuery.id, shop.bot_token)
          return
        }
        pending.step = 'channel'
        pendingAdOrders.set(fromId, pending)
        const buttons = channels.map((ch, i) => [{
          text: `${ch.name} — ${Number(ch.subscribers).toLocaleString('ru-RU')} obunachi | ${formatPrice(ch.price)}`,
          callback_data: `ad_ch_${i}`,
        }])
        await sendTelegramMessage(fromId, 'Reklamani qayerda joylashtirmoqchisiz? 📍', shop.bot_token, { inline_keyboard: buttons })
      } else if (type === 'hamkorlik') {
        pending.step = 'h_company'
        pendingAdOrders.set(fromId, pending)
        await sendTelegramMessage(fromId, 'Kompaniyangiz nomi?', shop.bot_token)
      } else if (type === 'optom') {
        pending.step = 'o_product'
        pendingAdOrders.set(fromId, pending)
        await sendTelegramMessage(fromId, 'Qanday mahsulot kerak?', shop.bot_token)
      } else {
        pending.step = 'b_msg'
        pendingAdOrders.set(fromId, pending)
        await sendTelegramMessage(fromId, 'Xabaringizni yozing', shop.bot_token)
      }
    }
    await answerCallbackQuery(callbackQuery.id, shop.bot_token)
    return
  }

  // --- Ad: select channel (reklama) ---
  const chMatch = data.match(/^ad_ch_(\d+)$/)
  if (chMatch) {
    const pending = pendingAdOrders.get(fromId)
    const channels = (shop.ad_prices || {}).channels || []
    const ch = channels[Number(chMatch[1])]
    if (pending && pending.shopId === shop.id && pending.step === 'channel' && ch) {
      pending.channel = ch
      pending.step = 'r_text'
      pendingAdOrders.set(fromId, pending)
      await sendTelegramMessage(fromId, 'Reklama matnini yuboring 📝', shop.bot_token)
    }
    await answerCallbackQuery(callbackQuery.id, shop.bot_token)
    return
  }

  // --- Ad: confirm submission ---
  if (data === 'ad_pay_confirm') {
    const pending = pendingAdOrders.get(fromId)
    if (pending && pending.shopId === shop.id && pending.step === 'confirm') {
      const username = callbackQuery.from?.username || null
      const type = pending.requestType
      const ch = pending.channel

      const adText = type === 'reklama'
        ? (pending.field1 || '')
        : [pending.field1, pending.field2].filter(Boolean).join('\n')
      const adPlacement = type === 'reklama' && ch ? `${ch.name} (${ch.username})` : null
      const price = type === 'reklama' && ch ? ch.price : 0

      const result = await query(
        `INSERT INTO ad_orders
           (shop_id, customer_telegram_id, customer_username, ad_text, ad_photo_file_id,
            ad_placement, customer_phone, price, payment_status, request_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9) RETURNING *`,
        [shop.id, fromId, username, adText, pending.adPhotoFileId,
         adPlacement, pending.customerPhone, price, type]
      )
      const adOrder = result.rows[0]
      pendingAdOrders.delete(fromId)

      await sendTelegramMessage(
        fromId,
        `✅ Arizangiz <b>#${adOrder.id}</b> qabul qilindi! Tasdiqlashni kuting.`,
        shop.bot_token
      )

      const TYPE_LABELS = {
        reklama: '📢 Reklama arizasi',
        hamkorlik: '🤝 Hamkorlik taklifi',
        optom: '📦 Optom buyurtma',
        boshqa: '💬 Boshqa murojaat',
      }
      const ownerLines = [`${TYPE_LABELS[type] || '📨 Yangi ariza'}! <b>#${adOrder.id}</b>`, '']

      if (type === 'reklama' && ch) ownerLines.push(`📍 Kanal: ${escapeHtml(`${ch.name} (${ch.username})`)}`)
      ownerLines.push(`👤 Mijoz: ${username ? `@${escapeHtml(username)}` : String(fromId)}`)
      if (type === 'reklama') {
        ownerLines.push(`📝 Matn: ${escapeHtml(pending.field1 || '')}`)
        ownerLines.push(`🖼 Rasm: ${pending.adPhotoFileId ? 'Bor' : "Yo'q"}`)
        if (ch) ownerLines.push(`💰 Narx: ${formatPrice(ch.price)}`)
      } else if (type === 'hamkorlik') {
        ownerLines.push(`🏢 Kompaniya: ${escapeHtml(pending.field1 || '')}`)
        ownerLines.push(`📝 ${escapeHtml(pending.field2 || '')}`)
      } else if (type === 'optom') {
        ownerLines.push(`📦 Mahsulot: ${escapeHtml(pending.field1 || '')}`)
        ownerLines.push(`🔢 Miqdor: ${escapeHtml(pending.field2 || '')}`)
      } else {
        ownerLines.push(`💬 ${escapeHtml(pending.field1 || '')}`)
      }
      ownerLines.push(`📞 Telefon: ${escapeHtml(pending.customerPhone || '—')}`)

      await sendTelegramMessage(shop.owner_telegram_id, ownerLines.join('\n'), shop.bot_token, {
        inline_keyboard: [[
          { text: '✅ Qabul qilish', callback_data: `approve_ad_${adOrder.id}` },
          { text: '❌ Rad etish', callback_data: `reject_ad_${adOrder.id}` },
        ]],
      })
    }
    await answerCallbackQuery(callbackQuery.id, shop.bot_token)
    return
  }

  // --- Ad: cancel ---
  if (data === 'ad_pay_cancel') {
    pendingAdOrders.delete(fromId)
    await sendTelegramMessage(fromId, 'Ariza bekor qilindi.', shop.bot_token)
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
      // Extract username from placement like "Kanal nomi (@username)"
      const usernameMatch = (adOrder.ad_placement || '').match(/@[\w]+/)
      const publishTarget = usernameMatch ? usernameMatch[0] : null
      if (publishTarget) {
        if (adOrder.ad_photo_file_id) {
          await sendTelegramPhoto(publishTarget, adOrder.ad_photo_file_id, shop.bot_token, escapeHtml(adOrder.ad_text || ''))
        } else {
          await sendTelegramMessage(publishTarget, escapeHtml(adOrder.ad_text || ''), shop.bot_token)
        }
      }
      await sendTelegramMessage(
        adOrder.customer_telegram_id,
        `✅ Reklamangiz <b>#${adId}</b> qabul qilindi va nashr etildi!`,
        shop.bot_token
      )
      await answerCallbackQuery(callbackQuery.id, shop.bot_token, 'Qabul qilindi')
      await editMessageText(chatId, messageId, `${originalText}\n\n✅ Qabul qilindi`, shop.bot_token)
    } else {
      await query(`UPDATE ad_orders SET payment_status = 'rejected' WHERE id = $1`, [adId])
      await sendTelegramMessage(
        adOrder.customer_telegram_id,
        `❌ Reklamangiz <b>#${adId}</b> rad etildi.`,
        shop.bot_token
      )
      await answerCallbackQuery(callbackQuery.id, shop.bot_token, 'Rad etildi')
      await editMessageText(chatId, messageId, `${originalText}\n\n❌ Rad etildi`, shop.bot_token)
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

    // Ad flow: waiting for photo (reklama only)
    const adPending = pendingAdOrders.get(fromId)
    if (adPending && adPending.shopId === shop.id && adPending.step === 'r_photo' && adPending.expiresAt > Date.now()) {
      adPending.adPhotoFileId = message.photo[message.photo.length - 1].file_id
      adPending.step = 'phone'
      pendingAdOrders.set(fromId, adPending)
      await sendTelegramMessage(fromId, 'Telefon raqamingizni yuboring 📞', shop.bot_token)
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
    const adPending = pendingAdOrders.get(fromId)
    if (adPending && adPending.shopId === shop.id && adPending.expiresAt > Date.now()) {
      // reklama: ad text
      if (adPending.step === 'r_text') {
        adPending.field1 = text
        adPending.step = 'r_photo'
        pendingAdOrders.set(fromId, adPending)
        await sendTelegramMessage(fromId, "Rasm yuborasizmi? (ixtiyoriy)\nRasm bo'lmasa /skip yozing", shop.bot_token)
        return
      }
      // reklama: skip photo via text
      if (adPending.step === 'r_photo') {
        if (text === '/skip') {
          adPending.step = 'phone'
          pendingAdOrders.set(fromId, adPending)
          await sendTelegramMessage(fromId, 'Telefon raqamingizni yuboring 📞', shop.bot_token)
        }
        return
      }
      // hamkorlik: company name
      if (adPending.step === 'h_company') {
        adPending.field1 = text
        adPending.step = 'h_desc'
        pendingAdOrders.set(fromId, adPending)
        await sendTelegramMessage(fromId, 'Hamkorlik haqida qisqacha yozing', shop.bot_token)
        return
      }
      // hamkorlik: description
      if (adPending.step === 'h_desc') {
        adPending.field2 = text
        adPending.step = 'phone'
        pendingAdOrders.set(fromId, adPending)
        await sendTelegramMessage(fromId, 'Telefon raqamingizni yuboring 📞', shop.bot_token)
        return
      }
      // optom: product
      if (adPending.step === 'o_product') {
        adPending.field1 = text
        adPending.step = 'o_qty'
        pendingAdOrders.set(fromId, adPending)
        await sendTelegramMessage(fromId, 'Taxminiy miqdori?', shop.bot_token)
        return
      }
      // optom: quantity
      if (adPending.step === 'o_qty') {
        adPending.field2 = text
        adPending.step = 'phone'
        pendingAdOrders.set(fromId, adPending)
        await sendTelegramMessage(fromId, 'Telefon raqamingizni yuboring 📞', shop.bot_token)
        return
      }
      // boshqa: message
      if (adPending.step === 'b_msg') {
        adPending.field1 = text
        adPending.step = 'phone'
        pendingAdOrders.set(fromId, adPending)
        await sendTelegramMessage(fromId, 'Telefon raqamingizni yuboring 📞', shop.bot_token)
        return
      }
      // shared: phone
      if (adPending.step === 'phone') {
        adPending.customerPhone = text
        adPending.step = 'confirm'
        pendingAdOrders.set(fromId, adPending)
        await sendAdSummary(fromId, adPending, shop)
        return
      }
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

  const keyboard = [[{ text: '🛍 Открыть каталог', web_app: { url: getMiniAppUrl(shop.id) } }]]
  if (shop.ads_enabled) {
    keyboard.push([{ text: '📢 Hamkorlik va reklama', callback_data: 'start_contact' }])
  }

  await sendTelegramMessage(fromId, text, shop.bot_token, { inline_keyboard: keyboard })
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

async function handleReklamaCommand(message, shop) {
  const fromId = message.from?.id
  if (!fromId) return

  if (!shop.ads_enabled) {
    await sendWelcomeMessage(message, shop)
    return
  }

  await showTypeMenu(fromId, shop)
}

async function showTypeMenu(fromId, shop) {
  pendingAdOrders.set(fromId, {
    shopId: shop.id,
    step: 'type_sel',
    requestType: null,
    channel: null,
    field1: null,
    field2: null,
    adPhotoFileId: null,
    customerPhone: null,
    expiresAt: Date.now() + PENDING_AD_TTL_MS,
  })

  await sendTelegramMessage(fromId, 'Qanday murojaat qilmoqchisiz? 👇', shop.bot_token, {
    inline_keyboard: [
      [{ text: '📢 Reklama', callback_data: 'ad_type_reklama' }],
      [{ text: '🤝 Hamkorlik', callback_data: 'ad_type_hamkorlik' }],
      [{ text: '📦 Optom buyurtma', callback_data: 'ad_type_optom' }],
      [{ text: '💬 Boshqa', callback_data: 'ad_type_boshqa' }],
    ],
  })
}

async function sendAdSummary(fromId, pending, shop) {
  const type = pending.requestType
  const ch = pending.channel
  const lines = ['✅ <b>Sizning arizangiz:</b>', '']

  if (type === 'reklama') {
    if (ch) {
      lines.push(`📍 Kanal: ${escapeHtml(`${ch.name} (${ch.username})`)}`)
      lines.push(`👥 ${Number(ch.subscribers).toLocaleString('ru-RU')} obunachi`)
      lines.push(`💰 Narx: ${formatPrice(ch.price)} so'm`)
    }
    lines.push(`📝 Matn: ${escapeHtml(pending.field1 || '')}`)
    lines.push(`🖼 Rasm: ${pending.adPhotoFileId ? 'Bor' : "Yo'q"}`)
  } else if (type === 'hamkorlik') {
    lines.push(`🏢 Kompaniya: ${escapeHtml(pending.field1 || '')}`)
    lines.push(`📝 Tavsif: ${escapeHtml(pending.field2 || '')}`)
  } else if (type === 'optom') {
    lines.push(`📦 Mahsulot: ${escapeHtml(pending.field1 || '')}`)
    lines.push(`🔢 Miqdor: ${escapeHtml(pending.field2 || '')}`)
  } else {
    lines.push(`💬 Xabar: ${escapeHtml(pending.field1 || '')}`)
  }

  lines.push(`📞 Telefon: ${escapeHtml(pending.customerPhone || '—')}`)
  lines.push('', 'Ariza yuborilsinmi?')

  await sendTelegramMessage(fromId, lines.join('\n'), shop.bot_token, {
    inline_keyboard: [
      [{ text: '✅ Ha, yuborish', callback_data: 'ad_pay_confirm' }],
      [{ text: '❌ Bekor qilish', callback_data: 'ad_pay_cancel' }],
    ],
  })
}
