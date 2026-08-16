import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const [shopId, setShopId]   = useState('')
  const [loginVal, setLogin]  = useState('')
  const [pass, setPass]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const { signIn, isAuth }    = useAuth()
  const navigate              = useNavigate()

  if (isAuth) { navigate('/'); return null }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(Number(shopId), loginVal, pass)
      signIn(data.token, data.shop_id)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center text-black font-black text-2xl mx-auto mb-4">
            F
          </div>
          <h1 className="text-white text-xl font-bold">Finexia Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-1">Boshqaruv tizimiga kiring</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className="label text-gray-400">Shop ID</label>
            <input
              type="number"
              className="input bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-yellow-400"
              placeholder="16"
              value={shopId}
              onChange={e => setShopId(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label text-gray-400">Login</label>
            <input
              type="text"
              className="input bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-yellow-400"
              placeholder="admin"
              value={loginVal}
              onChange={e => setLogin(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label text-gray-400">Parol</label>
            <input
              type="password"
              className="input bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-yellow-400"
              placeholder="••••••"
              value={pass}
              onChange={e => setPass(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Kirish...' : 'Kirish'}
          </button>
        </form>

        <p className="text-center text-gray-600 text-xs mt-6">
          Parolni sozlash uchun Telegram mini app dan foydalaning
        </p>
      </div>
    </div>
  )
}
