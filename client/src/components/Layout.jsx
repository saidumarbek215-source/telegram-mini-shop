import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import BottomNav from './BottomNav.jsx'
import Footer from './Footer.jsx'
import { initTelegramApp, getTelegramWebApp } from '../telegram.js'
import { useShop } from '../context/ShopContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { t } from '../i18n.js'

const isTelegram = !!window.Telegram?.WebApp?.initData

const HIDE_NAV = [/^\/checkout/]

export default function Layout() {
  const location = useLocation()
  const { shop, lang } = useShop()
  const { count: cartCount } = useCart()
  const [hideContact, setHideContact] = useState(false)

  useEffect(() => {
    initTelegramApp()
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
    setHideContact(false)
  }, [location.pathname])

  const showNav = !HIDE_NAV.some((pattern) => pattern.test(location.pathname))

  function handleContactSeller() {
    if (!shop?.admin_username) return
    const url = `https://t.me/${shop.admin_username}`
    const tg = getTelegramWebApp()
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(url)
    } else {
      window.open(url, '_blank')
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-bg text-white">
      {!isTelegram && (
        <header style={{
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <span style={{ fontWeight: 'bold', fontSize: 18 }}>{shop?.store_name}</span>
          <span>🛒 {cartCount}</span>
        </header>
      )}
      <div className={`flex-1 ${showNav ? 'pb-20' : 'pb-4'}`}>
        <Outlet context={{ setHideContact }} />
        <Footer />
      </div>
      {showNav && <BottomNav />}
      {!hideContact && shop?.admin_username && (
        <div className="group" style={{ position: 'fixed', bottom: '90px', right: '16px', zIndex: 40 }}>
          <button
            onClick={handleContactSeller}
            aria-label={t('contactSeller', lang)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-2xl shadow-lg transition-transform active:scale-95"
          >
            💬
          </button>
          <span className="pointer-events-none absolute right-full top-1/2 mr-2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-surface px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            {t('contactSeller', lang)}
          </span>
        </div>
      )}
    </div>
  )
}
