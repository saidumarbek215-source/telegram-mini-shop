import { getTelegramInitData } from './telegram.js'

const API_URL = import.meta.env.VITE_API_URL || '/api'

function withShopId(path) {
  const urlParams = new URLSearchParams(window.location.search)
  const shopId = urlParams.get('shop')
  if (!shopId) return path
  const [base, qs = ''] = path.split('?')
  const params = new URLSearchParams(qs)
  params.set('shop_id', shopId)
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
  getCategories: () => request('/categories'),
  getProducts: (params = {}) => {
    const filtered = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    )
    const qs = new URLSearchParams(filtered).toString()
    return request(`/products${qs ? `?${qs}` : ''}`)
  },
  getProduct: (id) => request(`/products/${id}`),
  getBanners: () => request('/banners'),
  getSettings: () => request('/settings'),
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
  getPartners: () => request('/admin/partners', { admin: true }),
  createPartner: (data) =>
    request('/admin/partners', { method: 'POST', body: JSON.stringify(data), admin: true }),
  updatePartner: (id, data) =>
    request(`/admin/partners/${id}`, { method: 'PUT', body: JSON.stringify(data), admin: true }),
  deletePartner: (id) => request(`/admin/partners/${id}`, { method: 'DELETE', admin: true }),
}
