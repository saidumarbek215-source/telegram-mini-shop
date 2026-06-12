const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'
const MODEL = 'claude-haiku-4-5-20251001'

const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

const PRODUCT_ANALYSIS_SYSTEM_PROMPT = `Ты помощник для интернет магазина в Узбекистане.
Проанализируй фото товара и верни ТОЛЬКО JSON без markdown:
{
  "name": "название товара на русском",
  "description": "описание 1-2 предложения",
  "category": "одна из категорий (Одежда/Обувь/Аксессуары/Электроника/Другое)",
  "colors": ["цвета которые видны на фото"],
  "sizes": ["размеры если применимо иначе пустой массив"],
  "price_hint": 0
}`

async function callClaude(body) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY не настроен')

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({ model: MODEL, ...body }),
  })

  const data = await res.json()
  if (data.type === 'error') throw new Error(data.error?.message || 'Ошибка Anthropic API')

  return data.content?.[0]?.text || ''
}

// Sends a product photo to Claude and returns the parsed product details.
export async function analyzeProductImage(base64Image, mimeType = 'image/jpeg') {
  const mediaType = SUPPORTED_IMAGE_TYPES.has(mimeType) ? mimeType : 'image/jpeg'

  const text = await callClaude({
    max_tokens: 1024,
    system: PRODUCT_ANALYSIS_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Image } },
          { type: 'text', text: 'Проанализируй это фото товара.' },
        ],
      },
    ],
  })

  const jsonText = text.trim().replace(/^```[a-z]*\n?/i, '').replace(/```\s*$/, '').trim()
  return JSON.parse(jsonText)
}

// Asks Claude to answer a customer's question using the shop's catalog.
export async function getShopAssistantReply({ shopName, products, miniAppUrl, userMessage }) {
  const system = `Ты дружелюбный консультант магазина ${shopName}.
Помогай клиентам выбрать товар.
Отвечай кратко на русском или узбекском.
Каталог товаров: ${JSON.stringify(products)}
В конце каждого ответа добавляй:
Открыть каталог: ${miniAppUrl}`

  return callClaude({
    max_tokens: 512,
    system,
    messages: [{ role: 'user', content: userMessage }],
  })
}
