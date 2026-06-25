import { SearchIcon } from './Icons.jsx'
import { useShop } from '../context/ShopContext.jsx'
import { t } from '../i18n.js'

export default function SearchBar({ value, onChange, onSubmit }) {
  const { lang } = useShop()

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit?.()
      }}
      className="px-4"
    >
      <div className="flex items-center gap-2 rounded-2xl bg-surface px-4 py-3">
        <SearchIcon className="h-5 w-5 flex-shrink-0 text-muted" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('search', lang)}
          className="w-full bg-transparent text-sm text-white placeholder:text-muted focus:outline-none"
        />
      </div>
    </form>
  )
}
