import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../utils/format.js'
import { isProductAvailable } from '../utils/stock.js'
import { useShop } from '../context/ShopContext.jsx'
import { t } from '../i18n.js'

export default function ProductCard({ product }) {
  const { shop, lang } = useShop()
  const currency = shop?.currency || 'сум'
  const [imgError, setImgError] = useState(false)
  const hasDiscount = product.old_price && Number(product.old_price) > Number(product.price)
  const discountPct = hasDiscount
    ? Math.round((1 - Number(product.price) / Number(product.old_price)) * 100)
    : 0
  const available = isProductAvailable(product)

  return (
    <Link
      to={`/product/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-surface shadow-sm"
    >
      <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: '1/1', backgroundColor: 'var(--surface2, #1A2236)' }}>
        {imgError || (!product.image_url && !product.image) ? (
          <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: 'var(--surface2, #1A2236)' }}>
            <span className="text-3xl text-muted/30">🖼</span>
          </div>
        ) : (
          <img
            src={product.image_url || product.image}
            alt={product.name}
            crossOrigin="anonymous"
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              backgroundColor: 'var(--surface2, #1A2236)',
            }}
            className="transition-transform duration-300 group-active:scale-95"
            onError={() => setImgError(true)}
          />
        )}
        {hasDiscount && (
          <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-bg">
            -{discountPct}%
          </span>
        )}
        {!available && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg/60">
            <span className="rounded-full bg-bg/80 px-3 py-1 text-[11px] text-muted">
              {t('outOfStock', lang)}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-tight" style={{ color: 'var(--text, #ffffff)' }}>
          {product.name}
        </h3>
        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-sm font-bold text-accent">{formatPrice(product.price, currency)}</span>
          {hasDiscount && (
            <span className="text-xs text-muted line-through">
              {formatPrice(product.old_price, currency)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
