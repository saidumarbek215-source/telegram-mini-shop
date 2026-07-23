import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useCart } from '../context/CartContext.jsx'
import { api } from '../api.js'

export default function Header({ shop }) {
  const { count } = useCart()
  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {})
  }, [])

  function handleSearch(e) {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(search.trim())}`)
      setSearch('')
    }
  }

  return (
    <header className="bg-primary text-white sticky top-0 z-50 shadow-lg">
      <div className="container-web py-3">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img
              src="https://i.postimg.cc/63GkxmFs/Bez-imeni-3.jpg"
              alt={shop?.store_name || "Do'kon"}
              className="h-10 w-auto object-contain"
            />
          </Link>

          {/* Katalog button — desktop */}
          <Link
            to="/catalog"
            className="hidden md:flex items-center gap-2 bg-accent text-black font-bold px-4 py-2 rounded-lg flex-shrink-0 hover:bg-accent-hover transition-colors text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Katalog
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Mahsulotni qidirish..."
              className="flex-1 px-4 py-2 text-gray-900 rounded-l-lg focus:outline-none text-sm min-w-0"
            />
            <button type="submit" className="bg-accent hover:bg-accent-hover text-black px-4 py-2 rounded-r-lg transition-colors flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Link to="/cart" className="flex flex-col items-center gap-0.5 px-3 py-1 hover:bg-white/10 rounded-lg transition-colors relative">
              <div className="relative">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {count > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </div>
              <span className="text-xs hidden sm:block">Savat</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Nav — dynamic categories from admin */}
      {categories.length > 0 && (
        <div className="hidden sm:block bg-secondary border-t border-white/10">
          <div className="container-web">
            <nav className="flex items-center gap-1 py-1 overflow-x-auto">
              {categories.slice(0, 8).map((cat) => (
                <Link
                  key={cat.id}
                  to={`/catalog?category=${cat.id}`}
                  className="flex-shrink-0 px-4 py-2 text-sm hover:text-accent hover:bg-white/5 rounded transition-colors whitespace-nowrap"
                >
                  {cat.name}
                </Link>
              ))}
              <Link
                to="/catalog"
                className="flex-shrink-0 px-4 py-2 text-sm hover:text-accent hover:bg-white/5 rounded transition-colors whitespace-nowrap text-white/50"
              >
                Barchasi →
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
