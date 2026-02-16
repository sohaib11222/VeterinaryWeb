import { Link, useSearchParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { useAppointment, useLatestWeightRecord, useVaccines } from '../../queries'
import {
  useAcceptAppointment,
  useRejectAppointment,
  useCompleteAppointment,
  useUpdateAppointmentStatus,
} from '../../mutations/appointmentMutations'

const DoctorAppointmentDetails = () => {
  const [searchParams] = useSearchParams()
  const appointmentId = searchParams.get('id')
  const { data: appointmentResponse, isLoading, refetch } = useAppointment(appointmentId)

  const { data: vaccinesResponse } = useVaccines()
  const vaccines = useMemo(() => vaccinesResponse?.data || vaccinesResponse || [], [vaccinesResponse])

  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [vaccinationsDraft, setVaccinationsDraft] = useState([
    { vaccineId: '', vaccinationDate: '', nextDueDate: '', batchNumber: '', notes: '' },
  ])

  const [weightDraft, setWeightDraft] = useState({ value: '', unit: 'kg', notes: '' })

  const acceptAppointment = useAcceptAppointment()
  const rejectAppointment = useRejectAppointment()
  const completeAppointment = useCompleteAppointment()
  const updateStatus = useUpdateAppointmentStatus()

  const appointment = useMemo(() => {
    return appointmentResponse?.data ?? appointmentResponse
  }, [appointmentResponse])

  const latestWeightPetId = appointment?.petId?._id
  const { data: latestWeightRecord } = useLatestWeightRecord(latestWeightPetId)

  const owner = appointment?.petOwnerId || {}
  const pet = appointment?.petId || {}
  const dateStr = appointment?.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString() : ''
  const timeStr = appointment?.appointmentTime || ''
  const status = String(appointment?.status || '').toUpperCase()
  const statusLabel = status || 'PENDING'

  const canAccept = status === 'PENDING'
  const canReject = status === 'PENDING'
  const canComplete = status === 'CONFIRMED'
  const canMarkNoShow = status === 'CONFIRMED'
  const canPrescription = status === 'COMPLETED'

  const getStatusBadgeClass = (s) => {
    switch (s) {
      case 'CONFIRMED': return 'bg-info'
      case 'PENDING': return 'bg-warning'
      case 'COMPLETED': return 'bg-success'
      case 'CANCELLED': return 'bg-danger'
      case 'REJECTED': return 'bg-danger'
      case 'NO_SHOW': return 'bg-secondary'
      default: return 'bg-warning'
    }
  }

  const handleAccept = async () => {
    try {
      await acceptAppointment.mutateAsync(appointmentId)
      toast.success('Appointment accepted')
      refetch()
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to accept appointment')
    }
  }

  const handleReject = async () => {
    try {
      await rejectAppointment.mutateAsync({
        appointmentId,
        data: { reason: rejectReason || undefined },
      })
      toast.success('Appointment rejected')
      setShowRejectModal(false)
      refetch()
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to reject appointment')
    }
  }

  const openCompleteModal = () => {
    const today = new Date().toISOString().slice(0, 10)
    setVaccinationsDraft([{ vaccineId: '', vaccinationDate: today, nextDueDate: '', batchNumber: '', notes: '' }])
    setWeightDraft({ value: '', unit: 'kg', notes: '' })
    setShowCompleteModal(true)
  }

  const handleCompleteSubmit = async () => {
    try {
      const filtered = (vaccinationsDraft || [])
        .filter((v) => v && String(v.vaccineId || '').trim())
        .map((v) => ({
          vaccineId: v.vaccineId,
          vaccinationDate: v.vaccinationDate || new Date().toISOString().slice(0, 10),
          nextDueDate: v.nextDueDate || null,
          batchNumber: v.batchNumber || null,
          notes: v.notes || null,
        }))

      const weightValue = Number(weightDraft.value)
      const hasWeight = Number.isFinite(weightValue) && weightDraft.value !== ''
      if (hasWeight && weightValue <= 0) {
        toast.error('Weight must be greater than 0')
        return
      }

      await completeAppointment.mutateAsync({
        appointmentId,
        data: {
          ...(filtered.length > 0 ? { vaccinations: filtered } : {}),
          ...(hasWeight
            ? {
              weightRecord: {
                weight: { value: weightValue, unit: weightDraft.unit || 'kg' },
                date: new Date().toISOString(),
                notes: weightDraft.notes || null,
              },
            }
            : {}),
        },
      })

      toast.success('Appointment marked as completed')
      setShowCompleteModal(false)
      refetch()
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to complete appointment')
    }
  }

  const handleNoShow = async () => {
    try {
      await updateStatus.mutateAsync({
        appointmentId,
        data: { status: 'NO_SHOW' },
      })
      toast.success('Appointment marked as no-show')
      refetch()
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to mark as no-show')
    }
  }

  const isProcessing = acceptAppointment.isPending || rejectAppointment.isPending || completeAppointment.isPending || updateStatus.isPending

  return (
    <>
      <div className="dashboard-header">
        <div className="header-back">
          <Link to="/appointments" className="back-arrow"><i className="fa-solid fa-arrow-left"></i></Link>
          <h3>Appointment Details</h3>
        </div>
      </div>
      <div className="appointment-details-wrap">
        {/* Appointment Detail Card */}
        <div className="appointment-wrap appointment-detail-card">
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
                  <div className="patinet-information">
                    <a href="#">
                      <img src="/assets/img/doctors-dashboard/profile-02.jpg" alt="Pet" />
                    </a>
                    <div className="patient-info">
                      <p>{appointment.appointmentNumber || appointment._id}</p>
                      <h6>
                        <a href="#">{pet.name ? `${pet.name}${pet.breed ? ` (${pet.breed})` : ''}` : 'Pet'}</a>
                        {status === 'PENDING' && <span className="badge new-tag ms-2">New</span>}
                      </h6>
                      <p className="text-muted mb-1">Owner: {owner.name || owner.fullName || 'Pet Owner'}</p>
                      <div className="mail-info-patient">
                        <ul>
                          <li><i className="fa-solid fa-envelope"></i>{owner.email || '—'}</li>
                          <li><i className="fa-solid fa-phone"></i>{owner.phone || '—'}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </li>
                <li className="appointment-info">
                  <div className="person-info">
                    <p>Type of Appointment</p>
                    <ul className="d-flex apponitment-types">
                      <li>
                        {appointment.bookingType === 'ONLINE' ? (
                          <><i className="fa-solid fa-video text-indigo"></i>Video Call</>
                        ) : (
                          <><i className="fa-solid fa-hospital text-green"></i>Clinic Visit</>
                        )}
                      </li>
                    </ul>
                  </div>
                </li>
                <li className="appointment-action">
                  <div className="detail-badge-info">
                    <span className={`badge ${getStatusBadgeClass(status)}`}>{statusLabel}</span>
                  </div>
                  <div className="consult-fees">
                    <h6>Consultation Fees: €50</h6>
                  </div>
                  <ul>
                    <li>
                      <Link to={appointmentId ? `/chat-doctor?appointmentId=${appointmentId}` : '/chat-doctor'}>
                        <i className="fa-solid fa-comments"></i>
                      </Link>
                    </li>
                  </ul>
                </li>
              </ul>
              <ul className="detail-card-bottom-info">
                <li>
                  <h6>Appointment Date & Time</h6>
                  <span>{dateStr} {timeStr}</span>
                </li>
                <li>
                  <h6>Visit Reason</h6>
                  <span>{appointment.reason || 'Consultation'}</span>
                </li>
                {appointment.petSymptoms && (
                  <li>
                    <h6>Pet Symptoms</h6>
                    <span>{appointment.petSymptoms}</span>
                  </li>
                )}
                {appointment.notes && (
                  <li>
                    <h6>Notes</h6>
                    <span>{appointment.notes}</span>
                  </li>
                )}
              </ul>

              {/* Action Buttons */}
              <div className="p-3 border-top">
                <div className="d-flex flex-wrap gap-2">
                  {canAccept && (
                    <button
                      className="btn btn-success"
                      onClick={handleAccept}
                      disabled={isProcessing}
                    >
                      {acceptAppointment.isPending ? 'Accepting...' : 'Accept Appointment'}
                    </button>
                  )}
                  {canReject && (
                    <button
                      className="btn btn-danger"
                      onClick={() => setShowRejectModal(true)}
                      disabled={isProcessing}
                    >
                      Reject Appointment
                    </button>
                  )}
                  {canComplete && (
                    <button
                      className="btn btn-primary"
                      onClick={openCompleteModal}
                      disabled={isProcessing}
                    >
                      {completeAppointment.isPending ? 'Completing...' : 'Mark as Completed'}
                    </button>
                  )}
                  {canMarkNoShow && (
                    <button
                      className="btn btn-secondary"
                      onClick={handleNoShow}
                      disabled={isProcessing}
                    >
                      {updateStatus.isPending ? 'Updating...' : 'Mark as No-Show'}
                    </button>
                  )}
                  {appointment.bookingType === 'ONLINE' && status === 'CONFIRMED' && (
                    <Link to={`/doctor/video-call?appointmentId=${appointmentId}`} className="btn btn-info">
                      <i className="fa-solid fa-video me-2"></i>Start Video Session
                    </Link>
                  )}

                  {canPrescription && (
                    <Link to={`/doctor/prescription?appointmentId=${appointmentId}`} className="btn btn-outline-primary">
                      Prescription
                    </Link>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        {/* /Appointment Detail Card */}
      </div>

      {/* Reject Appointment Modal */}
      {showRejectModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reject Appointment</h5>
                <button type="button" className="btn-close" onClick={() => setShowRejectModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to reject this appointment?</p>
                <div className="mb-3">
                  <label className="form-label">Reason for rejection (optional)</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter reason..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRejectModal(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleReject}
                  disabled={rejectAppointment.isPending}
                >
                  {rejectAppointment.isPending ? 'Rejecting...' : 'Reject Appointment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCompleteModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Complete Appointment & Record Vaccinations</h5>
                <button type="button" className="btn-close" onClick={() => setShowCompleteModal(false)} disabled={completeAppointment.isPending}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <h6 className="mb-2">Weight</h6>
                  {latestWeightRecord?.weight?.value !== undefined && latestWeightRecord?.weight?.value !== null && (
                    <div className="text-muted mb-2">
                      Last recorded: {latestWeightRecord.weight.value}{latestWeightRecord.weight.unit || 'kg'}
                    </div>
                  )}
                  <div className="row g-2 align-items-end">
                    <div className="col-md-4">
                      <label className="form-label">Value</label>
                      <input
                        type="number"
                        className="form-control"
                        value={weightDraft.value}
                        onChange={(e) => setWeightDraft((p) => ({ ...p, value: e.target.value }))}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Unit</label>
                      <select
                        className="form-select"
                        value={weightDraft.unit}
                        onChange={(e) => setWeightDraft((p) => ({ ...p, unit: e.target.value }))}
                      >
                        <option value="kg">kg</option>
                        <option value="lbs">lbs</option>
                      </select>
                    </div>
                    <div className="col-md-5">
                      <label className="form-label">Notes</label>
                      <input
                        type="text"
                        className="form-control"
                        value={weightDraft.notes}
                        onChange={(e) => setWeightDraft((p) => ({ ...p, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <h6 className="mb-2">Vaccinations</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Vaccine</th>
                        <th>Date</th>
                        <th>Next Due</th>
                        <th>Batch</th>
                        <th>Notes</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {vaccinationsDraft.map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ minWidth: 180 }}>
                            <select
                              className="form-select form-select-sm"
                              value={row.vaccineId}
                              onChange={(e) =>
                                setVaccinationsDraft((prev) => prev.map((p, i) => (i === idx ? { ...p, vaccineId: e.target.value } : p)))
                              }
                            >
                              <option value="">Select vaccine</option>
                              {Array.isArray(vaccines) && vaccines.map((v) => (
                                <option key={v._id} value={v._id}>{v.name}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={row.vaccinationDate}
                              onChange={(e) =>
                                setVaccinationsDraft((prev) => prev.map((p, i) => (i === idx ? { ...p, vaccinationDate: e.target.value } : p)))
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={row.nextDueDate}
                              onChange={(e) =>
                                setVaccinationsDraft((prev) => prev.map((p, i) => (i === idx ? { ...p, nextDueDate: e.target.value } : p)))
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={row.batchNumber}
                              onChange={(e) =>
                                setVaccinationsDraft((prev) => prev.map((p, i) => (i === idx ? { ...p, batchNumber: e.target.value } : p)))
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={row.notes}
                              onChange={(e) =>
                                setVaccinationsDraft((prev) => prev.map((p, i) => (i === idx ? { ...p, notes: e.target.value } : p)))
                              }
                            />
                          </td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => setVaccinationsDraft((prev) => prev.filter((_, i) => i !== idx))}
                              disabled={vaccinationsDraft.length <= 1 || completeAppointment.isPending}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => setVaccinationsDraft((prev) => [...prev, { vaccineId: '', vaccinationDate: new Date().toISOString().slice(0, 10), nextDueDate: '', batchNumber: '', notes: '' }])}
                  disabled={completeAppointment.isPending}
                >
                  Add Another Vaccine
                </button>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCompleteModal(false)} disabled={completeAppointment.isPending}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleCompleteSubmit} disabled={completeAppointment.isPending}>
                  {completeAppointment.isPending ? 'Completing...' : 'Complete Appointment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default DoctorAppointmentDetails

