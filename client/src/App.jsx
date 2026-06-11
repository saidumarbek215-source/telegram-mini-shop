import { Routes, Route, Navigate } from 'react-router-dom'
import { useShop } from './context/ShopContext.jsx'
import ShopNotFound from './pages/ShopNotFound.jsx'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Catalog from './pages/Catalog.jsx'
import Product from './pages/Product.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import Profile from './pages/Profile.jsx'
import ManageLayout from './pages/manage/ManageLayout.jsx'
import ManageOrders from './pages/manage/ManageOrders.jsx'
import ManageProducts from './pages/manage/ManageProducts.jsx'
import ManageCategories from './pages/manage/ManageCategories.jsx'
import ManageBanners from './pages/manage/ManageBanners.jsx'
import ManageSettings from './pages/manage/ManageSettings.jsx'
import ManageAI from './pages/manage/ManageAI.jsx'

export default function App() {
  const { status } = useShop()

  if (status === 'loading') return null
  if (status === 'not-found') return <ShopNotFound />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/product/:id" element={<Product />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/profile" element={<Profile />} />

        <Route path="/manage" element={<ManageLayout />}>
          <Route index element={<Navigate to="orders" replace />} />
          <Route path="orders" element={<ManageOrders />} />
          <Route path="products" element={<ManageProducts />} />
          <Route path="categories" element={<ManageCategories />} />
          <Route path="banners" element={<ManageBanners />} />
          <Route path="settings" element={<ManageSettings />} />
          <Route path="ai" element={<ManageAI />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
