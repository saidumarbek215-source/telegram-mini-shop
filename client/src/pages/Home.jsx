import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SearchBar from '../components/SearchBar.jsx'
import BannerSlider from '../components/BannerSlider.jsx'
import CategoryList from '../components/CategoryList.jsx'
import ProductCard from '../components/ProductCard.jsx'
import { useShop } from '../context/ShopContext.jsx'
import { t } from '../i18n.js'

export default function Home() {
  const navigate = useNavigate()
  const { shop, categories, banners, products, status, lang } = useShop()
  const [search, setSearch] = useState('')
  const loading = status === 'loading'

  function handleSearch() {
    if (search.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(search.trim())}`)
    }
  }

  return (
    <div>
      <header className="flex items-center gap-3 px-4 pb-3 pt-5">
        <div className="min-w-0">
          {loading ? (
            <div className="h-6 w-40 animate-pulse rounded-lg bg-surface2" />
          ) : (
            <h1 className="truncate text-lg font-bold leading-tight">
              {shop?.store_name}
            </h1>
          )}
          {!loading && shop?.store_description && (
            <p className="truncate text-xs text-muted">{shop.store_description}</p>
          )}
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
            <h2 className="text-sm font-semibold">{t('categories', lang)}</h2>
            <Link to="/catalog" className="text-xs font-medium text-accent">
              {t('allProducts', lang)}
            </Link>
          </div>
          <CategoryList categories={categories} />
        </div>
      )}

      <div className="mt-5 px-4">
        <h2 className="mb-3 text-sm font-semibold">{t('popular', lang)}</h2>
        {loading ? (
          <div className="py-10 text-center text-sm text-muted">{t('loading', lang)}</div>
        ) : products.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted">{t('noProducts', lang)}</div>
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
