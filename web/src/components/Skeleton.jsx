export function ProductSkeleton() {
  return (
    <div className="card">
      <div className="skeleton aspect-square rounded-t-xl" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-4 rounded w-full" />
        <div className="skeleton h-4 rounded w-2/3" />
        <div className="skeleton h-5 rounded w-1/2 mt-1" />
      </div>
    </div>
  )
}

export function BannerSkeleton() {
  return <div className="skeleton rounded-2xl aspect-[16/5]" />
}
