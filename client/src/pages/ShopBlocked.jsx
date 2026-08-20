import { BagIcon } from '../components/Icons.jsx'

export default function ShopBlocked() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-bg px-6 text-center text-white">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface">
        <BagIcon className="h-7 w-7 text-muted" />
      </div>
      <h1 className="text-lg font-bold">Do'kon vaqtincha faol emas</h1>
      <p className="mt-2 text-sm text-muted">
        Ushbu do'kon vaqtincha to'xtatilgan. Savol uchun:{' '}
        <a href="https://t.me/finexia_uz" className="text-accent underline">
          @finexia_uz
        </a>
      </p>
    </div>
  )
}
