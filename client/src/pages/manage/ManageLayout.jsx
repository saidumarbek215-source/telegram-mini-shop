import { useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useOwner } from '../../context/OwnerContext.jsx'
import { useShop } from '../../context/ShopContext.jsx'
import { t } from '../../i18n.js'
import { BagIcon, TagIcon, ImageIcon, SettingsIcon, BoxIcon, SparkleIcon, HelpIcon } from '../../components/Icons.jsx'

export default function ManageLayout() {
  const { isOwner, loading, shop, debugError } = useOwner()
  const { shop: publicShop, lang } = useShop()
  const navigate = useNavigate()

  const isTelegram = !!window.Telegram?.WebApp?.initData
  const webToken = localStorage.getItem('web_admin_token')

  useEffect(() => {
    if (!isTelegram && !webToken) {
      navigate('/admin-login', { replace: true })
      return
    }
    if (isTelegram && !loading && !isOwner) {
      navigate('/', { replace: true })
    }
  }, [loading, isOwner, navigate, isTelegram, webToken])

  if (!isTelegram && !webToken) return null

  if (isTelegram && debugError) {
    return (
      <div className="py-10 px-4 text-center">
        <p style={{ color: 'red', fontSize: '18px', fontWeight: 'bold' }}>DEBUG ERROR</p>
        <p style={{ color: 'red', fontSize: '14px', marginTop: '8px', wordBreak: 'break-all' }}>{debugError}</p>
      </div>
    )
  }

  if (isTelegram && (loading || !isOwner)) {
    return <div className="py-10 text-center text-sm text-muted">{t('loading', lang)}</div>
  }

  const baseTabs = [
    { to: '/manage/orders', label: t('manageOrders', lang), icon: BoxIcon },
    { to: '/manage/products', label: t('manageProducts', lang), icon: BagIcon },
    { to: '/manage/categories', label: t('manageCategories', lang), icon: TagIcon },
    { to: '/manage/banners', label: t('manageBanners', lang), icon: ImageIcon },
    { to: '/manage/settings', label: t('manageRequisites', lang), icon: SettingsIcon },
    { to: '/manage/ai', label: t('manageAI', lang), icon: SparkleIcon },
    { to: '/manage/help', label: t('help', lang), icon: HelpIcon },
  ]

  const tabs = [...baseTabs]
  if (publicShop?.credit_enabled) {
    tabs.splice(1, 0, { to: '/manage/credits', label: '💰 Долги', icon: null })
  }
  if (shop?.features?.partners_map) {
    tabs.push({ to: '/manage/map', label: '🗺 Карта', icon: null })
  }
  return (
    <div>
      <header className="px-4 pb-3 pt-5">
        <h1 className="text-lg font-bold">
          {t('storeManagement', lang)}{(shop?.name || publicShop?.store_name) ? ` «${shop?.name || publicShop?.store_name}»` : ''}
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
            {Icon && <Icon className="h-4 w-4" />} {label}
          </NavLink>
        ))}
      </nav>

      <main className="px-4">
        <Outlet />
      </main>
    </div>
  )
}
