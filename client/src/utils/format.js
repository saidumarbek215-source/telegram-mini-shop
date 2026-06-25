export function formatPrice(value, currency = 'сум') {
  const num = Number(value) || 0
  const formatted = num % 1 === 0 
    ? num.toLocaleString('ru-RU') 
    : num.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${formatted} ${currency}`
}
