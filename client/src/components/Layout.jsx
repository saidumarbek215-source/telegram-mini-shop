import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import BottomNav from './BottomNav.jsx'
import Footer from './Footer.jsx'
import { initTelegramApp, getTelegramWebApp } from '../telegram.js'
import { useShop } from '../context/ShopContext.jsx'

const HIDE_NAV = [/^\/product\//, /^\/checkout/]

export default function Layout() {
  const location = useLocation()
  const { shop } = useShop()
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
      <div className={`flex-1 ${showNav ? 'pb-20' : 'pb-4'}`}>
        <Outlet context={{ setHideContact }} />
        <Footer />
      </div>
      {showNav && <BottomNav />}
      {!hideContact && shop?.admin_username && (
        <button
          onClick={handleContactSeller}
          style={{ position: 'fixed', bottom: '80px', right: '16px' }}
          className="z-40 rounded-full bg-accent px-4 py-3 text-sm font-bold text-white shadow-lg"
        >
          💬 Связаться с продавцом
        </button>
      )}
    </div>
  )
}
