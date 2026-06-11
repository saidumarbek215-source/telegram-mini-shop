import { createContext, useContext, useEffect, useState } from 'react'
import { adminApi } from '../api.js'
import { getTelegramInitData } from '../telegram.js'
import { SHOP_ID } from '../shop.js'

const OwnerContext = createContext({ isOwner: false, loading: true, shop: null })

export function OwnerProvider({ children }) {
  const [state, setState] = useState({ isOwner: false, loading: true, shop: null })

  useEffect(() => {
    if (SHOP_ID == null || !getTelegramInitData()) {
      setState({ isOwner: false, loading: false, shop: null })
      return
    }

    adminApi
      .checkOwner()
      .then((res) => setState({ isOwner: true, loading: false, shop: res.shop || null }))
      .catch(() => setState({ isOwner: false, loading: false, shop: null }))
  }, [])

  return <OwnerContext.Provider value={state}>{children}</OwnerContext.Provider>
}

export function useOwner() {
  return useContext(OwnerContext)
}
