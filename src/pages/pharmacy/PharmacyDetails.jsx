import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Breadcrumb from '../../components/common/Breadcrumb'
import { usePetStore } from '../../queries/petStoreQueries'
import { useProducts } from '../../queries/productQueries'
import { getImageUrl } from '../../utils/apiConfig'
import { useLanguage } from '../../contexts/LanguageContext'

const PharmacyDetails = () => {
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const petStoreId = searchParams.get('id')

  const storeQuery = usePetStore(petStoreId)

  const store = useMemo(() => {
    const payload = storeQuery.data?.data ?? storeQuery.data
    return payload?.data ?? payload
  }, [storeQuery.data])

  const owner = store?.ownerId
  const ownerId = typeof owner === 'object' ? owner?._id : owner

  const productsQuery = useProducts({ sellerId: ownerId, limit: 6, page: 1 })
  const products = useMemo(() => {
    const payload = productsQuery.data?.data ?? productsQuery.data
    const data = payload?.data ?? payload
    return Array.isArray(data?.products) ? data.products : []
  }, [productsQuery.data])

  const formatAddress = (address) => {
    if (!address) return t('shop.addressUnavailable')
    const parts = [address.line1, address.line2, address.city, address.state, address.country, address.zip].filter(Boolean)
    return parts.join(', ') || t('shop.addressUnavailable')
  }

  if (storeQuery.isLoading) {
    return (
      <>
        <Breadcrumb title={t('shop.pharmacy')} li1={t('shop.pharmacy')} li2={t('shop.loading')} />
        <div className="content">
          <div className="container">
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">{t('shop.loading')}</span>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (storeQuery.isError || !store) {
    return (
      <>
        <Breadcrumb title={t('shop.pharmacy')} li1={t('shop.pharmacy')} li2={t('common.notFound', 'Not found')} />
        <div className="content">
          <div className="container">
            <div className="alert alert-danger">
              <h5>{t('shop.pharmacy')} {t('common.notFound', 'Not found')}</h5>
              <p>{t('shop.noResults')}</p>
              <Link to="/pharmacy-search" className="btn btn-primary">{t('shop.pharmacies')}</Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  const storeLogo = getImageUrl(store?.logo || owner?.profileImage) || '/assets/img/medical-img1.jpg'
  const storeAddress = formatAddress(store?.address)
  const storePhone = store?.phone || owner?.phone || t('shop.phoneUnavailable')
  const storeKind = String(store?.kind || '').toUpperCase() === 'PARAPHARMACY' ? t('shop.parapharmacy') : t('shop.pharmacy')

  return (
    <>
      <Breadcrumb title={t('shop.pharmacy')} li1={storeKind} li2={store?.name || storeKind} />
      <div className="content pharmacy-details-mobile">
        <div className="container">
          <div className="card pharmacy-details-hero-card">
            <div className="card-body">
              <div className="doctor-widget">
                <div className="doc-info-left">
                  <div className="doctor-img1" style={{ width: '100px', height: '100px', overflow: 'hidden', flexShrink: 0 }}>
                    <img
                      src={storeLogo}
                      className="img-fluid"
                      alt={store?.name}
                      style={{ width: '100px', height: '70px', objectFit: 'cover', display: 'block' }}
                      onError={(e) => {
                        e.currentTarget.src = '/assets/img/medical-img1.jpg'
                      }}
                    />
                  </div>
                  <div className="doc-info-cont">
                    <h4 className="doc-name mb-2">{store?.name}</h4>
                    <div className="clinic-details">
                      <div className="clini-infos pt-3">
                        <p className="doc-location mb-2">
                          <i className="fas fa-store me-1"></i> {storeKind}
                        </p>
                        <p className="doc-location mb-2">
                          <i className="fas fa-phone-volume me-1"></i> {storePhone}
                        </p>
                        <p className="doc-location mb-2 text-ellipse">
                          <i className="fas fa-map-marker-alt me-1"></i> {storeAddress}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="doc-info-right d-flex align-items-center justify-content-center">
                  <div className="clinic-booking">
                    <Link to={`/product-all?sellerId=${ownerId || ''}`} className="view-pro-btn">
                      {t('shop.browseProducts')}
                    </Link>
                    {store?.phone && (
                      <a className="apt-btn" href={`tel:${store.phone}`}>
                        {t('shop.callNow')}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body pt-0">
              <nav className="user-tabs mb-4">
                <ul className="nav nav-tabs nav-tabs-bottom nav-justified pharmacy-details-tabs">
                  <li className="nav-item">
                    <a className="nav-link active" href="#pharmacy_overview" data-bs-toggle="tab">{t('patient.reports.overview')}</a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="#pharmacy_locations" data-bs-toggle="tab">{t('shop.locationCity')}</a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="#pharmacy_products" data-bs-toggle="tab">{t('shop.products')}</a>
                  </li>
                </ul>
              </nav>

              <div className="tab-content pt-0">
                <div role="tabpanel" id="pharmacy_overview" className="tab-pane fade show active">
                  <div className="row pharmacy-details-products-grid">
                    <div className="col-md-9">
                      <div className="widget about-widget">
                        <h4 className="widget-title">{t('publicPages.about.title')} {storeKind}</h4>
                        <p>
                          {t('shop.pharmacy')} {store?.name} · {storeAddress}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div role="tabpanel" id="pharmacy_locations" className="tab-pane fade">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="widget locations-widget">
                        <h4 className="widget-title">{t('shop.locationCity')}</h4>
                        <p>{storeAddress}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div role="tabpanel" id="pharmacy_products" className="tab-pane fade">
                  <div className="row">
                    {productsQuery.isLoading ? (
                      <div className="col-12 text-center py-4 text-muted">{t('shop.loading')}</div>
                    ) : products.length === 0 ? (
                      <div className="col-12 text-center py-4 text-muted">{t('shop.noProducts')}</div>
                    ) : (
                      products.map((p) => {
                        const img = getImageUrl(p?.images?.[0]) || '/assets/img/products/product.jpg'
                        const price = typeof p?.discountPrice === 'number' && p.discountPrice > 0 ? p.discountPrice : p?.price
                        return (
                          <div key={p?._id} className="col-6 col-lg-4 mb-3">
                            <div className="card">
                              <div className="card-body">
                                <Link to={`/product-description?id=${p?._id}`} className="text-decoration-none">
                                  <div className="d-flex" style={{ gap: 12 }}>
                                    <img
                                      src={img}
                                      alt={p?.name}
                                      style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover' }}
                                      onError={(e) => {
                                        e.currentTarget.src = '/assets/img/products/product.jpg'
                                      }}
                                    />
                                    <div>
                                      <div className="fw-semibold">{p?.name}</div>
                                      <div className="text-muted small">€{Number(price || 0).toFixed(2)}</div>
                                    </div>
                                  </div>
                                </Link>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                  <div className="mt-2">
                    <Link to={`/product-all?sellerId=${ownerId || ''}`} className="btn btn-outline-primary">
                      {t('shop.allProducts')}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default PharmacyDetails

