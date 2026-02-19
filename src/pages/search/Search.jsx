import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../../contexts/AuthContext'
import { useVeterinarians } from '../../queries/veterinarianQueries'
import { useSpecializations } from '../../queries/specializationQueries'
import { useFavorites } from '../../queries/favoriteQueries'
import { useAddFavorite, useRemoveFavorite } from '../../mutations/favoriteMutations'
import { getImageUrl } from '../../utils/apiConfig'
import Breadcrumb from '../../components/common/Breadcrumb'

const Search = () => {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [location, setLocation] = useState('')
  const [selectedSpecialization, setSelectedSpecialization] = useState('')
  const [showAvailability, setShowAvailability] = useState(false)
  const [page, setPage] = useState(1)
  const limit = 12

  const [favoriteOverrides, setFavoriteOverrides] = useState({})
  const [favoriteIdOverrides, setFavoriteIdOverrides] = useState({})

  const queryParams = useMemo(() => {
    const params = { page, limit }
    if (searchTerm?.trim()) params.search = searchTerm.trim()
    if (location?.trim()) params.city = location.trim()
    if (selectedSpecialization) params.specialization = selectedSpecialization
    if (showAvailability) params.isAvailableOnline = true
    return params
  }, [searchTerm, location, selectedSpecialization, showAvailability, page, limit])

  const userId = user?.id || user?._id
  const { data: vetsData, isLoading, error } = useVeterinarians(queryParams)
  const { data: specsData } = useSpecializations()
  const { data: favoritesData } = useFavorites(userId, { limit: 500 })
  const addFavorite = useAddFavorite()
  const removeFavorite = useRemoveFavorite()

  useEffect(() => {
    setFavoriteOverrides({})
    setFavoriteIdOverrides({})
  }, [favoritesData])

  const veterinarians = useMemo(() => {
    const raw = vetsData?.data
    if (!raw || !raw.veterinarians) return []
    return raw.veterinarians
  }, [vetsData])

  const pagination = useMemo(() => {
    const raw = vetsData?.data
    return raw?.pagination || { page: 1, limit: 12, total: 0, pages: 0 }
  }, [vetsData])

  const specializationsList = useMemo(() => {
    const raw = specsData?.data?.data ?? specsData?.data ?? specsData
    return Array.isArray(raw) ? raw : []
  }, [specsData])

  const specializationOptions = useMemo(() => {
    return specializationsList
      .map((spec) => {
        const derivedCodeFromName = spec?.name?.toUpperCase()?.replace(/\s+/g, '_')
        const derivedCodeFromSlug = spec?.slug?.toUpperCase()?.replace(/-/g, '_')
        const code = spec?.type || derivedCodeFromSlug || derivedCodeFromName
        if (!code) return null
        return { code, name: spec?.name || code }
      })
      .filter(Boolean)
  }, [specializationsList])

  const specializationNameByCode = useMemo(() => {
    const map = {}
    specializationOptions.forEach((o) => {
      map[String(o.code)] = o.name
    })
    return map
  }, [specializationOptions])

  const favoriteVetIds = useMemo(() => {
    const raw = favoritesData?.data
    const list = raw?.favorites || []
    return new Set(
      list.map((f) => {
        const v = f.veterinarianId
        return v && (typeof v === 'object' ? v._id : v)
      }).filter(Boolean).map(String)
    )
  }, [favoritesData])

  const favoriteIdByVetId = useMemo(() => {
    const raw = favoritesData?.data
    const list = raw?.favorites || []
    const map = {}
    list.forEach((f) => {
      const v = f.veterinarianId
      const vid = v && (typeof v === 'object' ? v._id : v)
      if (vid && f._id) map[String(vid)] = f._id
    })
    return map
  }, [favoritesData])

  const handleFavoriteToggle = (e, vetUserId) => {
    e.preventDefault()
    if (!user || user.role !== 'PET_OWNER') {
      toast.info('Please log in as a pet owner to add favorites')
      return
    }
    const idStr = String(vetUserId)

    const currentlyFav =
      favoriteOverrides[idStr] !== undefined
        ? favoriteOverrides[idStr]
        : favoriteVetIds.has(idStr)

    if (currentlyFav) {
      const favId = favoriteIdOverrides[idStr] || favoriteIdByVetId[idStr]
      if (favId) {
        setFavoriteOverrides((prev) => ({ ...prev, [idStr]: false }))
        removeFavorite.mutate(favId, {
          onSuccess: () => toast.success('Removed from favorites'),
          onError: (err) => {
            setFavoriteOverrides((prev) => ({ ...prev, [idStr]: true }))
            toast.error(err?.response?.data?.message || err?.message || 'Failed to remove from favorites')
          },
        })
      } else toast.error('Favorite not found')
    } else {
      setFavoriteOverrides((prev) => ({ ...prev, [idStr]: true }))
      addFavorite.mutate(vetUserId, {
        onSuccess: (res) => {
          const created = res?.data?.data
          const favId = created?._id
          if (favId) {
            setFavoriteIdOverrides((prev) => ({ ...prev, [idStr]: favId }))
          }
          toast.success('Veterinarian added to favorites')
        },
        onError: (err) => {
          setFavoriteOverrides((prev) => ({ ...prev, [idStr]: false }))
          toast.error(err?.response?.data?.message || err?.message || 'Failed to add to favorites')
        },
      })
    }
  }

  const getVetName = (vet) => vet?.userId?.fullName || vet?.userId?.name || 'Veterinarian'
  const getVetImage = (vet) => getImageUrl(vet?.userId?.profileImage) || '/assets/img/doctors/doctor-01.jpg'
  const getSpecialty = (vet) => {
    const specs = vet?.specializations
    if (!Array.isArray(specs) || specs.length === 0) return 'Veterinary'

    const first = specs[0]
    if (first && typeof first === 'object') {
      const code = first.type || first.name
      return specializationNameByCode[String(code)] || first.name || 'Veterinary'
    }

    if (typeof first === 'string') {
      return specializationNameByCode[String(first)] || first
    }

    return 'Veterinary'
  }
  const getLocation = (vet) => {
    const clinics = vet?.clinics
    if (Array.isArray(clinics) && clinics[0]) {
      const c = clinics[0]
      return [c.city, c.state, c.country].filter(Boolean).join(', ') || '—'
    }
    return '—'
  }
  const getClinicImages = (vet) => {
    const clinics = vet?.clinics
    if (Array.isArray(clinics) && clinics[0]?.images?.length) {
      return clinics[0].images.slice(0, 4).map((src) => getImageUrl(src) || src)
    }
    return []
  }
  const getFee = (vet) => {
    const f = vet?.consultationFees
    if (!f) return 0
    return f.online ?? f.clinic ?? 0
  }
  const isAvailable = (vet) => vet?.isAvailableOnline !== false
  const getRating = (vet) => vet?.ratingAvg ?? 0
  const getRatingCount = (vet) => vet?.ratingCount ?? 0

  const handleSearch = (e) => {
    e?.preventDefault?.()
    setPage(1)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setLocation('')
    setSelectedSpecialization('')
    setShowAvailability(false)
    setPage(1)
  }

  const renderStars = (rating) => {
    const r = Number(rating) || 0
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i key={i} className={`fas fa-star ${i <= r ? 'filled' : ''}`} />
      )
    }
    return stars
  }

  return (
    <>
      <Breadcrumb title="Find Veterinarians" li2="Find Veterinarians" />

      <section className="search-page-header">
        <div className="container">
          <div className="doctors-search-box doctors-search-box-clean">
            <div className="search-box-one">
              <form onSubmit={handleSearch}>
                <div className="search-input search-line">
                  <i className="isax isax-hospital5 bficon"></i>
                  <div className="mb-0">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by name"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="search-input search-map-line">
                  <i className="isax isax-location5"></i>
                  <div className="mb-0">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="City"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-search-btn">
                  <button
                    className="btn btn-primary d-inline-flex align-items-center rounded-pill"
                    type="submit"
                  >
                    <i className="isax isax-search-normal-15 me-2"></i>Search
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Page Content - Search2 layout: sidebar + list */}
      <div className="content search-page-content">
        <div className="container">
          <div className="row">
            {/* Left sidebar filter */}
            <div className="col-xl-3">
              <div className="card filter-lists">
                <div className="card-header">
                  <div className="d-flex align-items-center filter-head justify-content-between">
                    <h4>Filter</h4>
                    <button type="button" className="btn btn-link p-0 text-secondary text-decoration-underline" onClick={clearFilters}>
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="card-body p-0">
                  <div className="accordion-item border-bottom">
                    <div className="accordion-header" id="headingSpec">
                      <div className="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#collapseSpec" aria-controls="collapseSpec" type="button">
                        <div className="d-flex align-items-center w-100">
                          <h5>Specializations</h5>
                          <div className="ms-auto">
                            <span><i className="fas fa-chevron-down"></i></span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div id="collapseSpec" className="accordion-collapse collapse show" aria-labelledby="headingSpec">
                      <div className="accordion-body pt-3">
                        <select
                          className="form-select form-control"
                          value={selectedSpecialization}
                          onChange={(e) => { setSelectedSpecialization(e.target.value); setPage(1) }}
                        >
                          <option value="">All specializations</option>
                          {specializationOptions.map((o) => (
                            <option key={o.code} value={o.code}>{o.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="accordion-item border-bottom">
                    <div className="accordion-header" id="headingAvail">
                      <div className="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#collapseAvail" aria-controls="collapseAvail" type="button">
                        <div className="d-flex align-items-center w-100">
                          <h5>Availability</h5>
                          <div className="ms-auto">
                            <span><i className="fas fa-chevron-down"></i></span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div id="collapseAvail" className="accordion-collapse collapse show" aria-labelledby="headingAvail">
                      <div className="accordion-body pt-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <span>Online now</span>
                          <div className="status-toggle status-tog">
                            <input
                              type="checkbox"
                              id="status_online"
                              className="check"
                              checked={showAvailability}
                              onChange={(e) => { setShowAvailability(e.target.checked); setPage(1) }}
                            />
                            <label htmlFor="status_online" className="checktoggle">checkbox</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main list - Search2 row layout */}
            <div className="col-xl-9">
              <div className="row align-items-center">
                <div className="col-md-6">
                  <div className="mb-4">
                    <h3>Showing <span className="text-secondary">{pagination.total}</span> Veterinarians</h3>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-center justify-content-end mb-4">
                    <Link to="/search" className="btn btn-sm head-icon active me-2" title="List view">
                      <i className="isax isax-row-vertical"></i>
                    </Link>
                    <Link to="/doctor-search-grid" className="btn btn-sm head-icon me-2" title="Grid view">
                      <i className="isax isax-grid-7"></i>
                    </Link>
                  </div>
                </div>
              </div>

              {error && (
                <div className="alert alert-danger">
                  {error?.message || 'Failed to load veterinarians'}
                </div>
              )}
              {isLoading && (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
              {!isLoading && !error && veterinarians.length === 0 && (
                <div className="text-center py-5 text-muted">
                  No veterinarians found. Try different filters.
                </div>
              )}
              {!isLoading && !error && veterinarians.length > 0 && (
                <div className="row">
                  {veterinarians.map((vet) => {
                    const vetUserId = vet?.userId?._id
                    const idStr = vetUserId ? String(vetUserId) : ''
                    const isFav =
                      !!vetUserId &&
                      (favoriteOverrides[idStr] !== undefined
                        ? favoriteOverrides[idStr]
                        : favoriteVetIds.has(idStr))
                    const clinicImages = getClinicImages(vet)
                    return (
                      <div key={vetUserId || vet._id} className="col-md-12 mb-3">
                        <div className="card">
                          <div className="card-body">
                            <div className="doctor-widget">
                              <div className="doc-info-left">
                                <div className="doctor-img position-relative">
                                  <Link to={vetUserId ? `/doctor-profile/${vetUserId}` : '/doctor-profile'}>
                                    <img src={getVetImage(vet)} className="img-fluid" alt={getVetName(vet)} />
                                  </Link>
                                </div>
                                <div className="doc-info-cont">
                                  <h4 className="doc-name">
                                    <Link to={vetUserId ? `/doctor-profile/${vetUserId}` : '/doctor-profile'}>{getVetName(vet)}</Link>
                                  </h4>
                                  <p className="doc-speciality">{getSpecialty(vet)}</p>
                                  <div className="rating">
                                    {renderStars(getRating(vet))}
                                    <span className="d-inline-block average-rating">{getRatingCount(vet)}</span>
                                  </div>
                                  <div className="clinic-details">
                                    <p className="doc-location">
                                      <i className="fas fa-map-marker-alt"></i> {getLocation(vet)}
                                    </p>
                                    {clinicImages.length > 0 && (
                                      <ul className="clinic-gallery">
                                        {clinicImages.slice(0, 3).map((img, i) => (
                                          <li key={i}>
                                            <span><img src={img} alt="" /></span>
                                          </li>
                                        ))}
                                        {clinicImages.length > 3 && (
                                          <li><span>+{clinicImages.length - 3}</span></li>
                                        )}
                                      </ul>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="doc-info-right">
                                <div className="d-flex justify-content-end mb-2">
                                  <button
                                    type="button"
                                    className={`fav-icon border-0 bg-transparent ${isFav ? 'favorited' : ''}`}
                                    style={{
                                      width: '36px',
                                      height: '36px',
                                      borderRadius: '50%',
                                      background: '#ffffff',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      border: '1px solid rgba(0,0,0,0.08)',
                                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                    }}
                                    onClick={(e) => handleFavoriteToggle(e, vetUserId)}
                                    aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                                  >
                                    <i
                                      className={`fa ${isFav ? 'fa-solid' : 'fa-regular'} fa-heart`}
                                      style={{ color: isFav ? '#e63b3b' : '#0E82FD', fontSize: '18px' }}
                                    ></i>
                                  </button>
                                </div>
                                <div className="clini-infos">
                                  <ul>
                                    <li><i className="fas fa-map-marker-alt"></i> {getLocation(vet)}</li>
                                    <li><i className="far fa-clock"></i> {isAvailable(vet) ? 'Available' : 'Unavailable'}</li>
                                    <li><i className="fas fa-euro-sign"></i> €{getFee(vet)} consultation</li>
                                  </ul>
                                </div>
                                <div className="clinic-booking">
                                  <Link className="view-pro-btn" to={vetUserId ? `/doctor-profile/${vetUserId}` : '/doctor-profile'}>View Profile</Link>
                                  <Link className="btn btn-primary" to={vetUserId ? `/booking?vet=${vetUserId}` : '/booking'}>Book Appointment</Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {!isLoading && !error && pagination.pages > 1 && (
                <div className="col-md-12 mt-4 text-center">
                  <button
                    type="button"
                    className="btn btn-outline-primary me-2"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <span className="mx-3">Page {pagination.page} of {pagination.pages}</span>
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    disabled={page >= pagination.pages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Search
