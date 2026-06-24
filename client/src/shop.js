function getShopId() {
  const urlParams = new URLSearchParams(window.location.search)
  const shopFromUrl = urlParams.get('shop')
  if (shopFromUrl) {
    localStorage.setItem('shop_id', shopFromUrl)
    return shopFromUrl
  }
  const tg = window.Telegram?.WebApp
  if (tg?.initDataUnsafe?.start_param) {
    localStorage.setItem('shop_id', tg.initDataUnsafe.start_param)
    return tg.initDataUnsafe.start_param
  }
  const hashParams = new URLSearchParams(window.location.hash.replace('#', ''))
  const shopFromHash = hashParams.get('shop')
  if (shopFromHash) {
    localStorage.setItem('shop_id', shopFromHash)
    return shopFromHash
  }
  return localStorage.getItem('shop_id')
}
const raw = getShopId()
const parsed = Number(raw)
export const SHOP_ID = raw && Number.isInteger(parsed) && parsed > 0 ? parsed : null
