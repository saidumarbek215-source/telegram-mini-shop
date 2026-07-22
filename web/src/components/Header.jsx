import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useCart } from '../context/CartContext.jsx'

export default function Header({ shop }) {
  const { count } = useCart()
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  function handleSearch(e) {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(search.trim())}`)
      setSearch('')
    }
  }

  return (
    <header className="bg-primary text-white sticky top-0 z-50 shadow-lg">
      {/* Top bar */}
      <div className="container-web py-3">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <span className="text-xl font-bold text-accent">
              {shop?.store_name || "Do'kon"}
            </span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
            <div className="flex">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Mahsulotni qidirish..."
                className="flex-1 px-4 py-2 text-gray-900 rounded-l-lg focus:outline-none text-sm"
              />
              <button
                type="submit"
                className="bg-accent hover:bg-accent-hover px-5 py-2 rounded-r-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          {/* Cart */}
          <Link to="/cart" className="flex-shrink-0 flex items-center gap-2 hover:text-accent transition-colors relative">
            <div className="relative">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {count > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </div>
            <span className="hidden sm:block text-sm">Savat</span>
          </Link>
        </div>
      </div>

      {/* Nav */}
      <div className="bg-secondary border-t border-white/10">
        <div className="container-web">
          <nav className="flex items-center gap-1 py-1 overflow-x-auto scrollbar-hide">
            <Link to="/catalog" className="flex-shrink-0 px-4 py-2 text-sm hover:text-accent hover:bg-white/5 rounded transition-colors whitespace-nowrap">
              Katalog
            </Link>
            <Link to="/catalog?sort=popular" className="flex-shrink-0 px-4 py-2 text-sm hover:text-accent hover:bg-white/5 rounded transition-colors whitespace-nowrap">
              Mashhur
            </Link>
            <Link to="/catalog?sort=new" className="flex-shrink-0 px-4 py-2 text-sm hover:text-accent hover:bg-white/5 rounded transition-colors whitespace-nowrap">
              Yangiliklar
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
