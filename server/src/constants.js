export const ORDER_STATUSES = ['new', 'accepted', 'shipped', 'delivered', 'cancelled', 'expired']

export const ORDER_STATUS_LABELS = {
  new: 'Новый',
  accepted: 'Принят',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
  expired: 'Истёк',
}

export function formatPrice(value) {
  return `${Math.round(Number(value)).toLocaleString('ru-RU').replace(/ /g, ' ')} сум`
}

export function getMiniAppUrl(shopId) {
  const baseUrl = process.env.WEBAPP_URL || 'https://telegram-mini-shop.netlify.app'
  return `${baseUrl}?shop=${shopId}`
}
