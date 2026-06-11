import { Link } from 'react-router-dom'

export default function CategoryList({ categories }) {
  return (
    <div className="flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          to={`/catalog?category=${cat.id}`}
          className="flex flex-shrink-0 flex-col items-center gap-1.5"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-2xl">
            {cat.icon}
          </div>
          <span className="max-w-[64px] truncate text-[11px] text-muted">{cat.name}</span>
        </Link>
      ))}
    </div>
  )
}
