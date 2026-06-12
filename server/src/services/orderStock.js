// Reverts the stock decrement made in POST /api/orders for every item of an
// order. Used when an order is cancelled or expires before payment.
export async function restoreOrderStock(client, orderId) {
  const itemsResult = await client.query('SELECT * FROM order_items WHERE order_id = $1', [
    orderId,
  ])

  for (const item of itemsResult.rows) {
    if (!item.product_id || !item.size) continue

    const productResult = await client.query(
      'SELECT sizes_stock FROM products WHERE id = $1 FOR UPDATE',
      [item.product_id]
    )
    const sizesStock = productResult.rows[0]?.sizes_stock
    if (sizesStock && Object.prototype.hasOwnProperty.call(sizesStock, item.size)) {
      sizesStock[item.size] = Number(sizesStock[item.size] || 0) + Number(item.quantity || 1)
      await client.query('UPDATE products SET sizes_stock = $1 WHERE id = $2', [
        sizesStock,
        item.product_id,
      ])
    }
  }
}
