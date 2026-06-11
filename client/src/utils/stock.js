// Returns the stock count for a given size, or null if the product
// doesn't track stock for that size (treated as always available).
export function getSizeStock(product, size) {
  const sizesStock = product?.sizes_stock
  if (!sizesStock || !(size in sizesStock)) return null
  return Number(sizesStock[size]) || 0
}

export function isSizeAvailable(product, size) {
  const stock = getSizeStock(product, size)
  return stock === null || stock > 0
}

// A product is out of stock if it's manually marked unavailable, or if it
// has sizes with tracked stock and every one of them is at 0.
export function isProductAvailable(product) {
  if (!product?.in_stock) return false

  const sizes = product?.sizes || []
  const sizesStock = product?.sizes_stock
  if (sizes.length > 0 && sizesStock && Object.keys(sizesStock).length > 0) {
    return sizes.some((size) => isSizeAvailable(product, size))
  }

  return true
}
