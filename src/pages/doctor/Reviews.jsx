import { useMemo, useState } from 'react'

import { useAuth } from '../../contexts/AuthContext'
import { useMyVeterinarianReviews, useVeterinarianProfile } from '../../queries'
import { getImageUrl } from '../../utils/apiConfig'

const formatDate = (value) => value ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const Stars = ({ rating }) => <span className="text-warning" aria-label={`${rating} out of 5 stars`}>{Array.from({ length: 5 }).map((_, index) => <i key={index} className={`fa-${index < Math.round(Number(rating) || 0) ? 'solid' : 'regular'} fa-star me-1`} />)}</span>

const Reviews = () => {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const limit = 10
  const profileQuery = useVeterinarianProfile()
  const reviewsQuery = useMyVeterinarianReviews({ page, limit }, { enabled: Boolean(user) })
  const profile = profileQuery.data?.data ?? profileQuery.data
  const payload = reviewsQuery.data?.data ?? reviewsQuery.data
  const reviews = payload?.reviews || []
  const pagination = payload?.pagination || { page: 1, pages: 1, total: 0 }
  const average = useMemo(() => {
    if (profile?.ratingAvg !== null && profile?.ratingAvg !== undefined) return Number(profile.ratingAvg) || 0
    return reviews.length ? reviews.reduce((sum, review) => sum + (Number(review?.rating) || 0), 0) / reviews.length : 0
  }, [profile?.ratingAvg, reviews])
  const total = Number(profile?.ratingCount ?? pagination.total ?? reviews.length) || 0

  return <section className="veterinary-dashboard"><div className="veterinary-dashboard-header mb-4"><h2 className="dashboard-title"><i className="fa-solid fa-star me-3" />Pet owner reviews</h2><p className="dashboard-subtitle">Feedback from pet owners after their veterinary appointments.</p></div>
    <div className="card border-0 shadow-sm mb-4 overflow-hidden"><div className="card-body p-4" style={{ background: 'linear-gradient(135deg, #effaf8, #fff)' }}><div className="row align-items-center g-4"><div className="col-md-auto"><div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: 96, height: 96, background: '#087f75', fontSize: 30 }}>{average.toFixed(1)}</div></div><div className="col"><h3 className="h4 mb-2">Overall rating</h3><Stars rating={average} /><p className="text-muted mb-0 mt-2">Based on {total} {total === 1 ? 'review' : 'reviews'}</p></div><div className="col-md-auto text-md-end"><span className="badge text-bg-light border px-3 py-2"><i className="fa-solid fa-paw me-2 text-primary" />Veterinary feedback</span></div></div></div></div>
    {reviewsQuery.isLoading ? <div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading reviews</span></div></div> : reviewsQuery.isError ? <div className="alert alert-danger">{reviewsQuery.error?.message || 'Unable to load reviews.'}</div> : reviews.length === 0 ? <div className="card border-0 shadow-sm"><div className="card-body text-center py-5 text-muted"><i className="fa-regular fa-star fa-2x mb-3" /><p className="mb-0">No reviews yet. New feedback will appear here.</p></div></div> : <div className="row g-4">{reviews.map((review) => { const owner = review?.petOwnerId || {}; const pet = review?.petId || {}; const ownerImage = getImageUrl(owner?.profileImage) || '/assets/img/doctors-dashboard/profile-01.jpg'; return <div className="col-12" key={review._id}><article className="card border-0 shadow-sm"><div className="card-body p-4"><div className="d-flex flex-wrap justify-content-between gap-3 mb-3"><div className="d-flex align-items-center gap-3"><img src={ownerImage} alt="Pet owner" className="rounded-circle object-fit-cover" style={{ width: 52, height: 52 }} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/assets/img/doctors-dashboard/profile-01.jpg' }} /><div><h3 className="h6 mb-1">{owner?.name || owner?.fullName || 'Pet owner'}</h3><div className="text-muted small">{pet?.name ? `Pet: ${pet.name}${pet.species ? ` · ${pet.species}` : ''}` : 'Pet details unavailable'} · {formatDate(review?.createdAt)}</div></div></div><div className="text-md-end"><Stars rating={review?.rating} /><div className="small text-muted mt-1">{Number(review?.rating || 0).toFixed(1)} / 5</div></div></div><blockquote className="mb-0 ps-3 border-start border-4 border-info text-secondary">{review?.reviewText || 'No written feedback was provided.'}</blockquote></div></article></div> })}</div>}
    {(pagination.pages || 1) > 1 && <nav className="d-flex justify-content-center align-items-center gap-3 mt-4" aria-label="Review pages"><button type="button" className="btn btn-outline-primary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button><span className="text-muted">Page {page} of {pagination.pages}</span><button type="button" className="btn btn-outline-primary" disabled={page >= pagination.pages} onClick={() => setPage((current) => current + 1)}>Next</button></nav>}
  </section>
}

export default Reviews
