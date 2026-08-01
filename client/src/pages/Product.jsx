import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { formatPrice } from '../utils/format.js'
import { useCart } from '../context/CartContext.jsx'
import { useShop } from '../context/ShopContext.jsx'
import { CheckIcon, BagIcon } from '../components/Icons.jsx'
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
  const [activePhoto, setActivePhoto] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [descExpanded, setDescExpanded] = useState(false)
  const touchStartX = useRef(null)

  useEffect(() => {
    setLoading(true)
    setAdded(false)
    setActivePhoto(0)
    Promise.all([api.getProduct(id), api.getSettings()])
      .then(([p, s]) => {
        setProduct(p)
        setSettings(s)
        const sizes = p.sizes || []
        setSize(sizes.find((sz) => isSizeAvailable(p, sz)) || sizes[0] || null)
        setColor(p.colors?.[0] || null)
        const variants = p.variants || []
        setSelectedVariant(variants.find((v) => v.in_stock !== false) || variants[0] || null)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="py-20 text-center text-sm text-muted">{t('loading', lang)}</div>
  if (!product) return <div className="py-20 text-center text-sm text-muted">{t('productNotFound', lang)}</div>

  const allImages = [product.image_url, ...(product.images || [])].filter(Boolean)
  const hasVariants = (product.variants?.length || 0) > 0

  const hasPrice = hasVariants ? !!selectedVariant?.price : !!product.price
  const displayPrice = hasVariants ? Number(selectedVariant?.price || 0) : Number(product.price || 0)
  const displayOldPrice = hasVariants ? selectedVariant?.old_price : product.old_price
  const hasDiscount = hasPrice && displayOldPrice && Number(displayOldPrice) > displayPrice
  const discountPct = hasDiscount
    ? Math.round((1 - displayPrice / Number(displayOldPrice)) * 100)
    : 0

  const unitType = settings?.product_unit_type || 'size'
  const currency = shop?.currency || 'сум'
  const available = isProductAvailable(product)
  const canAddToCart = hasVariants
    ? selectedVariant?.in_stock !== false
    : available && (!size || isSizeAvailable(product, size))

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
  }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) setActivePhoto((i) => Math.min(i + 1, allImages.length - 1))
      else setActivePhoto((i) => Math.max(i - 1, 0))
    }
    touchStartX.current = null
  }

  function handleAddToCart() {
    const effectiveSize = unitType === 'piece' ? null : size
    addItem(product, {
      size: effectiveSize,
      color,
      quantity: unitType === 'piece' ? quantity : 1,
      variant: selectedVariant,
    })
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

      {/* Photo gallery */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: '65vh', minHeight: '450px' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={allImages[activePhoto] || product.image_url}
          alt={product.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
          }}
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

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div
          className="flex gap-2 overflow-x-auto px-4 py-3"
          style={{ backgroundColor: 'var(--surface, #ffffff)' }}
        >
          {allImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setActivePhoto(i)}
              style={{
                flexShrink: 0,
                width: '60px',
                height: '60px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: `2px solid ${activePhoto === i ? 'var(--color-accent, #00E5CC)' : 'transparent'}`,
                padding: 0,
                background: '#f5f5f5',
              }}
            >
              <img
                src={img}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </button>
          ))}
        </div>
      )}

      <div className="px-4 pt-4">
        <h1 className="text-xl font-bold leading-tight" style={{ color: 'var(--text, #ffffff)' }}>{product.name}</h1>

        {product.rating != null && (
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-sm">⭐</span>
            <span className="text-sm font-semibold text-accent">{Number(product.rating).toFixed(1)}</span>
            {product.review_count > 0 && (
              <span className="text-xs text-muted">({product.review_count} отзывов)</span>
            )}
          </div>
        )}

        <div className="mt-1.5 flex items-baseline gap-2">
          {hasPrice ? (
            <>
              <span className="text-xl font-bold text-accent">{formatPrice(displayPrice, currency)}</span>
              {hasDiscount && (
                <span className="text-sm text-muted line-through">
                  {formatPrice(displayOldPrice, currency)}
                </span>
              )}
            </>
          ) : (
            <span className="text-lg font-semibold italic text-muted">Narxi so'rov orqali</span>
          )}
        </div>

        {Number(product.sold_this_week) > 0 && (
          <div className="mt-3 rounded-xl bg-accent/10 px-3 py-2.5 text-sm">
            <p className="font-medium text-accent">🔥 {product.sold_this_week} человек купили на этой неделе</p>
          </div>
        )}

        {!hasVariants && !available && (
          <div className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {t('outOfStock', lang)}
          </div>
        )}

        {product.description && (() => {
          const LIMIT = 150
          const isLong = product.description.length > LIMIT
          return (
            <div className="mt-4">
              <h2 className="mb-1 text-sm font-semibold text-muted">{t('description', lang)}</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary, rgba(255,255,255,0.8))' }}>
                {isLong && !descExpanded
                  ? product.description.slice(0, LIMIT) + '…'
                  : product.description}
              </p>
              {isLong && (
                <button
                  onClick={() => setDescExpanded((v) => !v)}
                  className="mt-1 text-xs font-medium text-accent"
                >
                  {descExpanded ? 'Свернуть' : 'Показать полностью'}
                </button>
              )}
            </div>
          )
        })()}

        {/* Variants with prices */}
        {hasVariants && (
          <div className="mt-4">
            <h2 className="mb-2 text-sm font-semibold text-muted">Вариант</h2>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => {
                const outOfStock = v.in_stock === false
                return (
                  <button
                    key={v.label}
                    onClick={() => !outOfStock && setSelectedVariant(v)}
                    disabled={outOfStock}
                    className={`h-10 min-w-10 rounded-xl px-3 text-sm font-medium transition-colors ${
                      outOfStock
                        ? 'cursor-not-allowed bg-surface line-through opacity-50'
                        : selectedVariant?.label === v.label
                          ? 'bg-accent'
                          : 'bg-surface'
                    }`}
                    style={{ color: outOfStock ? 'var(--muted)' : selectedVariant?.label === v.label ? 'var(--bg)' : 'var(--text, #ffffff)' }}
                  >
                    {v.label}
                  </button>
                )
              })}
            </div>
            {selectedVariant?.in_stock === false && (
              <div className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {t('outOfStock', lang)}
              </div>
            )}
          </div>
        )}

        {!hasVariants && unitType === 'size' && product.sizes?.length > 0 && (
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
                        ? 'cursor-not-allowed bg-surface line-through opacity-50'
                        : size === s
                          ? 'bg-accent'
                          : 'bg-surface'
                    }`}
                    style={{ color: !sizeAvailable ? 'var(--muted)' : size === s ? 'var(--bg)' : 'var(--text, #ffffff)' }}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {!hasVariants && unitType === 'weight' && (
          <div className="mt-4">
            <h2 className="mb-2 text-sm font-semibold text-muted">{t('packaging', lang)}</h2>
            <div className="flex flex-wrap gap-2">
              {(product.sizes?.length ? product.sizes : FALLBACK_WEIGHT).map((w) => (
                <button
                  key={w}
                  onClick={() => setSize(w)}
                  className={`h-10 min-w-10 rounded-xl px-3 text-sm font-medium transition-colors ${
                    size === w ? 'bg-accent' : 'bg-surface'
                  }`}
                  style={{ color: size === w ? 'var(--bg)' : 'var(--text, #ffffff)' }}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        )}

        {!hasVariants && unitType === 'volume' && (
          <div className="mt-4">
            <h2 className="mb-2 text-sm font-semibold text-muted">{t('volume', lang)}</h2>
            <div className="flex flex-wrap gap-2">
              {(product.sizes?.length ? product.sizes : FALLBACK_VOLUME).map((v) => (
                <button
                  key={v}
                  onClick={() => setSize(v)}
                  className={`h-10 min-w-10 rounded-xl px-3 text-sm font-medium transition-colors ${
                    size === v ? 'bg-accent' : 'bg-surface'
                  }`}
                  style={{ color: size === v ? 'var(--bg)' : 'var(--text, #ffffff)' }}
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
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-lg font-bold"
                style={{ color: 'var(--text, #ffffff)' }}
              >
                −
              </button>
              <span className="min-w-8 text-center text-sm font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-lg font-bold"
                style={{ color: 'var(--text, #ffffff)' }}
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
                    color === c ? 'bg-accent' : 'bg-surface'
                  }`}
                  style={{ color: color === c ? 'var(--bg)' : 'var(--text, #ffffff)' }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-16 mt-6 border-t border-white/5 bg-bg/95 px-4 py-3 backdrop-blur">
        {hasPrice ? (
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (!canAddToCart) return
                handleAddToCart()
                navigate('/checkout')
              }}
              disabled={!canAddToCart}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-accent py-3.5 text-sm font-bold text-bg shadow-glow transition-transform active:scale-[0.98] disabled:bg-surface disabled:text-muted disabled:shadow-none"
            >
              {canAddToCart ? t('buyNow', lang) : t('outOfStock', lang)}
            </button>
            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-surface transition-transform active:scale-[0.98] disabled:opacity-40"
              title={t('addToCart', lang)}
            >
              {added ? (
                <CheckIcon className="h-6 w-6 text-accent" />
              ) : (
                <BagIcon className="h-6 w-6 text-accent" />
              )}
            </button>
          </div>
        ) : (
          <a
            href={shop?.bot_username ? `https://t.me/${shop.bot_username}` : 'https://t.me/finexia_uz'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-3.5 text-sm font-bold text-bg shadow-glow"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            Sotuvchi bilan bog'lanish
          </a>
        )}
      </div>
    </div>
  )
}
