import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { useEligibleRescheduleAppointments } from '../../queries'
import { useCreateRescheduleRequest } from '../../mutations/scheduleMutations'
import { useLanguage } from '../../contexts/LanguageContext'

const RequestReschedule = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const appointmentIdFromUrl = searchParams.get('appointmentId')

  const eligibleQuery = useEligibleRescheduleAppointments()
  const createRequest = useCreateRescheduleRequest()

  const eligibleAppointments = useMemo(() => {
    const outer = eligibleQuery.data?.data ?? eligibleQuery.data
    const payload = outer?.data ?? outer
    return Array.isArray(payload) ? payload : Array.isArray(payload?.appointments) ? payload.appointments : []
  }, [eligibleQuery.data])

  const [selectedAppointmentId, setSelectedAppointmentId] = useState('')
  const [reason, setReason] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTime, setPreferredTime] = useState('')

  useEffect(() => {
    if (appointmentIdFromUrl) {
      setSelectedAppointmentId(appointmentIdFromUrl)
    }
  }, [appointmentIdFromUrl])

  const selectedAppointment = useMemo(
    () => eligibleAppointments.find((a) => String(a?._id) === String(selectedAppointmentId)) || null,
    [eligibleAppointments, selectedAppointmentId]
  )

  const submit = async (e) => {
    e.preventDefault()

    if (!selectedAppointmentId) {
      toast.error(t('patient.reschedule.chooseAppointment'))
      return
    }

    if (String(reason || '').trim().length < 10) {
      toast.error(t('patient.reschedule.reasonMin'))
      return
    }

    const payload = {
      appointmentId: selectedAppointmentId,
      reason: String(reason).trim(),
      ...(preferredDate ? { preferredDate } : {}),
      ...(preferredTime ? { preferredTime } : {}),
    }

    try {
      await createRequest.mutateAsync(payload)
      toast.success(t('patient.reschedule.requestSuccess'))
      navigate('/patient/reschedule-requests')
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || t('patient.reschedule.requestFailed'))
    }
  }

  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), [])

  return (
    <div className="content">
      <div className="container">
        <div className="dashboard-header">
          <div className="header-back">
            <Link to="/patient-appointments" className="back-arrow">
              <i className="fa-solid fa-arrow-left"></i>
            </Link>
            <h3>{t('patient.reschedule.request')}</h3>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            {eligibleQuery.isLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">{t('common.loading')}</span>
                </div>
              </div>
            ) : eligibleQuery.isError ? (
              <div className="alert alert-danger">
                {eligibleQuery.error?.message || t('patient.reschedule.failedLoadEligible')}
              </div>
            ) : eligibleAppointments.length === 0 ? (
              <div className="alert alert-info mb-0">
                {t('patient.reschedule.noEligible')}
              </div>
            ) : (
              <form onSubmit={submit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      {t('patient.reschedule.selectAppointment')} <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={selectedAppointmentId}
                      onChange={(e) => setSelectedAppointmentId(e.target.value)}
                    >
                      <option value="">{t('patient.reschedule.selectAppointmentPlaceholder')}</option>
                      {eligibleAppointments.map((a) => {
                        const dateStr = a?.appointmentDate ? new Date(a.appointmentDate).toLocaleDateString() : '—'
                        const timeStr = a?.appointmentTime || '—'
                        const vetName =
                          a?.veterinarianId?.name ||
                          a?.veterinarianId?.fullName ||
                          a?.veterinarianId?.email ||
                          t('patient.appointment.veterinarian')
                        return (
                          <option key={a?._id} value={a?._id}>
                            {vetName} - {dateStr} {timeStr}
                          </option>
                        )
                      })}
                    </select>
                    {selectedAppointment?.appointmentNumber && (
                      <small className="text-muted d-block mt-1">
                        {t('patient.appointment.details')}: {selectedAppointment.appointmentNumber}
                      </small>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">{t('patient.reschedule.preferredDate')}</label>
                    <input
                      type="date"
                      className="form-control"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      min={minDate}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">{t('patient.reschedule.preferredTime')}</label>
                    <input
                      type="time"
                      className="form-control"
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                    />
                  </div>

                  <div className="col-12 mb-3">
                    <label className="form-label">
                      {t('patient.reschedule.reason')} <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={t('patient.reschedule.reasonPlaceholder')}
                    />
                    <small className="text-muted">{String(reason || '').length}/500</small>
                  </div>

                  <div className="col-12">
                    <div className="alert alert-warning">
                      {t('patient.reschedule.feeNotice')}
                    </div>
                  </div>

                  <div className="col-12">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={createRequest.isPending}
                    >
                      {createRequest.isPending ? t('patient.reschedule.submitting') : t('patient.reschedule.submit')}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RequestReschedule
