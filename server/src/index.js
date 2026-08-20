import express from 'express'
import cors from 'cors'

import categoriesRouter from './routes/categories.js'
import productsRouter from './routes/products.js'
import bannersRouter from './routes/banners.js'
import settingsRouter from './routes/settings.js'
import ordersRouter from './routes/orders.js'
import adminRouter from './routes/admin.js'
import shopsRouter from './routes/shops.js'
import webAuthRouter from './routes/webAuth.js'
import superAdminRouter from './routes/superAdmin.js'
import uploadRouter from './routes/upload.js'
import { migrate } from './db/migrate.js'
import { startAutoCancelJob } from './jobs/autoCancelOrders.js'
import { startCreditReminderJob } from './jobs/creditReminder.js'
import { startSubscriptionReminderJob } from './jobs/subscriptionReminders.js'
import { startCheckExpiredSubscriptionsJob } from './jobs/checkExpiredSubscriptions.js'
import { startAllBots, stopAllBots } from './services/botManager.js'

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/var/www/uploads'

const app = express()
app.set('trust proxy', 1)

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(UPLOAD_DIR))

app.get('/api/health', (req, res) => res.json({ ok: true }))

app.use('/api/categories', categoriesRouter)
app.use('/api/products', productsRouter)
app.use('/api/banners', bannersRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/admin', adminRouter)
app.use('/api/shops', shopsRouter)
app.use('/api/web-auth', webAuthRouter)
app.use('/api/super-admin', superAdminRouter)
app.use('/api/upload-image', uploadRouter)

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Внутренняя ошибка сервера' })
})

const PORT = process.env.PORT || 3001

async function start() {
  await migrate()
  await startAllBots()
  startAutoCancelJob()
  startCreditReminderJob()
  startSubscriptionReminderJob()
  startCheckExpiredSubscriptionsJob()
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})

async function gracefulShutdown(signal) {
  console.log(`${signal} received, shutting down gracefully...`)
  await stopAllBots()
  process.exit(0)
}

process.on('SIGTERM', () => {
  const timeout = setTimeout(() => {
    console.error('Graceful shutdown timed out, forcing exit.')
    process.exit(1)
  }, 8000)
  timeout.unref()
  gracefulShutdown('SIGTERM')
})

process.on('SIGINT', () => {
  gracefulShutdown('SIGINT')
})
