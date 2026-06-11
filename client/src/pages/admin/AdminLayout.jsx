import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { adminApi } from '../../api.js'
import Footer from '../../components/Footer.jsx'
import { LogOutIcon, BagIcon, TagIcon, ImageIcon, SettingsIcon, BoxIcon } from '../../components/Icons.jsx'

const tabs = [
  { to: '/admin/orders', label: 'Заказы', icon: BoxIcon },
  { to: '/admin/products', label: 'Товары', icon: BagIcon },
  { to: '/admin/categories', label: 'Категории', icon: TagIcon },
  { to: '/admin/banners', label: 'Баннеры', icon: ImageIcon },
  { to: '/admin/settings', label: 'Настройки', icon: SettingsIcon },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      navigate('/admin/login', { replace: true })
      return
    }
    adminApi
      .getSettings()
      .then(() => setChecking(false))
      .catch(() => {
        localStorage.removeItem('admin_token')
        navigate('/admin/login', { replace: true })
      })
  }, [navigate])

  function handleLogout() {
    localStorage.removeItem('admin_token')
    navigate('/admin/login', { replace: true })
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-sm text-muted">
        Загрузка...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg text-white">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between px-4 py-4">
          <h1 className="text-base font-bold sm:text-lg">Админ-панель · Sneaker Store</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-xl bg-surface px-3 py-2 text-xs font-medium text-muted"
          >
            <LogOutIcon className="h-4 w-4" /> Выход
          </button>
        </header>

        <nav className="flex gap-2 overflow-x-auto px-4 pb-2 no-scrollbar">
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

        <main className="px-4 py-4">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  )
}
