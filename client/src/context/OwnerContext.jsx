import { createContext, useContext, useEffect, useState } from 'react'
import { adminApi } from '../api.js'
import { getTelegramInitData } from '../telegram.js'
import { SHOP_ID } from '../shop.js'

const OwnerContext = createContext({ isOwner: false, loading: true, shop: null, debugError: null })

export function OwnerProvider({ children }) {
  const [state, setState] = useState({ isOwner: false, loading: true, shop: null, debugError: null })

  useEffect(() => {
    if (SHOP_ID == null || !getTelegramInitData()) {
      setState({ isOwner: false, loading: false, shop: null, debugError: null })
      return
    }

    console.log('DEBUG initData present:', !!getTelegramInitData(), 'length:', getTelegramInitData()?.length)

    adminApi
      .checkOwner()
      .then((res) => setState({ isOwner: true, loading: false, shop: res.shop || null, debugError: null }))
      .catch((err) => setState({ isOwner: false, loading: false, shop: null, debugError: err.message || String(err) }))
  }, [])

  return <OwnerContext.Provider value={state}>{children}</OwnerContext.Provider>
}

export function useOwner() {
  return useContext(OwnerContext)
}
