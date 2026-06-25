import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { formatPrice } from '../utils/format.js'
import { MinusIcon, PlusIcon, TrashIcon, BagIcon } from '../components/Icons.jsx'
import { useShop } from '../context/ShopContext.jsx'

export default function Cart() {
  const navigate = useNavigate()
  const { items, updateQuantity, removeItem, total } = useCart()
  const { shop } = useShop()
  const currency = shop?.currency || 'сум'

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface">
          <BagIcon className="h-7 w-7 text-muted" />
        </div>
        <h2 className="text-base font-semibold">Корзина пуста</h2>
        <p className="mt-1 text-sm text-muted">Добавьте товары из каталога</p>
        <Link
          to="/catalog"
          className="mt-5 rounded-2xl bg-accent px-6 py-3 text-sm font-bold text-bg"
        >
          Перейти в каталог
        </Link>
      </div>
    )
  }

  return (
    <div>
      <header className="px-4 pb-2 pt-5">
        <h1 className="text-lg font-bold">Корзина</h1>
      </header>

      <div className="flex flex-col gap-3 px-4 pb-28">
        {items.map((item) => {
          const key = `${item.product_id}_${item.size}_${item.color}`
          return (
            <div key={key} className="flex gap-3 rounded-2xl bg-surface p-3">
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-surface2">
                <img
                  src={item.image_url}
                  alt={item.product_name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-medium leading-tight">{item.product_name}</h3>
                  <button
                    onClick={() => removeItem(item.product_id, item.size, item.color)}
                    className="flex-shrink-0 text-muted"
                    aria-label="Удалить"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
                {(item.size || item.color) && (
                  <p className="mt-0.5 text-xs text-muted">
                    {[item.size && `Размер: ${item.size}`, item.color].filter(Boolean).join(' · ')}
                  </p>
                )}
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="text-sm font-bold text-accent">
                    {formatPrice(item.price * item.quantity, currency)}
                  </span>
                  <div className="flex items-center gap-1 rounded-full bg-surface2 p-1">
                    <button
                      onClick={() =>
                        updateQuantity(item.product_id, item.size, item.color, item.quantity - 1)
                      }
                      className="flex h-6 w-6 items-center justify-center rounded-full text-white"
                      aria-label="Уменьшить количество"
                    >
                      <MinusIcon className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-5 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() =>
                        updateQuantity(item.product_id, item.size, item.color, item.quantity + 1)
                      }
                      className="flex h-6 w-6 items-center justify-center rounded-full text-white"
                      aria-label="Увеличить количество"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={() => navigate('/checkout')}
        className="fixed left-0 right-0 mx-4 rounded-2xl bg-accent py-3.5 text-sm font-bold text-bg shadow-glow transition-transform active:scale-[0.98]"
        style={{ bottom: '70px' }}
      >
        Оформить заказ · {formatPrice(total, currency)}
      </button>
    </div>
  )
}
