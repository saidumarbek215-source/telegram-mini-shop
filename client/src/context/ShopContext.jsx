import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api.js'

const ShopContext = createContext({
  status: 'loading',
  shop: null,
  categories: [],
  banners: [],
  products: [],
})

export function ShopProvider({ children }) {
  const [state, setState] = useState({
    status: 'loading',
    shop: null,
    categories: [],
    banners: [],
    products: [],
  })

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const shopId = urlParams.get('shop')

    if (!shopId) {
      setState({ status: 'not-found', shop: null, categories: [], banners: [], products: [] })
      return
    }

    api
      .getSettings()
      .then((shop) => {
        if (shop?.blocked) {
          setState({ status: 'blocked', shop: null, categories: [], banners: [], products: [] })
          return
        }
        return Promise.all([
          shop,
          api.getCategories().catch(() => []),
          api.getBanners().catch(() => []),
          api.getProducts().catch(() => []),
        ]).then(([s, categories, banners, products]) =>
          setState({ status: 'ready', shop: s, categories, banners, products })
        )
      })
      .catch(() =>
        setState({ status: 'not-found', shop: null, categories: [], banners: [], products: [] })
      )
  }, [])

  useEffect(() => {
    const { shop } = state
    if (!shop) return

    if (shop.features?.theme === 'light') {
      document.body.classList.add('light-theme')
    } else {
      document.body.classList.remove('light-theme')
    }

    if (shop.features?.language) {
      document.documentElement.lang = shop.features.language
      localStorage.setItem('lang', shop.features.language)
    }

    if (shop.features?.custom_theme) {
      const theme = shop.features.custom_theme
      Object.entries(theme).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--${key}`, value)
      })
    }
  }, [state.shop])

  return <ShopContext.Provider value={state}>{children}</ShopContext.Provider>
}

export function useShop() {
  const ctx = useContext(ShopContext)
  const lang = ctx.shop?.features?.language || 'ru'
  return { ...ctx, lang }
}
