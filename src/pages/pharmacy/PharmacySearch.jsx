import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Breadcrumb from '../../components/common/Breadcrumb'
import { usePetStores } from '../../queries/petStoreQueries'
import { getImageUrl } from '../../utils/apiConfig'

const extractPetStoreList = (payload) => {
  const outer = payload?.data ?? payload
  const data = outer?.data ?? outer
  const list = data?.petStores ?? data?.items
  const pagination = data?.pagination
  return {
    petStores: Array.isArray(list) ? list : [],
    pagination: pagination || { page: 1, limit: 10, total: 0, pages: 1 },
  }
}

const PharmacySearch = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const search = searchParams.get('search') || ''
  const city = searchParams.get('city') || ''
  const kind = searchParams.get('kind') || 'PHARMACY'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 10

  const [searchTerm, setSearchTerm] = useState(search)
  const [cityFilter, setCityFilter] = useState(city)
  const [selectedKind, setSelectedKind] = useState(kind)

  const storesQuery = usePetStores({ kind: selectedKind, search, city, page, limit })
  const { petStores, pagination } = useMemo(() => extractPetStoreList(storesQuery.data), [storesQuery.data])

  const cities = useMemo(
    () => Array.from(new Set(petStores.map((p) => p?.address?.city).filter(Boolean))).sort(),
    [petStores]
  )

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)
    params.set('kind', selectedKind)

    if (searchTerm) params.set('search', searchTerm)
    else params.delete('search')

    if (cityFilter) params.set('city', cityFilter)
    else params.delete('city')

    params.set('page', '1')
    setSearchParams(params)
  }

  const handleKindChange = (nextKind) => {
    if (nextKind === selectedKind) return
    setSelectedKind(nextKind)
    const params = new URLSearchParams(searchParams)
    params.set('kind', nextKind)
    params.set('page', '1')
    setSearchParams(params)
  }

  const handleCityChange = (nextCity) => {
    const params = new URLSearchParams(searchParams)
    if (nextCity && nextCity !== cityFilter) {
      params.set('city', nextCity)
      setCityFilter(nextCity)
    } else {
      params.delete('city')
      setCityFilter('')
    }
    params.set('page', '1')
    setSearchParams(params)
  }

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage.toString())
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const formatAddress = (address) => {
    if (!address) return 'Address not available'
    const parts = [address.line1, address.line2, address.city, address.state, address.country, address.zip].filter(Boolean)
    return parts.join(', ') || 'Address not available'
  }

  return (
    <>
      <Breadcrumb title="Pharmacy" li1="Pharmacy Search" li2="Pharmacy Search" />
      <div className="content">
        <div className="container">
          <div className="row">
            <div className="col-md-12 col-lg-4 col-xl-3 theiaStickySidebar">
              <div className="card search-filter">
                <div className="card-header">
                  <h4 className="card-title mb-0">Search Filter</h4>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSearch}>
                    <div className="filter-widget mb-3">
                      <label className="mb-2">Search</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder={selectedKind === 'PARAPHARMACY' ? 'Search parapharmacies...' : 'Search pharmacies...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="filter-widget mb-3">
                      <label className="mb-2">Location / City</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter city..."
                        value={cityFilter}
                        onChange={(e) => setCityFilter(e.target.value)}
                      />
                    </div>

                    {cities.length > 0 && (
                      <div className="filter-widget mb-3">
                        <h4>Popular Cities</h4>
                        {cities.slice(0, 5).map((cityName, idx) => (
                          <div key={idx}>
                            <label className="custom_check">
                              <input
                                type="checkbox"
                                checked={cityFilter === cityName}
                                onChange={() => handleCityChange(cityName)}
                              />
                              <span className="checkmark"></span> {cityName}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="btn-search">
                      <button type="submit" className="btn w-100">Search</button>
                    </div>
                    <div className="btn-search mt-2">
                      <button
                        type="button"
                        className="btn btn-outline-secondary w-100"
                        onClick={() => {
                          setSearchTerm('')
                          setCityFilter('')
                          setSelectedKind('PHARMACY')
                          setSearchParams({ kind: 'PHARMACY' })
                        }}
                      >
                        Clear Filters
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <div className="col-md-12 col-lg-8 col-xl-9">
              <div className="mb-3">
                <div className="btn-group" role="group" aria-label="Pharmacy kind">
                  <button
                    type="button"
                    className={`btn ${selectedKind === 'PHARMACY' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => handleKindChange('PHARMACY')}
                  >
                    Pharmacies
                  </button>
                  <button
                    type="button"
                    className={`btn ${selectedKind === 'PARAPHARMACY' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => handleKindChange('PARAPHARMACY')}
                  >
                    Parapharmacies
                  </button>
                </div>
              </div>

              {storesQuery.isLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : storesQuery.isError ? (
                <div className="alert alert-danger">{storesQuery.error?.message || 'Failed to load pharmacies'}</div>
              ) : petStores.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted">No results found. Try adjusting your search filters.</p>
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <p className="text-muted">
                      Showing {petStores.length} of {pagination.total} {selectedKind === 'PARAPHARMACY' ? 'parapharmacies' : 'pharmacies'}
                    </p>
                  </div>

                  {petStores.map((store) => {
                    const id = store?._id || store?.id
                    const owner = store?.ownerId
                    const logo = getImageUrl(store?.logo || owner?.profileImage) || '/assets/img/medical-img1.jpg'
                    const address = formatAddress(store?.address)
                    const phone = store?.phone || owner?.phone || 'Phone not available'
                    const ownerId = typeof owner === 'object' ? owner?._id : owner

                    return (
                      <div key={id} className="card mb-3">
                        <div className="card-body">
                          <div className="doctor-widget">
                            <div className="doc-info-left">
                              <div className="doctor-img1" style={{ width: '100px', height: '100px', overflow: 'hidden', flexShrink: 0 }}>
                                <Link to={id ? `/pharmacy-details?id=${id}` : '/pharmacy-search'} style={{ display: 'block', width: '100%', height: '100%' }}>
                                  <img
                                    src={logo}
                                    className="img-fluid"
                                    alt={store?.name}
                                    style={{ width: '100px', height: '70px', maxWidth: '100px', maxHeight: '70px', objectFit: 'cover', display: 'block' }}
                                    onError={(e) => {
                                      e.currentTarget.src = '/assets/img/medical-img1.jpg'
                                    }}
                                  />
                                </Link>
                              </div>
                              <div className="doc-info-cont">
                                <h4 className="doc-name mb-2">
                                  <Link to={id ? `/pharmacy-details?id=${id}` : '/pharmacy-search'}>{store?.name}</Link>
                                </h4>
                                <div className="clinic-details">
                                  <p className="doc-location mb-2">
                                    <i className="fas fa-phone-volume me-1"></i> {phone}
                                  </p>
                                  <p className="doc-location mb-2 text-ellipse">
                                    <i className="fas fa-map-marker-alt me-1"></i> {address}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="doc-info-right">
                              <div className="clinic-booking">
                                <Link
                                  to={`/product-all?sellerId=${ownerId || ''}&sellerType=PET_STORE`}
                                  className="view-pro-btn"
                                >
                                  Browse Products
                                </Link>
                                {store?.phone && (
                                  <a className="apt-btn" href={`tel:${store.phone}`}>
                                    Call Now
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {pagination.pages > 1 && (
                    <div className="row mt-4">
                      <div className="col-md-12">
                        <nav>
                          <ul className="pagination justify-content-center">
                            <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                              <button className="page-link" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
                                Previous
                              </button>
                            </li>
                            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((n) => (
                              <li key={n} className={`page-item ${page === n ? 'active' : ''}`}>
                                <button className="page-link" onClick={() => handlePageChange(n)}>
                                  {n}
                                </button>
                              </li>
                            ))}
                            <li className={`page-item ${page === pagination.pages ? 'disabled' : ''}`}>
                              <button
                                className="page-link"
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page === pagination.pages}
                              >
                                Next
                              </button>
                            </li>
                          </ul>
                        </nav>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default PharmacySearch

