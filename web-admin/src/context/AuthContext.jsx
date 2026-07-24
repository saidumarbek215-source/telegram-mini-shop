import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token'))
  const [shopId, setShopId] = useState(() => localStorage.getItem('admin_shop_id'))

  function signIn(token, shopId) {
    localStorage.setItem('admin_token', token)
    localStorage.setItem('admin_shop_id', String(shopId))
    setToken(token)
    setShopId(String(shopId))
  }

  function signOut() {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_shop_id')
    setToken(null)
    setShopId(null)
  }

  return (
    <AuthContext.Provider value={{ token, shopId, signIn, signOut, isAuth: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
