const API_URL = import.meta.env.VITE_API_URL || '/api'
const SHOP_ID = import.meta.env.VITE_SHOP_ID

if (!SHOP_ID) {
  console.warn('[api] VITE_SHOP_ID не задан — запросы будут падать с ошибкой 400')
}

const cache = new Map()
const CACHE_TTL = 30_000

async function cachedGet(path) {
  const key = path
  const hit = cache.get(key)
  if (hit && Date.now() - hit.time < CACHE_TTL) return hit.data
  const data = await get(path)
  cache.set(key, { data, time: Date.now() })
  return data
}

function withShopId(path) {
  const [base, qs = ''] = path.split('?')
  const params = new URLSearchParams(qs)
  params.set('shop_id', SHOP_ID)
  return `${base}?${params.toString()}`
}

async function get(path) {
  const res = await fetch(`${API_URL}${withShopId(path)}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Ошибка ${res.status}`)
  }
  return res.json()
}

async function post(path, data) {
  const res = await fetch(`${API_URL}${withShopId(path)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Ошибка ${res.status}`)
  }
  return res.json()
}

export const api = {
  getSettings: () => cachedGet('/settings'),
  getCategories: () => cachedGet('/categories'),
  getBanners: () => cachedGet('/banners'),
  getProducts: (params = {}) => {
    const filtered = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    )
    const qs = new URLSearchParams(filtered).toString()
    return cachedGet(`/products${qs ? `?${qs}` : ''}`)
  },
  getProduct: (id) => get(`/products/${id}`),
  createOrder: (data) => post('/orders', data),
}
