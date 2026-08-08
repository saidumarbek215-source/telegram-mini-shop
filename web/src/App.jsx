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

// Positions around the logo for product photos
const POSITIONS = [
  { top: '8%',  left: '50%',  tx: '-50%', anim: 'fromTop'    },
  { top: '20%', left: '8%',   tx: '0',    anim: 'fromLeft'   },
  { top: '20%', right: '8%',  tx: '0',    anim: 'fromRight'  },
  { top: '50%', left: '5%',   tx: '0',    anim: 'fromLeft'   },
  { top: '50%', right: '5%',  tx: '0',    anim: 'fromRight'  },
  { bottom: '20%', left: '8%', tx: '0',   anim: 'fromLeft'   },
  { bottom: '20%', right: '8%', tx: '0',  anim: 'fromRight'  },
  { bottom: '6%', left: '50%', tx: '-50%', anim: 'fromBottom' },
]

function Splash({ visible, products }) {
  const logoUrl = SITE_CONFIG.splash.logoUrl
  // Pick up to 8 products with images
  const imgs = products
    .filter(p => p.image_url || p.images?.[0])
    .slice(0, 8)
    .map(p => p.image_url || p.images?.[0])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'opacity 0.8s ease, visibility 0.8s ease',
      opacity: visible ? 1 : 0,
      visibility: visible ? 'visible' : 'hidden',
      pointerEvents: visible ? 'all' : 'none',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes splashLogoIn {
          0%   { transform: scale(0.4); opacity: 0; }
          70%  { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fromTop    { from { transform: translateY(-80px) scale(0.7); opacity:0; } to { transform: translateY(0) scale(1); opacity:1; } }
        @keyframes fromBottom { from { transform: translateY(80px)  scale(0.7); opacity:0; } to { transform: translateY(0) scale(1); opacity:1; } }
        @keyframes fromLeft   { from { transform: translateX(-80px) scale(0.7); opacity:0; } to { transform: translateX(0) scale(1); opacity:1; } }
        @keyframes fromRight  { from { transform: translateX(80px)  scale(0.7); opacity:0; } to { transform: translateX(0) scale(1); opacity:1; } }
        @keyframes logoFloat  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes logoGlow   { 0%,100%{box-shadow:0 0 0 0 rgba(255,224,0,0.3)} 50%{box-shadow:0 0 0 20px rgba(255,224,0,0)} }
        @keyframes ringPulse  { 0%,100%{transform:scale(0.9);opacity:0.5} 50%{transform:scale(1.1);opacity:0.15} }
        @keyframes shimmer    { 0%{transform:translateX(-200%)} 100%{transform:translateX(400%)} }
        @keyframes imgFloat   { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-6px)} }
      `}</style>

      {/* Pulsing rings */}
      {[200, 290, 390].map((size, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: size, height: size, borderRadius: '50%',
          border: `1px solid rgba(255,224,0,${0.2 - i * 0.05})`,
          animation: `ringPulse ${2.5 + i * 0.5}s ease-in-out ${i * 0.3}s infinite`,
        }} />
      ))}

      {/* Product photos around logo */}
      {imgs.map((src, i) => {
        const pos = POSITIONS[i % POSITIONS.length]
        return (
          <div key={i} style={{
            position: 'absolute',
            top: pos.top, bottom: pos.bottom,
            left: pos.left, right: pos.right,
            transform: pos.tx ? `translateX(${pos.tx})` : undefined,
            animation: `${pos.anim} 0.6s cubic-bezier(.2,.8,.4,1) ${0.3 + i * 0.12}s both, imgFloat ${3 + i * 0.3}s ease-in-out ${1 + i * 0.2}s infinite`,
            opacity: 0,
            zIndex: 1,
          }}>
            <div style={{
              width: 80, height: 80,
              borderRadius: 16,
              background: '#1a1a1a',
              border: '1px solid rgba(255,224,0,0.25)',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}>
              <img src={src} alt="" style={{
                width: '100%', height: '100%',
                objectFit: 'contain', padding: 6,
              }} />
            </div>
          </div>
        )
      })}

      {/* Center logo */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        animation: 'splashLogoIn 0.9s cubic-bezier(.2,.8,.4,1) 0.1s both',
        opacity: 0, position: 'relative', zIndex: 2,
      }}>
        <div style={{
          padding: 3, borderRadius: 20,
          background: 'linear-gradient(135deg, #FFE000, #b8860b)',
          animation: 'logoGlow 3s ease-in-out 1s infinite',
        }}>
          <div style={{ background: '#111', borderRadius: 18, padding: '14px 18px' }}>
            {logoUrl
              ? <img src={logoUrl} alt="Boston" style={{ width: 180, height: 'auto', maxHeight: 110, objectFit: 'contain', display: 'block', animation: 'logoFloat 4s ease-in-out infinite' }} />
              : <p style={{ color: '#FFE000', fontSize: 36, fontWeight: 900, margin: 0 }}>BO'STON</p>
            }
          </div>
        </div>

        {/* Shimmer line */}
        <div style={{ position: 'relative', overflow: 'hidden', height: 2, width: 140, background: 'rgba(255,224,0,0.15)', borderRadius: 2 }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, height: '100%', width: '35%',
            background: 'linear-gradient(90deg, transparent, #FFE000, transparent)',
            animation: 'shimmer 1.8s ease-in-out infinite',
          }} />
        </div>

        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', margin: 0 }}>
          Telefon Bozor
        </p>
      </div>
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
  const [products, setProducts] = useState([])
  const [splashVisible, setSplashVisible] = useState(true)

  useEffect(() => {
    api.getSettings().then(setShop).catch(console.error)
    api.getProducts().then(setProducts).catch(console.error)
    const timer = setTimeout(() => setSplashVisible(false), SITE_CONFIG.splash.duration || 4000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (shop?.store_name) document.title = shop.store_name
  }, [shop])

  return (
    <CartProvider>
      <Splash visible={splashVisible} products={products} />
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
