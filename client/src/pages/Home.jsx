import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import SearchBar from '../components/SearchBar.jsx'
import BannerSlider from '../components/BannerSlider.jsx'
import CategoryList from '../components/CategoryList.jsx'
import ProductCard from '../components/ProductCard.jsx'

export default function Home() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [settings, setSettings] = useState({})
  const [banners, setBanners] = useState([])
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.getSettings(), api.getBanners(), api.getCategories(), api.getProducts()])
      .then(([settingsData, bannersData, categoriesData, productsData]) => {
        setSettings(settingsData)
        setBanners(bannersData)
        setCategories(categoriesData)
        setProducts(productsData)
      })
      .finally(() => setLoading(false))
  }, [])

  function handleSearch() {
    if (search.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(search.trim())}`)
    }
  }

  return (
    <div>
      <header className="flex items-center gap-3 px-4 pb-3 pt-5">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-accent text-2xl shadow-glow">
          👟
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold leading-tight">
            {settings.store_name || 'Sneaker Store'}
          </h1>
          <p className="truncate text-xs text-muted">
            {settings.store_description || 'Оригинальные кроссовки с доставкой'}
          </p>
        </div>
      </header>

      <SearchBar value={search} onChange={setSearch} onSubmit={handleSearch} />

      {banners.length > 0 && (
        <div className="mt-4">
          <BannerSlider banners={banners} />
        </div>
      )}

      {categories.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between px-4">
            <h2 className="text-sm font-semibold">Категории</h2>
            <Link to="/catalog" className="text-xs font-medium text-accent">
              Все товары
            </Link>
          </div>
          <CategoryList categories={categories} />
        </div>
      )}

      <div className="mt-5 px-4">
        <h2 className="mb-3 text-sm font-semibold">Популярные товары</h2>
        {loading ? (
          <div className="py-10 text-center text-sm text-muted">Загрузка...</div>
        ) : products.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted">Товары не найдены</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
