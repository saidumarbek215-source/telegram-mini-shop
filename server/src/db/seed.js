import { pool } from './index.js'

const categories = [
  { name: 'Беговые', icon: '🏃' },
  { name: 'Баскетбольные', icon: '🏀' },
  { name: 'Повседневные', icon: '👟' },
  { name: 'Классические', icon: '⭐' },
]

const SIZES_STANDARD = ['38', '39', '40', '41', '42', '43', '44', '45']

// Builds a sizes_stock object (size -> quantity), with `zeroSizes` set to 0
// so the "out of stock size" UI can be demoed.
function buildSizesStock(sizes, zeroSizes = []) {
  return Object.fromEntries(sizes.map((s) => [s, zeroSizes.includes(s) ? 0 : 4]))
}

const products = [
  {
    name: 'Nike Air Max 270',
    description:
      'Культовая модель с увеличенным амортизирующим элементом Air в пятке. Лёгкий верх из дышащего сетчатого материала и мягкая подошва обеспечивают комфорт на весь день.',
    price: 1250000,
    old_price: 1450000,
    image_url:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    category: 'Беговые',
    sizes: SIZES_STANDARD.slice(2),
    sizes_stock: buildSizesStock(SIZES_STANDARD.slice(2), ['45']),
    colors: ['Белый', 'Чёрный', 'Серый'],
    in_stock: true,
  },
  {
    name: 'Adidas Ultraboost 22',
    description:
      'Беговые кроссовки с технологией Boost для максимального возврата энергии при каждом шаге. Подходят как для тренировок, так и для повседневной носки.',
    price: 1450000,
    old_price: null,
    image_url:
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=800&q=80',
    category: 'Беговые',
    sizes: SIZES_STANDARD.slice(1),
    sizes_stock: buildSizesStock(SIZES_STANDARD.slice(1)),
    colors: ['Чёрный', 'Синий'],
    in_stock: true,
  },
  {
    name: 'Nike Air Jordan 1',
    description:
      'Легендарные высокие кроссовки, ставшие символом баскетбольной культуры и уличной моды. Прочная кожа и узнаваемый силуэт.',
    price: 1650000,
    old_price: 1850000,
    image_url:
      'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=800&q=80',
    category: 'Баскетбольные',
    sizes: SIZES_STANDARD.slice(2),
    sizes_stock: buildSizesStock(SIZES_STANDARD.slice(2), ['40']),
    colors: ['Красный/Чёрный', 'Белый/Синий'],
    in_stock: true,
  },
  {
    name: 'Nike Air Force 1',
    description:
      'Один из самых узнаваемых силуэтов в истории кроссовок. Прочная кожаная отделка, амортизация Air и универсальный белый цвет подойдут к любому образу.',
    price: 980000,
    old_price: null,
    image_url:
      'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=800&q=80',
    category: 'Баскетбольные',
    sizes: SIZES_STANDARD,
    sizes_stock: buildSizesStock(SIZES_STANDARD),
    colors: ['Белый'],
    in_stock: true,
  },
  {
    name: 'Puma RS-X',
    description:
      'Массивные кроссовки в стиле ретро-футуризм с яркими цветовыми акцентами и объёмной подошвой RS для дополнительной амортизации.',
    price: 850000,
    old_price: 990000,
    image_url:
      'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80',
    category: 'Повседневные',
    sizes: SIZES_STANDARD.slice(0, 7),
    sizes_stock: buildSizesStock(SIZES_STANDARD.slice(0, 7), ['44']),
    colors: ['Мультиколор', 'Белый/Зелёный'],
    in_stock: true,
  },
  {
    name: 'Reebok Classic',
    description:
      'Минималистичные кожаные кроссовки в винтажном стиле 80-х. Лёгкая пенная подошва обеспечивает комфорт при долгой ходьбе.',
    price: 750000,
    old_price: null,
    image_url:
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
    category: 'Повседневные',
    sizes: SIZES_STANDARD.slice(0, 7),
    sizes_stock: buildSizesStock(SIZES_STANDARD.slice(0, 7)),
    colors: ['Белый', 'Бежевый'],
    in_stock: true,
  },
  {
    name: 'New Balance 574',
    description:
      'Классическая модель с фирменной буквой "N" на боку. Сочетание замши и сетчатого материала создаёт стильный и удобный кроссовок на каждый день.',
    price: 920000,
    old_price: null,
    image_url:
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80',
    category: 'Классические',
    sizes: SIZES_STANDARD.slice(1),
    sizes_stock: buildSizesStock(SIZES_STANDARD.slice(1)),
    colors: ['Серый', 'Синий', 'Зелёный'],
    in_stock: true,
  },
  {
    name: 'Adidas Superstar',
    description:
      'Иконическая модель с фирменным резиновым носком "ракушка". Сочетание классического стиля и современного комфорта.',
    price: 870000,
    old_price: 950000,
    image_url:
      'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=800&q=80',
    category: 'Классические',
    sizes: SIZES_STANDARD,
    sizes_stock: buildSizesStock(SIZES_STANDARD, SIZES_STANDARD),
    colors: ['Белый/Чёрный'],
    in_stock: false,
  },
]

