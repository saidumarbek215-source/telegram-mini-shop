import { useEffect, useRef, useState } from 'react'

export default function BannerSlider({ banners }) {
  const [active, setActive] = useState(0)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (banners.length <= 1) return undefined
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % banners.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [banners.length])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ left: active * el.clientWidth, behavior: 'smooth' })
  }, [active])

  if (!banners.length) return null

  function handleScroll() {
    const el = scrollRef.current
    if (!el || el.clientWidth === 0) return
    setActive(Math.round(el.scrollLeft / el.clientWidth))
  }

  return (
    <div className="px-4">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-2xl no-scrollbar"
      >
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="relative aspect-[16/9] w-full flex-shrink-0 snap-center"
          >
            <img
              src={banner.image_url}
              alt={banner.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex flex-col justify-end p-4" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.1), transparent)' }}>
              {banner.title && <h3 className="text-base font-bold" style={{ color: '#ffffff' }}>{banner.title}</h3>}
              {banner.subtitle && (
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>{banner.subtitle}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {banners.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {banners.map((banner, i) => (
            <span
              key={banner.id}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? 'w-4 bg-accent' : 'w-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
