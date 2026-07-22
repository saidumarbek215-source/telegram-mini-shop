import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { CartProvider } from './context/CartContext.jsx'
import { api } from './api.js'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Catalog from './pages/Catalog.jsx'
import Product from './pages/Product.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import Success from './pages/Success.jsx'

function Layout({ shop, children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header shop={shop} />
      <main className="flex-1">
        {children}
      </main>
      <Footer shop={shop} />
    </div>
  )
}

export default function App() {
  const [shop, setShop] = useState(null)

  useEffect(() => {
    api.getSettings().then(setShop).catch(console.error)
  }, [])

  // Update page title
  useEffect(() => {
    if (shop?.store_name) {
      document.title = shop.store_name
    }
  }, [shop])

  return (
    <CartProvider>
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
