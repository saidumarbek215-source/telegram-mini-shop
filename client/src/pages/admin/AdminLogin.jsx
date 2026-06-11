import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../../api.js'
import Footer from '../../components/Footer.jsx'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token } = await adminApi.login(password)
      localStorage.setItem('admin_token', token)
      navigate('/admin/orders', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-between bg-bg text-white">
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-3xl shadow-glow">
          👟
        </div>
        <h1 className="mb-1 text-xl font-bold">Sneaker Store</h1>
        <p className="mb-6 text-sm text-muted">Вход в админ-панель</p>

        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль администратора"
            autoFocus
            className="w-full rounded-2xl bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-3 w-full rounded-2xl bg-accent py-3.5 text-sm font-bold text-bg shadow-glow transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
      <Footer />
    </div>
  )
}
