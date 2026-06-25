import { getTelegramInitData } from './telegram.js'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const cache = new Map()
const CACHE_TTL = 30000

async function cachedRequest(path) {
  const cached = cache.get(path)
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.data
  }
  const data = await request(path)
  cache.set(path, { data, time: Date.now() })
  return data
}

export function invalidateCache(path) {
  if (path) cache.delete(path)
  else cache.clear()
}

// Captured once at module load — before React Router changes the URL
const SHOP_ID = (() => {
  const urlParams = new URLSearchParams(window.location.search)
  const fromUrl = urlParams.get('shop')
  if (fromUrl) return fromUrl

  const tg = window.Telegram?.WebApp
  if (tg?.initDataUnsafe?.start_param) return tg.initDataUnsafe.start_param

  return localStorage.getItem('shop_id')
})()

function withShopId(path) {
  if (!SHOP_ID) return path
  const [base, qs = ''] = path.split('?')
  const params = new URLSearchParams(qs)
  params.set('shop_id', SHOP_ID)
  return `${base}?${params.toString()}`
}

async function request(path, { admin, ...options } = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (admin) {
    headers['X-Telegram-Init-Data'] = getTelegramInitData()
  }
  const res = await fetch(`${API_URL}${withShopId(path)}`, { ...options, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Ошибка запроса (${res.status})`)
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  getCategories: () => cachedRequest('/categories'),
  getProducts: (params = {}) => {
    const filtered = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    )
    const qs = new URLSearchParams(filtered).toString()
    const path = `/products${qs ? `?${qs}` : ''}`
    return cachedRequest(path)
  },
  getProduct: (id) => request(`/products/${id}`),
  getBanners: () => cachedRequest('/banners'),
  getSettings: () => cachedRequest('/settings'),
  createOrder: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  getOrderHistory: (telegramUserId) => request(`/orders/user/${telegramUserId}`),
}

export const adminApi = {
  checkOwner: () => request('/admin/check', { admin: true }),
  getProducts: () => request('/admin/products', { admin: true }),
  createProduct: (data) =>
    request('/admin/products', { method: 'POST', body: JSON.stringify(data), admin: true }),
  updateProduct: (id, data) =>
    request(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data), admin: true }),
  deleteProduct: (id) => request(`/admin/products/${id}`, { method: 'DELETE', admin: true }),
  getCategories: () => request('/admin/categories', { admin: true }),
  createCategory: (data) =>
    request('/admin/categories', { method: 'POST', body: JSON.stringify(data), admin: true }),
  updateCategory: (id, data) =>
    request(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data), admin: true }),
  deleteCategory: (id) => request(`/admin/categories/${id}`, { method: 'DELETE', admin: true }),
  getBanners: () => request('/admin/banners', { admin: true }),
  createBanner: (data) =>
    request('/admin/banners', { method: 'POST', body: JSON.stringify(data), admin: true }),
  updateBanner: (id, data) =>
    request(`/admin/banners/${id}`, { method: 'PUT', body: JSON.stringify(data), admin: true }),
  deleteBanner: (id) => request(`/admin/banners/${id}`, { method: 'DELETE', admin: true }),
  getOrders: () => request('/admin/orders', { admin: true }),
  updateOrderStatus: (id, status) =>
    request(`/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
      admin: true,
    }),
  getSettings: () => request('/admin/settings', { admin: true }),
  updateSettings: (data) =>
    request('/admin/settings', { method: 'PUT', body: JSON.stringify(data), admin: true }),
  getCredits: () => request('/admin/credits', { admin: true }),
  markCreditPaid: (id) =>
    request(`/admin/credits/${id}/paid`, { method: 'PUT', admin: true }),
  getPartners: () => request('/admin/partners', { admin: true }),
  createPartner: (data) =>
    request('/admin/partners', { method: 'POST', body: JSON.stringify(data), admin: true }),
  updatePartner: (id, data) =>
    request(`/admin/partners/${id}`, { method: 'PUT', body: JSON.stringify(data), admin: true }),
  deletePartner: (id) => request(`/admin/partners/${id}`, { method: 'DELETE', admin: true }),
}
