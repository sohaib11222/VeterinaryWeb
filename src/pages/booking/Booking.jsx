import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { useAuth } from '../../contexts/AuthContext'
import { usePets, useVeterinarianPublicProfile, useWeeklyAvailableSlotsForDate } from '../../queries'

const Booking = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

  const veterinarianId = searchParams.get('vet') || searchParams.get('veterinarianId')

  const [bookingType, setBookingType] = useState('VISIT')
  const [petId, setPetId] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [reason, setReason] = useState('')
  const [petSymptoms, setPetSymptoms] = useState('')

  const petOwnerId = user?._id || user?.id || ''

  const { data: petsResponse, isLoading: petsLoading } = usePets()
  const pets = useMemo(() => {
    const raw = petsResponse?.data ?? petsResponse
    return Array.isArray(raw) ? raw : []
  }, [petsResponse])

  const { data: vetProfileResponse, isLoading: vetLoading } = useVeterinarianPublicProfile(veterinarianId)
  const vetProfile = useMemo(() => {
    return vetProfileResponse?.data ?? vetProfileResponse ?? null
  }, [vetProfileResponse])

  const vetName =
    vetProfile?.userId?.name ||
    vetProfile?.userId?.fullName ||
    vetProfile?.name ||
    'Veterinarian'

  const { data: slotsResponse, isLoading: slotsLoading } = useWeeklyAvailableSlotsForDate({
    veterinarianId,
    date: appointmentDate,
    enabled: !!appointmentDate,
  })

  const availableSlots = useMemo(() => {
    const raw = slotsResponse?.data ?? slotsResponse
    return Array.isArray(raw) ? raw : []
  }, [slotsResponse])

  useEffect(() => {
    if (!appointmentDate) {
      setAppointmentTime('')
    }
  }, [appointmentDate])

  const minDate = useMemo(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!veterinarianId) {
      toast.error('Please select a veterinarian first')
      return
    }

    if (!user || !petOwnerId) {
      toast.error('Please login to book an appointment')
      navigate('/login')
      return
    }

    if (!petId) {
      toast.error('Please select a pet')
      return
    }

    if (!appointmentDate) {
      toast.error('Please select a date')
      return
    }

    if (!appointmentTime) {
      toast.error('Please select a time slot')
      return
    }

    if (!reason.trim()) {
      toast.error('Please enter a reason for the appointment')
      return
    }

    const tzOffset = -new Date().getTimezoneOffset()

    // Navigate to checkout with booking details
    const checkoutParams = new URLSearchParams({
      veterinarianId,
      petOwnerId,
      petId,
      appointmentDate,
      appointmentTime,
      bookingType,
      reason: reason.trim(),
      ...(petSymptoms.trim() && { petSymptoms: petSymptoms.trim() }),
      timezoneOffset: tzOffset.toString(),
    })

    navigate(`/checkout?${checkoutParams.toString()}`)
  }

  if (!veterinarianId) {
    return (
      <div className="doctor-content">
        <div className="container">
          <div className="row">
            <div className="col-lg-9 mx-auto">
              <div className="alert alert-warning">
                <h5>Veterinarian Required</h5>
                <p>Please select a veterinarian from search to book an appointment.</p>
                <Link className="btn btn-primary" to="/search">Browse Veterinarians</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="doctor-content">
      <div className="container">
        <div className="row">
          <div className="col-lg-9 mx-auto">
            <div className="booking-wizard">
              <ul className="form-wizard-steps d-sm-flex align-items-center justify-content-center" id="progressbar2">
                <li className="progress-active">
                  <div className="profile-step">
                    <span className="multi-steps">1</span>
                    <div className="step-section">
                      <h6>Appointment</h6>
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            <div className="booking-widget multistep-form mb-5">
              <div className="card booking-card mb-0">
                <div className="card-header">
                  <div className="booking-header pb-0">
                    <div className="card mb-0">
                      <div className="card-body">
                        <div className="d-flex align-items-center flex-wrap rpw-gap-2 row-gap-2">
                          <span className="avatar avatar-xxxl avatar-rounded me-2 flex-shrink-0">
                            <img src="/assets/img/clients/client-15.jpg" alt="" />
                          </span>
                          <div>
                            <h4 className="mb-1">{vetLoading ? 'Loading...' : vetName}</h4>
                            <p className="text-indigo mb-0 fw-medium">Book a veterinary appointment</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card-body booking-body">
                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Appointment Type</label>
                        <select
                          className="form-select"
                          value={bookingType}
                          onChange={(e) => setBookingType(e.target.value)}
                        >
                          <option value="VISIT">Clinic Visit</option>
                          <option value="ONLINE">Online Consultation</option>
                        </select>
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">Pet</label>
                        <select
                          className="form-select"
                          value={petId}
                          onChange={(e) => setPetId(e.target.value)}
                          disabled={petsLoading}
                        >
                          <option value="">Select Pet</option>
                          {pets.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        {!petsLoading && pets.length === 0 && (
                          <div className="form-text text-danger">
                            You have no pets yet. Please add a pet first.
                          </div>
                        )}
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">Date</label>
                        <input
                          className="form-control"
                          type="date"
                          min={minDate}
                          value={appointmentDate}
                          onChange={(e) => setAppointmentDate(e.target.value)}
                        />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">Time Slot</label>
                        <select
                          className="form-select"
                          value={appointmentTime}
                          onChange={(e) => setAppointmentTime(e.target.value)}
                          disabled={!appointmentDate || slotsLoading}
                        >
                          <option value="">Select Time</option>
                          {availableSlots.map((s, idx) => (
                            <option key={`${s.startTime}-${idx}`} value={s.startTime}>
                              {s.startTime} - {s.endTime}
                            </option>
                          ))}
                        </select>
                        {appointmentDate && !slotsLoading && availableSlots.length === 0 && (
                          <div className="form-text text-muted">No slots available for this date.</div>
                        )}
                      </div>

                      <div className="col-12 mb-3">
                        <label className="form-label">Reason</label>
                        <input
                          className="form-control"
                          type="text"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="e.g. Vaccination, fever, checkup"
                        />
                      </div>

                      <div className="col-12 mb-3">
                        <label className="form-label">Pet Symptoms (optional)</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={petSymptoms}
                          onChange={(e) => setPetSymptoms(e.target.value)}
                          placeholder="Describe symptoms..."
                        />
                      </div>
                    </div>

                    <div className="d-flex align-items-center justify-content-between mt-3">
                      <button
                        type="button"
                        className="btn btn-md btn-dark inline-flex align-items-center rounded-pill"
                        onClick={() => navigate(-1)}
                      >
                        <i className="isax isax-arrow-left-2 me-1"></i>
                        Back
                      </button>
                      <button
                        type="submit"
                        className="btn btn-md btn-primary-gradient inline-flex align-items-center rounded-pill"
                        disabled={pets.length === 0}
                      >
                        Proceed to Checkout
                        <i className="isax isax-arrow-right-3 ms-1"></i>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="mb-0">Copyright © {new Date().getFullYear()}. All Rights Reserved, MyPetPlus</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Booking

