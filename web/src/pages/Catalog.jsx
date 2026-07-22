import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api.js'
import ProductCard from '../components/ProductCard.jsx'
import { ProductSkeleton } from '../components/Skeleton.jsx'

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')

  const categoryId = searchParams.get('category') || ''
  const searchQuery = searchParams.get('search') || ''

  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error)
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (categoryId) params.category = categoryId
    if (searchQuery) params.search = searchQuery
    api.getProducts(params)
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [categoryId, searchQuery])

  function handleSearch(e) {
    e.preventDefault()
    const next = new URLSearchParams(searchParams)
    if (search.trim()) {
      next.set('search', search.trim())
    } else {
      next.delete('search')
    }
    next.delete('category')
    setSearchParams(next)
  }

  function selectCategory(id) {
    const next = new URLSearchParams()
    if (id) next.set('category', id)
    setSearch('')
    setSearchParams(next)
  }

  return (
    <div className="container-web py-6">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex mb-6 max-w-xl">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Mahsulotni qidirish..."
          className="input rounded-r-none"
        />
        <button type="submit" className="bg-accent hover:bg-accent-hover text-white px-5 rounded-r-lg transition-colors flex-shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </form>

      <div className="flex gap-6">
        {/* Sidebar categories */}
        {categories.length > 0 && (
          <aside className="hidden md:block w-56 flex-shrink-0">
            <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wide mb-3">Kategoriyalar</h3>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => selectCategory('')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    !categoryId ? 'bg-accent text-white font-semibold' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  Barchasi
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => selectCategory(String(cat.id))}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      categoryId === String(cat.id)
                        ? 'bg-accent text-white font-semibold'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        )}

        {/* Products grid */}
        <div className="flex-1">
          {/* Mobile category scroll */}
          {categories.length > 0 && (
            <div className="md:hidden flex gap-2 overflow-x-auto pb-3 mb-4">
              <button
                onClick={() => selectCategory('')}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  !categoryId ? 'bg-accent text-white' : 'bg-white border border-gray-200 text-gray-700'
                }`}
              >
                Barchasi
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => selectCategory(String(cat.id))}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    categoryId === String(cat.id) ? 'bg-accent text-white' : 'bg-white border border-gray-200 text-gray-700'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Count */}
          {!loading && (
            <p className="text-sm text-gray-500 mb-4">
              {products.length} ta mahsulot topildi
              {searchQuery && <span className="font-medium text-gray-700"> "{searchQuery}" bo'yicha</span>}
            </p>
          )}

          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
              : products.length === 0
              ? (
                <div className="col-span-full text-center py-16 text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Mahsulot topilmadi</p>
                </div>
              )
              : products.map((p) => <ProductCard key={p.id} product={p} />)
            }
          </div>
        </div>
      </div>
    </div>
  )
}
