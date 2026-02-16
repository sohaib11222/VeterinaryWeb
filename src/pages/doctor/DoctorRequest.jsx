import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { Link } from 'react-router-dom'

import { useAppointments } from '../../queries'
import { useAcceptAppointment, useRejectAppointment } from '../../mutations'
import { getImageUrl } from '../../utils/apiConfig'

const DoctorRequest = () => {
  const [rejectModal, setRejectModal] = useState({ show: false, appointmentId: null, reason: '' })

  const requestParams = useMemo(() => ({ status: 'PENDING', limit: 50 }), [])
  const { data: appointmentsResponse, isLoading } = useAppointments(requestParams)

  const accept = useAcceptAppointment()
  const reject = useRejectAppointment()

  const appointments = useMemo(() => {
    const payload = appointmentsResponse?.data ?? appointmentsResponse
    const list = payload?.appointments ?? payload?.data?.appointments ?? payload
    return Array.isArray(list) ? list : []
  }, [appointmentsResponse])

  const formatDateTime = (dateString, timeString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    const formattedDate = date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    return `${formattedDate} ${timeString || ''}`.trim()
  }

  const getBookingTypeDisplay = (bookingType) => {
    switch (String(bookingType || '').toUpperCase()) {
      case 'ONLINE':
        return { icon: 'fa-solid fa-video text-primary', text: 'Video Call' }
      case 'VISIT':
        return { icon: 'fa-solid fa-clinic-medical text-success', text: 'Clinic Visit' }
      default:
        return { icon: 'fa-solid fa-circle-info text-info', text: bookingType || 'N/A' }
    }
  }

  const handleAccept = async (appointmentId) => {
    try {
      await accept.mutateAsync(appointmentId)
      toast.success('Appointment accepted successfully!')
    } catch (err) {
      toast.error(err?.message || 'Failed to accept appointment')
    }
  }

  const handleReject = (appointmentId) => {
    setRejectModal({ show: true, appointmentId, reason: '' })
  }

  const confirmReject = async () => {
    const appointmentId = rejectModal.appointmentId
    if (!appointmentId) return
    try {
      await reject.mutateAsync({ appointmentId, data: { reason: rejectModal.reason || null } })
      toast.success('Appointment rejected successfully!')
      setRejectModal({ show: false, appointmentId: null, reason: '' })
    } catch (err) {
      toast.error(err?.message || 'Failed to reject appointment')
    }
  }

  return (
    <div className="content veterinary-dashboard">
      <div className="container-fluid">
        <div className="row">
          <div className="col-lg-3 col-xl-2 theiaStickySidebar">{/* Sidebar is handled by DashboardLayout */}</div>
          <div className="col-lg-12 col-xl-12">
            <div className="row mb-4">
              <div className="col-12">
                <div className="veterinary-dashboard-header">
                  <h2 className="dashboard-title">
                    <i className="fa-solid fa-calendar-check me-3"></i>
                    Pet Requests
                  </h2>
                  <p className="dashboard-subtitle">Manage pet appointment requests from owners</p>
                </div>
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-12">
                <div className="dashboard-card veterinary-card">
                  <div className="dashboard-card-body">
                    <div className="row align-items-center">
                      <div className="col-lg-8">
                        <h5 className="card-title mb-0">
                          <i className="fa-solid fa-list me-2"></i>
                          Pending Pet Requests
                        </h5>
                      </div>
                      <div className="col-lg-4 text-end">
                        <span className="text-muted">{appointments.length} pending</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {isLoading && (
              <div className="text-center py-5">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}

            {!isLoading && appointments.length === 0 && (
              <div className="text-center py-5">
                <p className="text-muted">No pending appointment requests</p>
              </div>
            )}

            {!isLoading && appointments.length > 0 && (
              <div className="row">
                <div className="col-12">
                  {appointments.map((appointment) => {
                    const pet = appointment?.petId || {}
                    const owner = appointment?.petOwnerId || {}
                    const appointmentNumber = appointment?.appointmentNumber || appointment?._id?.slice?.(-6) || 'N/A'
                    const bookingType = getBookingTypeDisplay(appointment?.bookingType)

                    const detailsUrl = appointment?._id ? `/doctor-appointment-details?id=${appointment._id}` : '/doctor-appointment-details'

                    const petName = pet?.name || 'Pet'
                    const petBreed = pet?.breed ? ` (${pet.breed})` : ''
                    const ownerName = owner?.fullName || owner?.name || 'Pet Owner'

                    const petImage =
                      getImageUrl(pet?.photo) ||
                      '/assets/img/doctors-dashboard/profile-01.jpg'

                    return (
                      <div key={appointment._id} className="dashboard-card veterinary-card mb-4">
                        <div className="dashboard-card-body">
                          <div className="appointment-wrap veterinary-appointment">
                            <ul>
                              <li>
                                <div className="patinet-information">
                                  <Link to={detailsUrl}>
                                    <img
                                      src={petImage}
                                      alt="Pet Image"
                                      onError={(e) => {
                                        e.currentTarget.onerror = null
                                        e.currentTarget.src = '/assets/img/doctors-dashboard/profile-01.jpg'
                                      }}
                                    />
                                  </Link>
                                  <div className="patient-info">
                                    <p>#{appointmentNumber}</p>
                                    <h6>
                                      <Link to={detailsUrl}>{petName}{petBreed}</Link>
                                      <span className="badge veterinary-badge new-tag">New</span>
                                    </h6>
                                    <small className="text-muted">Owner: {ownerName}</small>
                                  </div>
                                </div>
                              </li>
                              <li className="appointment-info">
                                <p>
                                  <i className="fa-solid fa-clock"></i>
                                  {formatDateTime(appointment?.appointmentDate, appointment?.appointmentTime)}
                                </p>
                                <p className="md-text">{appointment?.reason || 'Consultation'}</p>
                              </li>
                              <li className="appointment-type">
                                <p className="md-text">Type of Appointment</p>
                                <p>
                                  <i className={bookingType.icon}></i>
                                  {bookingType.text}
                                </p>
                              </li>
                              <li>
                                <ul className="request-action">
                                  <li>
                                    <button
                                      type="button"
                                      className="veterinary-accept-btn"
                                      onClick={() => handleAccept(appointment._id)}
                                      disabled={accept.isPending}
                                      style={{ cursor: accept.isPending ? 'not-allowed' : 'pointer' }}
                                    >
                                      <i className="fa-solid fa-check-circle"></i>
                                      <span>{accept.isPending ? 'Processing...' : 'Accept'}</span>
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      type="button"
                                      className="veterinary-reject-btn"
                                      onClick={() => handleReject(appointment._id)}
                                      disabled={reject.isPending}
                                      style={{ cursor: reject.isPending ? 'not-allowed' : 'pointer' }}
                                    >
                                      <i className="fa-solid fa-times-circle"></i>
                                      <span>Reject</span>
                                    </button>
                                  </li>
                                </ul>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {rejectModal.show && (
              <>
                <div
                  className="modal-backdrop fade show"
                  style={{ zIndex: 1040 }}
                  onMouseDown={() => setRejectModal({ show: false, appointmentId: null, reason: '' })}
                ></div>
                <div className="modal fade show" style={{ display: 'block', zIndex: 1050 }} tabIndex="-1">
                  <div
                    className="modal-dialog modal-dialog-centered"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Reject Appointment</h5>
                        <button
                          type="button"
                          className="btn-close"
                          onClick={() => setRejectModal({ show: false, appointmentId: null, reason: '' })}
                        ></button>
                      </div>
                      <div className="modal-body">
                        <div className="form-group">
                          <label>Reason for Rejection (Optional)</label>
                          <textarea
                            className="form-control"
                            rows="4"
                            value={rejectModal.reason}
                            onChange={(e) => setRejectModal((prev) => ({ ...prev, reason: e.target.value }))}
                            placeholder="Enter reason for rejection..."
                          ></textarea>
                        </div>
                      </div>
                      <div className="modal-footer">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setRejectModal({ show: false, appointmentId: null, reason: '' })}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={confirmReject}
                          disabled={reject.isPending}
                        >
                          {reject.isPending ? 'Rejecting...' : 'Reject Appointment'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorRequest
