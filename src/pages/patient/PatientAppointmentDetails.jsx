import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { useAppointment } from '../../queries'
import { useEligibleRescheduleAppointments } from '../../queries'
import { useCancelAppointment } from '../../mutations/appointmentMutations'
import { useCreateReview } from '../../mutations'
import { useMyAppointmentReview } from '../../queries'
import { getImageUrl } from '../../utils/apiConfig'

const PatientAppointmentDetails = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const appointmentId = searchParams.get('id')
  const { data: appointmentResponse, isLoading, refetch } = useAppointment(appointmentId)

  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState('')

  const cancelAppointment = useCancelAppointment()

  const appointment = useMemo(() => {
    return appointmentResponse?.data ?? appointmentResponse
  }, [appointmentResponse])

  const vet = appointment?.veterinarianId || {}
  const pet = appointment?.petId || {}
  const vetImage = getImageUrl(vet?.profileImage) || '/assets/img/doctors-dashboard/doctor-profile-img.jpg'
  const dateStr = appointment?.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString() : ''
  const timeStr = appointment?.appointmentTime || ''
  const status = String(appointment?.status || '').toUpperCase()
  const statusLabel = status || 'PENDING'

  const canCancel = ['PENDING', 'CONFIRMED'].includes(status)

  const { data: eligibleRescheduleRes } = useEligibleRescheduleAppointments()
  const eligibleAppointmentIds = useMemo(() => {
    const outer = eligibleRescheduleRes?.data ?? eligibleRescheduleRes
    const payload = outer?.data ?? outer
    const list = Array.isArray(payload) ? payload : Array.isArray(payload?.appointments) ? payload.appointments : []
    return new Set((list || []).map((a) => String(a?._id)).filter(Boolean))
  }, [eligibleRescheduleRes])

  const canRequestReschedule = useMemo(() => {
    if (!appointmentId || !appointment) return false
    if (status !== 'CONFIRMED') return false
    if (appointment?.bookingType !== 'ONLINE') return false
    if (!appointment?.appointmentDate || !appointment?.appointmentTime) return false

    const dt = new Date(appointment.appointmentDate)
    const [h, m] = String(appointment.appointmentTime || '00:00').split(':').map(Number)
    dt.setHours(h || 0, m || 0, 0, 0)
    const hasPassed = dt.getTime() < Date.now()
    if (!hasPassed) return false

    // Eligible list is authoritative (checks for video call participation + existing request)
    return eligibleAppointmentIds.has(String(appointmentId))
  }, [appointment, appointmentId, eligibleAppointmentIds, status])

  const createReview = useCreateReview()
  const { data: myReviewRes } = useMyAppointmentReview(appointmentId, { enabled: status === 'COMPLETED' })
  const existingReview = myReviewRes?.data ?? null

  const handleCancel = async () => {
    try {
      await cancelAppointment.mutateAsync({
        appointmentId,
        data: { reason: cancelReason || undefined },
      })
      toast.success('Appointment cancelled successfully')
      setShowCancelModal(false)
      refetch()
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to cancel appointment')
    }
  }

  const handleReviewSubmit = async () => {
    if (!reviewText.trim()) {
      toast.error('Please provide a review text')
      return
    }

    const veterinarianId = appointment?.veterinarianId?._id || appointment?.veterinarianId
    if (!veterinarianId) {
      toast.error('Veterinarian information not available')
      return
    }

    try {
      await createReview.mutateAsync({
        veterinarianId,
        appointmentId,
        petId: appointment?.petId?._id || appointment?.petId,
        rating: reviewRating,
        reviewText: reviewText.trim(),
        reviewType: 'APPOINTMENT',
      })
      toast.success('Review submitted successfully')
      setShowReviewModal(false)
      setReviewRating(5)
      setReviewText('')
    } catch (err) {
      toast.error(err?.message || 'Failed to submit review')
    }
  }

  const getStatusBadgeClass = (s) => {
    switch (s) {
      case 'CONFIRMED': return 'veterinary-upcoming'
      case 'PENDING': return 'veterinary-pending'
      case 'COMPLETED': return 'veterinary-completed'
      case 'CANCELLED': return 'veterinary-cancelled'
      case 'REJECTED': return 'veterinary-cancelled'
      case 'NO_SHOW': return 'veterinary-cancelled'
      default: return 'veterinary-pending'
    }
  }

  return (
    <div className="content veterinary-dashboard">
      <div className="container-fluid">
        <div className="row">
          <div className="col-lg-3 col-xl-2 theiaStickySidebar">
            {/* PatientSidebar will be rendered by DashboardLayout */}
          </div>
          <div className="col-lg-12 col-xl-12">
            {/* Veterinary Dashboard Header */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="veterinary-dashboard-header">
                  <div className="header-back veterinary-header-back">
                    <Link to="/patient-appointments" className="back-arrow veterinary-back-btn">
                      <i className="fa-solid fa-arrow-left me-2"></i>Back to Appointments
                    </Link>
                    <h2 className="dashboard-title">
                      <i className="fa-solid fa-calendar-check me-3"></i>
                      Pet Appointment Details
                    </h2>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="appointment-details-wrap veterinary-appointment-details">
              {/* Appointment Detail Card - Upcoming */}
              <div className="dashboard-card veterinary-card mb-4">
                <div className="dashboard-card-body">
                  <div className="appointment-wrap veterinary-appointment-detail">
                    {isLoading ? (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    ) : !appointmentId || !appointment ? (
                      <div className="text-center py-5">
                        <h5>Appointment not found</h5>
                        <p className="text-muted">Please go back to appointments and select one.</p>
                      </div>
                    ) : (
                      <>
                        <ul>
                          <li>
                            <div className="patinet-information veterinary-vet-info">
                              <a href="#">
                                <img src={vetImage} alt="Veterinarian" className="veterinary-avatar" />
                              </a>
                              <div className="patient-info veterinary-pet-info">
                                <p className="veterinary-appointment-id">{appointment.appointmentNumber || appointment._id}</p>
                                <h6><a href="#" className="veterinary-vet-name">{vet.name || vet.fullName || vet.email || 'Veterinarian'}</a></h6>
                                <p className="veterinary-pet-name"><i className="fa-solid fa-paw me-1"></i>{pet.name ? `${pet.name}${pet.breed ? ` (${pet.breed})` : ''}` : 'Pet'}</p>
                                <div className="mail-info-patient veterinary-contact-info">
                                  <ul>
                                    <li><i className="fa-solid fa-envelope me-2"></i>{vet.email || '—'}</li>
                                    <li><i className="fa-solid fa-phone me-2"></i>{vet.phone || '—'}</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </li>
                          <li className="appointment-info veterinary-appointment-info">
                            <div className="person-info">
                              <p>Type of Appointment</p>
                              <ul className="d-flex apponitment-types veterinary-appointment-types">
                                <li className="veterinary-type-badge"><i className="fa-solid fa-hospital me-1"></i>{appointment.bookingType === 'ONLINE' ? 'Online' : 'Clinic Visit'}</li>
                              </ul>
                            </div>
                          </li>
                          <li className="appointment-action veterinary-appointment-actions">
                            <div className="detail-badge-info">
                              <span className={`badge veterinary-badge ${getStatusBadgeClass(status)}`}>{statusLabel}</span>
                            </div>
                            <div className="consult-fees veterinary-consult-fees">
                              <h6><i className="fa-solid fa-euro-sign me-1"></i>Consultation Fees: €50</h6>
                            </div>
                            <ul>
                              <li>
                                <Link
                                  to={appointmentId ? `/chat?appointmentId=${appointmentId}` : '/chat'}
                                  className="veterinary-action-btn"
                                  title="Chat with Vet"
                                >
                                  <i className="fa-solid fa-comments"></i>
                                </Link>
                              </li>
                              {canCancel && (
                                <li>
                                  <button
                                    type="button"
                                    className="veterinary-action-btn text-danger border-0 bg-transparent"
                                    title="Cancel Appointment"
                                    onClick={() => setShowCancelModal(true)}
                                  >
                                    <i className="fa-solid fa-times-circle"></i>
                                  </button>
                                </li>
                              )}
                            </ul>
                          </li>
                        </ul>
                        <ul className="detail-card-bottom-info veterinary-detail-info">
                          <li>
                            <h6><i className="fa-solid fa-calendar-days me-2"></i>Appointment Date & Time</h6>
                            <span>{dateStr} {timeStr}</span>
                          </li>
                          <li>
                            <h6><i className="fa-solid fa-stethoscope me-2"></i>Visit Type</h6>
                            <span>{appointment.reason || 'Consultation'}</span>
                          </li>
                          <li>
                            <h6><i className="fa-solid fa-hospital me-2"></i>Appointment Type</h6>
                            <span>{appointment.bookingType === 'ONLINE' ? 'Video Consultation' : 'Clinic Visit'}</span>
                          </li>
                          {appointment.petSymptoms && (
                            <li>
                              <h6><i className="fa-solid fa-notes-medical me-2"></i>Pet Symptoms</h6>
                              <span>{appointment.petSymptoms}</span>
                            </li>
                          )}
                          {appointment.notes && (
                            <li>
                              <h6><i className="fa-solid fa-clipboard me-2"></i>Notes</h6>
                              <span>{appointment.notes}</span>
                            </li>
                          )}
                          {appointment.bookingType === 'ONLINE' && status === 'CONFIRMED' && (
                            <li>
                              <div className="start-btn">
                                <Link to={`/video-call?appointmentId=${appointmentId}`} className="btn veterinary-btn-primary rounded-pill">
                                  <i className="fa-solid fa-video me-2"></i>Start Video Session
                                </Link>
                              </div>
                            </li>
                          )}

                          {canRequestReschedule && (
                            <li>
                              <div className="mt-3">
                                <div className="alert alert-warning mb-0">
                                  <h6>Missed Appointment?</h6>
                                  <p className="mb-2">If no video call was initiated, you can request a reschedule.</p>
                                  <Link
                                    to={`/patient/request-reschedule?appointmentId=${appointmentId}`}
                                    className="btn btn-warning rounded-pill"
                                  >
                                    <i className="fa-solid fa-calendar-days me-2"></i>Request Reschedule
                                  </Link>
                                </div>
                              </div>
                            </li>
                          )}

                          {status === 'COMPLETED' && (
                            <li className="detail-badge-info">
                              <Link
                                to={`/patient/prescription?appointmentId=${appointmentId}`}
                                className="btn veterinary-btn-primary rounded-pill me-2"
                              >
                                Download Prescription
                              </Link>
                              {!existingReview ? (
                                <button
                                  type="button"
                                  className="btn btn-success rounded-pill"
                                  onClick={() => setShowReviewModal(true)}
                                >
                                  Write a Review
                                </button>
                              ) : (
                                <span className="badge bg-success">Review Submitted</span>
                              )}
                            </li>
                          )}
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {/* /Appointment Detail Card */}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Appointment Modal */}
      {showCancelModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Cancel Appointment</h5>
                <button type="button" className="btn-close" onClick={() => setShowCancelModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to cancel this appointment?</p>
                <div className="mb-3">
                  <label className="form-label">Reason for cancellation (optional)</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Enter reason..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCancelModal(false)}>
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleCancel}
                  disabled={cancelAppointment.isPending}
                >
                  {cancelAppointment.isPending ? 'Cancelling...' : 'Cancel Appointment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Write a Review</h5>
                <button type="button" className="btn-close" onClick={() => setShowReviewModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Rating</label>
                  <div className="d-flex align-items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="btn btn-link p-0"
                        onClick={() => setReviewRating(star)}
                        style={{ fontSize: '2rem', color: star <= reviewRating ? '#ffc107' : '#ccc' }}
                      >
                        <i className="fa-solid fa-star"></i>
                      </button>
                    ))}
                    <span className="ms-2">{reviewRating} / 5</span>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Your Review</label>
                  <textarea
                    className="form-control"
                    rows="5"
                    placeholder="Share your experience..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowReviewModal(false)}>
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleReviewSubmit}
                  disabled={createReview.isPending}
                >
                  {createReview.isPending ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientAppointmentDetails

