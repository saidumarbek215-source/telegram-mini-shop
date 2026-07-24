import { useEffect, useState } from 'react'
import { checkAdmin } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'

const FEATURES = [
  'Отвечать клиентам 24/7',
  'Помогать выбирать товары',
  'Отправлять ссылку на каталог',
  'Работать на RU/UZ/EN',
]

export default function AI() {
  const { shopId } = useAuth()
  const [aiConnected, setAiConnected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAdmin()
      .then(data => setAiConnected(data.ai_connected))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function handleConnect() {
    const url = `https://finexia.uz?ref=miniapp${shopId ? `&shop_id=${shopId}` : ''}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (loading) return (
    <div className="space-y-4 max-w-2xl">
      {[1, 2].map(i => <div key={i} className="card p-5 h-24 animate-pulse bg-gray-100" />)}
    </div>
  )

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-xl font-black text-gray-900">AI Ассистент</h1>
        <p className="text-sm text-gray-500">Finexia AI для вашего магазина</p>
      </div>

      {aiConnected ? (
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 flex-shrink-0 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
            ✅
          </div>
          <div>
            <p className="font-bold text-gray-900">Finexia AI подключён</p>
            <p className="text-sm text-gray-500 mt-0.5">Бот консультирует ваших клиентов 24/7</p>
          </div>
        </div>
      ) : (
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex-shrink-0 bg-yellow-100 rounded-xl flex items-center justify-center text-2xl">
              🤖
            </div>
            <p className="font-bold text-gray-900">Finexia AI Ассистент</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Ваш бот будет:</p>
            <ul className="space-y-1.5">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-yellow-500 font-bold">✓</span> {f}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm font-semibold text-yellow-600">Первые 10 дней — бесплатно</p>

          <button onClick={handleConnect} className="btn-primary w-full">
            Подключить Finexia AI
          </button>
        </div>
      )}
    </div>
  )
}
