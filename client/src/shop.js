export function getShopId() {
  const urlParams = new URLSearchParams(window.location.search)
  const shopFromUrl = urlParams.get('shop')
  if (shopFromUrl) return Number(shopFromUrl)
  const tg = window.Telegram?.WebApp
  if (tg?.initDataUnsafe?.start_param) return Number(tg.initDataUnsafe.start_param)
  const hashParams = new URLSearchParams(window.location.hash.replace('#',''))
  const shopFromHash = hashParams.get('shop')
  if (shopFromHash) return Number(shopFromHash)
  return null
}
const raw = getShopId()
export const SHOP_ID = raw && raw > 0 ? raw : null
