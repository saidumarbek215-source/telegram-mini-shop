import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { api } from '../api.js'
import { formatPrice } from '../utils/format.js'

export default function Checkout() {
  const { items, total, clearCart } = useCart()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    address: '',
    comment: '',
    payment_method: 'card',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (items.length === 0) {
    return (
      <div className="container-web py-16 text-center">
        <p className="text-gray-500 mb-4">Savat bo'sh</p>
        <Link to="/catalog" className="btn-primary inline-block">Katalogga qaytish</Link>
      </div>
    )
  }

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.customer_name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError("Ism, telefon va manzilni to'ldiring")
      return
    }

    setSubmitting(true)
    try {
      await api.createOrder({
        ...form,
        items: items.map((i) => ({
          product_id: i.product_id,
          product_name: i.product_name,
          image_url: i.image_url,
          price: i.price,
          quantity: i.quantity,
          size: i.size,
          color: i.color,
        })),
      })
      clearCart()
      navigate('/success')
    } catch (err) {
      setError(err.message || 'Xatolik yuz berdi')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container-web py-6">
      <h1 className="text-2xl font-bold mb-6">Buyurtma berish</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-4">
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-lg">Ma'lumotlaringiz</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ismingiz *</label>
              <input
                name="customer_name"
                value={form.customer_name}
                onChange={handleChange}
                className="input"
                placeholder="Ism Familiya"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="input"
                placeholder="+998 90 123 45 67"
                type="tel"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manzil *</label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                className="input resize-none"
                rows={3}
                placeholder="Shahar, ko'cha, uy raqami"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Izoh (ixtiyoriy)</label>
              <textarea
                name="comment"
                value={form.comment}
                onChange={handleChange}
                className="input resize-none"
                rows={2}
                placeholder="Qo'shimcha ma'lumot..."
              />
            </div>
          </div>

          {/* Payment method */}
          <div className="card p-6">
            <h2 className="font-semibold text-lg mb-4">To'lov usuli</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { value: 'card', label: 'Karta' },
                { value: 'cash', label: 'Naqd' },
                { value: 'click', label: 'Click' },
                { value: 'payme', label: 'Payme' },
                { value: 'uzum', label: 'Uzum' },
              ].map((m) => (
                <label
                  key={m.value}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    form.payment_method === m.value ? 'border-accent bg-accent/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value={m.value}
                    checked={form.payment_method === m.value}
                    onChange={handleChange}
                    className="accent-orange-400"
                  />
                  <span className="text-sm font-medium">{m.label}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full text-center text-lg py-4"
          >
            {submitting ? 'Yuborilmoqda...' : `Buyurtma berish — ${formatPrice(total)}`}
          </button>
        </form>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="card p-5 sticky top-24">
            <h2 className="font-bold mb-4">Buyurtma</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item._key} className="flex gap-3 text-sm">
                  <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    {item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 truncate">{item.product_name}</p>
                    {item.size && <p className="text-gray-400 text-xs">{item.size}</p>}
                    <p className="text-gray-500">{item.quantity} × {formatPrice(item.price)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t mt-4 pt-3 flex justify-between font-bold">
              <span>Jami:</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
