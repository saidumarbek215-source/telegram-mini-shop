import { Link } from 'react-router-dom'
import { formatPrice } from '../utils/format.js'
import { useCart } from '../context/CartContext.jsx'

export default function ProductCard({ product }) {
  const { addItem } = useCart()
  const image = product.image_url || product.images?.[0] || null
  const hasSizes = product.sizes_stock && Object.keys(product.sizes_stock).length > 0

  function handleAddToCart(e) {
    e.preventDefault()
    e.stopPropagation()
    if (hasSizes) return // с размерами — только через страницу товара
    addItem(product)
  }

  return (
    <Link to={`/product/${product.id}`} className="card group flex flex-col hover:-translate-y-1 transition-transform duration-200">
      {/* Image */}
      <div className="relative overflow-hidden rounded-t-xl bg-gray-100 aspect-square">
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {product.old_price && Number(product.old_price) > Number(product.price) && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            -{Math.round((1 - product.price / product.old_price) * 100)}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-sm text-gray-700 line-clamp-2 leading-snug">{product.name}</p>
        {product.rating != null && (
          <p className="mt-0.5 text-xs text-yellow-500 font-medium">⭐ {Number(product.rating).toFixed(1)}</p>
        )}

        <div className="mt-2 flex items-center justify-between gap-2">
          <div>
            <p className="font-bold text-gray-900 text-base">{formatPrice(product.price)}</p>
            {product.old_price && Number(product.old_price) > Number(product.price) && (
              <p className="text-xs text-gray-400 line-through">{formatPrice(product.old_price)}</p>
            )}
          </div>

          {!hasSizes && (
            <button
              onClick={handleAddToCart}
              className="flex-shrink-0 w-9 h-9 bg-accent hover:bg-accent-hover text-white rounded-full flex items-center justify-center transition-colors shadow-sm"
              title="Savatga qo'shish"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}
