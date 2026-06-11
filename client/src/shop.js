// The active shop is selected once via the `?shop=ID` URL parameter when the
// Mini App is opened (see BotFather menu button URL:
// https://telegram-mini-shop.netlify.app?shop=SHOP_ID). Since this is a SPA,
// the query string isn't preserved across client-side navigation, so it's
// captured once here and reused for every API request.
const params = new URLSearchParams(window.location.search)
const raw = params.get('shop')
const parsed = Number(raw)

export const SHOP_ID = raw && Number.isInteger(parsed) && parsed > 0 ? parsed : null
