import { useOwner } from '../../context/OwnerContext.jsx'
import { getTelegramUser, getTelegramWebApp } from '../../telegram.js'

const FEATURES = [
  'Отвечать клиентам 24/7',
  'Помогать выбирать товары',
  'Отправлять ссылку на каталог',
  'Работать на RU/UZ/EN',
]

export default function ManageAI() {
  const { shop } = useOwner()

  function handleConnect() {
    const ownerId = getTelegramUser()?.id
    const url = `https://finexia.uz?ref=miniapp${ownerId ? `&shop_id=${ownerId}` : ''}`
    const tg = getTelegramWebApp()
    if (tg?.openLink) {
      tg.openLink(url)
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  if (shop?.ai_connected) {
    return (
      <div className="flex flex-col gap-4 pb-4">
        <h2 className="text-base font-bold">AI Ассистент</h2>

        <div className="rounded-2xl bg-surface p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-2xl">
              ✅
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Finexia AI подключён</p>
              <p className="mt-0.5 text-sm text-muted">Бот консультирует ваших клиентов 24/7</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      <h2 className="text-base font-bold">AI Ассистент</h2>

      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-surface2 via-surface to-[#06231F] p-4 ring-1 ring-accent/20">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-2xl">
            🤖
          </div>
          <p className="text-sm font-semibold">Finexia AI Ассистент</p>
        </div>

        <p className="mb-2 text-sm font-medium text-white/90">Ваш бот будет:</p>
        <ul className="mb-4 flex flex-col gap-1.5">
          {FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm text-white/80">
              <span className="text-accent">✓</span> {feature}
            </li>
          ))}
        </ul>

        <p className="mb-4 text-sm font-semibold text-accent">Первые 10 дней — бесплатно</p>

        <button
          onClick={handleConnect}
          className="w-full rounded-2xl bg-accent py-3.5 text-sm font-bold text-bg shadow-glow transition-transform active:scale-[0.98]"
        >
          Подключить Finexia AI
        </button>
      </div>
    </div>
  )
}
