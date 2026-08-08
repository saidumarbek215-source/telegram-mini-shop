import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import ProductCard from '../components/ProductCard.jsx'
import { ProductSkeleton } from '../components/Skeleton.jsx'
import { formatPrice } from '../utils/format.js'
import { useCart } from '../context/CartContext.jsx'
import BannerSlider from '../components/BannerSlider.jsx'
// Emoji icons for categories without images
const CAT_ICON_MAP = [
  { keys: ['iphone', 'apple'], icon: '🍎' },
  { keys: ['чехол', 'чахол', 'pitaka', 'case'], icon: '📱' },
  { keys: ['наушник', 'quloqchin', 'airpod', 'headphone'], icon: '🎧' },
  { keys: ['smartfon', 'telefon', 'phone'], icon: '📱' },
  { keys: ['noutbuk', 'laptop', 'computer'], icon: '💻' },
  { keys: ['planshet', 'tablet', 'ipad'], icon: '📟' },
  { keys: ['zaryadlovchi', 'зарядка', 'cable', 'kabel'], icon: '⚡' },
  { keys: ['soat', 'watch'], icon: '⌚' },
  { keys: ['kamera', 'camera'], icon: '📷' },
  { keys: ['oyinchilik', 'game', 'gaming'], icon: '🎮' },
  { keys: ['aksessuar', 'аксесуар'], icon: '🔌' },
  { keys: ['samsung', 'galaxy'], icon: '📲' },
  { keys: ['колонка', 'speaker', 'audio'], icon: '🔊' },
]
function getCatIcon(name) {
  const lower = name.toLowerCase()
  for (const { keys, icon } of CAT_ICON_MAP) {
    if (keys.some(k => lower.includes(k))) return icon
  }
  return null
}

function DealOfDay({ product }) {
  const { addItem } = useCart()
  const [secs, setSecs] = useState(86400)
  useEffect(() => {
    const t = setInterval(() => setSecs(s => s > 0 ? s - 1 : 86400), 1000)
    return () => clearInterval(t)
  }, [])
  const h = String(Math.floor(secs / 3600)).padStart(2, '0')
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')

  if (!product) return null
  const img = product.image_url || product.images?.[0]
  const discount = product.old_price
    ? Math.round((1 - product.price / product.old_price) * 100) : 0

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="bg-primary px-4 py-2.5 flex items-center justify-between">
        <span className="text-accent font-bold text-sm tracking-wide">⚡ Kun taklifi</span>
        <div className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2"/>
          </svg>
          {h}:{m}:{s}
        </div>
      </div>
      <div className="p-3 flex flex-col flex-1">
        <div className="bg-gray-50 rounded-xl aspect-square flex items-center justify-center overflow-hidden mb-3 border border-gray-100">
          {img
            ? <img src={img} alt={product.name} className="w-full h-full object-contain" />
            : <span className="text-5xl">📱</span>
          }
        </div>
        <p className="text-sm text-gray-800 font-semibold line-clamp-2 mb-2 leading-snug">{product.name}</p>
        {discount > 0 && (
          <div className="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded mb-2 w-fit border border-red-200">
            -{discount}% chegirma
          </div>
        )}
        {product.old_price && (
          <p className="text-gray-400 line-through text-xs mb-0.5">{formatPrice(product.old_price)}</p>
        )}
        <p className="text-accent font-black text-xl mb-3">{formatPrice(product.price)}</p>
        <button
          onClick={() => addItem(product)}
          className="mt-auto w-full bg-accent hover:bg-accent-hover text-black font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Savatga
        </button>
      </div>
    </div>
  )
}


