#!/usr/bin/env node
/**
 * Миграция изображений с postimg.cc на локальное хранилище.
 *
 * Использование:
 *   node scripts/migrate-images.js
 *
 * Переменные окружения берёт из server/.env (запускать из директории server/).
 */

import 'dotenv/config'
import pg from 'pg'
import sharp from 'sharp'
import { mkdir, writeFile, appendFile } from 'fs/promises'
import { randomBytes } from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/var/www/uploads'
const BASE_URL = (process.env.BASE_URL || 'https://api.finexia.uz').replace(/\/$/, '')
const LOG_FILE = path.join(__dirname, 'failed_migrations.log')

const db = new pg.Pool({ connectionString: process.env.DATABASE_URL })

const stats = { total: 0, success: 0, skipped: 0, failed: 0 }

async function logFailure(context, url, err) {
  const line = `[${new Date().toISOString()}] ${context} | ${url} | ${err.message}\n`
  await appendFile(LOG_FILE, line).catch(() => {})
  console.error(`  FAILED: ${err.message}`)
}

async function downloadImage(url) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(20_000),
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ImageMigrator/1.0)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length === 0) throw new Error('Пустой ответ')
  return buf
}

async function processAndSave(buf, shopId) {
  const dir = path.join(UPLOAD_DIR, String(shopId))
  await mkdir(dir, { recursive: true })

  const stamp = Date.now()
  const rand = randomBytes(4).toString('hex')
  const baseName = `${stamp}-${rand}`

  const [thumbBuf, fullBuf] = await Promise.all([
    sharp(buf)
      .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer(),
    sharp(buf)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer(),
  ])

  await Promise.all([
    writeFile(path.join(dir, `${baseName}_thumb.webp`), thumbBuf),
    writeFile(path.join(dir, `${baseName}.webp`), fullBuf),
  ])

  return {
    thumbnail_url: `${BASE_URL}/uploads/${shopId}/${baseName}_thumb.webp`,
    full_url: `${BASE_URL}/uploads/${shopId}/${baseName}.webp`,
  }
}

function isPostimg(url) {
  return typeof url === 'string' && url.includes('postimg.cc')
}

// ── products ──────────────────────────────────────────────────────────────────

async function migrateProducts() {
  const { rows } = await db.query(
    `SELECT id, shop_id, image_url, images
     FROM products
     WHERE image_url LIKE '%postimg.cc%'
        OR images::text LIKE '%postimg.cc%'`
  )
  console.log(`\nProducts: найдено ${rows.length} записей с postimg.cc`)

  for (const row of rows) {
    let newImageUrl = row.image_url
    let newImages = Array.isArray(row.images) ? [...row.images] : []
    let changed = false

    // image_url
    if (isPostimg(row.image_url)) {
      stats.total++
      console.log(`  [product #${row.id}] image_url: ${row.image_url}`)
      try {
        const buf = await downloadImage(row.image_url)
        const { full_url } = await processAndSave(buf, row.shop_id)
        newImageUrl = full_url
        changed = true
        stats.success++
        console.log(`    → ${full_url}`)
      } catch (err) {
        await logFailure(`product #${row.id} image_url`, row.image_url, err)
        stats.failed++
      }
    }

    // images[]
    for (let i = 0; i < newImages.length; i++) {
      if (!isPostimg(newImages[i])) continue
      stats.total++
      console.log(`  [product #${row.id}] images[${i}]: ${newImages[i]}`)
      try {
        const buf = await downloadImage(newImages[i])
        const { full_url } = await processAndSave(buf, row.shop_id)
        newImages[i] = full_url
        changed = true
        stats.success++
        console.log(`    → ${full_url}`)
      } catch (err) {
        await logFailure(`product #${row.id} images[${i}]`, newImages[i], err)
        stats.failed++
      }
    }

    if (changed) {
      await db.query(
        'UPDATE products SET image_url = $1, images = $2 WHERE id = $3',
        [newImageUrl, JSON.stringify(newImages), row.id]
      )
    }
  }
}

// ── banners ───────────────────────────────────────────────────────────────────

async function migrateBanners() {
  const { rows } = await db.query(
    `SELECT id, shop_id, image_url FROM banners WHERE image_url LIKE '%postimg.cc%'`
  )
  console.log(`\nBanners: найдено ${rows.length} записей с postimg.cc`)

  for (const row of rows) {
    stats.total++
    console.log(`  [banner #${row.id}] ${row.image_url}`)
    try {
      const buf = await downloadImage(row.image_url)
      const { full_url } = await processAndSave(buf, row.shop_id)
      await db.query('UPDATE banners SET image_url = $1 WHERE id = $2', [full_url, row.id])
      stats.success++
      console.log(`    → ${full_url}`)
    } catch (err) {
      await logFailure(`banner #${row.id} image_url`, row.image_url, err)
      stats.failed++
    }
  }
}

// ── categories ────────────────────────────────────────────────────────────────

async function migrateCategories() {
  const { rows } = await db.query(
    `SELECT id, shop_id, image_url FROM categories WHERE image_url LIKE '%postimg.cc%'`
  ).catch(() => ({ rows: [] })) // image_url может не быть в схеме старых БД

  console.log(`\nCategories: найдено ${rows.length} записей с postimg.cc`)

  for (const row of rows) {
    stats.total++
    console.log(`  [category #${row.id}] ${row.image_url}`)
    try {
      const buf = await downloadImage(row.image_url)
      const { full_url } = await processAndSave(buf, row.shop_id)
      await db.query('UPDATE categories SET image_url = $1 WHERE id = $2', [full_url, row.id])
      stats.success++
      console.log(`    → ${full_url}`)
    } catch (err) {
      await logFailure(`category #${row.id} image_url`, row.image_url, err)
      stats.failed++
    }
  }
}

// ── partners ──────────────────────────────────────────────────────────────────

async function migratePartners() {
  const { rows } = await db.query(
    `SELECT id, shop_id, photo_url FROM partners WHERE photo_url LIKE '%postimg.cc%'`
  ).catch(() => ({ rows: [] }))

  console.log(`\nPartners: найдено ${rows.length} записей с postimg.cc`)

  for (const row of rows) {
    stats.total++
    console.log(`  [partner #${row.id}] ${row.photo_url}`)
    try {
      const buf = await downloadImage(row.photo_url)
      const { full_url } = await processAndSave(buf, row.shop_id)
      await db.query('UPDATE partners SET photo_url = $1 WHERE id = $2', [full_url, row.id])
      stats.success++
      console.log(`    → ${full_url}`)
    } catch (err) {
      await logFailure(`partner #${row.id} photo_url`, row.photo_url, err)
      stats.failed++
    }
  }
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Миграция изображений postimg.cc → локальное хранилище ===')
  console.log(`Директория: ${UPLOAD_DIR}`)
  console.log(`Базовый URL: ${BASE_URL}`)

  await migrateProducts()
  await migrateBanners()
  await migrateCategories()
  await migratePartners()

  console.log('\n=== Итог ===')
  console.log(`Всего URL обработано:  ${stats.total}`)
  console.log(`Успешно мигрировано:   ${stats.success}`)
  console.log(`Ошибок:                ${stats.failed}`)

  if (stats.failed > 0) {
    console.log(`\nДетали ошибок: ${LOG_FILE}`)
  }
  if (stats.total === 0) {
    console.log('Изображений с postimg.cc не найдено — миграция не нужна.')
  }
}

main()
  .catch((err) => {
    console.error('Критическая ошибка:', err)
    process.exit(1)
  })
  .finally(() => db.end())
