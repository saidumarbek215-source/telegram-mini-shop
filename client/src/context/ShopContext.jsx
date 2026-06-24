import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api.js'

const ShopContext = createContext({ status: 'loading', shop: null })

export function ShopProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', shop: null })

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const shopId = urlParams.get('shop')
    
    if (!shopId) {
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
