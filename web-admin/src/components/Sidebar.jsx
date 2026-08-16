import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const NAV = [
  { to: '/',           label: 'Dashboard',    icon: '📊', end: true },
  { to: '/orders',     label: 'Buyurtmalar',  icon: '🛒' },
  { to: '/products',   label: 'Mahsulotlar',  icon: '📦' },
  { to: '/categories', label: 'Kategoriyalar',icon: '🗂️' },
  { to: '/banners',    label: 'Bannerlar',    icon: '🖼️' },
  { to: '/customers',  label: 'Mijozlar',     icon: '👥' },
  { to: '/analytics',  label: 'Tahlil',       icon: '📈' },
  { to: '/credits',    label: 'Nasiyalar',    icon: '💳' },
  { to: '/map',        label: 'Xarita',       icon: '🗺️' },
  { to: '/ai',         label: 'AI Assistant', icon: '🤖' },
  { to: '/settings',   label: 'Sozlamalar',   icon: '⚙️' },
  { to: '/help',       label: 'Yordam',       icon: '❓' },
]

export default function Sidebar({ onClose }) {
  const { signOut, shopId } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    signOut()
    navigate('/login')
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-700">
        <div className="w-9 h-9 bg-yellow-400 rounded-lg flex items-center justify-center text-black font-black text-sm">
          F
        </div>
        <div>
          <p className="font-bold text-sm leading-tight">Finexia Admin</p>
          <p className="text-xs text-gray-400">Shop #{shopId}</p>
        </div>
        <button onClick={onClose} className="ml-auto lg:hidden p-1 hover:bg-gray-700 rounded">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, icon, end }) => (
          <NavLink
            key={to} to={to} end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-yellow-400 text-black'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <span className="text-lg w-6 text-center">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-700">
        <a
          href={`https://web-shop-demo.pages.dev`}
          target="_blank" rel="noreferrer"
          className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors mb-1"
        >
          <span>🌐</span> Saytni ko'rish
        </a>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <span>🚪</span> Chiqish
        </button>
      </div>
    </div>
  )
}
