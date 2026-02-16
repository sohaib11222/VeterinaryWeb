import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { useEligibleRescheduleAppointments } from '../../queries'
import { useCreateRescheduleRequest } from '../../mutations/scheduleMutations'

const RequestReschedule = () => {
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
      toast.error('Please select an appointment')
      return
    }

    if (String(reason || '').trim().length < 10) {
      toast.error('Reason must be at least 10 characters')
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
      toast.success('Reschedule request submitted successfully')
      navigate('/patient/reschedule-requests')
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to submit reschedule request')
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
            <h3>Request Reschedule</h3>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            {eligibleQuery.isLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : eligibleQuery.isError ? (
              <div className="alert alert-danger">
                {eligibleQuery.error?.message || 'Failed to load eligible appointments'}
              </div>
            ) : eligibleAppointments.length === 0 ? (
              <div className="alert alert-info mb-0">
                No appointments are eligible for reschedule.
              </div>
            ) : (
              <form onSubmit={submit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Select Missed Appointment <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={selectedAppointmentId}
                      onChange={(e) => setSelectedAppointmentId(e.target.value)}
                    >
                      <option value="">Select appointment</option>
                      {eligibleAppointments.map((a) => {
                        const dateStr = a?.appointmentDate ? new Date(a.appointmentDate).toLocaleDateString() : '—'
                        const timeStr = a?.appointmentTime || '—'
                        const vetName =
                          a?.veterinarianId?.name ||
                          a?.veterinarianId?.fullName ||
                          a?.veterinarianId?.email ||
                          'Veterinarian'
                        return (
                          <option key={a?._id} value={a?._id}>
                            {vetName} - {dateStr} {timeStr}
                          </option>
                        )
                      })}
                    </select>
                    {selectedAppointment?.appointmentNumber && (
                      <small className="text-muted d-block mt-1">
                        Appointment: {selectedAppointment.appointmentNumber}
                      </small>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Preferred New Date (optional)</label>
                    <input
                      type="date"
                      className="form-control"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      min={minDate}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Preferred New Time (optional)</label>
                    <input
                      type="time"
                      className="form-control"
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                    />
                  </div>

                  <div className="col-12 mb-3">
                    <label className="form-label">
                      Reason <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Explain why you missed the appointment (min 10 characters)"
                    />
                    <small className="text-muted">{String(reason || '').length}/500</small>
                  </div>

                  <div className="col-12">
                    <div className="alert alert-warning">
                      After approval, you may need to pay a reschedule fee to confirm the new appointment.
                    </div>
                  </div>

                  <div className="col-12">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={createRequest.isPending}
                    >
                      {createRequest.isPending ? 'Submitting...' : 'Submit Request'}
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
