import { createContext, useContext, useEffect, useState } from 'react'

const CartContext = createContext(null)

const STORAGE_KEY = 'sneaker_store_cart'

function cartKey(productId, size, color) {
  return `${productId}__${size || ''}__${color || ''}`
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

  function addItem(product, { size, color, quantity = 1 } = {}) {
    setItems((prev) => {
      const key = cartKey(product.id, size, color)
      const existing = prev.find((i) => cartKey(i.product_id, i.size, i.color) === key)

      if (existing) {
        return prev.map((i) =>
          cartKey(i.product_id, i.size, i.color) === key
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
          price: Number(product.price),
          size: size || null,
          color: color || null,
          quantity,
        },
      ]
    })
  }

  function updateQuantity(productId, size, color, quantity) {
    const key = cartKey(productId, size, color)
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((i) => cartKey(i.product_id, i.size, i.color) !== key)
      }
      return prev.map((i) =>
        cartKey(i.product_id, i.size, i.color) === key ? { ...i, quantity } : i
      )
    })
  }

  function removeItem(productId, size, color) {
    const key = cartKey(productId, size, color)
    setItems((prev) => prev.filter((i) => cartKey(i.product_id, i.size, i.color) !== key))
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
