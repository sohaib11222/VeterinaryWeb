import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useMyProducts } from '../../queries/productQueries'
import { useMyPetStoreSubscription, usePetStoreSetupStatus } from '../../queries/petStoreQueries'
import { useCreateProduct, useDeleteProduct, useUpdateProduct } from '../../mutations/productMutations'
import { toast } from 'react-toastify'
import { api } from '../../utils/api'
import { API_ROUTES, getImageUrl } from '../../utils/apiConfig'
import { useLanguage } from '../../contexts/LanguageContext'

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

const speciesOptions = ['DOG', 'CAT', 'RABBIT', 'BIRD', 'HORSE', 'OTHER']
const medicineFormOptions = ['Tablet', 'Capsule', 'Oral solution', 'Drops', 'Spot-on', 'Paste', 'Powder', 'Injection', 'Spray', 'Other']
const packageTypeOptions = ['Box', 'Bottle', 'Blister', 'Tube', 'Sachet', 'Jar', 'Pipette', 'Single dose', 'Other']

const makeVariant = (isMedicine) => ({
  name: '',
  sku: '',
  barcode: '',
  strengthValue: '',
  strengthUnit: 'mg',
  dosageForm: isMedicine ? 'Tablet' : '',
  packageType: 'Box',
  unitsPerPack: '',
  unitLabel: isMedicine ? 'tablets' : 'units',
  packageDescription: '',
  price: '',
  discountPrice: '',
  stock: '',
  isDefault: false,
  isActive: true,
})

const makeProductForm = (isMedicine) => ({
  name: '',
  brand: '',
  manufacturer: '',
  barcode: '',
  description: '',
  category: '',
  subCategory: '',
  petType: [],
  requiresPrescription: false,
  isActive: true,
  images: [],
  medicine: {
    activeIngredients: '',
    administrationRoute: '',
    indications: '',
    dosageInstructions: '',
    warnings: '',
    storageInstructions: '',
    authorizationHolder: '',
    aicNumber: '',
    leafletUrl: '',
  },
  parapharmacy: {
    productClass: 'Supplement',
    ingredients: '',
    allergens: '',
    lifeStage: 'All life stages',
    usageInstructions: '',
    warnings: '',
    storageInstructions: '',
  },
  variants: [makeVariant(isMedicine)],
})

const variantLabel = (variant, fallback = 'Variant') => {
  if (variant?.name) return variant.name
  const strength = variant?.strengthValue ? `${variant.strengthValue}${variant.strengthUnit ? ` ${variant.strengthUnit}` : ''}` : ''
  const form = variant?.dosageForm || ''
  const pack = variant?.unitsPerPack ? `${variant.unitsPerPack} ${variant.unitLabel || 'units'}` : ''
  return [strength, form, pack].filter(Boolean).join(' - ') || fallback
}

