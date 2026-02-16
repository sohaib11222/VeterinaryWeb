import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueries } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useAuth } from '../../contexts/AuthContext'
import { useFavorites } from '../../queries/favoriteQueries'
import { useRemoveFavorite } from '../../mutations/favoriteMutations'
import { api } from '../../utils/api'
import { API_ROUTES } from '../../utils/apiConfig'
import { getImageUrl } from '../../utils/apiConfig'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '')

const normalizeImageUrl = (uri) => {
  if (!uri || typeof uri !== 'string') return null
  const t = uri.trim()
  if (!t) return null
  if (t.startsWith('http')) return t
  return `${API_BASE}${t.startsWith('/') ? t : `/${t}`}`
}

const Favourites = () => {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const limit = 24

  const userId = user?.id || user?._id
  const { data: favoritesData, isLoading, error, refetch } = useFavorites(userId, { page, limit })
  const removeFavorite = useRemoveFavorite()

  const favorites = useMemo(() => {
    const raw = favoritesData?.data
    return raw?.favorites ?? []
  }, [favoritesData])

  const pagination = useMemo(() => {
    const raw = favoritesData?.data
    return raw?.pagination ?? { page: 1, limit, total: 0, pages: 0 }
  }, [favoritesData])

  const vetUserIds = useMemo(() => {
    return favorites
      .map((f) => {
        const v = f.veterinarianId
        return v && (typeof v === 'object' ? v._id : v)
      })
      .filter(Boolean)
  }, [favorites])

  const vetProfileQueries = useQueries({
    queries: vetUserIds.map((vetUserId) => ({
      queryKey: ['veterinarian', 'public', vetUserId],
      queryFn: () => api.get(API_ROUTES.VETERINARIANS.PUBLIC_PROFILE(vetUserId)),
      enabled: !!vetUserId,
    })),
  })

  const vetProfileByUserId = useMemo(() => {
    const map = {}
    vetProfileQueries.forEach((q, i) => {
      const uid = vetUserIds[i]
      if (!uid) return
      const data = q.data?.data
      if (data) map[String(uid)] = data
    })
    return map
  }, [vetProfileQueries, vetUserIds])

  const favoritesWithDetails = useMemo(() => {
    return favorites.map((fav) => {
      const vetUser = fav.veterinarianId
      const vetUserId = vetUser && (typeof vetUser === 'object' ? vetUser._id : vetUser)
      const profile = vetUserId ? vetProfileByUserId[String(vetUserId)] : null
      const name = vetUser?.fullName || vetUser?.name || 'Veterinarian'
      const profileUser = profile?.userId
      const image =
        getImageUrl(vetUser?.profileImage) ||
        getImageUrl(profileUser?.profileImage) ||
        normalizeImageUrl(vetUser?.profileImage) ||
        '/assets/img/doctors/doctor-thumb-21.jpg'
      const speciality = profile?.specializations?.[0]?.name || 'Veterinary'
      const location = profile?.clinics?.[0]
        ? [profile.clinics[0].city, profile.clinics[0].state, profile.clinics[0].country].filter(Boolean).join(', ') || '—'
        : '—'
      const rating = profile?.ratingAvg ?? 0
      return {
        ...fav,
        vetUserId,
        name,
        image,
        speciality,
        location,
        rating,
      }
    })
  }, [favorites, vetProfileByUserId])

  const filteredFavorites = useMemo(() => {
    if (!searchQuery.trim()) return favoritesWithDetails
    const q = searchQuery.toLowerCase()
    return favoritesWithDetails.filter(
      (f) =>
        (f.name || '').toLowerCase().includes(q) ||
        (f.speciality || '').toLowerCase().includes(q) ||
        (f.location || '').toLowerCase().includes(q)
    )
  }, [favoritesWithDetails, searchQuery])

  const handleRemoveFavorite = (e, favoriteId) => {
    e.preventDefault()
    removeFavorite.mutate(favoriteId, {
      onSuccess: () => toast.success('Removed from favorites'),
      onError: (err) => toast.error(err?.response?.data?.message || err?.message || 'Failed to remove'),
    })
  }

  const renderStars = (rating) => {
    const stars = []
    const r = Number(rating) || 0
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i
          key={i}
          className={i <= r ? 'fa-solid fa-star filled veterinary-star' : 'fa-solid fa-star veterinary-star'}
        />
      )
    }
    return stars
  }

  const handleLoadMore = () => {
    if (pagination.pages > page) setPage((p) => p + 1)
  }

  if (isLoading && page === 1) {
    return (
      <div className="content veterinary-dashboard">
        <div className="container-fluid">
          <div className="row">
            <div className="col-lg-12 col-xl-12">
              <div className="veterinary-dashboard-header mb-4">
                <h2 className="dashboard-title">
                  <i className="fa-solid fa-heart me-3"></i>Favorite Veterinarians
                </h2>
              </div>
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Loading favorites...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="content veterinary-dashboard">
        <div className="container-fluid">
          <div className="row">
            <div className="col-lg-12 col-xl-12">
              <div className="alert alert-danger">
                <h5>Error loading favorites</h5>
                <p>{error?.response?.data?.message || error?.message || 'Please try again.'}</p>
                <button className="btn veterinary-btn-primary mt-2" onClick={() => refetch()}>
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="content veterinary-dashboard">
      <div className="container-fluid">
        <div className="row">
          <div className="col-lg-3 col-xl-2 theiaStickySidebar">{/* PatientSidebar from DashboardLayout */}</div>
          <div className="col-lg-12 col-xl-12">
            <div className="row mb-4">
              <div className="col-12">
                <div className="veterinary-dashboard-header">
                  <h2 className="dashboard-title">
                    <i className="fa-solid fa-heart me-3"></i>Favorite Veterinarians
                  </h2>
                  <p className="dashboard-subtitle">Your trusted veterinary professionals for pet healthcare</p>
                </div>
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-12">
                <div className="dashboard-card veterinary-card">
                  <div className="dashboard-card-body">
                    <div className="row align-items-center">
                      <div className="col-lg-8">
                        <div className="input-block dash-search-input">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search favorite veterinarians..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                          <span className="search-icon">
                            <i className="fa-solid fa-magnifying-glass"></i>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {filteredFavorites.length === 0 ? (
              <div className="row">
                <div className="col-12 text-center py-5">
                  <i
                    className="fa-solid fa-heart"
                    style={{ fontSize: '64px', color: '#dee2e6', marginBottom: '16px' }}
                  />
                  <h5>No favorites yet</h5>
                  <p className="text-muted">Add veterinarians from the search page to see them here.</p>
                  <Link to="/search" className="btn veterinary-btn-primary mt-3 rounded-pill">
                    Find Veterinarians
                  </Link>
                </div>
              </div>
            ) : (
              <div className="row">
                {filteredFavorites.map((fav) => (
                  <div key={fav._id} className="col-md-6 col-lg-4 d-flex">
                    <div className="profile-widget veterinary-favourite-card flex-fill">
                      <div className="fav-head veterinary-fav-head">
                        <button
                          type="button"
                          className="fav-btn favourite-btn veterinary-fav-btn border-0 bg-transparent p-0"
                          onClick={(e) => handleRemoveFavorite(e, fav._id)}
                          title="Remove from favorites"
                          aria-label="Remove from favorites"
                        >
                          <span className="favourite-icon favourite">
                            <i className="fa-solid fa-heart"></i>
                          </span>
                        </button>
                        <div className="doc-img veterinary-doc-img">
                          <Link to={fav.vetUserId ? `/doctor-profile/${fav.vetUserId}` : '/doctor-profile'}>
                            <img
                              className="img-fluid veterinary-avatar"
                              alt="Veterinarian"
                              src={fav.image}
                              onError={(e) => {
                                e.currentTarget.onerror = null
                                e.currentTarget.src = '/assets/img/doctors/doctor-thumb-21.jpg'
                              }}
                            />
                          </Link>
                        </div>
                        <div className="pro-content veterinary-pro-content">
                          <h3 className="title veterinary-title">
                            <Link to={fav.vetUserId ? `/doctor-profile/${fav.vetUserId}` : '/doctor-profile'}>
                              {fav.name}
                            </Link>
                            <i className="fa-solid fa-check-circle verified veterinary-verified"></i>
                          </h3>
                          <p className="speciality veterinary-speciality">{fav.speciality}</p>
                          <div className="rating veterinary-rating">
                            {renderStars(fav.rating)}
                            <span className="d-inline-block average-rating veterinary-rating-text">
                              {Number(fav.rating).toFixed(1)}
                            </span>
                          </div>
                          <ul className="available-info veterinary-available-info">
                            <li>
                              <i className="fa-solid fa-location-dot me-1"></i>
                              <span>Location :</span> {fav.location}
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="fav-footer veterinary-fav-footer">
                        <div className="row row-sm">
                          <div className="col-6">
                            <Link
                              to={fav.vetUserId ? `/doctor-profile/${fav.vetUserId}` : '/doctor-profile'}
                              className="btn veterinary-btn-outline btn-md w-100 rounded-pill"
                            >
                              View Profile
                            </Link>
                          </div>
                          <div className="col-6">
                            <Link
                              to={fav.vetUserId ? `/booking?vet=${fav.vetUserId}` : '/booking'}
                              className="btn veterinary-btn-primary btn-md w-100 rounded-pill"
                            >
                              Book Now
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pagination.pages > 1 && page < pagination.pages && (
              <div className="col-md-12 mt-4 text-center">
                <button
                  type="button"
                  className="btn veterinary-btn-outline rounded-pill"
                  onClick={handleLoadMore}
                  disabled={removeFavorite.isPending}
                >
                  <i className="fa-solid fa-plus me-2"></i>Load More
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Favourites
