import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { ShopProvider } from './context/ShopContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { OwnerProvider } from './context/OwnerContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ShopProvider>
        <CartProvider>
          <OwnerProvider>
            <App />
          </OwnerProvider>
        </CartProvider>
      </ShopProvider>
    </BrowserRouter>
  </React.StrictMode>
)
