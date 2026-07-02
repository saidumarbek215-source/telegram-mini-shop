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

// Receipt forwarding state: userId -> { shopId, orderId, expiresAt }
const pendingReceipts = new Map()
const PENDING_RECEIPT_TTL_MS = 60 * 60 * 1000

/* ─────────────────────────── CALLBACK QUERY ─────────────────────────── */

export async function handleCallbackQuery(callbackQuery, shop) {
  const data = callbackQuery.data || ''
  const fromId = callbackQuery.from?.id
  const chatId = callbackQuery.message?.chat?.id
  const messageId = callbackQuery.message?.message_id
  const originalText = callbackQuery.message?.text || ''

  if (!fromId) {
    await answerCallbackQuery(callbackQuery.id, shop.bot_token)
    return
  }

  // ── Order: confirm / cancel ──────────────────────────────────────────
  const orderMatch = data.match(/^(confirm|cancel)_order_(\d+)$/)
  if (!orderMatch) {
    await answerCallbackQuery(callbackQuery.id, shop.bot_token)
    return
  }

  const [, action, orderIdStr] = orderMatch
  const orderId = Number(orderIdStr)
  const orderResult = await query('SELECT * FROM orders WHERE id = $1 AND shop_id = $2', [orderId, shop.id])
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
    const result = await query(`UPDATE orders SET status = 'accepted', updated_at = now() WHERE id = $1 RETURNING *`, [orderId])
    await notifyCustomerOrderConfirmed(result.rows[0], shop)
    await answerCallbackQuery(callbackQuery.id, shop.bot_token, 'Заказ подтверждён')
    await editMessageText(chatId, messageId, `${originalText}\n\n✅ Подтверждён`, shop.bot_token)
    return
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await restoreOrderStock(client, orderId)
    await client.query(`UPDATE orders SET status = 'cancelled', updated_at = now() WHERE id = $1`, [orderId])
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

/* ─────────────────────────── MESSAGE HANDLER ────────────────────────── */

export async function handleMessage(message, shop) {
  const fromId = message.from?.id
  const text = message.text || ''

  // /start
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

  if (message.photo?.length) {
    // Owner photo → auto-product
    if (isOwner) {
      await handleOwnerProductPhoto(message, shop)
      return
    }

    // Receipt forwarding
    const receipt = pendingReceipts.get(fromId)
    if (receipt && receipt.shopId === shop.id && receipt.expiresAt > Date.now()) {
      const fileId = message.photo[message.photo.length - 1].file_id
      await sendTelegramPhoto(shop.owner_telegram_id, fileId, shop.bot_token, `📎 Чек об оплате к заказу #${receipt.orderId}`)
      await sendTelegramMessage(fromId, 'Спасибо! Чек отправлен продавцу.', shop.bot_token)
    }
    return
  }

  if (!text) return

  // Non-owner free text → AI assistant
  if (!isOwner) {
    await handleCustomerChatMessage(text, fromId, shop)
  }
}

/* ─────────────────────────── HELPERS ────────────────────────────────── */

const CATEGORY_ICONS = {
  Одежда: '👕', Обувь: '👟', Аксессуары: '👜', Электроника: '📱', Другое: '📦',
}

async function getOrCreateCategory(shopId, categoryName) {
  const name = CATEGORY_ICONS[categoryName] ? categoryName : 'Другое'
  const existing = await query('SELECT id FROM categories WHERE shop_id = $1 AND name = $2', [shopId, name])
  if (existing.rows.length) return existing.rows[0].id
  const created = await query('INSERT INTO categories (shop_id, name, icon) VALUES ($1, $2, $3) RETURNING id', [shopId, name, CATEGORY_ICONS[name]])
  return created.rows[0].id
}

async function handleOwnerProductPhoto(message, shop) {
  const fromId = message.from.id
  const fileId = message.photo[message.photo.length - 1].file_id

  if (!shop.ai_connected) {
    await sendTelegramMessage(fromId, [
      'Эта функция доступна только для подписчиков Finexia AI.',
      'Подключите AI в Управление → AI Ассистент.',
      'Первые 10 дней бесплатно! 🎁',
      'finexia.uz',
    ].join('\n'), shop.bot_token)
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

    await sendTelegramMessage(fromId, [
      '✅ Товар добавлен!',
      `Название: ${escapeHtml(product.name)}`,
      `Категория: ${escapeHtml(product.category)}`,
      `Цвета: ${escapeHtml(colors.join(', '))}`,
      `Цена: ${formatPrice(price)}`,
      '',
      'Открой каталог чтобы проверить и изменить цену если нужно.',
    ].join('\n'), shop.bot_token)
  } catch (err) {
    console.error('Product auto-create failed:', err.message)
    await sendTelegramMessage(fromId, '❌ Не удалось распознать товар на фото. Попробуйте ещё раз.', shop.bot_token)
  }
}

async function handleCustomerChatMessage(text, fromId, shop) {
  try {
    const productsResult = await query(
      `SELECT p.name, p.description, p.price, p.colors, p.sizes, c.name AS category
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.shop_id = $1 AND p.in_stock = true
       ORDER BY p.sort_order ASC, p.id ASC LIMIT 100`,
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

  await sendTelegramMessage(fromId, text, shop.bot_token, {
    inline_keyboard: [
      [{ text: '🛍 Открыть каталог', web_app: { url: getMiniAppUrl(shop.id) } }],
    ],
  })
}

async function forwardOrderContact(orderId, message, shop) {
  const fromId = message.from?.id
  if (!fromId) return

  const orderResult = await query('SELECT * FROM orders WHERE id = $1 AND shop_id = $2', [orderId, shop.id])
  const order = orderResult.rows[0]
  if (!order) return

  const itemsResult = await query('SELECT * FROM order_items WHERE order_id = $1', [orderId])
  const itemsText = itemsResult.rows
    .map((item) =>
      [escapeHtml(item.product_name), item.size && `размер ${escapeHtml(item.size)}`, item.color && escapeHtml(item.color)]
        .filter(Boolean).join(', ')
    ).join('\n')

  const username = message.from?.username ? ` (@${escapeHtml(message.from.username)})` : ''

  await sendTelegramMessage(shop.owner_telegram_id, [
    `💬 Покупатель открыл чат по заказу <b>#${order.id}</b>`,
    '',
    `Товар: ${itemsText}`,
    `Сумма: <b>${formatPrice(order.total)}</b>`,
    `👤 ${escapeHtml(order.customer_name)}${username}`,
    `📱 ${escapeHtml(order.phone)}`,
    '',
    '📎 Фото чека: клиент отправит следующим сообщением',
  ].join('\n'), shop.bot_token)

  await sendTelegramMessage(fromId,
    `Информация о заказе #${order.id} передана продавцу.\nОтправьте сюда фото чека об оплате — мы передадим его продавцу.`,
    shop.bot_token
  )

  pendingReceipts.set(fromId, {
    shopId: shop.id,
    orderId: order.id,
    expiresAt: Date.now() + PENDING_RECEIPT_TTL_MS,
  })
}
