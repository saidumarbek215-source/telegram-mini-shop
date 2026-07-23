import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import BannerSlider from '../components/BannerSlider.jsx'
import ProductCard from '../components/ProductCard.jsx'
import { BannerSkeleton, ProductSkeleton } from '../components/Skeleton.jsx'
import { formatPrice } from '../utils/format.js'
import { useCart } from '../context/CartContext.jsx'

const CAT_COLORS = ['#FFE000','#FF6B35','#4ECDC4','#A855F7','#EF4444','#3B82F6','#10B981','#F59E0B']

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
      <div className="bg-primary px-4 py-2 flex items-center justify-between">
        <span className="text-accent font-bold text-sm">Kun taklifi</span>
        <div className="flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2"/>
          </svg>
          {h}:{m}:{s}
        </div>
      </div>
      <div className="p-3 flex flex-col flex-1">
        <div className="bg-gray-50 rounded-xl aspect-square flex items-center justify-center overflow-hidden mb-3">
          {img
            ? <img src={img} alt={product.name} className="w-full h-full object-contain" />
            : <span className="text-5xl">📱</span>
          }
        </div>
        <p className="text-sm text-gray-800 font-medium line-clamp-2 mb-2">{product.name}</p>
        {discount > 0 && (
          <div className="bg-accent/10 text-accent-hover text-xs font-bold px-2 py-1 rounded mb-2 w-fit">
            {formatPrice(product.old_price)} / 18 oy
          </div>
        )}
        {product.old_price && (
          <p className="text-gray-400 line-through text-xs mb-0.5">{formatPrice(product.old_price)}</p>
        )}
        <p className="text-accent font-black text-xl mb-3">{formatPrice(product.price)}</p>
        <button
          onClick={() => addItem(product)}
          className="mt-auto w-10 h-10 bg-accent hover:bg-accent-hover rounded-full flex items-center justify-center transition-colors self-end"
        >
          <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function Home() {
  const [banners, setBanners] = useState([])
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const catRef = useRef(null)

  useEffect(() => {
    Promise.all([api.getBanners(), api.getCategories(), api.getProducts()])
      .then(([b, c, p]) => { setBanners(b); setCategories(c); setProducts(p) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const dealProduct = products.find(p => p.old_price && Number(p.old_price) > Number(p.price)) || products[0]
  const discounted = products.filter(p => p.old_price && Number(p.old_price) > Number(p.price))

  function scrollCats(dir) {
    if (catRef.current) catRef.current.scrollBy({ left: dir * 200, behavior: 'smooth' })
  }

  return (
    <div>
      {/* Banner + Deal of day */}
      <div className="container-web pt-3 pb-0">
        <div className="flex gap-4">
          {/* Main banner */}
          <div className="flex-1 min-w-0">
            {loading ? <BannerSkeleton /> : <BannerSlider banners={banners} />}
          </div>
          {/* Deal of day — desktop only */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            {loading
              ? <div className="skeleton rounded-2xl h-full min-h-72" />
              : <DealOfDay product={dealProduct} />
            }
          </div>
        </div>
      </div>

      {/* Features strip */}
      <div className="bg-primary border-t border-white/10 py-2.5">
        <div className="container-web">
          <div className="flex justify-around gap-2">
            {[
              { icon: '🚚', text: "Tez yetkazib berish" },
              { icon: '✅', text: "Kafolat bilan" },
              { icon: '🔄', text: "14 kun qaytarish" },
              { icon: '💳', text: "Bo'lib to'lash" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-lg">{f.icon}</span>
                <span className="text-xs text-white/80 hidden sm:block whitespace-nowrap">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container-web pt-3 pb-6 space-y-6">

        {/* Categories with arrows */}
        {(loading || categories.length > 0) && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Kategoriyalar</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => scrollCats(-1)} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-accent transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
                <button onClick={() => scrollCats(1)} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-accent transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
            </div>
            <div ref={catRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide scroll-smooth">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton flex-shrink-0 w-32 h-32 rounded-2xl" />)
                : categories.map((cat, idx) => {
                    const bg = CAT_COLORS[idx % CAT_COLORS.length]
                    return (
                      <Link key={cat.id} to={`/catalog?category=${cat.id}`}
                        className="flex-shrink-0 w-32 h-32 rounded-2xl overflow-hidden relative group border border-gray-100 hover:border-accent transition-colors bg-white"
                      >
                        {cat.image_url ? (
                          <>
                            <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <p className="absolute bottom-2 left-0 right-0 text-center text-white text-xs font-bold px-1">{cat.name}</p>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3" style={{ background: bg }}>
                            <span className="text-4xl font-black text-white drop-shadow">{cat.name[0]}</span>
                            <p className="text-center text-xs font-bold text-white leading-tight">{cat.name}</p>
                          </div>
                        )}
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
                <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">AKSIYA</span>
                <h2 className="text-lg font-bold">Chegirmali mahsulotlar</h2>
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
            <h2 className="text-lg font-bold">Mashhur mahsulotlar</h2>
            <Link to="/catalog" className="text-accent text-sm font-medium hover:underline">Barchasi ko'rish →</Link>
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
          <h2 className="text-center text-base font-bold mb-4 text-accent">Nima uchun Bo'ston?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { icon: '📱', title: 'Original tovarlar' },
              { icon: '💰', title: 'Eng yaxshi narx' },
              { icon: '🛡️', title: '1 yil kafolat' },
              { icon: '📞', title: '24/7 aloqa' },
            ].map((item, i) => (
              <div key={i}>
                <div className="text-3xl mb-1">{item.icon}</div>
                <p className="text-xs font-bold text-accent">{item.title}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
