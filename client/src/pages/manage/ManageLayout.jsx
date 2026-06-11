import { useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useOwner } from '../../context/OwnerContext.jsx'
import { BagIcon, TagIcon, ImageIcon, SettingsIcon, BoxIcon, SparkleIcon } from '../../components/Icons.jsx'

const tabs = [
  { to: '/manage/orders', label: 'Заказы', icon: BoxIcon },
  { to: '/manage/products', label: 'Товары', icon: BagIcon },
  { to: '/manage/categories', label: 'Категории', icon: TagIcon },
  { to: '/manage/banners', label: 'Баннеры', icon: ImageIcon },
  { to: '/manage/settings', label: 'Реквизиты', icon: SettingsIcon },
  { to: '/manage/ai', label: 'AI Ассистент', icon: SparkleIcon },
]

export default function ManageLayout() {
  const { isOwner, loading, shop } = useOwner()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !isOwner) {
      navigate('/', { replace: true })
    }
  }, [loading, isOwner, navigate])

  if (loading || !isOwner) {
    return <div className="py-10 text-center text-sm text-muted">Загрузка...</div>
  }

  return (
    <div>
      <header className="px-4 pb-3 pt-5">
        <h1 className="text-lg font-bold">
          Управление магазином{shop?.name ? ` «${shop.name}»` : ''}
        </h1>
      </header>

      <nav className="flex gap-2 overflow-x-auto px-4 pb-3 no-scrollbar">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-accent text-bg' : 'bg-surface text-muted'
              }`
            }
          >
            <Icon className="h-4 w-4" /> {label}
          </NavLink>
        ))}
      </nav>

      <main className="px-4">
        <Outlet />
      </main>
    </div>
  )
}
