import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import BottomNav from './BottomNav.jsx'
import Footer from './Footer.jsx'
import { initTelegramApp } from '../telegram.js'

const HIDE_NAV = [/^\/product\//, /^\/checkout/]

export default function Layout() {
  const location = useLocation()

  useEffect(() => {
    initTelegramApp()
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  const showNav = !HIDE_NAV.some((pattern) => pattern.test(location.pathname))

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-bg text-white">
      <div className={`flex-1 ${showNav ? 'pb-20' : 'pb-4'}`}>
        <Outlet />
        <Footer />
      </div>
      {showNav && <BottomNav />}
    </div>
  )
}
