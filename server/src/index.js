import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import categoriesRouter from './routes/categories.js'
import productsRouter from './routes/products.js'
import bannersRouter from './routes/banners.js'
import settingsRouter from './routes/settings.js'
import ordersRouter from './routes/orders.js'
import adminRouter from './routes/admin.js'
import shopsRouter from './routes/shops.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ ok: true }))

app.use('/api/categories', categoriesRouter)
app.use('/api/products', productsRouter)
app.use('/api/banners', bannersRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/admin', adminRouter)
app.use('/api/shops', shopsRouter)

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Внутренняя ошибка сервера' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
