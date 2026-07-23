import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { CartProvider } from './context/CartContext.jsx'
import { api } from './api.js'
import { SITE_CONFIG } from './config.js'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import BottomNav from './components/BottomNav.jsx'
import Home from './pages/Home.jsx'
import Catalog from './pages/Catalog.jsx'
import Product from './pages/Product.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import Success from './pages/Success.jsx'

function Splash({ shop, visible }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#1a1a2e',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '16px',
        transition: 'opacity 0.5s ease, visibility 0.5s ease',
        opacity: visible ? 1 : 0,
        visibility: visible ? 'visible' : 'hidden',
        pointerEvents: visible ? 'all' : 'none',
      }}
    >
      {SITE_CONFIG.splash.logoUrl ? (
        <img
          src={SITE_CONFIG.splash.logoUrl}
          alt={shop?.store_name}
          style={{ width: 240, height: 'auto', objectFit: 'contain', maxHeight: 120 }}
        />
      ) : shop?.logo_url ? (
        <img
          src={shop.logo_url}
          alt={shop.store_name}
          style={{ width: 240, height: 'auto', objectFit: 'contain', maxHeight: 120 }}
        />
      ) : (
        <>
          <p style={{ color: '#FFE000', fontSize: 36, fontWeight: 900, letterSpacing: 1, lineHeight: 1 }}>
            {shop?.store_name || "BO'STON"}
          </p>
          <p style={{ color: '#CC0000', fontSize: 16, fontWeight: 700, letterSpacing: 2, marginTop: -4 }}>
            TELEFON BOZOR
          </p>
        </>
      )}
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#FFE000',
            animation: `bounce 1.2s ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function Layout({ shop, children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header shop={shop} />
      <main className="flex-1 pb-16 sm:pb-0">
        {children}
      </main>
      <Footer shop={shop} />
      <BottomNav />
    </div>
  )
}

export default function App() {
  const [shop, setShop] = useState(null)
  const [splashVisible, setSplashVisible] = useState(true)

  useEffect(() => {
    api.getSettings().then(setShop).catch(console.error)
    // Скрываем сплэш через 3 секунды
    const timer = setTimeout(() => setSplashVisible(false), SITE_CONFIG.splash.duration)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (shop?.store_name) document.title = shop.store_name
  }, [shop])

  return (
    <CartProvider>
      <Splash shop={shop} visible={splashVisible} />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout shop={shop}><Home /></Layout>} />
          <Route path="/catalog" element={<Layout shop={shop}><Catalog /></Layout>} />
          <Route path="/product/:id" element={<Layout shop={shop}><Product /></Layout>} />
          <Route path="/cart" element={<Layout shop={shop}><Cart /></Layout>} />
          <Route path="/checkout" element={<Layout shop={shop}><Checkout /></Layout>} />
          <Route path="/success" element={<Layout shop={shop}><Success /></Layout>} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  )
}
