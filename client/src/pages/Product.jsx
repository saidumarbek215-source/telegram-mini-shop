import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { formatPrice } from '../utils/format.js'
import { useCart } from '../context/CartContext.jsx'
import { ChevronLeftIcon, CheckIcon } from '../components/Icons.jsx'
import { hapticFeedback } from '../telegram.js'

export default function Product() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [size, setSize] = useState(null)
  const [color, setColor] = useState(null)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    setLoading(true)
    setAdded(false)
    api
      .getProduct(id)
      .then((p) => {
        setProduct(p)
        setSize(p.sizes?.[0] || null)
        setColor(p.colors?.[0] || null)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="py-20 text-center text-sm text-muted">Загрузка...</div>
  if (!product) return <div className="py-20 text-center text-sm text-muted">Товар не найден</div>

  const hasDiscount = product.old_price && Number(product.old_price) > Number(product.price)
  const discountPct = hasDiscount
    ? Math.round((1 - Number(product.price) / Number(product.old_price)) * 100)
    : 0

  function handleAddToCart() {
    addItem(product, { size, color, quantity: 1 })
    hapticFeedback('medium')
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div>
      <div className="relative aspect-square w-full bg-surface">
        <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
        <button
          onClick={() => navigate(-1)}
          className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-bg/60 backdrop-blur"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        {hasDiscount && (
          <span className="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-bg">
            -{discountPct}%
          </span>
        )}
      </div>

      <div className="px-4 pt-4">
        <h1 className="text-xl font-bold leading-tight">{product.name}</h1>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-xl font-bold text-accent">{formatPrice(product.price)}</span>
          {hasDiscount && (
            <span className="text-sm text-muted line-through">
              {formatPrice(product.old_price)}
            </span>
          )}
        </div>

        {!product.in_stock && (
          <div className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">
            Нет в наличии
          </div>
        )}

        {product.description && (
          <div className="mt-4">
            <h2 className="mb-1 text-sm font-semibold text-muted">Описание</h2>
            <p className="text-sm leading-relaxed text-white/80">{product.description}</p>
          </div>
        )}

        {product.sizes?.length > 0 && (
          <div className="mt-4">
            <h2 className="mb-2 text-sm font-semibold text-muted">Размер</h2>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`h-10 min-w-10 rounded-xl px-3 text-sm font-medium transition-colors ${
                    size === s ? 'bg-accent text-bg' : 'bg-surface text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {product.colors?.length > 0 && (
          <div className="mt-4">
            <h2 className="mb-2 text-sm font-semibold text-muted">Цвет</h2>
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
          disabled={!product.in_stock}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-3.5 text-sm font-bold text-bg shadow-glow transition-transform active:scale-[0.98] disabled:bg-surface disabled:text-muted disabled:shadow-none"
        >
          {added ? (
            <>
              <CheckIcon className="h-5 w-5" /> Добавлено
            </>
          ) : product.in_stock ? (
            'В корзину'
          ) : (
            'Нет в наличии'
          )}
        </button>
      </div>
    </div>
  )
}
