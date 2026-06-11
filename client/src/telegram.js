export function getTelegramWebApp() {
  return window.Telegram?.WebApp || null
}

export function initTelegramApp() {
  const tg = getTelegramWebApp()
  if (!tg) return null

  tg.ready()
  tg.expand()

  try {
    tg.setHeaderColor('#0A0F1A')
    tg.setBackgroundColor('#0A0F1A')
  } catch {
    // older clients may not support these methods
  }

  return tg
}

export function getTelegramUser() {
  return getTelegramWebApp()?.initDataUnsafe?.user || null
}

export function getTelegramInitData() {
  return getTelegramWebApp()?.initData || ''
}

export function hapticFeedback(style = 'light') {
  try {
    getTelegramWebApp()?.HapticFeedback?.impactOccurred(style)
  } catch {
    // ignore
  }
}
