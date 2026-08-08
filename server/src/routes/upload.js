import { Router } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import { mkdir, writeFile } from 'fs/promises'
import { randomBytes } from 'crypto'
import path from 'path'
import { requireOwner } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/var/www/uploads'
const BASE_URL = (process.env.BASE_URL || 'https://api.finexia.uz').replace(/\/$/, '')

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Допустимые форматы: jpg, png, webp, gif'))
    }
  },
})

function multerMiddleware(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (!err) return next()
    const msg = err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
      ? 'Файл слишком большой (макс 10 МБ)'
      : err.message
    res.status(400).json({ error: msg })
  })
}

router.post(
  '/',
  asyncHandler(requireOwner),
  multerMiddleware,
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Файл не передан (поле: image)' })

    const shopId = req.shop.id
    const dir = path.join(UPLOAD_DIR, String(shopId))
    await mkdir(dir, { recursive: true })

    const stamp = Date.now()
    const rand = randomBytes(4).toString('hex')
    const baseName = `${stamp}-${rand}`

    const [thumbBuf, fullBuf] = await Promise.all([
      sharp(req.file.buffer)
        .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 75 })
        .toBuffer(),
      sharp(req.file.buffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer(),
    ])

    await Promise.all([
      writeFile(path.join(dir, `${baseName}_thumb.webp`), thumbBuf),
      writeFile(path.join(dir, `${baseName}.webp`), fullBuf),
    ])

    res.json({
      thumbnail_url: `${BASE_URL}/uploads/${shopId}/${baseName}_thumb.webp`,
      full_url: `${BASE_URL}/uploads/${shopId}/${baseName}.webp`,
    })
  })
)

export default router
