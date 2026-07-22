import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../api.js'
import { useCart } from '../context/CartContext.jsx'
import { formatPrice } from '../utils/format.js'

export default function Product() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [activeImg, setActiveImg] = useState(0)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.getProduct(id)
      .then((p) => {
        setProduct(p)
        // Auto-select first available size
        if (p.sizes_stock) {
          const available = Object.entries(p.sizes_stock).find(([, qty]) => qty > 0)
          if (available) setSelectedSize(available[0])
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  function handleAddToCart() {
    if (!product) return
    const hasSizes = product.sizes_stock && Object.keys(product.sizes_stock).length > 0
    if (hasSizes && !selectedSize) {
      alert("Iltimos, o'lchamni tanlang")
      return
    }
    addItem(product, { size: selectedSize || null, color: selectedColor || null, quantity })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (loading) return (
    <div className="container-web py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="skeleton aspect-square rounded-2xl" />
        <div className="space-y-4">
          <div className="skeleton h-8 rounded w-3/4" />
          <div className="skeleton h-6 rounded w-1/3" />
          <div className="skeleton h-4 rounded w-full" />
          <div className="skeleton h-4 rounded w-full" />
          <div className="skeleton h-4 rounded w-2/3" />
        </div>
      </div>
    </div>
  )

  if (error || !product) return (
    <div className="container-web py-16 text-center text-gray-400">
      <p>Mahsulot topilmadi</p>
      <Link to="/catalog" className="text-accent text-sm mt-2 block hover:underline">Katalogga qaytish</Link>
    </div>
  )

  const images = [product.image_url, ...(product.images || [])].filter(Boolean)
  const hasSizes = product.sizes_stock && Object.keys(product.sizes_stock).length > 0
  const colors = product.colors || []
  const availableQty = hasSizes && selectedSize ? (product.sizes_stock[selectedSize] ?? 0) : null

  return (
    <div className="container-web py-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-4 flex gap-2">
        <Link to="/" className="hover:text-accent">Bosh sahifa</Link>
        <span>/</span>
        <Link to="/catalog" className="hover:text-accent">Katalog</Link>
        <span>/</span>
        <span className="text-gray-700 truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <div>
          <div className="bg-gray-100 rounded-2xl overflow-hidden aspect-square mb-3">
            {images[activeImg] ? (
              <img src={images[activeImg]} alt={product.name} className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    i === activeImg ? 'border-accent' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>

          {/* Price */}
          <div>
            <p className="text-3xl font-bold text-gray-900">{formatPrice(product.price)}</p>
            {product.old_price && Number(product.old_price) > Number(product.price) && (
              <p className="text-gray-400 line-through text-lg">{formatPrice(product.old_price)}</p>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{product.description}</p>
          )}

          {/* Sizes */}
          {hasSizes && (
            <div>
              <p className="font-semibold mb-2 text-sm">O'lcham:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(product.sizes_stock).map(([size, qty]) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    disabled={qty <= 0}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                      selectedSize === size
                        ? 'border-accent bg-accent text-white'
                        : qty <= 0
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                        : 'border-gray-200 hover:border-accent text-gray-700'
                    }`}
                  >
                    {size}
                    {qty <= 0 && <span className="ml-1 text-xs">(yo'q)</span>}
                  </button>
                ))}
              </div>
              {selectedSize && availableQty !== null && availableQty > 0 && availableQty <= 5 && (
                <p className="text-orange-500 text-xs mt-1">{availableQty} ta qoldi</p>
              )}
            </div>
          )}

          {/* Colors */}
          {colors.length > 0 && (
            <div>
              <p className="font-semibold mb-2 text-sm">Rang: <span className="font-normal">{selectedColor}</span></p>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 rounded-lg border-2 text-sm transition-colors ${
                      selectedColor === color ? 'border-accent bg-accent/10 font-semibold' : 'border-gray-200 hover:border-accent'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <p className="font-semibold mb-2 text-sm">Miqdor:</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:border-accent transition-colors text-lg font-medium"
              >−</button>
              <span className="w-10 text-center font-semibold text-lg">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:border-accent transition-colors text-lg font-medium"
              >+</button>
            </div>
          </div>

          {/* Add to cart */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleAddToCart}
              className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all ${
                added
                  ? 'bg-green-500 text-white'
                  : 'bg-accent hover:bg-accent-hover text-white'
              }`}
            >
              {added ? '✓ Savatga qo\'shildi' : 'Savatga qo\'shish'}
            </button>
          </div>

          <button
            onClick={() => { handleAddToCart(); navigate('/cart') }}
            className="w-full py-4 rounded-xl font-bold text-lg border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors"
          >
            Hozir sotib olish
          </button>
        </div>
      </div>
    </div>
  )
}
