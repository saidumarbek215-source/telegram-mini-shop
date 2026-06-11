import { getTelegramUser, getTelegramWebApp } from '../../telegram.js'

export default function ManageAI() {
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

  return (
    <div className="flex flex-col gap-4 pb-4">
      <h2 className="text-base font-bold">AI Ассистент</h2>

      <div className="rounded-2xl bg-surface p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-2xl">
            🤖
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Finexia AI</p>
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-surface2 px-2.5 py-1 text-[11px] text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              Не подключён
            </span>
          </div>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-white/80">
          Подключите Finexia AI — ваш бот будет отвечать клиентам 24/7, консультировать по
          товарам и направлять в каталог. Первые 10 дней бесплатно.
        </p>

        <button
          onClick={handleConnect}
          className="w-full rounded-2xl bg-accent py-3.5 text-sm font-bold text-bg shadow-glow transition-transform active:scale-[0.98]"
        >
          Подключить
        </button>
      </div>
    </div>
  )
}
