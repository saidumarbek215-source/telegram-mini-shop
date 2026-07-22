import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import BannerSlider from '../components/BannerSlider.jsx'
import ProductCard from '../components/ProductCard.jsx'
import { BannerSkeleton, ProductSkeleton } from '../components/Skeleton.jsx'

export default function Home() {
  const [banners, setBanners] = useState([])
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.getBanners(), api.getCategories(), api.getProducts()])
      .then(([b, c, p]) => {
        setBanners(b)
        setCategories(c)
        setProducts(p)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container-web py-6 space-y-10">
      {/* Banner */}
      <section>
        {loading ? <BannerSkeleton /> : <BannerSlider banners={banners} />}
      </section>

      {/* Categories */}
      {(loading || categories.length > 0) && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Kategoriyalar</h2>
            <Link to="/catalog" className="text-accent text-sm hover:underline">Barchasi →</Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="skeleton h-20 rounded-xl" />
                ))
              : categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/catalog?category=${cat.id}`}
                    className="card flex flex-col items-center justify-center p-3 gap-2 hover:border-accent border border-transparent transition-colors text-center"
                  >
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} className="w-10 h-10 object-contain" />
                    ) : (
                      <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                        <span className="text-accent font-bold text-lg">{cat.name[0]}</span>
                      </div>
                    )}
                    <span className="text-xs font-medium text-gray-700 leading-tight">{cat.name}</span>
                  </Link>
                ))
            }
          </div>
        </section>
      )}

      {/* Popular products */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Mashhur mahsulotlar</h2>
          <Link to="/catalog" className="text-accent text-sm hover:underline">Barchasi →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {loading
            ? Array.from({ length: 10 }).map((_, i) => <ProductSkeleton key={i} />)
            : products.slice(0, 10).map((p) => <ProductCard key={p.id} product={p} />)
          }
        </div>
      </section>

      {/* All products CTA */}
      {!loading && products.length > 10 && (
        <div className="text-center">
          <Link to="/catalog" className="btn-outline">
            Barcha mahsulotlarni ko'rish ({products.length} ta)
          </Link>
        </div>
      )}
    </div>
  )
}
