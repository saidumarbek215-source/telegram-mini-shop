// Resolves the `shop_id` query parameter (sent by the client with every
// request) into `req.shopId`. Used by public routes to scope data to a shop.
export function requireShopId(req, res, next) {
  const shopId = Number(req.query.shop_id)
  if (!Number.isInteger(shopId) || shopId <= 0) {
    return res.status(400).json({ error: 'shop_id обязателен' })
  }

  req.shopId = shopId
  next()
}
