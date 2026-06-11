import { useEffect, useState } from 'react'
import { adminApi } from '../../api.js'
import { formatPrice } from '../../utils/format.js'
import Modal from '../../components/admin/Modal.jsx'
import ProductForm from './ProductForm.jsx'
import { PencilIcon, TrashIcon, PlusIcon } from '../../components/Icons.jsx'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // null | 'new' | product

  useEffect(() => {
    load()
  }, [])

  function load() {
    setLoading(true)
    Promise.all([adminApi.getProducts(), adminApi.getCategories()])
      .then(([p, c]) => {
        setProducts(p)
        setCategories(c)
      })
      .finally(() => setLoading(false))
  }

  function categoryName(id) {
    return categories.find((c) => c.id === id)?.name
  }

  async function handleSave(data) {
    if (editing === 'new') {
      const created = await adminApi.createProduct(data)
      setProducts((prev) => [...prev, created])
    } else {
      const updated = await adminApi.updateProduct(editing.id, data)
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    }
    setEditing(null)
  }

  async function handleDelete(id) {
    if (!confirm('Удалить товар?')) return
    await adminApi.deleteProduct(id)
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  if (loading) return <div className="py-10 text-center text-sm text-muted">Загрузка...</div>

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold">Товары ({products.length})</h2>
        <button
          onClick={() => setEditing('new')}
          className="flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-bold text-bg"
        >
          <PlusIcon className="h-4 w-4" /> Добавить
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {products.map((product) => (
          <div key={product.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3">
            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-surface2">
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{product.name}</p>
              <p className="text-xs text-muted">
                {categoryName(product.category_id) || 'Без категории'}
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-sm font-bold text-accent">
                  {formatPrice(product.price)}
                </span>
                {!product.in_stock && (
                  <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] text-red-400">
                    Нет в наличии
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-shrink-0 flex-col gap-2">
              <button
                onClick={() => setEditing(product)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface2 text-white"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(product.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface2 text-red-400"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">Товаров пока нет</p>
        )}
      </div>

      {editing && (
        <Modal
          title={editing === 'new' ? 'Новый товар' : 'Редактировать товар'}
          onClose={() => setEditing(null)}
        >
          <ProductForm
            product={editing === 'new' ? null : editing}
            categories={categories}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </div>
  )
}
