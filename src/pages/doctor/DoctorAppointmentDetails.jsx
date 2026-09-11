import { Link, useSearchParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { useAppointment, useLatestWeightRecord, useVaccines } from '../../queries'
import { getImageUrl } from '../../utils/apiConfig'
import {
  useAcceptAppointment,
  useRejectAppointment,
  useCompleteAppointment,
  useUpdateAppointmentStatus,
} from '../../mutations/appointmentMutations'
import { useLanguage } from '../../contexts/LanguageContext'

const DoctorAppointmentDetails = () => {
  const { t, language } = useLanguage()
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

  // In some payloads the UI expects patient profile image (like react-conversion).
  // For Veterinary, appointments list uses pet.photo, so prioritize that.
  const patientImage =
    getImageUrl(appointment?.patientId?.profileImage) ||
    getImageUrl(owner?.profileImage) ||
    getImageUrl(pet?.photo) ||
    getImageUrl(pet?.image) ||
    getImageUrl(pet?.profileImage) ||
    '/assets/img/doctors-dashboard/profile-02.jpg'
  const dateStr = appointment?.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString(language === 'it' ? 'it-IT' : 'en-GB') : ''
  const timeStr = appointment?.appointmentTime || ''
  const status = String(appointment?.status || '').toUpperCase()
  const statusLabel = t(`doctorAppointments.${({ CONFIRMED: 'statusConfirmed', PENDING: 'statusPending', PENDING_PAYMENT: 'statusPendingPayment', COMPLETED: 'statusCompleted', CANCELLED: 'statusCancelled', REJECTED: 'statusRejected', NO_SHOW: 'statusNoShow', RESCHEDULED: 'statusRescheduled' })[status] || 'statusPending'}`)
  const consultationFee = useMemo(() => {
    const rawValue = appointment?.consultationFee
    if (rawValue === null || rawValue === undefined || rawValue === '') return null
    const value = Number(rawValue)
    return Number.isFinite(value) && value >= 0 ? value : null
  }, [appointment?.consultationFee])

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
      toast.success(t('doctorAppointmentDetails.accepted'))
      refetch()
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || t('doctorAppointmentDetails.acceptFailed'))
    }
  }

  const handleReject = async () => {
    try {
      await rejectAppointment.mutateAsync({
        appointmentId,
        data: { reason: rejectReason || undefined },
      })
      toast.success(t('doctorAppointmentDetails.rejected'))
      setShowRejectModal(false)
      refetch()
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || t('doctorAppointmentDetails.rejectFailed'))
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
        toast.error(t('doctorAppointmentDetails.weightInvalid'))
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

      toast.success(t('doctorAppointmentDetails.completed'))
      setShowCompleteModal(false)
      refetch()
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || t('doctorAppointmentDetails.completeFailed'))
    }
  }

  const handleNoShow = async () => {
    try {
      await updateStatus.mutateAsync({
        appointmentId,
        data: { status: 'NO_SHOW' },
      })
      toast.success(t('doctorAppointmentDetails.noShow'))
      refetch()
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || t('doctorAppointmentDetails.noShowFailed'))
    }
  }

  const isProcessing = acceptAppointment.isPending || rejectAppointment.isPending || completeAppointment.isPending || updateStatus.isPending

  return (
    <>
      <div className="dashboard-header">
        <div className="header-back">
          <Link to="/appointments" className="back-arrow" aria-label={t('doctorAppointmentDetails.back')} title={t('doctorAppointmentDetails.back')}><i className="fa-solid fa-arrow-left"></i></Link>
          <h3>{t('doctorAppointmentDetails.title')}</h3>
        </div>
      </div>
      <div className="appointment-details-wrap">
        {/* Appointment Detail Card */}
        <div className="appointment-wrap appointment-detail-card">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">{t('doctorAppointmentDetails.loading')}</span>
              </div>
            </div>
          ) : !appointmentId || !appointment ? (
            <div className="text-center py-5">
              <h5>{t('doctorAppointmentDetails.notFound')}</h5>
              <p className="text-muted">{t('doctorAppointmentDetails.notFoundHint')}</p>
            </div>
          ) : (
            <>
              <ul>
                <li>
                  <div className="patinet-information">
                    <a href="#">
                      <div
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          backgroundColor: '#f0f0f0',
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={patientImage}
                          alt={t('doctorAppointmentDetails.pet')}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                          onError={(e) => {
                            e.currentTarget.onerror = null
                            e.currentTarget.src = '/assets/img/doctors-dashboard/profile-02.jpg'
                          }}
                        />
                      </div>
                    </a>
                    <div className="patient-info">
                      <p>{appointment.appointmentNumber || appointment._id}</p>
                      <h6>
                        <a href="#">{pet.name ? `${pet.name}${pet.breed ? ` (${pet.breed})` : ''}` : t('doctorAppointmentDetails.pet')}</a>
                        {status === 'PENDING' && <span className="badge new-tag ms-2">{t('doctorAppointmentDetails.new')}</span>}
                      </h6>
                      <p className="text-muted mb-1">{t('doctorAppointmentDetails.owner')}: {owner.name || owner.fullName || t('doctorAppointmentDetails.owner')}</p>
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
                    <p>{t('doctorAppointmentDetails.typeOfAppointment')}</p>
                    <ul className="d-flex apponitment-types">
                      <li>
                        {appointment.bookingType === 'ONLINE' ? (
                          <><i className="fa-solid fa-video text-indigo"></i>{t('doctorAppointmentDetails.videoCall')}</>
                        ) : (
                          <><i className="fa-solid fa-hospital text-green"></i>{t('doctorAppointmentDetails.clinicVisit')}</>
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
                    <h6>{t('doctorAppointmentDetails.consultationFee')}: {consultationFee === null ? '—' : `€${consultationFee.toFixed(2)}`}</h6>
                  </div>
                  <ul>
                    <li>
                      <Link to={appointmentId ? `/chat-doctor?appointmentId=${appointmentId}` : '/chat-doctor'} aria-label={t('doctorAppointments.openChat')} title={t('doctorAppointments.openChat')}>
                        <i className="fa-solid fa-comments"></i>
                      </Link>
                    </li>
                  </ul>
                </li>
              </ul>
              <ul className="detail-card-bottom-info">
                <li>
                  <h6>{t('doctorAppointmentDetails.dateTime')}</h6>
                  <span>{dateStr} {timeStr}</span>
                </li>
                <li>
                  <h6>{t('doctorAppointmentDetails.visitReason')}</h6>
                  <span>{appointment.reason || t('doctorAppointmentDetails.consultation')}</span>
                </li>
                {appointment.petSymptoms && (
                  <li>
                    <h6>{t('doctorAppointmentDetails.petSymptoms')}</h6>
                    <span>{appointment.petSymptoms}</span>
                  </li>
                )}
                {appointment.notes && (
                  <li>
                    <h6>{t('doctorAppointmentDetails.notes')}</h6>
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
                       {acceptAppointment.isPending ? t('doctorAppointmentDetails.accepting') : t('doctorAppointmentDetails.accept')}
                    </button>
                  )}
                  {canReject && (
                    <button
                      className="btn btn-danger"
                      onClick={() => setShowRejectModal(true)}
                      disabled={isProcessing}
                    >
                       {t('doctorAppointmentDetails.reject')}
                    </button>
                  )}
                  {canComplete && (
                    <button
                      className="btn btn-primary"
                      onClick={openCompleteModal}
                      disabled={isProcessing}
                    >
                       {completeAppointment.isPending ? t('doctorAppointmentDetails.completing') : t('doctorAppointmentDetails.markCompleted')}
                    </button>
                  )}
                  {canMarkNoShow && (
                    <button
                      className="btn btn-secondary"
                      onClick={handleNoShow}
                      disabled={isProcessing}
                    >
                       {updateStatus.isPending ? t('doctorAppointmentDetails.updating') : t('doctorAppointmentDetails.markNoShow')}
                    </button>
                  )}
                  {appointment.bookingType === 'ONLINE' && status === 'CONFIRMED' && (
                    <Link to={`/doctor/video-call?appointmentId=${appointmentId}`} className="btn btn-info">
                       <i className="fa-solid fa-video me-2"></i>{t('doctorAppointmentDetails.startVideo')}
                    </Link>
                  )}

                  {canPrescription && (
                    <Link to={`/doctor/prescription?appointmentId=${appointmentId}`} className="btn btn-outline-primary">
                       {t('doctorAppointmentDetails.prescription')}
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
                <h5 className="modal-title">{t('doctorAppointmentDetails.rejectModalTitle')}</h5>
                <button type="button" className="btn-close" onClick={() => setShowRejectModal(false)} aria-label={t('doctorAppointmentDetails.close')}></button>
              </div>
              <div className="modal-body">
                <p>{t('doctorAppointmentDetails.rejectConfirm')}</p>
                <div className="mb-3">
                  <label className="form-label" htmlFor="doctor-reject-reason">{t('doctorAppointmentDetails.reasonOptional')}</label>
                  <textarea
                    id="doctor-reject-reason"
                    className="form-control"
                    rows="3"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder={t('doctorAppointmentDetails.reasonPlaceholder')}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRejectModal(false)}>
                  {t('doctorAppointmentDetails.cancel')}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleReject}
                  disabled={rejectAppointment.isPending}
                >
                  {rejectAppointment.isPending ? t('doctorAppointmentDetails.rejecting') : t('doctorAppointmentDetails.rejectAction')}
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
                <h5 className="modal-title">{t('doctorAppointmentDetails.completeModalTitle')}</h5>
                <button type="button" className="btn-close" onClick={() => setShowCompleteModal(false)} disabled={completeAppointment.isPending} aria-label={t('doctorAppointmentDetails.close')}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <h6 className="mb-2">{t('doctorAppointmentDetails.weight')}</h6>
                  {latestWeightRecord?.weight?.value !== undefined && latestWeightRecord?.weight?.value !== null && (
                    <div className="text-muted mb-2">
                      {t('doctorAppointmentDetails.lastRecorded')} {latestWeightRecord.weight.value}{latestWeightRecord.weight.unit || 'kg'}
                    </div>
                  )}
                  <div className="row g-2 align-items-end">
                    <div className="col-md-4">
                      <label className="form-label" htmlFor="doctor-weight-value">{t('doctorAppointmentDetails.value')}</label>
                      <input
                        id="doctor-weight-value"
                        type="number"
                        className="form-control"
                        value={weightDraft.value}
                        onChange={(e) => setWeightDraft((p) => ({ ...p, value: e.target.value }))}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label" htmlFor="doctor-weight-unit">{t('doctorAppointmentDetails.unit')}</label>
                      <select
                        id="doctor-weight-unit"
                        className="form-select"
                        value={weightDraft.unit}
                        onChange={(e) => setWeightDraft((p) => ({ ...p, unit: e.target.value }))}
                      >
                        <option value="kg">kg</option>
                        <option value="lbs">lbs</option>
                      </select>
                    </div>
                    <div className="col-md-5">
                      <label className="form-label" htmlFor="doctor-weight-notes">{t('doctorAppointmentDetails.weightNotes')}</label>
                      <input
                        id="doctor-weight-notes"
                        type="text"
                        className="form-control"
                        value={weightDraft.notes}
                        onChange={(e) => setWeightDraft((p) => ({ ...p, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <h6 className="mb-2">{t('doctorAppointmentDetails.vaccinations')}</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>{t('doctorAppointmentDetails.vaccine')}</th>
                        <th>{t('doctorAppointmentDetails.date')}</th>
                        <th>{t('doctorAppointmentDetails.nextDue')}</th>
                        <th>{t('doctorAppointmentDetails.batch')}</th>
                        <th>{t('doctorAppointmentDetails.weightNotes')}</th>
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
                              <option value="">{t('doctorAppointmentDetails.selectVaccine')}</option>
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
                              {t('doctorAppointmentDetails.remove')}
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
                  {t('doctorAppointmentDetails.addAnotherVaccine')}
                </button>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCompleteModal(false)} disabled={completeAppointment.isPending}>
                  {t('doctorAppointmentDetails.cancel')}
                </button>
                <button type="button" className="btn btn-primary" onClick={handleCompleteSubmit} disabled={completeAppointment.isPending}>
                  {completeAppointment.isPending ? t('doctorAppointmentDetails.completing') : t('doctorAppointmentDetails.completeAppointment')}
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

