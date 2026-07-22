import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { formatPrice } from '../utils/format.js'

export default function Cart() {
  const { items, removeItem, updateQty, total, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <div className="container-web py-16 text-center">
        <div className="text-gray-300 mb-4">
          <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p className="text-gray-500 text-lg mb-4">Savat bo'sh</p>
        <Link to="/catalog" className="btn-primary inline-block">Xarid qilishni boshlash</Link>
      </div>
    )
  }

  return (
    <div className="container-web py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Savat</h1>
        <button onClick={clearCart} className="text-sm text-red-400 hover:text-red-600 transition-colors">
          Tozalash
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={item._key} className="card p-4 flex gap-4">
              {/* Image */}
              <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 leading-snug">{item.product_name}</p>
                <div className="text-sm text-gray-500 mt-0.5 space-x-2">
                  {item.size && <span>O'lcham: {item.size}</span>}
                  {item.color && <span>Rang: {item.color}</span>}
                </div>
                <p className="font-bold text-gray-900 mt-1">{formatPrice(item.price)}</p>

                {/* Qty controls */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => updateQty(item._key, item.quantity - 1)}
                    className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:border-accent transition-colors text-sm"
                  >−</button>
                  <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item._key, item.quantity + 1)}
                    className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:border-accent transition-colors text-sm"
                  >+</button>
                  <button
                    onClick={() => removeItem(item._key)}
                    className="ml-2 text-red-400 hover:text-red-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Subtotal */}
              <div className="flex-shrink-0 text-right">
                <p className="font-bold text-gray-900">{formatPrice(Number(item.price) * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24 space-y-4">
            <h2 className="font-bold text-lg">Jami</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Mahsulotlar ({items.reduce((s, i) => s + i.quantity, 0)} ta)</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Jami:</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            <Link to="/checkout" className="btn-primary w-full text-center block">
              Buyurtma berish
            </Link>
            <Link to="/catalog" className="block text-center text-sm text-accent hover:underline">
              ← Xaridni davom ettirish
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
