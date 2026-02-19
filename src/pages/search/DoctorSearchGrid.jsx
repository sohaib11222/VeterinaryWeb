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

const DoctorSearchGrid = () => {
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
      list
        .map((f) => {
          const v = f.veterinarianId
          return v && (typeof v === 'object' ? v._id : v)
        })
        .filter(Boolean)
        .map(String)
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
      favoriteOverrides[idStr] !== undefined ? favoriteOverrides[idStr] : favoriteVetIds.has(idStr)

    if (currentlyFav) {
      const favId = favoriteIdOverrides[idStr] || favoriteIdByVetId[idStr]
      if (!favId) {
        toast.error('Favorite not found')
        return
      }
      setFavoriteOverrides((prev) => ({ ...prev, [idStr]: false }))
      removeFavorite.mutate(favId, {
        onSuccess: () => toast.success('Removed from favorites'),
        onError: (err) => {
          setFavoriteOverrides((prev) => ({ ...prev, [idStr]: true }))
          toast.error(err?.response?.data?.message || err?.message || 'Failed to remove from favorites')
        },
      })
    } else {
      setFavoriteOverrides((prev) => ({ ...prev, [idStr]: true }))
      addFavorite.mutate(vetUserId, {
        onSuccess: (res) => {
          const created = res?.data?.data
          const favId = created?._id
          if (favId) setFavoriteIdOverrides((prev) => ({ ...prev, [idStr]: favId }))
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
  const getVetImage = (vet) => getImageUrl(vet?.userId?.profileImage) || '/assets/img/doctor-grid/doctor-grid-01.jpg'
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
  const getLocationText = (vet) => {
    const clinics = vet?.clinics
    if (Array.isArray(clinics) && clinics[0]) {
      const c = clinics[0]
      return [c.city, c.state, c.country].filter(Boolean).join(', ') || '—'
    }
    return '—'
  }
  const getFee = (vet) => {
    const f = vet?.consultationFees
    if (!f) return 0
    return f.online ?? f.clinic ?? 0
  }
  const isAvailable = (vet) => vet?.isAvailableOnline !== false
  const getRating = (vet) => Number(vet?.ratingAvg ?? 0)

  const handleSearch = (e) => {
    e?.preventDefault?.()
    setPage(1)
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
                <div className="search-input search-calendar-line">
                  <i className="isax isax-calendar-tick5"></i>
                  <div className="mb-0">
                    <select
                      className="form-control"
                      value={selectedSpecialization}
                      onChange={(e) => {
                        setSelectedSpecialization(e.target.value)
                        setPage(1)
                      }}
                    >
                      <option value="">All Specializations</option>
                      {specializationOptions.map((o) => (
                        <option key={o.code} value={o.code}>
                          {o.name}
                        </option>
                      ))}
                    </select>
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

      <div className="content search-page-content">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6">
              <div className="mb-4">
                <h3>Showing <span className="text-secondary">{pagination.total}</span> Veterinarians</h3>
              </div>
            </div>
            <div className="col-md-6">
              <div className="d-flex align-items-center justify-content-end mb-4">
                <div className="doctor-filter-availability me-2">
                  <p>Availability</p>
                  <div className="status-toggle status-tog">
                    <input
                      type="checkbox"
                      id="status_6"
                      className="check"
                      checked={showAvailability}
                      onChange={(e) => { setShowAvailability(e.target.checked); setPage(1) }}
                    />
                    <label htmlFor="status_6" className="checktoggle">checkbox</label>
                  </div>
                </div>
                <Link to="/doctor-search-grid" className="btn btn-sm head-icon active me-2" title="Grid view">
                  <i className="isax isax-grid-7"></i>
                </Link>
                <Link to="/search" className="btn btn-sm head-icon me-2" title="List view">
                  <i className="isax isax-row-vertical"></i>
                </Link>
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger">{error?.message || 'Failed to load veterinarians'}</div>
          )}
          {isLoading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}
          {!isLoading && !error && veterinarians.length === 0 && (
            <div className="text-center py-5 text-muted">No veterinarians found. Try different filters.</div>
          )}

          {!isLoading && !error && veterinarians.length > 0 && (
            <div className="row">
              {veterinarians.map((vet) => {
                const vetUserId = vet?.userId?._id
                const idStr = vetUserId ? String(vetUserId) : ''
                const isFav =
                  !!vetUserId &&
                  (favoriteOverrides[idStr] !== undefined ? favoriteOverrides[idStr] : favoriteVetIds.has(idStr))
                const name = getVetName(vet)
                const image = getVetImage(vet)
                const specialtyName = getSpecialty(vet)
                const rating = getRating(vet)
                const locationStr = getLocationText(vet)
                const fee = getFee(vet)
                const available = isAvailable(vet)

                return (
                  <div key={vetUserId || vet._id} className="col-xxl-4 col-lg-4 col-md-6">
                    <div className="card">
                      <div className="card-img card-img-hover">
                        <Link to={vetUserId ? `/doctor-profile/${vetUserId}` : '/doctor-profile'}>
                          <img src={image} alt={name} onError={(e) => { e.currentTarget.src = '/assets/img/doctor-grid/doctor-grid-01.jpg' }} />
                        </Link>
                        <div className="grid-overlay-item d-flex align-items-center justify-content-between">
                          <span className="badge bg-orange">
                            <i className="fa-solid fa-star me-1"></i>{rating.toFixed(1)}
                          </span>
                          <a
                            href="javascript:void(0)"
                            className={`fav-icon ${isFav ? 'favorited' : ''}`}
                            onClick={(e) => handleFavoriteToggle(e, vetUserId)}
                            title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <i className={`fa fa-heart ${isFav ? 'filled' : ''}`}></i>
                          </a>
                        </div>
                      </div>
                      <div className="card-body p-0">
                        <div className="d-flex active-bar align-items-center justify-content-between p-3">
                          <a href="#" onClick={(e) => e.preventDefault()} className="text-primary fw-medium fs-14">{specialtyName}</a>
                          <span className={`badge ${available ? 'bg-success-light' : 'bg-danger-light'} d-inline-flex align-items-center`}>
                            <i className="fa-solid fa-circle fs-5 me-1"></i>
                            {available ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                        <div className="p-3 pt-0">
                          <div className="doctor-info-detail mb-3 pb-3">
                            <h3 className="mb-1">
                              <Link to={vetUserId ? `/doctor-profile/${vetUserId}` : '/doctor-profile'}>{name}</Link>
                            </h3>
                            <div className="d-flex align-items-center">
                              <p className="d-flex align-items-center mb-0 fs-14" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                                <i className="isax isax-location me-2"></i>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', maxWidth: 'calc(100% - 24px)' }}>{locationStr}</span>
                              </p>
                            </div>
                          </div>
                          <div className="d-flex align-items-center justify-content-between">
                            <div>
                              <p className="mb-1">Consultation Fees</p>
                              <h3 className="text-orange">€{fee || 'N/A'}</h3>
                            </div>
                            <Link to={vetUserId ? `/booking?vet=${vetUserId}` : '/booking'} className="btn btn-md btn-dark d-inline-flex align-items-center rounded-pill">
                              <i className="isax isax-calendar-1 me-2"></i>
                              Book Now
                            </Link>
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
    </>
  )
}

export default DoctorSearchGrid