function StoreCard({ shop, newProducts }) {
  const newest = (newProducts || []).slice(0, 3)
  return (
    <div style={{
      background: 'linear-gradient(160deg, #0d0d0d 0%, #181818 100%)',
      borderRadius: 16, overflow: 'hidden',
      display: 'flex', flexDirection: 'column', height: '100%',
      border: '1px solid rgba(255,224,0,0.12)',
    }}>
      {/* Logo area */}
      <div style={{ padding: '20px 16px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ padding: 2, borderRadius: 12, background: 'linear-gradient(135deg, #FFE000, #b8860b)' }}>
          <div style={{ background: '#111', borderRadius: 10, padding: '8px 10px' }}>
            <img src="https://i.postimg.cc/63GkxmFs/Bez-imeni-3.jpg" alt="Boston"
              style={{ width: 80, height: 'auto', maxHeight: 50, objectFit: 'contain', display: 'block' }} />
          </div>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', margin: 0 }}>Telefon Bozor</p>
      </div>

      {/* New arrivals */}
      <div style={{ flex: 1, padding: '12px 12px 0' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, letterSpacing: 3, textTransform: 'uppercase', margin: '0 0 8px', fontWeight: 700 }}>
          Yangi keldi
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {newest.map(p => {
            const img = p.image_url || p.images?.[0]
            return (
              <Link key={p.id} to={`/product/${p.id}`} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.05)', borderRadius: 10,
                padding: 8, textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.08)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,224,0,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
              >
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#222', flexShrink: 0, overflow: 'hidden' }}>
                  {img
                    ? <img src={img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 3 }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📱</div>
                  }
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: '#fff', fontSize: 10, fontWeight: 600, margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                  <p style={{ color: '#FFE000', fontSize: 10, fontWeight: 800, margin: 0 }}>{formatPrice(p.price)}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <div style={{ padding: '0 0 14px' }} />
    </div>
  )
}


function HeroSection({ discounted, allProducts }) {
  const items = [
    ...discounted,
    ...allProducts.filter(p => !discounted.find(d => d.id === p.id))
  ].slice(0, 8)

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0d0d0d 0%, #1c1c1c 100%)',
      position: 'relative', overflow: 'hidden', height: '100%',
    }}>
      <style>{`
        @keyframes hFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes hShimmer { 0%{transform:translateX(-200%)} 100%{transform:translateX(400%)} }
        @keyframes hPulse { 0%,100%{box-shadow:0 0 0 0 rgba(255,224,0,0.35)} 50%{box-shadow:0 0 0 14px rgba(255,224,0,0)} }
        @keyframes hItemIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .hprod { transition: all 0.2s ease; text-decoration: none; display:flex; flex-direction:column; }
        .hprod:hover { transform: translateY(-2px) !important; border-color: rgba(255,224,0,0.5) !important; }

        /* MOBILE: только товары, лого скрыто */
        .hero-inner { display:flex; flex-direction:column; }
        .hero-logo-row { display:none; }
        .hero-badge { background:#cc0000; color:#fff; font-size:9px; font-weight:800; padding:2px 7px; border-radius:4px; letter-spacing:1px; }
        .hero-grid { display:grid; grid-template-columns: repeat(2,1fr); gap:8px; padding:12px; }

        /* DESKTOP: лого слева + 4 колонки */
        @media(min-width:640px){
          .hero-inner { flex-direction:row; align-items:stretch; min-height:260px; }
          .hero-logo-row {
            display:flex; flex-direction:column; justify-content:center; align-items:center;
            width:150px; flex-shrink:0; gap:12px;
            padding:24px 16px;
            border-right:1px solid rgba(255,255,255,0.07);
            animation: hFloat 4s ease-in-out infinite;
          }
          .hero-logo-img { width:100px; max-height:65px; }
          .hero-grid { flex:1; grid-template-columns:repeat(4,1fr); gap:8px; padding:16px; align-content:center; }
        }
      `}</style>

      <div className="hero-inner">
        {/* Logo row (mobile: horizontal top bar; desktop: left column) */}
        <div className="hero-logo-row">
          <div style={{
            padding: 2, borderRadius: 12,
            background: 'linear-gradient(135deg, #FFE000 0%, #b8860b 100%)',
            animation: 'hPulse 3s ease-in-out infinite', flexShrink: 0,
          }}>
            <div style={{ background: '#111', borderRadius: 10, padding: '7px 9px' }}>
              <img src="https://i.postimg.cc/63GkxmFs/Bez-imeni-3.jpg" alt="Boston" className="hero-logo-img" />
            </div>
          </div>
          <div>
            <span className="hero-badge">🔥 AKSIYA</span>
            <p style={{color:'rgba(255,255,255,0.35)',fontSize:8,letterSpacing:3,textTransform:'uppercase',margin:'4px 0 0',fontWeight:700}}>Kun takliflari</p>
          </div>
        </div>

        {/* Products grid */}
        <div className="hero-grid">
          {items.map((p, i) => {
            const img = p.image_url || p.images?.[0]
            const disc = p.old_price ? Math.round((1 - p.price / p.old_price) * 100) : 0
            return (
              <Link key={p.id} to={`/product/${p.id}`} className="hprod" style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, overflow: 'hidden',
                animation: `hItemIn 0.3s ease ${i * 0.05}s both`,
              }}>
                <div style={{ background: '#1a1a1a', aspectRatio: '1', position: 'relative', overflow: 'hidden' }}>
                  {img
                    ? <img src={img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 5 }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📱</div>
                  }
                  {disc > 0 && (
                    <div style={{ position: 'absolute', top: 3, left: 3, background: '#cc0000', color: '#fff', fontSize: 8, fontWeight: 800, padding: '1px 4px', borderRadius: 3 }}>
                      -{disc}%
                    </div>
                  )}
                </div>
                <div style={{ padding: '5px 7px' }}>
                  <p style={{ color: '#fff', fontSize: 9, fontWeight: 600, margin: '0 0 2px', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.name}</p>
                  <p style={{ color: '#FFE000', fontSize: 10, fontWeight: 800, margin: 0 }}>{formatPrice(p.price)}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [categories, setCategories] = useState([])
  const [products,   setProducts]   = useState([])
  const [banners,    setBanners]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const catRef = useRef(null)

  useEffect(() => {
    Promise.all([api.getCategories(), api.getProducts(), api.getBanners()])
      .then(([c, p, b]) => { setCategories(c); setProducts(p); setBanners(b) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const dealProduct = products.find(p => p.old_price && Number(p.old_price) > Number(p.price)) || products[0]
  const discounted  = products.filter(p => p.old_price && Number(p.old_price) > Number(p.price))

  function scrollCats(dir) {
    if (catRef.current) catRef.current.scrollBy({ left: dir * 240, behavior: 'smooth' })
  }

  return (
    <div>

      {/* Баннер — полный экран */}
      <div style={{ width: '100%' }}>
        <div style={{ width: '100%', aspectRatio: '16/7', overflow: 'hidden' }}>
          {loading
            ? <div className="skeleton w-full h-full" style={{ minHeight: 260 }} />
            : banners.length > 0
              ? <BannerSlider banners={banners} />
              : <HeroSection discounted={discounted} allProducts={products} />
          }
        </div>
      </div>



      {/* ── MAIN CONTENT ── */}
      <div className="container-web pt-5 pb-8 space-y-8">

        {/* Categories */}
        {(loading || categories.length > 0) && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900">Kategoriyalar</h2>
              <div className="flex items-center gap-1.5">
                <button onClick={() => scrollCats(-1)}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-accent hover:text-accent transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
                <button onClick={() => scrollCats(1)}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-accent hover:text-accent transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
            </div>

            <div ref={catRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide scroll-smooth">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton flex-shrink-0 w-28 h-32 rounded-xl" />
                  ))
                : categories.map((cat) => {
                    const icon = getCatIcon(cat.name)
                    return (
                      <Link key={cat.id} to={`/catalog?category=${cat.id}`}
                        className="flex-shrink-0 w-40 bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-accent transition-all group"
                      >
                        {/* Grey image area */}
                        <div className="bg-gray-100 h-32 flex items-center justify-center overflow-hidden">
                          {cat.image_url ? (
                            <img src={cat.image_url} alt={cat.name}
                              className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <span className="text-5xl">{icon || '📦'}</span>
                          )}
                        </div>
                        {/* Name */}
                        <div className="px-3 py-2">
                          <p className="text-sm font-semibold text-gray-800 text-center leading-tight line-clamp-2">{cat.name}</p>
                        </div>
                      </Link>
                    )
                  })
              }
            </div>
          </section>
        )}


        {/* Discounted */}
        {!loading && discounted.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">🔥 AKSIYA</span>
                <h2 className="text-base font-bold">Chegirmali mahsulotlar</h2>
              </div>
              <Link to="/catalog" className="text-accent text-sm font-medium hover:underline">Barchasi →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {discounted.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* All products */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold">Mashhur mahsulotlar</h2>
            <Link to="/catalog" className="text-accent text-sm font-medium hover:underline">Barchasi →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {loading
              ? Array.from({ length: 10 }).map((_, i) => <ProductSkeleton key={i} />)
              : products.slice(0, 20).map(p => <ProductCard key={p.id} product={p} />)
            }
          </div>
          {!loading && products.length > 20 && (
            <div className="text-center mt-6">
              <Link to="/catalog" className="btn-outline">Yana ko'rish</Link>
            </div>
          )}
        </section>

        {/* Why us */}
        <section className="bg-primary rounded-2xl p-6 text-white">
          <h2 className="text-center text-sm font-bold mb-5 text-accent uppercase tracking-widest">Nima uchun Bo'ston?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-center">
            {[
              { icon: '📱', title: 'Original tovarlar', sub: '100% sifat kafolati' },
              { icon: '💰', title: 'Eng yaxshi narx', sub: 'Raqobatchi narxdan past' },
              { icon: '🛡️', title: '1 yil kafolat', sub: "Har bir mahsulotga" },
              { icon: '📞', title: '24/7 aloqa', sub: 'Har doim yordamda' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-1">
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <p className="text-xs font-bold text-accent">{item.title}</p>
                <p className="text-xs text-white/50 hidden sm:block">{item.sub}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
