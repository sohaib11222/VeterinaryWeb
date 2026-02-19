import { useMemo, useState } from 'react'

import { useAuth } from '../../contexts/AuthContext'
import { useMyVeterinarianReviews, useVeterinarianProfile } from '../../queries'
import { getImageUrl } from '../../utils/apiConfig'

const Reviews = () => {
  const { user } = useAuth()

  const [page, setPage] = useState(1)
  const limit = 10

  const { data: profileRes } = useVeterinarianProfile()
  const profile = profileRes?.data ?? profileRes

  const { data: reviewsRes, isLoading, error } = useMyVeterinarianReviews({ page, limit }, { enabled: Boolean(user) })
  const payload = reviewsRes?.data ?? reviewsRes
  const reviews = payload?.reviews || []
  const pagination = payload?.pagination || { page: 1, limit, total: 0, pages: 1 }

  const overallRating = useMemo(() => {
    const avg = profile?.ratingAvg
    if (avg !== null && avg !== undefined) return Number(avg) || 0
    if (reviews.length === 0) return 0
    const sum = reviews.reduce((acc, r) => acc + (Number(r?.rating) || 0), 0)
    return sum / reviews.length
  }, [profile?.ratingAvg, reviews])

  const ratingCount = useMemo(() => {
    const count = profile?.ratingCount
    if (count !== null && count !== undefined) return Number(count) || 0
    return pagination?.total || reviews.length || 0
  }, [profile?.ratingCount, pagination?.total, reviews.length])

  const renderStars = (rating) => {
    const r = Math.max(0, Math.min(5, Number(rating) || 0))
    const full = Math.floor(r)
    const half = r % 1 !== 0
    return Array.from({ length: 5 }).map((_, i) => {
      if (i < full) return <i key={i} className="fa-solid fa-star filled"></i>
      if (i === full && half) return <i key={i} className="fa-solid fa-star-half-stroke filled"></i>
      return <i key={i} className="fa-solid fa-star"></i>
    })
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const d = new Date(dateString)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (pagination?.pages || 1)) {
      setPage(newPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="content veterinary-dashboard">
      <div className="container-fluid">
        <div className="row">
          <div className="col-lg-3 col-xl-2 theiaStickySidebar">
            {/* Sidebar is handled by DashboardLayout */}
          </div>
          <div className="col-lg-12 col-xl-12">
            {/* Veterinary Reviews Header */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="veterinary-dashboard-header">
                  <h2 className="dashboard-title">
                    <i className="fa-solid fa-star me-3"></i>
                    Pet Owner Reviews
                  </h2>
                  <p className="dashboard-subtitle">Read feedback from happy pet owners about our veterinary services</p>
                </div>
              </div>
            </div>

            {/* Reviews Content */}
            <div className="row">
              <div className="col-12">
                <div className="dashboard-card veterinary-card">
                  <div className="dashboard-card-body">
                    {/* Review Listing */}
                    <ul className="comments-list veterinary-reviews-list">
                      {/* Overall Rating */}
                      <li className="over-all-review veterinary-overall-review">
                        <div className="review-content">
                          <div className="review-rate">
                            <h5>
                              <i className="fa-solid fa-paw me-2"></i>
                              Overall Rating
                            </h5>
                            <div className="star-rated veterinary-star-rated">
                              <span>{overallRating.toFixed(1)}</span>
                              {renderStars(overallRating)}
                              <div className="rating-summary">
                                <small className="text-muted">Based on {ratingCount} reviews</small>
                              </div>
                            </div>
                          </div>
                          <div className="position-relative daterange-wraper">
                            <div className="input-groupicon calender-input">
                              <input type="text" className="form-control date-range bookingrange veterinary-input" placeholder="From Date - To Date" />
                            </div>
                            <i className="fa-solid fa-calendar-days"></i>
                          </div>
                        </div>
                      </li>

                      {isLoading ? (
                        <li>
                          <div className="text-center py-5">
                            <div className="spinner-border" role="status">
                              <span className="visually-hidden">Loading reviews...</span>
                            </div>
                          </div>
                        </li>
                      ) : error ? (
                        <li>
                          <div className="text-center py-5 text-danger">
                            <p>Error loading reviews</p>
                            <small>{error?.message || 'Failed to load reviews'}</small>
                          </div>
                        </li>
                      ) : reviews.length === 0 ? (
                        <li>
                          <div className="text-center py-5 text-muted">
                            <p>No reviews yet</p>
                            <small>Reviews from pet owners will appear here</small>
                          </div>
                        </li>
                      ) : (
                        reviews.map((review) => {
                          const owner = review?.petOwnerId || {}
                          const pet = review?.petId || {}

                          const ownerName = owner?.fullName || owner?.name || 'Anonymous'
                          const ownerImage = getImageUrl(owner?.profileImage) || '/assets/img/doctors-dashboard/profile-01.jpg'
                          const petText = pet?.name ? `${pet.name}${pet.species ? ` (${pet.species})` : ''}` : ''

                          return (
                            <li key={review._id}>
                              <div className="comments veterinary-review-card">
                                <div className="comment-head">
                                  <div className="patinet-information">
                                    <a href="javascript:void(0);">
                                      <img
                                        src={ownerImage}
                                        alt="Pet Owner"
                                        onError={(e) => {
                                          e.currentTarget.onerror = null
                                          e.currentTarget.src = '/assets/img/doctors-dashboard/profile-01.jpg'
                                        }}
                                      />
                                    </a>
                                    <div className="patient-info">
                                      <h6><a href="javascript:void(0);">{ownerName}</a></h6>
                                      <span className="review-date">{formatDate(review?.createdAt)}</span>
                                      {petText && (
                                        <div className="pet-info">
                                          <small className="text-muted">Pet: {petText}</small>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="star-rated veterinary-star-rating">
                                    {renderStars(review?.rating)}
                                  </div>
                                </div>
                                <div className="review-info">
                                  <p>{review?.reviewText || '—'}</p>
                                </div>
                              </div>
                            </li>
                          )
                        })
                      )}
                    </ul>

                    {/* Pagination */}
                    {(pagination?.pages || 1) > 1 && (
                      <div className="pagination dashboard-pagination veterinary-pagination">
                        <ul>
                          <li>
                            <a
                              href="#"
                              className={`page-link veterinary-page-link ${page <= 1 ? 'disabled' : ''}`}
                              onClick={(e) => {
                                e.preventDefault()
                                handlePageChange(page - 1)
                              }}
                            >
                              <i className="fa-solid fa-chevron-left"></i>
                            </a>
                          </li>
                          <li>
                            <a href="#" className="page-link veterinary-page-link active" onClick={(e) => e.preventDefault()}>
                              {page}
                            </a>
                          </li>
                          <li>
                            <a
                              href="#"
                              className={`page-link veterinary-page-link ${page >= (pagination?.pages || 1) ? 'disabled' : ''}`}
                              onClick={(e) => {
                                e.preventDefault()
                                handlePageChange(page + 1)
                              }}
                            >
                              <i className="fa-solid fa-chevron-right"></i>
                            </a>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reviews
