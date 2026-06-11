import { Link } from 'react-router-dom'
import { formatPrice } from '../utils/format.js'
import { isProductAvailable } from '../utils/stock.js'

export default function ProductCard({ product }) {
  const hasDiscount = product.old_price && Number(product.old_price) > Number(product.price)
  const discountPct = hasDiscount
    ? Math.round((1 - Number(product.price) / Number(product.old_price)) * 100)
    : 0
  const available = isProductAvailable(product)

  return (
    <Link
      to={`/product/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-surface"
    >
      <div className="relative aspect-square overflow-hidden bg-surface2">
        <img
          src={product.image_url}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-active:scale-95"
          loading="lazy"
        />
        {hasDiscount && (
          <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-bg">
            -{discountPct}%
          </span>
        )}
        {!available && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg/60">
            <span className="rounded-full bg-bg/80 px-3 py-1 text-[11px] text-muted">
              Нет в наличии
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-tight text-white">
          {product.name}
        </h3>
        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-sm font-bold text-accent">{formatPrice(product.price)}</span>
          {hasDiscount && (
            <span className="text-xs text-muted line-through">
              {formatPrice(product.old_price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
