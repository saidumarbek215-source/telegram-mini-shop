const API_URL = import.meta.env.VITE_API_URL || '/api'

async function request(path, { auth, ...options } = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }

  if (auth) {
    const token = localStorage.getItem('admin_token')
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

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
  login: (password) =>
    request('/admin/login', { method: 'POST', body: JSON.stringify({ password }) }),

  getProducts: () => request('/admin/products', { auth: true }),
  createProduct: (data) =>
    request('/admin/products', { method: 'POST', body: JSON.stringify(data), auth: true }),
  updateProduct: (id, data) =>
    request(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data), auth: true }),
  deleteProduct: (id) => request(`/admin/products/${id}`, { method: 'DELETE', auth: true }),

  getCategories: () => request('/admin/categories', { auth: true }),
  createCategory: (data) =>
    request('/admin/categories', { method: 'POST', body: JSON.stringify(data), auth: true }),
  updateCategory: (id, data) =>
    request(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data), auth: true }),
  deleteCategory: (id) => request(`/admin/categories/${id}`, { method: 'DELETE', auth: true }),

  getBanners: () => request('/admin/banners', { auth: true }),
  createBanner: (data) =>
    request('/admin/banners', { method: 'POST', body: JSON.stringify(data), auth: true }),
  updateBanner: (id, data) =>
    request(`/admin/banners/${id}`, { method: 'PUT', body: JSON.stringify(data), auth: true }),
  deleteBanner: (id) => request(`/admin/banners/${id}`, { method: 'DELETE', auth: true }),

  getOrders: () => request('/admin/orders', { auth: true }),
  updateOrderStatus: (id, status) =>
    request(`/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
      auth: true,
    }),

  getSettings: () => request('/admin/settings', { auth: true }),
  updateSettings: (data) =>
    request('/admin/settings', { method: 'PUT', body: JSON.stringify(data), auth: true }),
}
