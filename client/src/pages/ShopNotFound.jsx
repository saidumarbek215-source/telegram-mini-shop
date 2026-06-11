import { BagIcon } from '../components/Icons.jsx'

export default function ShopNotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-bg px-6 text-center text-white">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface">
        <BagIcon className="h-7 w-7 text-muted" />
      </div>
      <h1 className="text-lg font-bold">Магазин не найден</h1>
      <p className="mt-2 text-sm text-muted">
        Откройте Mini App по ссылке, которую дал вам продавец — она должна содержать параметр{' '}
        <code className="rounded bg-surface px-1.5 py-0.5 text-xs">?shop=ID</code>.
      </p>
    </div>
  )
}
