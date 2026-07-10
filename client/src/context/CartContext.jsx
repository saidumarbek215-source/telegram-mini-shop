import { createContext, useContext, useEffect, useState } from 'react'

const CartContext = createContext(null)

const SHOP_ID = new URLSearchParams(window.location.search).get('shop')
const STORAGE_KEY = SHOP_ID ? `cart_shop_${SHOP_ID}` : 'cart_shop_default'

function cartKey(productId, size, color, variantLabel) {
  return `${productId}__${size || ''}__${color || ''}__${variantLabel || ''}`
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  function addItem(product, { size, color, quantity = 1, variant = null } = {}) {
    setItems((prev) => {
      const key = cartKey(product.id, size, color, variant?.label)
      const existing = prev.find((i) => cartKey(i.product_id, i.size, i.color, i.variant_label) === key)

      if (existing) {
        return prev.map((i) =>
          cartKey(i.product_id, i.size, i.color, i.variant_label) === key
            ? { ...i, quantity: i.quantity + quantity }
            : i
        )
      }

      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          image_url: product.image_url,
          price: variant ? Number(variant.price) : Number(product.price),
          size: size || null,
          color: color || null,
          variant_label: variant?.label || null,
          quantity,
        },
      ]
    })
  }

  function updateQuantity(productId, size, color, quantity, variantLabel) {
    const key = cartKey(productId, size, color, variantLabel)
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((i) => cartKey(i.product_id, i.size, i.color, i.variant_label) !== key)
      }
      return prev.map((i) =>
        cartKey(i.product_id, i.size, i.color, i.variant_label) === key ? { ...i, quantity } : i
      )
    })
  }

  function removeItem(productId, size, color, variantLabel) {
    const key = cartKey(productId, size, color, variantLabel)
    setItems((prev) => prev.filter((i) => cartKey(i.product_id, i.size, i.color, i.variant_label) !== key))
  }

  function clearCart() {
    setItems([])
  }

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const count = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQuantity, removeItem, clearCart, total, count }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
