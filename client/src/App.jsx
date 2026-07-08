import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useShop } from './context/ShopContext.jsx'
import ShopNotFound from './pages/ShopNotFound.jsx'
import Layout from './components/Layout.jsx'
import WebAdminLogin from './pages/WebAdminLogin.jsx'

const Home = lazy(() => import('./pages/Home.jsx'))
const Catalog = lazy(() => import('./pages/Catalog.jsx'))
const Product = lazy(() => import('./pages/Product.jsx'))
const Cart = lazy(() => import('./pages/Cart.jsx'))
const Checkout = lazy(() => import('./pages/Checkout.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))
const Faq = lazy(() => import('./pages/Faq.jsx'))
const ManageLayout = lazy(() => import('./pages/manage/ManageLayout.jsx'))
const ManageOrders = lazy(() => import('./pages/manage/ManageOrders.jsx'))
const ManageProducts = lazy(() => import('./pages/manage/ManageProducts.jsx'))
const ManageCategories = lazy(() => import('./pages/manage/ManageCategories.jsx'))
const ManageBanners = lazy(() => import('./pages/manage/ManageBanners.jsx'))
const ManageSettings = lazy(() => import('./pages/manage/ManageSettings.jsx'))
const ManageCredits = lazy(() => import('./pages/manage/ManageCredits.jsx'))
const ManageAI = lazy(() => import('./pages/manage/ManageAI.jsx'))
const ManageHelp = lazy(() => import('./pages/manage/ManageHelp.jsx'))
const ManageMap = lazy(() => import('./pages/manage/ManageMap.jsx'))

function Spinner() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-accent border-t-transparent" />
    </div>
  )
}

export default function App() {
  const { status } = useShop()

  if (status === 'loading' && window.location.pathname !== '/admin-login') return null
  if (status === 'not-found' && window.location.pathname !== '/admin-login') return <ShopNotFound />

  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/admin-login" element={<WebAdminLogin />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/faq" element={<Faq />} />

          <Route path="/manage" element={<ManageLayout />}>
            <Route index element={<Navigate to="orders" replace />} />
            <Route path="orders" element={<ManageOrders />} />
            <Route path="products" element={<ManageProducts />} />
            <Route path="categories" element={<ManageCategories />} />
            <Route path="banners" element={<ManageBanners />} />
            <Route path="settings" element={<ManageSettings />} />
            <Route path="credits" element={<ManageCredits />} />
            <Route path="ai" element={<ManageAI />} />
            <Route path="help" element={<ManageHelp />} />
            <Route path="map" element={<ManageMap />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
