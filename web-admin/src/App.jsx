import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Products from './pages/Products.jsx'
import Categories from './pages/Categories.jsx'
import Orders from './pages/Orders.jsx'
import Banners from './pages/Banners.jsx'
import Settings from './pages/Settings.jsx'
import Credits from './pages/Credits.jsx'
import Map from './pages/Map.jsx'
import AI from './pages/AI.jsx'
import Help from './pages/Help.jsx'
import Customers from './pages/Customers.jsx'
import Analytics from './pages/Analytics.jsx'

function PrivateRoute({ children }) {
  const { isAuth } = useAuth()
  return isAuth ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="categories" element={<Categories />} />
            <Route path="orders" element={<Orders />} />
            <Route path="banners" element={<Banners />} />
            <Route path="credits" element={<Credits />} />
            <Route path="customers"  element={<Customers />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="map"       element={<Map />} />
            <Route path="ai" element={<AI />} />
            <Route path="settings" element={<Settings />} />
            <Route path="help" element={<Help />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
