import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api.js'
import { SHOP_ID } from '../shop.js'

const ShopContext = createContext({ status: 'loading', shop: null })

export function ShopProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', shop: null })

  useEffect(() => {
    if (SHOP_ID == null) {
      setState({ status: 'not-found', shop: null })
      return
    }

    api
      .getSettings()
      .then((shop) => setState({ status: 'ready', shop }))
      .catch(() => setState({ status: 'not-found', shop: null }))
  }, [])

  return <ShopContext.Provider value={state}>{children}</ShopContext.Provider>
}

export function useShop() {
  return useContext(ShopContext)
}
