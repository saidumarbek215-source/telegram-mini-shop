export function formatPrice(value, currency = 'сум') {
  return `${Math.round(Number(value) || 0).toLocaleString('ru-RU')} ${currency}`
}
