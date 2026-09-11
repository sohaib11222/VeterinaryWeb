import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Breadcrumb from '../../components/common/Breadcrumb'
import { toast } from 'react-toastify'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import { useProduct } from '../../queries/productQueries'
import { useProductPrescriptionEligibility } from '../../queries/productPrescriptionRequestQueries'
import { useSubmitProductPrescriptionRequest } from '../../mutations/productPrescriptionRequestMutations'
import { api } from '../../utils/api'
import { API_ROUTES, getImageUrl } from '../../utils/apiConfig'
import { useLanguage } from '../../contexts/LanguageContext'

const DetailRow = ({ label, value }) => {
  if (value === null || value === undefined || value === '') return null
  const displayValue = Array.isArray(value) ? value.join(', ') : value
  if (!displayValue) return null
  return (
    <div className="col-md-6 mb-3">
      <div className="text-muted small mb-1">{label}</div>
      <div style={{ whiteSpace: 'pre-line' }}>{displayValue}</div>
    </div>
  )
}

const variantLabel = (variant, fallback, defaultUnit) => {
  if (variant?.name) return variant.name
  const strength = variant?.strengthValue ? `${variant.strengthValue} ${variant.strengthUnit || ''}`.trim() : ''
  const form = variant?.dosageForm || ''
  const pack = variant?.unitsPerPack ? `${variant.unitsPerPack} ${variant.unitLabel || defaultUnit}` : ''
  return [strength, form, pack].filter(Boolean).join(' · ') || fallback
}