const banners = [
  {
    image_url:
      'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=1200&q=80',
    title: 'Новая коллекция уже здесь',
    subtitle: 'Скидки до 20% на популярные модели',
    sort_order: 0,
  },
  {
    image_url:
      'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1200&q=80',
    title: 'Бесплатная доставка',
    subtitle: 'При заказе от 1 000 000 сум по Ташкенту',
    sort_order: 1,
  },
  {
    image_url:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
    title: 'Air Jordan 1',
    subtitle: 'Легендарная модель снова в наличии',
    sort_order: 2,
  },
]

const shop = {
  name: 'Sneaker Store',
  description: 'Оригинальные кроссовки с доставкой по Узбекистану',
  card_number: '8600 1234 5678 9012',
  card_holder: 'IVAN IVANOV',
  click_number: '+998 90 123 45 67',
  currency: 'сум',
  owner_telegram_id: process.env.OWNER_TELEGRAM_ID || null,
  bot_token: process.env.BOT_TOKEN || null,
}

async function seed() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await client.query(
      'TRUNCATE order_items, orders, products, banners, categories, shops RESTART IDENTITY CASCADE'
    )

    const shopResult = await client.query(
      `INSERT INTO shops
        (name, description, owner_telegram_id, bot_token, card_number, card_holder, click_number, currency)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        shop.name,
        shop.description,
        shop.owner_telegram_id,
        shop.bot_token,
        shop.card_number,
        shop.card_holder,
        shop.click_number,
        shop.currency,
      ]
    )
    const shopId = shopResult.rows[0].id

    const categoryIds = {}
    for (let i = 0; i < categories.length; i++) {
      const c = categories[i]
      const res = await client.query(
        'INSERT INTO categories (shop_id, name, icon, sort_order) VALUES ($1, $2, $3, $4) RETURNING id',
        [shopId, c.name, c.icon, i]
      )
      categoryIds[c.name] = res.rows[0].id
    }

    for (let i = 0; i < products.length; i++) {
      const p = products[i]
      await client.query(
        `INSERT INTO products
          (shop_id, name, description, price, old_price, image_url, category_id, sizes, colors, sizes_stock, in_stock, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          shopId,
          p.name,
          p.description,
          p.price,
          p.old_price,
          p.image_url,
          categoryIds[p.category],
          p.sizes,
          p.colors,
          p.sizes_stock,
          p.in_stock,
          i,
        ]
      )
    }

    for (const b of banners) {
      await client.query(
        'INSERT INTO banners (shop_id, image_url, title, subtitle, sort_order, active) VALUES ($1, $2, $3, $4, $5, true)',
        [shopId, b.image_url, b.title, b.subtitle, b.sort_order]
      )
    }

    await client.query('COMMIT')
    console.log(`Database seeded successfully (demo shop id=${shopId})`)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Seed failed:', err)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

seed()
