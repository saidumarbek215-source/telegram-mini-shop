import { useState, useEffect, useCallback, useRef } from 'react'

export default function BannerSlider({ banners }) {
  const [current, setCurrent] = useState(0)
  const touchX = useRef(null)

  const next = useCallback(() => setCurrent((c) => (c + 1) % banners.length), [banners.length])
  const prev = useCallback(() => setCurrent((c) => (c - 1 + banners.length) % banners.length), [banners.length])

  useEffect(() => {
    if (banners.length <= 1) return
    const id = setInterval(next, 4000)
    return () => clearInterval(id)
  }, [next, banners.length])

  function onTouchStart(e) {
    touchX.current = e.touches[0].clientX
  }
  function onTouchEnd(e) {
    if (touchX.current === null) return
    const diff = touchX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev()
    touchX.current = null
  }

  if (!banners.length) return null

  return (
    <div
      className="relative overflow-hidden w-full h-full"
      style={{ background: '#000', cursor: 'grab' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {banners.map((b, i) => (
        <div
          key={b.id}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100' : 'opacity-0'}`}
        >
          {b.image_url ? (
            <img
              src={b.image_url}
              alt={b.title || ''}
              className="w-full h-full object-cover object-top"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
              <p className="text-white text-2xl font-bold">{b.title}</p>
            </div>
          )}
        </div>
      ))}

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all ${i === current ? 'w-7 h-2.5 bg-yellow-400' : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
