import { createContext, useContext, useState, useEffect } from 'react'

const STORAGE_KEY = `cart_shop_${import.meta.env.VITE_SHOP_ID}`

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  function addItem(product, { size, color, quantity = 1 } = {}) {
    setItems((prev) => {
      const key = `${product.id}-${size || ''}-${color || ''}`
      const existing = prev.find((i) => i._key === key)
      if (existing) {
        return prev.map((i) =>
          i._key === key ? { ...i, quantity: i.quantity + quantity } : i
        )
      }
      return [
        ...prev,
        {
          _key: key,
          product_id: product.id,
          product_name: product.name,
          image_url: product.image_url || product.images?.[0] || '',
          price: product.price,
          quantity,
          size: size || null,
          color: color || null,
        },
      ]
    })
  }

  function removeItem(key) {
    setItems((prev) => prev.filter((i) => i._key !== key))
  }

  function updateQty(key, quantity) {
    if (quantity <= 0) return removeItem(key)
    setItems((prev) => prev.map((i) => (i._key === key ? { ...i, quantity } : i)))
  }

  function clearCart() {
    setItems([])
  }

  const total = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0)
  const count = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
