function getShopId() {
  // Way 1: standard URL query param (?shop=ID)
  const urlParams = new URLSearchParams(window.location.search)
  const shopFromUrl = urlParams.get('shop')
  if (shopFromUrl) return shopFromUrl

  // Way 2: Telegram startapp / start_param (t.me/bot?startapp=SHOP_ID)
  const tg = window.Telegram?.WebApp
  if (tg?.initDataUnsafe?.start_param) {
    return tg.initDataUnsafe.start_param
  }

  // Way 3: hash param (#shop=ID)
  const hashParams = new URLSearchParams(window.location.hash.replace('#', ''))
  const shopFromHash = hashParams.get('shop')
  if (shopFromHash) return shopFromHash

  return null
}

const raw = getShopId()
const parsed = Number(raw)

export const SHOP_ID = raw && Number.isInteger(parsed) && parsed > 0 ? parsed : null
