const BASE = 'https://api.finexia.uz/api'

function getAuth() {
  return {
    token: localStorage.getItem('admin_token'),
    shopId: localStorage.getItem('admin_shop_id'),
  }
}

function headers() {
  const { token } = getAuth()
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'x-web-admin-token': token } : {}),
  }
}

function shopParam() {
  const { shopId } = getAuth()
  return `shop_id=${shopId}`
}

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}?${shopParam()}`, {
    method,
    headers: headers(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

// Auth
export const login = (shop_id, login, password) =>
  fetch(`${BASE}/web-auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shop_id, login, password }),
  }).then(async r => {
    if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Xato') }
    return r.json()
  })

// Products
export const getProducts   = ()         => req('GET',    '/admin/products')
export const createProduct = (data)     => req('POST',   '/admin/products', data)
export const updateProduct = (id, data) => req('PUT',    `/admin/products/${id}`, data)
export const deleteProduct = (id)       => req('DELETE', `/admin/products/${id}`)

// Categories
export const getCategories   = ()         => req('GET',    '/admin/categories')
export const createCategory  = (data)     => req('POST',   '/admin/categories', data)
export const updateCategory  = (id, data) => req('PUT',    `/admin/categories/${id}`, data)
export const deleteCategory  = (id)       => req('DELETE', `/admin/categories/${id}`)

// Banners
export const getBanners   = ()         => req('GET',    '/admin/banners')
export const createBanner = (data)     => req('POST',   '/admin/banners', data)
export const updateBanner = (id, data) => req('PUT',    `/admin/banners/${id}`, data)
export const deleteBanner = (id)       => req('DELETE', `/admin/banners/${id}`)

// Orders
export const getOrders     = ()             => req('GET', '/admin/orders')
export const updateOrderStatus = (id, status) => req('PUT', `/admin/orders/${id}/status`, { status })

// Settings
export const getSettings   = ()     => req('GET', '/admin/settings')
export const updateSettings = (data) => req('PUT', '/admin/settings', data)

// Stats (public endpoint)
export const getPublicProducts = (shopId) =>
  fetch(`${BASE}/products?shop_id=${shopId}`).then(r => r.json())

// Shop info (includes ai_connected)
export const checkAdmin = () => req('GET', '/admin/check')

// Credits (debtors)
export const getCredits    = ()      => req('GET', '/admin/credits')
export const markCreditPaid = (id)   => req('PUT', `/admin/credits/${id}/paid`)

// Analytics
export async function getAnalytics(days = 30) {
  const { token, shopId } = getAuth()
  const res = await fetch(`${BASE}/admin/analytics?shop_id=${shopId}&days=${days}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'x-web-admin-token': token } : {}),
    },
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || res.statusText) }
  return res.json()
}

// Image upload
export async function uploadImage(file) {
  const { token, shopId } = getAuth()
  const form = new FormData()
  form.append('image', file)
  const res = await fetch(`${BASE}/upload-image?shop_id=${shopId}`, {
    method: 'POST',
    headers: token ? { 'x-web-admin-token': token } : {},
    body: form,
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Upload failed') }
  return res.json()
}

// Partners (map)
export const getPartners    = ()          => req('GET',    '/admin/partners')
export const createPartner  = (data)      => req('POST',   '/admin/partners', data)
export const updatePartner  = (id, data)  => req('PUT',    `/admin/partners/${id}`, data)
export const deletePartner  = (id)        => req('DELETE', `/admin/partners/${id}`)