const ProductDescription = () => {
  const { t } = useLanguage()
  const { addToCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const productId = searchParams.get('id')
  const requestedVariantId = searchParams.get('variantId')
  const [quantity, setQuantity] = useState(1)
  const [selectedVariantId, setSelectedVariantId] = useState('')
  const [isUploadingPrescription, setIsUploadingPrescription] = useState(false)
  const prescriptionInputRef = useRef(null)

  const productQuery = useProduct(productId)
  const payload = productQuery.data?.data ?? productQuery.data
  const product = payload?.data ?? payload

  const allVariants = useMemo(() => {
    if (Array.isArray(product?.variants) && product.variants.length > 0) return product.variants
    if (!product) return []
    return [{
      name: t('shop.standardPack'),
      sku: product.sku,
      barcode: product.barcode,
      price: product.price,
      discountPrice: product.discountPrice,
      stock: product.stock,
      isDefault: true,
      isActive: product.isActive !== false,
    }]
  }, [product])

  const purchasableVariants = useMemo(() => {
    const activeVariants = allVariants.filter((variant) => variant.isActive !== false)
    return activeVariants.length > 0 ? activeVariants : allVariants
  }, [allVariants])

  useEffect(() => {
    const preferred = allVariants.find((variant) => (
      requestedVariantId && String(variant?._id || variant?.id || 'legacy-default') === requestedVariantId
    )) || allVariants.find((variant) => variant.isDefault && variant.isActive !== false) || purchasableVariants[0] || allVariants[0]
    setSelectedVariantId(String(preferred?._id || preferred?.id || 'legacy-default'))
    setQuantity(1)
  }, [allVariants, purchasableVariants, requestedVariantId])

  const selectedVariant = allVariants.find((variant) => String(variant?._id || variant?.id || 'legacy-default') === selectedVariantId)
    || purchasableVariants[0]
  const selectedStock = Number(selectedVariant?.stock ?? product?.stock ?? 0)
  const selectedPrice = typeof selectedVariant?.discountPrice === 'number' && selectedVariant.discountPrice > 0
    ? selectedVariant.discountPrice
    : selectedVariant?.price ?? product?.price
  const originalPrice = typeof selectedVariant?.discountPrice === 'number' && selectedVariant.discountPrice > 0
    ? selectedVariant.price
    : null
  const discountPercent = originalPrice ? Math.round(((originalPrice - selectedPrice) / originalPrice) * 100) : 0
  const hasStructuredVariants = Array.isArray(product?.variants) && product.variants.length > 0
  const isInStock = selectedVariant?.isActive !== false && selectedStock > 0
  const medicineDetails = product?.medicineDetails || {}
  const parapharmacyDetails = product?.parapharmacyDetails || {}
  const isMedicine = product?.productType === 'PHARMACY_MEDICINE'
    || (!product?.productType && String(product?.sellerType || '').toUpperCase() !== 'PARAPHARMACY')
  const requiresPrescription = Boolean(product?.requiresPrescription)
  const role = String(user?.role || '').toUpperCase()
  const isPetOwner = role === 'PET_OWNER'
  const selectedPrescriptionVariantId = hasStructuredVariants ? selectedVariant?._id || selectedVariant?.id || null : null
  const prescriptionEligibilityQuery = useProductPrescriptionEligibility(
    product?._id || productId,
    selectedPrescriptionVariantId,
    { enabled: requiresPrescription && isPetOwner }
  )
  const submitPrescriptionRequest = useSubmitProductPrescriptionRequest()
  const prescriptionEligibilityPayload = prescriptionEligibilityQuery.data?.data ?? prescriptionEligibilityQuery.data
  const prescriptionEligibility = prescriptionEligibilityPayload?.data ?? prescriptionEligibilityPayload
  const prescriptionStatus = prescriptionEligibility?.status || (requiresPrescription ? 'NOT_SUBMITTED' : null)
  const canPurchase = !requiresPrescription || (isPetOwner && prescriptionEligibility?.canPurchase === true)

  useEffect(() => {
    if (selectedStock > 0 && quantity > selectedStock) setQuantity(selectedStock)
  }, [selectedStock, quantity])

  const handleQuantityChange = (delta) => {
    const next = quantity + delta
    if (next < 1) return
    if (selectedStock && next > selectedStock) {
      toast.warning(t('shop.variantAvailability', { count: selectedStock }))
      return
    }
    setQuantity(next)
  }

  const selectVariant = (variant) => {
    const nextVariantId = String(variant?._id || variant?.id || 'legacy-default')
    if (nextVariantId !== selectedVariantId) {
      setSelectedVariantId(nextVariantId)
      setQuantity(1)
    }
  }

  const ensureAdd = (goCheckout) => {
    if (!product) return
    if (requiresPrescription && !canPurchase) {
      toast.error(t('shop.prescriptionBlocked'))
      return
    }
    if (!isInStock) {
      toast.error(t('shop.outOfStockVariant'))
      return
    }

    addToCart(product, quantity, { variant: hasStructuredVariants ? selectedVariant : null })

    if (goCheckout) {
      navigate('/product-checkout')
      return
    }

    toast.success(t('shop.addedToCart', { quantity, name: `${product.name}${selectedVariant ? ` (${variantLabel(selectedVariant, t('shop.standardPack'), t('shop.units'))})` : ''}` }))
  }

  const handlePrescriptionFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !product) return
    if (!isPetOwner) {
      toast.info(t('shop.prescriptionLogin'))
      navigate('/login')
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error(t('shop.prescriptionFileSize'))
      return
    }
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (file.type && !allowedTypes.includes(file.type)) {
      toast.error(t('shop.prescriptionFileType'))
      return
    }

    try {
      setIsUploadingPrescription(true)
      const formData = new FormData()
      formData.append('file', file, file.name)
      const uploadResponse = await api.upload(API_ROUTES.UPLOAD.PRODUCT_PRESCRIPTION, formData)
      const uploadPayload = uploadResponse?.data ?? uploadResponse
      const prescriptionUrl = uploadPayload?.data?.url || uploadPayload?.url
      if (!prescriptionUrl) throw new Error(t('shop.prescriptionFailed'))

      await submitPrescriptionRequest.mutateAsync({
        productId: product._id || product.id,
        variantId: selectedPrescriptionVariantId,
        prescriptionUrl,
        originalName: file.name,
        mimeType: file.type || null,
      })
      toast.success(t('shop.prescriptionSubmitted'))
    } catch (error) {
      toast.error(error?.message || t('shop.prescriptionFailed'))
    } finally {
      setIsUploadingPrescription(false)
    }
  }

  if (productQuery.isLoading) {
    return (
      <>
        <Breadcrumb title={t('shop.pharmacy')} li1={t('shop.details')} li2={t('shop.loading')} />
        <div className="content"><div className="container"><div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">{t('shop.loading')}</span></div></div></div></div>
      </>
    )
  }

  if (productQuery.isError || !product) {
    return (
      <>
        <Breadcrumb title={t('shop.pharmacy')} li1={t('shop.details')} li2={t('common.notFound', 'Not found')} />
        <div className="content"><div className="container"><div className="alert alert-danger"><h5>{t('shop.product')} {t('common.notFound', 'Not found')}</h5><p>{t('shop.noProducts')}</p><Link to="/product-all" className="btn btn-primary">{t('shop.browseProducts')}</Link></div></div></div>
      </>
    )
  }

  const productImage = getImageUrl(product?.images?.[0]) || '/assets/img/products/product.jpg'
  const selectedPack = [
    selectedVariant?.packageType,
    selectedVariant?.unitsPerPack ? `${selectedVariant.unitsPerPack} ${selectedVariant.unitLabel || t('shop.units')}` : '',
    selectedVariant?.packageDescription,
  ].filter(Boolean).join(' · ')

  return (
    <>
      <Breadcrumb title={t('shop.pharmacy')} li1={t('shop.details')} li2={product?.name || t('shop.product')} />
      <div className="content pharmacy-product-detail-mobile">
        <div className="container">
          <div className="row">
            <div className="col-md-7 col-lg-9 col-xl-9">
              <div className="card">
                <div className="card-body product-description pharmacy-product-summary">
                  <div className="doctor-widget">
                    <div className="doc-info-left">
                      <div className="doctor-img1">
                        <img src={productImage} className="img-fluid" alt={product?.name} onError={(e) => { e.currentTarget.src = '/assets/img/products/product.jpg' }} />
                      </div>
                      <div className="doc-info-cont product-cont">
                        <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                          <h4 className="doc-name mb-0">{product?.name}</h4>
                          <span className={`badge ${isMedicine ? 'bg-primary' : 'bg-info text-dark'}`}>{isMedicine ? t('shop.medicine') : t('shop.parapharmacyProduct')}</span>
                          {product?.requiresPrescription && <span className="badge bg-warning text-dark">{t('shop.prescriptionRequired')}</span>}
                        </div>
                        {product?.brand && <p className="mb-2"><span className="text-muted">{t('shop.brand')} </span>{product.brand}</p>}
                        {product?.petStoreId?.name && <p className="mb-2"><span className="text-muted">{t('shop.soldBy')} </span>{product.petStoreId.name}</p>}
                        <p>{product?.description || t('shop.noDescription')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <h3 className="mb-3">{t('shop.details')}</h3>
                  <div className="widget about-widget mb-4">
                    <h4 className="widget-title">{t('shop.selectedVariant')}</h4>
                    <div className="row product-detail-facts">
                      <DetailRow label={t('shop.variant')} value={variantLabel(selectedVariant, t('shop.standardPack'), t('shop.units'))} />
                      <DetailRow label={t('shop.strength')} value={selectedVariant?.strengthValue ? `${selectedVariant.strengthValue} ${selectedVariant.strengthUnit || ''}`.trim() : null} />
                      <DetailRow label={isMedicine ? t('shop.dosageForm') : t('shop.productFormat')} value={selectedVariant?.dosageForm} />
                      <DetailRow label={t('shop.package')} value={selectedPack} />
                      <DetailRow label={t('shop.variantSku')} value={selectedVariant?.sku || product?.sku} />
                      <DetailRow label={t('shop.variantBarcode')} value={selectedVariant?.barcode || product?.barcode} />
                    </div>
                  </div>

                  {allVariants.length > 1 && (
                    <div className="widget about-widget mb-4">
                      <h4 className="widget-title">{t('shop.availableVariants')}</h4>
                      <div className="table-responsive">
                        <table className="table table-sm align-middle mb-0 product-variant-mobile-table">
                          <thead><tr><th>{t('shop.variant')}</th><th>{t('shop.strength')} / {t('shop.productFormat')}</th><th>{t('shop.package')}</th><th>{t('shop.price')}</th><th>{t('shop.status')}</th><th className="text-end">{t('shop.select')}</th></tr></thead>
                          <tbody>
                            {allVariants.map((variant, index) => {
                              const variantPrice = typeof variant.discountPrice === 'number' && variant.discountPrice > 0 ? variant.discountPrice : variant.price
                              const variantPack = [variant.packageType, variant.unitsPerPack ? `${variant.unitsPerPack} ${variant.unitLabel || t('shop.units')}` : ''].filter(Boolean).join(' · ')
                              const variantId = String(variant._id || variant.id || 'legacy-default')
                              const isSelected = variantId === selectedVariantId
                              return <tr
                                key={variant._id || index}
                                className={isSelected ? 'table-primary' : ''}
                                role="button"
                                tabIndex={0}
                                aria-pressed={isSelected}
                                onClick={() => selectVariant(variant)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault()
                                    selectVariant(variant)
                                  }
                                }}
                                style={{ cursor: 'pointer' }}
                              >
                                <td data-label={t('shop.variant')}>{variantLabel(variant, `${t('shop.variant')} ${index + 1}`, t('shop.units'))}{variant.isDefault && <span className="badge bg-secondary ms-2">{t('shop.default')}</span>}</td>
                                <td data-label={`${t('shop.strength')} / ${t('shop.productFormat')}`}>{[variant.strengthValue ? `${variant.strengthValue} ${variant.strengthUnit || ''}`.trim() : '', variant.dosageForm].filter(Boolean).join(' · ') || '—'}</td>
                                <td data-label={t('shop.package')}>{variantPack || variant.packageDescription || '—'}</td>
                                <td data-label={t('shop.price')}>€{Number(variantPrice || 0).toFixed(2)}</td>
                                <td data-label={t('shop.availability')}>{variant.isActive === false ? t('shop.unavailable') : variant.stock > 0 ? t('shop.inStock', { count: variant.stock }) : t('shop.outOfStock')}</td>
                                <td data-label={t('shop.select')} className="text-end"><button type="button" className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline-primary'}`} onClick={(event) => { event.stopPropagation(); selectVariant(variant) }}>{isSelected ? t('shop.selected') : t('shop.choose')}</button></td>
                              </tr>
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {isMedicine ? (
                    <div className="widget about-widget mb-4">
                      <h4 className="widget-title">{t('shop.medicineInfo')}</h4>
                      <div className="row product-detail-facts">
                        <DetailRow label={t('shop.activeIngredients')} value={medicineDetails.activeIngredients} />
                        <DetailRow label={t('shop.administrationRoute')} value={medicineDetails.administrationRoute} />
                        <DetailRow label={t('shop.targetSpecies')} value={medicineDetails.targetSpecies?.length ? medicineDetails.targetSpecies : product.petType} />
                        <DetailRow label={t('shop.manufacturer')} value={medicineDetails.manufacturer || product.manufacturer} />
                        <DetailRow label={t('shop.indications')} value={medicineDetails.indications} />
                        <DetailRow label={t('shop.dosageNotes')} value={medicineDetails.dosageInstructions} />
                        <DetailRow label={t('shop.warnings')} value={medicineDetails.warnings} />
                        <DetailRow label={t('shop.storage')} value={medicineDetails.storageInstructions} />
                        <DetailRow label={t('shop.authorizationNumber')} value={medicineDetails.aicNumber} />
                        <DetailRow label={t('shop.authorizationHolder')} value={medicineDetails.authorizationHolder} />
                        {medicineDetails.leafletUrl && <div className="col-md-6 mb-3"><div className="text-muted small mb-1">{t('shop.leaflet')}</div><a href={medicineDetails.leafletUrl} target="_blank" rel="noreferrer">{t('shop.openLeaflet')}</a></div>}
                      </div>
                    </div>
                  ) : (
                    <div className="widget about-widget mb-4">
                      <h4 className="widget-title">{t('shop.parapharmacyInfo')}</h4>
                      <div className="row product-detail-facts">
                        <DetailRow label={t('shop.productClass')} value={parapharmacyDetails.productClass} />
                        <DetailRow label={t('shop.lifeStage')} value={parapharmacyDetails.lifeStage} />
                        <DetailRow label={t('shop.targetSpecies')} value={parapharmacyDetails.targetSpecies?.length ? parapharmacyDetails.targetSpecies : product.petType} />
                        <DetailRow label={t('shop.manufacturer')} value={parapharmacyDetails.manufacturer || product.manufacturer} />
                        <DetailRow label={t('shop.ingredients')} value={parapharmacyDetails.ingredients} />
                        <DetailRow label={t('shop.allergenInfo')} value={parapharmacyDetails.allergens} />
                        <DetailRow label={t('shop.usageInstructions')} value={parapharmacyDetails.usageInstructions} />
                        <DetailRow label={t('shop.warnings')} value={parapharmacyDetails.warnings} />
                        <DetailRow label={t('shop.storage')} value={parapharmacyDetails.storageInstructions} />
                      </div>
                    </div>
                  )}

                  <div className="widget about-widget mb-0"><h4 className="widget-title">{t('shop.description')}</h4><p className="mb-0">{product?.description || t('shop.noDescription')}</p></div>
                </div>
              </div>
            </div>

            <div className="col-md-5 col-lg-3 col-xl-3 theiaStickySidebar">
              <div className="card search-filter pharmacy-product-purchase-card"><div className="card-body">
                {allVariants.length > 1 && (
                  <div className="mb-3">
                    <label className="form-label">{t('shop.chooseVariant')}</label>
                    <select className="form-select" value={selectedVariantId} onChange={(e) => selectVariant(allVariants.find((variant) => String(variant?._id || variant?.id || 'legacy-default') === e.target.value))}>
                      {allVariants.map((variant, index) => <option key={variant._id || variant.id || index} value={String(variant._id || variant.id || 'legacy-default')}>{variantLabel(variant, `${t('shop.variant')} ${index + 1}`, t('shop.units'))}{variant.isActive === false ? ` — ${t('shop.unavailable').toLowerCase()}` : ''}</option>)}
                    </select>
                  </div>
                )}
                <div className="clini-infos mt-0"><h2>€{Number(selectedPrice || 0).toFixed(2)}{originalPrice !== null && <>{' '}<b className="text-lg strike">€{Number(originalPrice || 0).toFixed(2)}</b>{' '}<span className="text-lg text-success"><b>{t('shop.discount', { count: discountPercent })}</b></span></>}</h2></div>
                <span className={`badge ${isInStock ? 'badge-primary' : 'badge-danger'}`}>{isInStock ? t('shop.inStock', { count: selectedStock }) : t('shop.outOfStock')}</span>

                {requiresPrescription && (
                  <div className="mt-3 rounded-3 p-3" style={{ background: '#f4f8ff', border: '1px solid #cfe0ff' }}>
                    <div className="d-flex align-items-start gap-2">
                      <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 34, height: 34, background: '#e0ebff', color: '#0d6efd' }}>
                        <i className="fa-solid fa-file-prescription"></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-semibold">{t('shop.prescriptionRequired')}</div>
                        {prescriptionEligibilityQuery.isLoading ? (
                          <div className="text-muted small mt-1">{t('shop.checkingPrescription')}</div>
                        ) : !isPetOwner ? (
                          <div className="text-muted small mt-1">{t('shop.prescriptionLoginHint')}</div>
                        ) : prescriptionStatus === 'APPROVED' ? (
                          <div className="text-success small mt-1"><i className="fa-solid fa-circle-check me-1"></i>{t('shop.prescriptionApproved')}</div>
                        ) : prescriptionStatus === 'PENDING' ? (
                          <div className="text-warning small mt-1"><i className="fa-solid fa-clock me-1"></i>{t('shop.prescriptionPending')}</div>
                        ) : prescriptionStatus === 'REJECTED' ? (
                          <div className="text-danger small mt-1"><i className="fa-solid fa-circle-exclamation me-1"></i>{prescriptionEligibility?.request?.reviewNotes || t('shop.prescriptionRejected')}</div>
                        ) : (
                          <div className="text-muted small mt-1">{t('shop.prescriptionUploadHint')}</div>
                        )}
                      </div>
                    </div>
                    {isPetOwner && prescriptionStatus !== 'APPROVED' && prescriptionStatus !== 'PENDING' && (
                      <>
                        <input ref={prescriptionInputRef} type="file" className="d-none" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" onChange={handlePrescriptionFile} />
                        <button type="button" className="btn btn-sm btn-primary w-100 mt-3" onClick={() => prescriptionInputRef.current?.click()} disabled={isUploadingPrescription || submitPrescriptionRequest.isPending}>
                          <i className="fa-solid fa-upload me-2"></i>{isUploadingPrescription ? t('shop.uploadingPrescription') : prescriptionStatus === 'REJECTED' ? t('shop.uploadNewPrescription') : t('shop.uploadPrescription')}
                        </button>
                      </>
                    )}
                  </div>
                )}

                <div className="custom-increment pt-4"><div className="input-group1">
                  <span className="input-group-btn float-start"><button type="button" className="quantity-left-minus btn btn-danger btn-number" onClick={() => handleQuantityChange(-1)}><span><i className="fas fa-minus"></i></span></button></span>
                  <input type="text" className="input-number" value={quantity} readOnly />
                  <span className="input-group-btn float-end"><button type="button" className="quantity-right-plus btn btn-success btn-number" onClick={() => handleQuantityChange(1)} disabled={selectedStock ? quantity >= selectedStock : true}><span><i className="fas fa-plus"></i></span></button></span>
                </div></div>

                <div className="clinic-details mt-4 rounded-3 p-2" style={{ background: '#f8fafc', border: '1px solid #e8eef6' }}><div className="clinic-booking d-grid" style={{ gap: 10 }}>
                  <button type="button" className="apt-btn shadow-sm" onClick={() => ensureAdd(false)} disabled={!isInStock || !canPurchase}>
                    <i className="fa-solid fa-cart-plus me-2"></i>{t('shop.addToCart')}
                  </button>
                  <button type="button" className="btn btn-outline-primary shadow-sm" onClick={() => ensureAdd(true)} disabled={!isInStock || !canPurchase}>
                    <i className="fa-solid fa-bag-shopping me-2"></i>{t('shop.buyNow')}
                  </button>
                </div></div>

                <div className="card flex-fill mt-4 mb-0"><ul className="list-group list-group-flush">
                  <li className="list-group-item">{t('shop.sku')} <span className="float-end">{selectedVariant?.sku || product?.sku || '—'}</span></li>
                  <li className="list-group-item">{t('shop.package')} <span className="float-end text-end" style={{ maxWidth: '60%' }}>{selectedPack || '—'}</span></li>
                  {product?.category && <li className="list-group-item">{t('shop.category')} <span className="float-end">{product.category}</span></li>}
                </ul></div>
              </div></div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ProductDescription
