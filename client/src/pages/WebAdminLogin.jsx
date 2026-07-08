import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const SHOP_ID = (() => {
  const p = new URLSearchParams(window.location.search)
  return p.get('shop') || localStorage.getItem('shop_id')
})()

export default function WebAdminLogin() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ login: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!SHOP_ID) {
      setError('shop_id topilmadi. URL-da ?shop=ID bo\'lishi kerak.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/web-auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: form.login, password: form.password, shop_id: SHOP_ID }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Login yoki parol noto'g'ri")
        return
      }
      localStorage.setItem('web_admin_token', data.token)
      localStorage.setItem('web_admin_shop_id', data.shop_id)
      localStorage.setItem('shop_id', data.shop_id)
      const search = window.location.search
      navigate('/manage' + search, { replace: true })
    } catch {
      setError("Login yoki parol noto'g'ri")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0f1a',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '360px',
          background: '#141b2d',
          borderRadius: '24px',
          padding: '36px 28px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🏪</div>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>Finexia</h1>
          <p style={{ color: '#8896b3', fontSize: 14, margin: '6px 0 0' }}>Admin panel</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            name="login"
            value={form.login}
            onChange={handleChange}
            placeholder="Login"
            autoComplete="username"
            required
            style={{
              background: '#0a0f1a',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14,
              padding: '13px 16px',
              color: '#fff',
              fontSize: 15,
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Parol"
            autoComplete="current-password"
            required
            style={{
              background: '#0a0f1a',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14,
              padding: '13px 16px',
              color: '#fff',
              fontSize: 15,
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />

          {error && (
            <p style={{ color: '#f87171', fontSize: 13, margin: 0, textAlign: 'center' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              padding: '14px',
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: 4,
            }}
          >
            {loading ? 'Kirish...' : 'Kirish'}
          </button>
        </form>
      </div>
    </div>
  )
}
