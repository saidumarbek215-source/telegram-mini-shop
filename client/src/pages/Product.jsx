import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { formatPrice } from '../utils/format.js'
import { useCart } from '../context/CartContext.jsx'
import { useShop } from '../context/ShopContext.jsx'
import { CheckIcon } from '../components/Icons.jsx'
import { hapticFeedback } from '../telegram.js'
import { isProductAvailable, isSizeAvailable } from '../utils/stock.js'
import { t } from '../i18n.js'

const FALLBACK_WEIGHT = ['1кг', '5кг', '10кг', '25кг', '50кг']
const FALLBACK_VOLUME = ['1л', '5л', '10л', '20л']

export default function Product() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { shop, lang } = useShop()

  const [product, setProduct] = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [size, setSize] = useState(null)
  const [color, setColor] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    setLoading(true)
    setAdded(false)
    Promise.all([api.getProduct(id), api.getSettings()])
      .then(([p, s]) => {
        setProduct(p)
        setSettings(s)
        const sizes = p.sizes || []
        setSize(sizes.find((sz) => isSizeAvailable(p, sz)) || sizes[0] || null)
        setColor(p.colors?.[0] || null)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="py-20 text-center text-sm text-muted">{t('loading', lang)}</div>
  if (!product) return <div className="py-20 text-center text-sm text-muted">{t('productNotFound', lang)}</div>

  const hasDiscount = product.old_price && Number(product.old_price) > Number(product.price)
  const discountPct = hasDiscount
    ? Math.round((1 - Number(product.price) / Number(product.old_price)) * 100)
    : 0

  const unitType = settings?.product_unit_type || 'size'
  const currency = shop?.currency || 'сум'
  const available = isProductAvailable(product)
  const canAddToCart = available && (!size || isSizeAvailable(product, size))

  function handleAddToCart() {
    const effectiveSize = unitType === 'piece' ? null : size
    addItem(product, { size: effectiveSize, color, quantity: unitType === 'piece' ? quantity : 1 })
    hapticFeedback('medium')
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        style={{
          position: 'fixed',
          left: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 100,
          background: 'rgba(0,0,0,0.5)',
          borderRadius: '50%',
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '20px',
        }}
      >
        ←
      </button>
      <div className="relative aspect-square w-full bg-surface">
        <img
          src={product.image_url}
          alt={product.name}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.target.onerror = null
            e.target.src = 'https://via.placeholder.com/300x300?text=No+Image'
          }}
        />
        {hasDiscount && (
          <span className="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-bg">
            -{discountPct}%
          </span>
        )}
      </div>

      <div className="px-4 pt-4">
        <h1 className="text-xl font-bold leading-tight">{product.name}</h1>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-xl font-bold text-accent">{formatPrice(product.price, currency)}</span>
          {hasDiscount && (
            <span className="text-sm text-muted line-through">
              {formatPrice(product.old_price, currency)}
            </span>
          )}
        </div>

        {!available && (
          <div className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {t('outOfStock', lang)}
          </div>
        )}

        {product.description && (
          <div className="mt-4">
            <h2 className="mb-1 text-sm font-semibold text-muted">{t('description', lang)}</h2>
            <p className="text-sm leading-relaxed text-white/80">{product.description}</p>
          </div>
        )}

        {unitType === 'size' && product.sizes?.length > 0 && (
          <div className="mt-4">
            <h2 className="mb-2 text-sm font-semibold text-muted">{t('size', lang)}</h2>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => {
                const sizeAvailable = isSizeAvailable(product, s)
                return (
                  <button
                    key={s}
                    onClick={() => sizeAvailable && setSize(s)}
                    disabled={!sizeAvailable}
                    className={`h-10 min-w-10 rounded-xl px-3 text-sm font-medium transition-colors ${
                      !sizeAvailable
                        ? 'cursor-not-allowed bg-surface text-muted line-through opacity-50'
                        : size === s
                          ? 'bg-accent text-bg'
                          : 'bg-surface text-white'
                    }`}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {unitType === 'weight' && (
          <div className="mt-4">
            <h2 className="mb-2 text-sm font-semibold text-muted">{t('packaging', lang)}</h2>
            <div className="flex flex-wrap gap-2">
              {(product.sizes?.length ? product.sizes : FALLBACK_WEIGHT).map((w) => (
                <button
                  key={w}
                  onClick={() => setSize(w)}
                  className={`h-10 min-w-10 rounded-xl px-3 text-sm font-medium transition-colors ${
                    size === w ? 'bg-accent text-bg' : 'bg-surface text-white'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        )}

        {unitType === 'volume' && (
          <div className="mt-4">
            <h2 className="mb-2 text-sm font-semibold text-muted">{t('volume', lang)}</h2>
            <div className="flex flex-wrap gap-2">
              {(product.sizes?.length ? product.sizes : FALLBACK_VOLUME).map((v) => (
                <button
                  key={v}
                  onClick={() => setSize(v)}
                  className={`h-10 min-w-10 rounded-xl px-3 text-sm font-medium transition-colors ${
                    size === v ? 'bg-accent text-bg' : 'bg-surface text-white'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}

        {unitType === 'piece' && (
          <div className="mt-4">
            <h2 className="mb-2 text-sm font-semibold text-muted">{t('quantity', lang)}</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-lg font-bold text-white"
              >
                −
              </button>
              <span className="min-w-8 text-center text-sm font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-lg font-bold text-white"
              >
                +
              </button>
            </div>
          </div>
        )}

        {product.colors?.length > 0 && (
          <div className="mt-4">
            <h2 className="mb-2 text-sm font-semibold text-muted">{t('color', lang)}</h2>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                    color === c ? 'bg-accent text-bg' : 'bg-surface text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 mt-6 border-t border-white/5 bg-bg/95 px-4 py-3 backdrop-blur">
        <button
          onClick={handleAddToCart}
          disabled={!canAddToCart}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-3.5 text-sm font-bold text-bg shadow-glow transition-transform active:scale-[0.98] disabled:bg-surface disabled:text-muted disabled:shadow-none"
        >
          {added ? (
            <>
              <CheckIcon className="h-5 w-5" /> {t('added', lang)}
            </>
          ) : canAddToCart ? (
            t('addToCart', lang)
          ) : (
            t('outOfStock', lang)
          )}
        </button>
      </div>
    </div>
  )
}
