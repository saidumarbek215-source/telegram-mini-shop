import { useState } from 'react'

const FAQ_ITEMS = [
  {
    q: 'Как добавить товар?',
    a: 'Перейдите в раздел Mahsulotlar → нажмите «Qo\'shish» → заполните данные и сохраните.',
  },
  {
    q: 'Как изменить реквизиты оплаты?',
    a: 'Sozlamalar → введите номер карты и имя владельца → нажмите Saqlash.',
  },
  {
    q: 'Как подтвердить заказ?',
    a: 'При новом заказе вам придёт уведомление в Telegram с кнопками «Подтвердить» и «Отменить».',
  },
  {
    q: 'Что если клиент не оплатил?',
    a: 'Заказ автоматически отменяется через установленное время (настраивается в Sozlamalar → Buyurtma sozlamalari) и товар возвращается в наличие.',
  },
  {
    q: 'Как подключить AI консультанта?',
    a: 'Перейдите в раздел AI Ассистент → нажмите «Подключить Finexia AI». Первые 10 дней бесплатно.',
  },
  {
    q: 'Как работает раздел «Должники»?',
    a: 'Здесь отображаются заказы с отложенной оплатой (насия). Заказы с истёкшей датой выделяются красным. После получения оплаты нажмите «Оплачено ✓».',
  },
  {
    q: 'Как добавить партнёрский магазин на карту?',
    a: 'Перейдите в раздел Xarita → нажмите «+ Добавить». Укажите название, телефон, адрес и выберите точку на карте.',
  },
  {
    q: 'Как зарегистрировать новый магазин?',
    a: (
      <>
        <p>Отправьте POST запрос на сервер:</p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-100 p-3 text-xs text-gray-700">
{`POST /api/shops/register
{
  "name": "...",
  "owner_telegram_id": ...,
  "bot_token": "..."
}`}
        </pre>
      </>
    ),
  },
]

function AccordionItem({ item }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left flex items-center justify-between gap-3 py-4 px-5"
      >
        <span className="text-sm font-semibold text-gray-900">{item.q}</span>
        <svg
          className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">
          {item.a}
        </div>
      )}
    </div>
  )
}

export default function Help() {
  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-xl font-black text-gray-900">Yordam / Помощь</h1>
        <p className="text-sm text-gray-500">Часто задаваемые вопросы</p>
      </div>

      <div className="card overflow-hidden divide-y divide-gray-100">
        {FAQ_ITEMS.map((item) => (
          <AccordionItem key={item.q} item={item} />
        ))}
      </div>
    </div>
  )
}
