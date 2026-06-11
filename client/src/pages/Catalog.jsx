import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api.js'
import SearchBar from '../components/SearchBar.jsx'
import ProductCard from '../components/ProductCard.jsx'

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryId = searchParams.get('category') || ''
  const urlSearch = searchParams.get('search') || ''

  const [search, setSearch] = useState(urlSearch)
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getCategories().then(setCategories)
  }, [])

  useEffect(() => {
    setSearch(urlSearch)
  }, [urlSearch])

  useEffect(() => {
    setLoading(true)
    api
      .getProducts({ category: categoryId, search: urlSearch })
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [categoryId, urlSearch])

  function handleSearch() {
    const params = new URLSearchParams(searchParams)
    if (search.trim()) params.set('search', search.trim())
    else params.delete('search')
    setSearchParams(params)
  }

  function selectCategory(id) {
    const params = new URLSearchParams(searchParams)
    if (id) params.set('category', id)
    else params.delete('category')
    setSearchParams(params)
  }

  const activeCategory = categories.find((c) => String(c.id) === categoryId)

  return (
    <div>
      <header className="px-4 pb-2 pt-5">
        <h1 className="text-lg font-bold">{activeCategory ? activeCategory.name : 'Каталог'}</h1>
      </header>

      <SearchBar value={search} onChange={setSearch} onSubmit={handleSearch} />

      <div className="mt-3 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
        <button
          onClick={() => selectCategory('')}
          className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
            !categoryId ? 'bg-accent text-bg' : 'bg-surface text-muted'
          }`}
        >
          Все
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => selectCategory(String(cat.id))}
            className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              categoryId === String(cat.id) ? 'bg-accent text-bg' : 'bg-surface text-muted'
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      <div className="mt-4 px-4">
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
