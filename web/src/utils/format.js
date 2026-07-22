export function formatPrice(price) {
  if (price == null) return ''
  return Number(price).toLocaleString('uz-UZ') + " so'm"
}

export function formatDate(str) {
  if (!str) return ''
  return new Date(str).toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
