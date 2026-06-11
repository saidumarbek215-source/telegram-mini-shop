import { createContext, useContext, useEffect, useState } from 'react'
import { adminApi } from '../api.js'
import { getTelegramInitData } from '../telegram.js'

const OwnerContext = createContext({ isOwner: false, loading: true })

export function OwnerProvider({ children }) {
  const [state, setState] = useState({ isOwner: false, loading: true })

  useEffect(() => {
    if (!getTelegramInitData()) {
      setState({ isOwner: false, loading: false })
      return
    }

    adminApi
      .checkOwner()
      .then(() => setState({ isOwner: true, loading: false }))
      .catch(() => setState({ isOwner: false, loading: false }))
  }, [])

  return <OwnerContext.Provider value={state}>{children}</OwnerContext.Provider>
}

export function useOwner() {
  return useContext(OwnerContext)
}
