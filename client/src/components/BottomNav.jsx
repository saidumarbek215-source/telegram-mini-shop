import { NavLink } from 'react-router-dom'
import { HomeIcon, GridIcon, BagIcon, UserIcon, SlidersIcon, HelpIcon } from './Icons.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useOwner } from '../context/OwnerContext.jsx'
import { useShop } from '../context/ShopContext.jsx'
import { t } from '../i18n.js'

export default function BottomNav() {
  const { count } = useCart()
  const { isOwner } = useOwner()
  const { lang } = useShop()

  const items = [
    { to: '/', label: t('home', lang), icon: HomeIcon, end: true },
    { to: '/catalog', label: t('catalog', lang), icon: GridIcon },
    { to: '/cart', label: t('cart', lang), icon: BagIcon, badge: true },
    { to: '/profile', label: t('profile', lang), icon: UserIcon },
    { to: '/faq', label: t('help', lang), icon: HelpIcon },
  ]

  const navItems = isOwner
    ? [...items, { to: '/manage', label: t('manage', lang), icon: SlidersIcon }]
    : items

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/5 bg-surface/90 backdrop-blur-lg">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {navItems.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] transition-colors ${
                isActive ? 'text-accent' : 'text-muted'
              }`
            }
          >
            <span className="relative">
              <Icon className="h-6 w-6" />
              {badge && count > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-bg">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </span>
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
