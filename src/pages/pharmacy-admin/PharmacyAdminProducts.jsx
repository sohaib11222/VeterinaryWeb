import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useMyProducts } from '../../queries/productQueries'
import { useMyPetStoreSubscription } from '../../queries/petStoreQueries'
import { useCreateProduct, useDeleteProduct, useUpdateProduct } from '../../mutations/productMutations'
import { toast } from 'react-toastify'
import { api } from '../../utils/api'
import { API_ROUTES, getImageUrl } from '../../utils/apiConfig'

const normalizeListPayload = (payload) => {
  const outer = payload?.data ?? payload
  const list = outer?.items ?? outer?.products ?? outer?.data?.items ?? outer?.data?.products
  const total = outer?.total ?? outer?.count ?? outer?.data?.total ?? outer?.data?.count
  if (Array.isArray(list)) {
    return { items: list, total: typeof total === 'number' ? total : list.length }
  }
  if (Array.isArray(outer)) {
    return { items: outer, total: outer.length }
  }
  return { items: [], total: 0 }
}

const PharmacyAdminProducts = () => {
  const { user } = useAuth()
  const role = String(user?.role || '').toUpperCase()

  const [isActiveFilter, setIsActiveFilter] = useState('all')
  const [mode, setMode] = useState('create')
  const [editingId, setEditingId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    stock: '',
    category: '',
    subCategory: '',
    requiresPrescription: false,
    isActive: true,
    images: [],
  })

  const queryParams = useMemo(() => ({ isActive: isActiveFilter }), [isActiveFilter])
  const myProductsQuery = useMyProducts(queryParams)
  const mySubscriptionQuery = useMyPetStoreSubscription({ enabled: role === 'PET_STORE' })
  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct()
  const deleteMutation = useDeleteProduct()

  const mySubscription = useMemo(() => {
    const payload = mySubscriptionQuery.data?.data ?? mySubscriptionQuery.data
    return payload?.data ?? payload
  }, [mySubscriptionQuery.data])

  const hasActiveSubscription = role !== 'PET_STORE' ? true : !!mySubscription?.hasActiveSubscription

  const { items: products } = useMemo(
    () => normalizeListPayload(myProductsQuery.data),
    [myProductsQuery.data]
  )

  const resetForm = () => {
    setMode('create')
    setEditingId(null)
    setForm({
      name: '',
      description: '',
      price: '',
      discountPrice: '',
      stock: '',
      category: '',
      subCategory: '',
      requiresPrescription: false,
      isActive: true,
      images: [],
    })
  }

  const openCreateModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setIsUploadingImages(false)
  }

  const startEdit = (p) => {
    setMode('edit')
    setEditingId(p?._id || p?.id)
    setForm({
      name: p?.name || '',
      description: p?.description || '',
      price: p?.price ?? '',
      discountPrice: p?.discountPrice ?? '',
      stock: p?.stock ?? '',
      category: p?.category || '',
      subCategory: p?.subCategory || '',
      requiresPrescription: !!p?.requiresPrescription,
      isActive: p?.isActive !== false,
      images: Array.isArray(p?.images) ? p.images : [],
    })
    setIsModalOpen(true)
  }

  const uploadProductImages = async (files) => {
    if (!files || files.length === 0) return []

    const formData = new FormData()
    Array.from(files).forEach((f) => formData.append('product', f))

    const res = await api.upload(API_ROUTES.UPLOAD.PRODUCT, formData)
    const payload = res?.data ?? res
    const urls = payload?.data?.urls || payload?.urls

    if (!Array.isArray(urls) || urls.length === 0) {
      throw new Error('Failed to upload images')
    }

    return urls
  }

  const onSelectImages = async (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      setIsUploadingImages(true)
      const urls = await uploadProductImages(files)
      setForm((p) => ({ ...p, images: [...(p.images || []), ...urls] }))
      toast.success('Images uploaded')
    } catch (error) {
      toast.error(error?.message || 'Image upload failed')
    } finally {
      setIsUploadingImages(false)
      e.target.value = ''
    }
  }

  const removeImage = (url) => {
    setForm((p) => ({ ...p, images: (p.images || []).filter((x) => x !== url) }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()

    if (role === 'PET_STORE' && !hasActiveSubscription) {
      toast.error('Active subscription required')
      return
    }

    const name = String(form.name || '').trim()
    const priceNum = Number(form.price)

    if (!name) {
      toast.error('Product name is required')
      return
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      toast.error('Price must be a positive number')
      return
    }

    const discountNumRaw = form.discountPrice === '' || form.discountPrice === null || form.discountPrice === undefined
      ? null
      : Number(form.discountPrice)
    if (discountNumRaw !== null) {
      if (!Number.isFinite(discountNumRaw) || discountNumRaw <= 0) {
        toast.error('Selling price must be a positive number')
        return
      }
      if (discountNumRaw >= priceNum) {
        toast.error('Selling price must be less than actual price')
        return
      }
    }

    const payload = {
      name,
      description: String(form.description || '').trim() || null,
      price: priceNum,
      discountPrice:
        discountNumRaw === null ? null : discountNumRaw,
      stock:
        form.stock === '' || form.stock === null || form.stock === undefined
          ? 0
          : Number(form.stock),
      category: String(form.category || '').trim() || null,
      subCategory: String(form.subCategory || '').trim() || null,
      requiresPrescription: !!form.requiresPrescription,
      isActive: !!form.isActive,
      images: Array.isArray(form.images) ? form.images : [],
    }

    try {
      if (mode === 'edit' && editingId) {
        await updateMutation.mutateAsync({ productId: editingId, data: payload })
        toast.success('Product updated')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Product created')
      }
      resetForm()
      closeModal()
    } catch (error) {
      const message = error?.message || 'Operation failed'
      if (role === 'PET_STORE' && message.toLowerCase().includes('subscription')) {
        toast.error(message)
        return
      }
      toast.error(message)
    }
  }

  const onDelete = async (productId) => {
    const ok = window.confirm('Delete this product?')
    if (!ok) return

    try {
      await deleteMutation.mutateAsync(productId)
      toast.success('Product deleted')
      if (editingId && productId === editingId) {
        resetForm()
      }
    } catch (error) {
      toast.error(error?.message || 'Delete failed')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <h3 className="page-title mb-0">My Products</h3>
          <button type="button" className="btn btn-primary" onClick={openCreateModal} disabled={!hasActiveSubscription}>
            Add Product
          </button>
        </div>
      </div>

      {role === 'PET_STORE' && (
        <div className="card mb-3">
          <div className="card-body d-flex align-items-center justify-content-between flex-wrap" style={{ gap: 12 }}>
            <div>
              <div className="fw-bold">Subscription</div>
              {mySubscriptionQuery.isLoading ? (
                <div className="text-muted small">Loading subscription status…</div>
              ) : mySubscriptionQuery.isError ? (
                <div className="text-muted small">{mySubscriptionQuery.error?.message || 'Failed to load subscription status'}</div>
              ) : hasActiveSubscription ? (
                <div className="text-muted small">Your subscription is active.</div>
              ) : (
                <div className="text-muted small">Your subscription is inactive. Subscribe to create and update products.</div>
              )}
            </div>
            <div className="d-flex align-items-center" style={{ gap: 8 }}>
              <span className={`badge ${hasActiveSubscription ? 'bg-success' : 'bg-danger'}`}>
                {hasActiveSubscription ? 'Active' : 'Inactive'}
              </span>
              <Link to="/pharmacy-admin/subscription" className="btn btn-sm btn-outline-primary">
                Manage
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
            <h5 className="mb-0">Product List</h5>
            <div style={{ minWidth: 220 }}>
              <label className="form-label mb-1">Filter</label>
              <select
                className="form-select"
                value={isActiveFilter}
                onChange={(e) => setIsActiveFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          {myProductsQuery.isLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : myProductsQuery.isError ? (
            <div className="alert alert-danger">{myProductsQuery.error?.message || 'Failed to load products'}</div>
          ) : products.length === 0 ? (
            <div className="alert alert-info mb-0">No products found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th style={{ width: 160 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const id = p?._id || p?.id
                    const firstImage = Array.isArray(p?.images) && p.images.length > 0 ? p.images[0] : null
                    const imgSrc = firstImage ? getImageUrl(firstImage) || firstImage : null
                    const hasDiscount = typeof p?.discountPrice === 'number' && typeof p?.price === 'number' && p.discountPrice > 0
                    const effectivePrice = hasDiscount ? p.discountPrice : p?.price
                    return (
                      <tr key={id}>
                        <td>
                          <div className="d-flex align-items-center" style={{ gap: 10 }}>
                            {imgSrc ? (
                              <img
                                src={imgSrc}
                                alt="product"
                                style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }}
                                onError={(e) => {
                                  e.currentTarget.onerror = null
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            ) : (
                              <div
                                style={{ width: 40, height: 40, borderRadius: 8, background: '#f1f5f9' }}
                              ></div>
                            )}
                            <div>
                              <div className="fw-semibold">{p?.name}</div>
                              <div className="text-muted small">{Array.isArray(p?.images) ? `${p.images.length} image(s)` : '0 image(s)'}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="fw-semibold">
                            {typeof effectivePrice === 'number' ? effectivePrice.toFixed(2) : effectivePrice}
                          </div>
                          {hasDiscount && (
                            <div className="text-muted small" style={{ textDecoration: 'line-through' }}>
                              {p.price.toFixed(2)}
                            </div>
                          )}
                        </td>
                        <td>{p?.stock ?? 0}</td>
                        <td>
                          {p?.isActive === false ? (
                            <span className="badge bg-secondary">Inactive</span>
                          ) : (
                            <span className="badge bg-success">Active</span>
                          )}
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => startEdit(p)}>
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => onDelete(id)}
                              disabled={deleteMutation.isPending}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <>
          <div className="modal-backdrop fade show" onClick={closeModal} style={{ zIndex: 1040 }}></div>
          <div
            className="modal fade show"
            style={{ display: 'block', zIndex: 1050 }}
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
              if (e.target.classList.contains('modal')) closeModal()
            }}
          >
            <div className="modal-dialog modal-lg modal-dialog-centered" role="document" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{mode === 'edit' ? 'Edit Product' : 'Add Product'}</h5>
                  <button type="button" className="btn-close" onClick={closeModal}></button>
                </div>
                <div className="modal-body">
                  <div className="text-muted small mb-3">
                    {role === 'PET_STORE'
                      ? 'Pharmacy accounts require an active subscription to manage products.'
                      : 'Parapharmacy accounts can manage products without a subscription.'}
                  </div>

                  <form onSubmit={onSubmit}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Name</label>
                        <input
                          className="form-control"
                          value={form.name}
                          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        />
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label">Actual Price</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={form.price}
                          onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                        />
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label">Stock</label>
                        <input
                          type="number"
                          className="form-control"
                          value={form.stock}
                          onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                        />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={form.description}
                          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                        />
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label">Category</label>
                        <input
                          className="form-control"
                          value={form.category}
                          onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                        />
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label">Sub-category</label>
                        <input
                          className="form-control"
                          value={form.subCategory}
                          onChange={(e) => setForm((p) => ({ ...p, subCategory: e.target.value }))}
                        />
                      </div>

                      <div className="col-md-4 mb-3">
                        <label className="form-label">Selling Price</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={form.discountPrice}
                          onChange={(e) => setForm((p) => ({ ...p, discountPrice: e.target.value }))}
                        />
                      </div>

                      <div className="col-md-8 mb-3">
                        <label className="form-label">Images</label>
                        <input
                          type="file"
                          className="form-control"
                          accept="image/*"
                          multiple
                          onChange={onSelectImages}
                          disabled={isUploadingImages}
                        />
                        {isUploadingImages && <div className="text-muted small mt-1">Uploading…</div>}

                        {Array.isArray(form.images) && form.images.length > 0 && (
                          <div className="d-flex flex-wrap mt-2" style={{ gap: 10 }}>
                            {form.images.map((url) => {
                              const src = getImageUrl(url) || url
                              return (
                                <div key={url} style={{ position: 'relative' }}>
                                  <img
                                    src={src}
                                    alt="product"
                                    style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover' }}
                                    onError={(e) => {
                                      e.currentTarget.onerror = null
                                      e.currentTarget.style.display = 'none'
                                    }}
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-danger"
                                    onClick={() => removeImage(url)}
                                    style={{ position: 'absolute', top: -8, right: -8, borderRadius: 999 }}
                                  >
                                    ×
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      <div className="col-md-4 mb-3 d-flex align-items-end">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="requiresPrescription"
                            checked={form.requiresPrescription}
                            onChange={(e) => setForm((p) => ({ ...p, requiresPrescription: e.target.checked }))}
                          />
                          <label className="form-check-label" htmlFor="requiresPrescription">
                            Requires prescription
                          </label>
                        </div>
                      </div>
                      <div className="col-md-4 mb-3 d-flex align-items-end">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="isActive"
                            checked={form.isActive}
                            onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                          />
                          <label className="form-check-label" htmlFor="isActive">
                            Active
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2">
                      <button type="button" className="btn btn-secondary" onClick={closeModal}>
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={!hasActiveSubscription || isUploadingImages || createMutation.isPending || updateMutation.isPending}
                      >
                        {mode === 'edit' ? 'Save Changes' : 'Create Product'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default PharmacyAdminProducts