const PharmacyAdminProducts = () => {
  const { t } = useLanguage()
  const { user } = useAuth()
  const role = String(user?.role || '').toUpperCase()
  const isMedicineAccount = role !== 'PARAPHARMACY'
  const accountLabel = isMedicineAccount ? t('pharmacyAdmin.nav.pharmacy') : t('pharmacyAdmin.nav.parapharmacy')

  const [isActiveFilter, setIsActiveFilter] = useState('all')
  const [mode, setMode] = useState('create')
  const [editingId, setEditingId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [form, setForm] = useState(() => makeProductForm(true))

  const queryParams = useMemo(() => ({ isActive: isActiveFilter }), [isActiveFilter])
  const myProductsQuery = useMyProducts(queryParams)
  const mySubscriptionQuery = useMyPetStoreSubscription({ enabled: role === 'PET_STORE' })
  const setupQuery = usePetStoreSetupStatus({ enabled: role === 'PET_STORE' || role === 'PARAPHARMACY' })
  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct()
  const deleteMutation = useDeleteProduct()

  const mySubscription = useMemo(() => {
    const payload = mySubscriptionQuery.data?.data ?? mySubscriptionQuery.data
    return payload?.data ?? payload
  }, [mySubscriptionQuery.data])

  const hasActiveSubscription = role !== 'PET_STORE' ? true : !!mySubscription?.hasActiveSubscription
  const setupPayload = setupQuery.data?.data ?? setupQuery.data
  const setup = setupPayload?.data ?? setupPayload
  const canManageProducts = role === 'ADMIN' || Boolean(setup?.profileCompleted && (!setup?.requiresSubscription || setup?.hasActiveSubscription))

  const { items: products } = useMemo(
    () => normalizeListPayload(myProductsQuery.data),
    [myProductsQuery.data]
  )

  const resetForm = () => {
    setMode('create')
    setEditingId(null)
    setForm(makeProductForm(isMedicineAccount))
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
    const productIsMedicine = p?.productType
      ? p.productType === 'PHARMACY_MEDICINE'
      : isMedicineAccount
    const existingVariants = Array.isArray(p?.variants) && p.variants.length
      ? p.variants
      : [{
          name: p?.name || '',
          sku: p?.sku || '',
          barcode: p?.barcode || '',
          price: p?.price ?? '',
          discountPrice: p?.discountPrice ?? '',
          stock: p?.stock ?? '',
          isDefault: true,
          isActive: p?.isActive !== false,
        }]
    setForm({
      ...makeProductForm(productIsMedicine),
      name: p?.name || '',
      brand: p?.brand || '',
      manufacturer: p?.manufacturer || p?.medicineDetails?.manufacturer || p?.parapharmacyDetails?.manufacturer || '',
      barcode: p?.barcode || '',
      description: p?.description || '',
      category: p?.category || '',
      subCategory: p?.subCategory || '',
      petType: Array.isArray(p?.petType) ? p.petType : [],
      requiresPrescription: !!p?.requiresPrescription,
      isActive: p?.isActive !== false,
      images: Array.isArray(p?.images) ? p.images : [],
      medicine: { ...makeProductForm(true).medicine, ...(p?.medicineDetails || {}) },
      parapharmacy: { ...makeProductForm(false).parapharmacy, ...(p?.parapharmacyDetails || {}) },
      variants: existingVariants.map((variant, index) => ({
        ...makeVariant(productIsMedicine),
        ...variant,
        name: variant?.name || variantLabel(variant, `Variant ${index + 1}`),
        price: variant?.price ?? '',
        discountPrice: variant?.discountPrice ?? '',
        stock: variant?.stock ?? '',
      })),
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
      toast.success(t('pharmacyAdmin.products.imageUploaded'))
    } catch (error) {
      toast.error(error?.message || t('pharmacyAdmin.products.imageUploadFailed'))
    } finally {
      setIsUploadingImages(false)
      e.target.value = ''
    }
  }

  const removeImage = (url) => {
    setForm((p) => ({ ...p, images: (p.images || []).filter((x) => x !== url) }))
  }

  const updateVariant = (index, changes) => {
    setForm((p) => ({
      ...p,
      variants: p.variants.map((variant, variantIndex) => (
        variantIndex === index ? { ...variant, ...changes } : variant
      )),
    }))
  }

  const addVariant = () => {
    setForm((p) => ({ ...p, variants: [...p.variants, makeVariant(isMedicineAccount)] }))
  }

  const removeVariant = (index) => {
    setForm((p) => {
      if (p.variants.length <= 1) return p
      const variants = p.variants.filter((_, variantIndex) => variantIndex !== index)
      if (!variants.some((variant) => variant.isDefault)) variants[0].isDefault = true
      return { ...p, variants }
    })
  }

  const setDefaultVariant = (index) => {
    setForm((p) => ({
      ...p,
      variants: p.variants.map((variant, variantIndex) => ({ ...variant, isDefault: variantIndex === index })),
    }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()

    if (!canManageProducts) {
      toast.error(t('pharmacyAdmin.products.profileRequired'))
      return
    }

    const name = String(form.name || '').trim()
    if (!name) {
      toast.error(t('pharmacyAdmin.products.nameRequired'))
      return
    }

    let variants
    try {
      variants = form.variants.map((variant, index) => {
        const price = Number(variant.price)
        const salePrice = variant.discountPrice === '' || variant.discountPrice === null || variant.discountPrice === undefined
          ? null
          : Number(variant.discountPrice)
        const stock = Number(variant.stock)
        const strengthValue = variant.strengthValue === '' || variant.strengthValue === null || variant.strengthValue === undefined
          ? null
          : Number(variant.strengthValue)
        const unitsPerPack = variant.unitsPerPack === '' || variant.unitsPerPack === null || variant.unitsPerPack === undefined
          ? null
          : Number(variant.unitsPerPack)
        if (!Number.isFinite(price) || price <= 0) throw new Error(`Enter a valid regular price for variant ${index + 1}`)
        if (!Number.isFinite(stock) || stock < 0) throw new Error(`Enter a valid stock quantity for variant ${index + 1}`)
        if (strengthValue !== null && (!Number.isFinite(strengthValue) || strengthValue <= 0)) {
          throw new Error(`Enter a valid strength for variant ${index + 1}`)
        }
        if (unitsPerPack !== null && (!Number.isFinite(unitsPerPack) || unitsPerPack <= 0)) {
          throw new Error(`Enter a valid pack quantity for variant ${index + 1}`)
        }
        if (salePrice !== null && (!Number.isFinite(salePrice) || salePrice <= 0 || salePrice >= price)) {
          throw new Error(`Sale price must be lower than regular price for variant ${index + 1}`)
        }
        return {
          ...(variant?._id ? { _id: variant._id } : {}),
          name: variantLabel(variant, `Variant ${index + 1}`),
          sku: String(variant.sku || '').trim() || null,
          barcode: String(variant.barcode || '').trim() || null,
          strengthValue,
          strengthUnit: String(variant.strengthUnit || '').trim() || null,
          dosageForm: String(variant.dosageForm || '').trim() || null,
          packageType: String(variant.packageType || '').trim() || null,
          unitsPerPack,
          unitLabel: String(variant.unitLabel || '').trim() || null,
          packageDescription: String(variant.packageDescription || '').trim() || null,
          price,
          discountPrice: salePrice,
          stock,
          isDefault: index === form.variants.findIndex((item) => item.isDefault) || (index === 0 && !form.variants.some((item) => item.isDefault)),
          isActive: variant.isActive !== false,
        }
      })
    } catch (error) {
      toast.error(error?.message || t('pharmacyAdmin.products.variantsInvalid'))
      return
    }

    if (!variants.length) {
      toast.error(t('pharmacyAdmin.products.variantRequired'))
      return
    }

    if (isMedicineAccount && !String(form.medicine.activeIngredients || '').trim()) {
      toast.error(t('pharmacyAdmin.products.ingredientRequired'))
      return
    }

    const payload = {
      name,
      description: String(form.description || '').trim() || null,
      productType: isMedicineAccount ? 'PHARMACY_MEDICINE' : 'PARAPHARMACY_PRODUCT',
      brand: String(form.brand || '').trim() || null,
      manufacturer: String(form.manufacturer || '').trim() || null,
      barcode: String(form.barcode || '').trim() || null,
      price: variants[0].price,
      discountPrice: variants[0].discountPrice,
      stock: variants.reduce((total, variant) => total + variant.stock, 0),
      category: String(form.category || '').trim() || null,
      subCategory: String(form.subCategory || '').trim() || null,
      petType: form.petType,
      requiresPrescription: isMedicineAccount && !!form.requiresPrescription,
      isActive: !!form.isActive,
      images: Array.isArray(form.images) ? form.images : [],
      variants,
      medicineDetails: isMedicineAccount ? {
        ...form.medicine,
        manufacturer: String(form.manufacturer || '').trim() || null,
        targetSpecies: form.petType,
      } : {},
      parapharmacyDetails: !isMedicineAccount ? {
        ...form.parapharmacy,
        manufacturer: String(form.manufacturer || '').trim() || null,
        targetSpecies: form.petType,
      } : {},
    }

    try {
      if (mode === 'edit' && editingId) {
        await updateMutation.mutateAsync({ productId: editingId, data: payload })
        toast.success(t('pharmacyAdmin.products.updated'))
      } else {
        await createMutation.mutateAsync(payload)
        toast.success(t('pharmacyAdmin.products.created'))
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
    const ok = window.confirm(t('pharmacyAdmin.products.confirmDelete'))
    if (!ok) return

    try {
      await deleteMutation.mutateAsync(productId)
      toast.success(t('pharmacyAdmin.products.deleted'))
      if (editingId && productId === editingId) {
        resetForm()
      }
    } catch (error) {
      toast.error(error?.message || t('pharmacyAdmin.products.deleteFailed'))
    }
  }

  return (
    <div className="pharmacy-admin-products-mobile">
      <div className="page-header">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <h3 className="page-title mb-0">{t('pharmacyAdmin.products.title')}</h3>
          <button type="button" className="btn btn-primary" onClick={openCreateModal} disabled={!canManageProducts}>
            {t('pharmacyAdmin.products.addNewProduct')}
          </button>
        </div>
      </div>

      {role === 'PET_STORE' && (
        <div className="card mb-3">
          <div className="card-body d-flex align-items-center justify-content-between flex-wrap" style={{ gap: 12 }}>
            <div>
              <div className="fw-bold">{t('pharmacyAdmin.products.subscription')}</div>
              {mySubscriptionQuery.isLoading ? (
                <div className="text-muted small">{t('pharmacyAdmin.products.loadingSubscription')}</div>
              ) : mySubscriptionQuery.isError ? (
                <div className="text-muted small">{mySubscriptionQuery.error?.message || 'Failed to load subscription status'}</div>
              ) : hasActiveSubscription ? (
                <div className="text-muted small">{t('pharmacyAdmin.products.activeSubscription')}</div>
              ) : (
                <div className="text-muted small">{t('pharmacyAdmin.products.inactiveSubscription')}</div>
              )}
            </div>
            <div className="d-flex align-items-center" style={{ gap: 8 }}>
              <span className={`badge ${hasActiveSubscription ? 'bg-success' : 'bg-danger'}`}>
                {hasActiveSubscription ? t('pharmacyAdmin.products.active') : t('pharmacyAdmin.products.inactive')}
              </span>
              <Link to="/pharmacy-admin/subscription" className="btn btn-sm btn-outline-primary">
                {t('pharmacyAdmin.dashboard.manage')}
              </Link>
            </div>
          </div>
        </div>
      )}

      {(role === 'PET_STORE' || role === 'PARAPHARMACY') && !setupQuery.isLoading && !canManageProducts && (
        <div className="alert alert-warning d-flex align-items-center justify-content-between flex-wrap gap-2">
          <span><i className="fa-solid fa-lock me-2"></i>Complete your profile{role === 'PET_STORE' ? ' and activate your subscription' : ''} to manage products.</span>
          <Link to="/pharmacy-admin/dashboard" className="btn btn-sm btn-outline-dark">{t('pharmacyAdmin.products.viewSetup')}</Link>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
            <h5 className="mb-0">{t('pharmacyAdmin.products.list')}</h5>
            <div style={{ minWidth: 220 }}>
              <label className="form-label mb-1">{t('pharmacyAdmin.products.filter')}</label>
              <select
                className="form-select"
                value={isActiveFilter}
                onChange={(e) => setIsActiveFilter(e.target.value)}
              >
                <option value="all">{t('pharmacyAdmin.products.all')}</option>
                <option value="true">{t('pharmacyAdmin.products.active')}</option>
                <option value="false">{t('pharmacyAdmin.products.inactive')}</option>
              </select>
            </div>
          </div>

          {myProductsQuery.isLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">{t('pharmacyAdmin.products.loading')}</span>
              </div>
            </div>
          ) : myProductsQuery.isError ? (
            <div className="alert alert-danger">{myProductsQuery.error?.message || 'Failed to load products'}</div>
          ) : products.length === 0 ? (
            <div className="alert alert-info mb-0">{t('pharmacyAdmin.products.empty')}</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0 pharmacy-admin-products-table">
                <thead>
                  <tr>
                    <th>{t('pharmacyAdmin.products.name')}</th>
                    <th>{t('pharmacyAdmin.products.price')}</th>
                    <th>{t('pharmacyAdmin.products.stock')}</th>
                    <th>{t('pharmacyAdmin.products.status')}</th>
                    <th style={{ width: 160 }}>{t('pharmacyAdmin.products.action')}</th>
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
                        <td data-label={t('pharmacyAdmin.products.name')}>
                          <div className="d-flex align-items-center" style={{ gap: 10 }}>
                            {imgSrc ? (
                              <img
                                src={imgSrc}
                                alt={t('pharmacyAdmin.orderDetails.product')}
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
                        <td data-label={t('pharmacyAdmin.products.price')}>
                          <div className="fw-semibold">
                            {typeof effectivePrice === 'number' ? effectivePrice.toFixed(2) : effectivePrice}
                          </div>
                          {hasDiscount && (
                            <div className="text-muted small" style={{ textDecoration: 'line-through' }}>
                              {p.price.toFixed(2)}
                            </div>
                          )}
                        </td>
                        <td data-label={t('pharmacyAdmin.products.stock')}>{p?.stock ?? 0}</td>
                        <td data-label={t('pharmacyAdmin.products.status')}>
                          {p?.isActive === false ? (
                            <span className="badge bg-secondary">{t('pharmacyAdmin.products.inactive')}</span>
                          ) : (
                            <span className="badge bg-success">{t('pharmacyAdmin.products.active')}</span>
                          )}
                        </td>
                        <td data-label={t('pharmacyAdmin.products.action')}>
                          <div className="d-flex gap-2 pharmacy-product-actions">
                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => startEdit(p)}>
                              {t('pharmacyAdmin.products.edit')}
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => onDelete(id)}
                              disabled={deleteMutation.isPending}
                            >
                              {t('pharmacyAdmin.products.delete')}
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
            className="modal fade show pharmacy-product-editor-modal"
            style={{ display: 'block', zIndex: 1050 }}
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
              if (e.target.classList.contains('modal')) closeModal()
            }}
          >
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable" role="document" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title mb-1">{mode === 'edit' ? `${t('pharmacyAdmin.products.editProduct')} ${accountLabel}` : `${t('pharmacyAdmin.products.addNewProduct')} ${accountLabel}`}</h5>
                    <div className="text-muted small">
                      {isMedicineAccount
                        ? t('pharmacyAdmin.products.variantHint')
                        : t('pharmacyAdmin.products.variantHint')}
                    </div>
                  </div>
                  <button type="button" className="btn-close" onClick={closeModal}></button>
                </div>
                <div className="modal-body">
                  <div className="text-muted small mb-3">
                    {role === 'PET_STORE'
                      ? t('pharmacyAdmin.products.inactiveSubscription')
                      : t('pharmacyAdmin.products.activeSubscription')}
                  </div>

                  <form onSubmit={onSubmit}>
                    <section className="border rounded p-3 mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0">{t('pharmacyAdmin.products.basics')}</h6>
                        <span className={`badge ${isMedicineAccount ? 'bg-primary' : 'bg-info text-dark'}`}>
                          {isMedicineAccount ? t('pharmacyAdmin.products.medicineInfo') : t('pharmacyAdmin.products.parapharmacyInfo')}
                        </span>
                      </div>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">{t('pharmacyAdmin.products.productName')}</label>
                          <input className="form-control" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder={t('pharmacyAdmin.products.placeholder', { value: isMedicineAccount ? 'Amoxicillin' : 'Omega-3 Skin & Coat Oil' })} />
                        </div>
                        <div className="col-md-3 mb-3">
                          <label className="form-label">{t('pharmacyAdmin.products.brand')}</label>
                          <input className="form-control" value={form.brand} onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))} />
                        </div>
                        <div className="col-md-3 mb-3">
                          <label className="form-label">{t('pharmacyAdmin.products.manufacturer')}</label>
                          <input className="form-control" value={form.manufacturer} onChange={(e) => setForm((p) => ({ ...p, manufacturer: e.target.value }))} />
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label">{t('pharmacyAdmin.products.category')}</label>
                          <input className="form-control" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder={t('pharmacyAdmin.products.placeholder', { value: isMedicineAccount ? 'Antibiotics, antiparasitics…' : 'Supplements, hygiene…' })} />
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label">{t('pharmacyAdmin.products.subCategory')}</label>
                          <input className="form-control" value={form.subCategory} onChange={(e) => setForm((p) => ({ ...p, subCategory: e.target.value }))} />
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label">{t('pharmacyAdmin.products.barcode')}</label>
                          <input className="form-control" value={form.barcode} onChange={(e) => setForm((p) => ({ ...p, barcode: e.target.value }))} />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">{t('pharmacyAdmin.products.species')}</label>
                          <select multiple className="form-select" value={form.petType} onChange={(e) => setForm((p) => ({ ...p, petType: Array.from(e.target.selectedOptions, (option) => option.value) }))} style={{ minHeight: 108 }}>
                            {speciesOptions.map((species) => <option key={species} value={species}>{species}</option>)}
                          </select>
                          <div className="form-text">{t('pharmacyAdmin.products.speciesHint')}</div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">{t('pharmacyAdmin.products.description')}</label>
                          <textarea className="form-control" rows={4} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder={t('pharmacyAdmin.products.descriptionPlaceholder')} />
                        </div>
                      </div>
                    </section>

                    {isMedicineAccount ? (
                      <section className="border rounded p-3 mb-3">
                          <h6 className="mb-3">{t('pharmacyAdmin.products.medicineInfo')}</h6>
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label className="form-label">{t('pharmacyAdmin.products.activeIngredients')}</label>
                            <input className="form-control" value={form.medicine.activeIngredients} onChange={(e) => setForm((p) => ({ ...p, medicine: { ...p.medicine, activeIngredients: e.target.value } }))} placeholder={t('pharmacyAdmin.products.placeholder', { value: 'Amoxicillin trihydrate' })} />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">{t('pharmacyAdmin.products.administrationRoute')}</label>
                            <input className="form-control" value={form.medicine.administrationRoute} onChange={(e) => setForm((p) => ({ ...p, medicine: { ...p.medicine, administrationRoute: e.target.value } }))} placeholder={t('pharmacyAdmin.products.placeholder', { value: 'Oral, topical, otic' })} />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">{t('pharmacyAdmin.products.indications')}</label>
                            <textarea className="form-control" rows={3} value={form.medicine.indications} onChange={(e) => setForm((p) => ({ ...p, medicine: { ...p.medicine, indications: e.target.value } }))} />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">{t('pharmacyAdmin.products.dosageNotes')}</label>
                            <textarea className="form-control" rows={3} value={form.medicine.dosageInstructions} onChange={(e) => setForm((p) => ({ ...p, medicine: { ...p.medicine, dosageInstructions: e.target.value } }))} />
                          </div>
                          <div className="col-md-4 mb-3">
                            <label className="form-label">{t('pharmacyAdmin.products.authorizationNumber')}</label>
                            <input className="form-control" value={form.medicine.aicNumber} onChange={(e) => setForm((p) => ({ ...p, medicine: { ...p.medicine, aicNumber: e.target.value } }))} />
                          </div>
                          <div className="col-md-4 mb-3">
                            <label className="form-label">{t('pharmacyAdmin.products.authorizationHolder')}</label>
                            <input className="form-control" value={form.medicine.authorizationHolder} onChange={(e) => setForm((p) => ({ ...p, medicine: { ...p.medicine, authorizationHolder: e.target.value } }))} />
                          </div>
                          <div className="col-md-4 mb-3">
                            <label className="form-label">{t('pharmacyAdmin.products.leafletUrl')}</label>
                            <input type="url" className="form-control" value={form.medicine.leafletUrl} onChange={(e) => setForm((p) => ({ ...p, medicine: { ...p.medicine, leafletUrl: e.target.value } }))} placeholder="https://…" />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">{t('pharmacyAdmin.products.warnings')}</label>
                            <textarea className="form-control" rows={3} value={form.medicine.warnings} onChange={(e) => setForm((p) => ({ ...p, medicine: { ...p.medicine, warnings: e.target.value } }))} />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">{t('pharmacyAdmin.products.storage')}</label>
                            <textarea className="form-control" rows={3} value={form.medicine.storageInstructions} onChange={(e) => setForm((p) => ({ ...p, medicine: { ...p.medicine, storageInstructions: e.target.value } }))} />
                          </div>
                        </div>
                      </section>
                    ) : (
                      <section className="border rounded p-3 mb-3">
                        <h6 className="mb-3">{t('pharmacyAdmin.products.parapharmacyInfo')}</h6>
                        <div className="row">
                          <div className="col-md-4 mb-3">
                            <label className="form-label">{t('pharmacyAdmin.products.productClass')}</label>
                            <select className="form-select" value={form.parapharmacy.productClass} onChange={(e) => setForm((p) => ({ ...p, parapharmacy: { ...p.parapharmacy, productClass: e.target.value } }))}>
                              {['Supplement', 'Complementary feed', 'Hygiene', 'Dental care', 'Skin & coat', 'Ear & eye care', 'Grooming', 'Accessories', 'Other'].map((productClass) => <option key={productClass} value={productClass}>{productClass}</option>)}
                            </select>
                          </div>
                          <div className="col-md-4 mb-3">
                            <label className="form-label">{t('pharmacyAdmin.products.lifeStage')}</label>
                            <select className="form-select" value={form.parapharmacy.lifeStage} onChange={(e) => setForm((p) => ({ ...p, parapharmacy: { ...p.parapharmacy, lifeStage: e.target.value } }))}>
                              {['All life stages', 'Puppy / kitten', 'Adult', 'Senior'].map((lifeStage) => <option key={lifeStage} value={lifeStage}>{lifeStage}</option>)}
                            </select>
                          </div>
                          <div className="col-md-4 mb-3">
                            <label className="form-label">{t('pharmacyAdmin.products.allergenInfo')}</label>
                            <input className="form-control" value={form.parapharmacy.allergens} onChange={(e) => setForm((p) => ({ ...p, parapharmacy: { ...p.parapharmacy, allergens: e.target.value } }))} placeholder={t('pharmacyAdmin.products.placeholder', { value: 'Contains fish' })} />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">{t('pharmacyAdmin.products.ingredients')}</label>
                            <textarea className="form-control" rows={3} value={form.parapharmacy.ingredients} onChange={(e) => setForm((p) => ({ ...p, parapharmacy: { ...p.parapharmacy, ingredients: e.target.value } }))} />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">{t('pharmacyAdmin.products.usageInstructions')}</label>
                            <textarea className="form-control" rows={3} value={form.parapharmacy.usageInstructions} onChange={(e) => setForm((p) => ({ ...p, parapharmacy: { ...p.parapharmacy, usageInstructions: e.target.value } }))} />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">{t('pharmacyAdmin.products.warnings')}</label>
                            <textarea className="form-control" rows={3} value={form.parapharmacy.warnings} onChange={(e) => setForm((p) => ({ ...p, parapharmacy: { ...p.parapharmacy, warnings: e.target.value } }))} />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">{t('pharmacyAdmin.products.storage')}</label>
                            <textarea className="form-control" rows={3} value={form.parapharmacy.storageInstructions} onChange={(e) => setForm((p) => ({ ...p, parapharmacy: { ...p.parapharmacy, storageInstructions: e.target.value } }))} />
                          </div>
                        </div>
                      </section>
                    )}

                    <section className="border rounded p-3 mb-3">
                      <div className="d-flex justify-content-between align-items-center gap-2 mb-2 flex-wrap">
                        <div>
                          <h6 className="mb-1">{t('pharmacyAdmin.products.variantPricing')}</h6>
                          <div className="text-muted small">{t('pharmacyAdmin.products.variantHint')}</div>
                        </div>
                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={addVariant}>{t('pharmacyAdmin.products.addVariant')}</button>
                      </div>

                      {form.variants.map((variant, index) => (
                        <div key={variant._id || index} className="border rounded p-3 mb-3 bg-light">
                          <div className="d-flex align-items-center justify-content-between gap-2 mb-3 flex-wrap">
                            <div className="fw-semibold">Variant {index + 1}{variant.isDefault ? ' · Default' : ''}</div>
                            <div className="d-flex align-items-center gap-3">
                              <div className="form-check mb-0">
                                <input className="form-check-input" type="radio" name="defaultVariant" id={`default-variant-${index}`} checked={variant.isDefault} onChange={() => setDefaultVariant(index)} />
                                <label className="form-check-label" htmlFor={`default-variant-${index}`}>{t('pharmacyAdmin.products.default')}</label>
                              </div>
                              <div className="form-check mb-0">
                                <input className="form-check-input" type="checkbox" id={`variant-active-${index}`} checked={variant.isActive !== false} onChange={(e) => updateVariant(index, { isActive: e.target.checked })} />
                                <label className="form-check-label" htmlFor={`variant-active-${index}`}>{t('pharmacyAdmin.products.active')}</label>
                              </div>
                              <button type="button" className="btn btn-sm btn-outline-danger" disabled={form.variants.length === 1} onClick={() => removeVariant(index)}>{t('pharmacyAdmin.products.remove')}</button>
                            </div>
                          </div>
                          <div className="row">
                            <div className="col-md-4 mb-3">
                              <label className="form-label">{t('pharmacyAdmin.products.variantLabel')}</label>
                              <input className="form-control" value={variant.name} onChange={(e) => updateVariant(index, { name: e.target.value })} placeholder={t('pharmacyAdmin.products.placeholder', { value: isMedicineAccount ? '500 mg tablets' : '250 ml bottle' })} />
                            </div>
                            {isMedicineAccount && <>
                              <div className="col-md-2 mb-3">
                                <label className="form-label">{t('pharmacyAdmin.products.strength')}</label>
                                <input type="number" min="0" step="0.01" className="form-control" value={variant.strengthValue} onChange={(e) => updateVariant(index, { strengthValue: e.target.value })} placeholder="500" />
                              </div>
                              <div className="col-md-2 mb-3">
                                <label className="form-label">{t('pharmacyAdmin.products.unit')}</label>
                                <select className="form-select" value={variant.strengthUnit || 'mg'} onChange={(e) => updateVariant(index, { strengthUnit: e.target.value })}>
                                  {['mg', 'g', 'mcg', 'mg/ml', '%', 'IU', 'ml'].map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                                </select>
                              </div>
                            </>}
                            <div className={`mb-3 ${isMedicineAccount ? 'col-md-4' : 'col-md-4'}`}>
                              <label className="form-label">{isMedicineAccount ? t('pharmacyAdmin.products.dosageForm') : t('pharmacyAdmin.products.productClass')}</label>
                              {isMedicineAccount ? (
                                <select className="form-select" value={variant.dosageForm} onChange={(e) => updateVariant(index, { dosageForm: e.target.value })}>
                                  {medicineFormOptions.map((formType) => <option key={formType} value={formType}>{formType}</option>)}
                                </select>
                              ) : (
                                <input className="form-control" value={variant.dosageForm} onChange={(e) => updateVariant(index, { dosageForm: e.target.value })} placeholder={t('pharmacyAdmin.products.placeholder', { value: 'Liquid, wipes, chew' })} />
                              )}
                            </div>
                            <div className="col-md-3 mb-3">
                              <label className="form-label">{t('pharmacyAdmin.products.packType')}</label>
                              <select className="form-select" value={variant.packageType} onChange={(e) => updateVariant(index, { packageType: e.target.value })}>
                                {packageTypeOptions.map((packageType) => <option key={packageType} value={packageType}>{packageType}</option>)}
                              </select>
                            </div>
                            <div className="col-md-2 mb-3">
                              <label className="form-label">{t('pharmacyAdmin.products.unitsPerPack')}</label>
                              <input type="number" min="0" step="1" className="form-control" value={variant.unitsPerPack} onChange={(e) => updateVariant(index, { unitsPerPack: e.target.value })} placeholder="30" />
                            </div>
                            <div className="col-md-2 mb-3">
                              <label className="form-label">{t('pharmacyAdmin.products.unitLabel')}</label>
                              <input className="form-control" value={variant.unitLabel} onChange={(e) => updateVariant(index, { unitLabel: e.target.value })} placeholder="tablets" />
                            </div>
                            <div className="col-md-5 mb-3">
                              <label className="form-label">{t('pharmacyAdmin.products.packDescription')}</label>
                              <input className="form-control" value={variant.packageDescription} onChange={(e) => updateVariant(index, { packageDescription: e.target.value })} placeholder={t('pharmacyAdmin.products.placeholder', { value: 'Box of 3 blisters' })} />
                            </div>
                            <div className="col-md-3 mb-3">
                              <label className="form-label">{t('pharmacyAdmin.products.variantSku')}</label>
                              <input className="form-control" value={variant.sku} onChange={(e) => updateVariant(index, { sku: e.target.value })} />
                            </div>
                            <div className="col-md-3 mb-3">
                              <label className="form-label">{t('pharmacyAdmin.products.variantBarcode')}</label>
                              <input className="form-control" value={variant.barcode} onChange={(e) => updateVariant(index, { barcode: e.target.value })} />
                            </div>
                            <div className="col-md-2 mb-3">
                              <label className="form-label">{t('pharmacyAdmin.products.regularPrice')}</label>
                              <input type="number" min="0" step="0.01" className="form-control" value={variant.price} onChange={(e) => updateVariant(index, { price: e.target.value })} />
                            </div>
                            <div className="col-md-2 mb-3">
                              <label className="form-label">{t('pharmacyAdmin.products.salePrice')}</label>
                              <input type="number" min="0" step="0.01" className="form-control" value={variant.discountPrice} onChange={(e) => updateVariant(index, { discountPrice: e.target.value })} />
                            </div>
                            <div className="col-md-2 mb-3">
                              <label className="form-label">{t('pharmacyAdmin.products.availableQuantity')}</label>
                              <input type="number" min="0" step="1" className="form-control" value={variant.stock} onChange={(e) => updateVariant(index, { stock: e.target.value })} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </section>

                    <section className="border rounded p-3 mb-3">
                      <h6 className="mb-3">{t('pharmacyAdmin.products.imagesVisibility')}</h6>
                      <div className="row align-items-end">
                        <div className="col-md-8 mb-3">
                          <label className="form-label">{t('pharmacyAdmin.products.productImages')}</label>
                          <input type="file" className="form-control" accept="image/*" multiple onChange={onSelectImages} disabled={isUploadingImages} />
                          {isUploadingImages && <div className="text-muted small mt-1">{t('pharmacyAdmin.products.uploading')}</div>}
                          {Array.isArray(form.images) && form.images.length > 0 && (
                            <div className="d-flex flex-wrap mt-2" style={{ gap: 10 }}>
                              {form.images.map((url) => {
                                const src = getImageUrl(url) || url
                                return (
                                  <div key={url} style={{ position: 'relative' }}>
                                    <img src={src} alt={t('pharmacyAdmin.orderDetails.product')} style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover' }} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none' }} />
                                    <button type="button" className="btn btn-sm btn-danger" onClick={() => removeImage(url)} style={{ position: 'absolute', top: -8, right: -8, borderRadius: 999 }}>×</button>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                        {isMedicineAccount && <div className="col-md-2 mb-3">
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" id="requiresPrescription" checked={form.requiresPrescription} onChange={(e) => setForm((p) => ({ ...p, requiresPrescription: e.target.checked }))} />
                            <label className="form-check-label" htmlFor="requiresPrescription">{t('pharmacyAdmin.products.requiresPrescription')}</label>
                          </div>
                        </div>}
                        <div className={`${isMedicineAccount ? 'col-md-2' : 'col-md-4'} mb-3`}>
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
                            <label className="form-check-label" htmlFor="isActive">{t('pharmacyAdmin.products.visibleActive')}</label>
                          </div>
                        </div>
                      </div>
                    </section>

                    <div className="d-flex justify-content-end gap-2">
                      <button type="button" className="btn btn-secondary" onClick={closeModal}>
                        {t('pharmacyAdmin.products.cancel')}
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={!canManageProducts || isUploadingImages || createMutation.isPending || updateMutation.isPending}
                      >
                        {mode === 'edit' ? t('pharmacyAdmin.products.save') : t('pharmacyAdmin.products.addNewProduct')}
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
