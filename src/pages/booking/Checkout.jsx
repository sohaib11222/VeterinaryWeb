import { useState, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { useAuth } from '../../contexts/AuthContext'
import { useVeterinarianPublicProfile, usePets } from '../../queries'
import { useCreateAppointment } from '../../mutations/appointmentMutations'
import { useProcessAppointmentPayment } from '../../mutations/paymentMutations'
import { getImageUrl } from '../../utils/apiConfig'

const Checkout = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

  const [paymentMethod, setPaymentMethod] = useState('CARD')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Get booking details from URL params
  const bookingDetails = useMemo(() => ({
    veterinarianId: searchParams.get('veterinarianId'),
    petOwnerId: searchParams.get('petOwnerId'),
    petId: searchParams.get('petId'),
    appointmentDate: searchParams.get('appointmentDate'),
    appointmentTime: searchParams.get('appointmentTime'),
    bookingType: searchParams.get('bookingType') || 'VISIT',
    reason: searchParams.get('reason'),
    petSymptoms: searchParams.get('petSymptoms'),
    timezoneOffset: parseInt(searchParams.get('timezoneOffset') || '0', 10),
  }), [searchParams])

  const { data: vetProfileResponse, isLoading: vetLoading } = useVeterinarianPublicProfile(bookingDetails.veterinarianId)
  const vetProfile = useMemo(() => vetProfileResponse?.data ?? vetProfileResponse ?? null, [vetProfileResponse])
  const vetName = vetProfile?.userId?.name || vetProfile?.userId?.fullName || vetProfile?.name || 'Veterinarian'
  const vetImage = getImageUrl(vetProfile?.userId?.profileImage) || '/assets/img/doctors/doctor-thumb-02.jpg'

  const consultationFee = useMemo(() => {
    const fees = vetProfile?.consultationFees
    const raw = bookingDetails.bookingType === 'ONLINE' ? fees?.online : fees?.clinic
    if (raw === null || raw === undefined || raw === '') return null
    const num = typeof raw === 'number' ? raw : Number(raw)
    if (!Number.isFinite(num) || num <= 0) return null
    return num
  }, [vetProfile, bookingDetails.bookingType])

  const { data: petsResponse } = usePets()
  const pets = useMemo(() => {
    const raw = petsResponse?.data ?? petsResponse
    return Array.isArray(raw) ? raw : []
  }, [petsResponse])
  const selectedPet = pets.find((p) => p._id === bookingDetails.petId)

  const createAppointment = useCreateAppointment()
  const processPayment = useProcessAppointmentPayment()

  const totalAmount = consultationFee || 0

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!termsAccepted) {
      toast.error('Please accept the terms and conditions')
      return
    }

    if (!consultationFee) {
      toast.error('Consultation fee is not set for this appointment type')
      return
    }

    if (!bookingDetails.veterinarianId || !bookingDetails.petId) {
      toast.error('Invalid booking details. Please go back and try again.')
      return
    }

    setIsProcessing(true)

    try {
      // 1. Create the appointment first
      const appointmentPayload = {
        veterinarianId: bookingDetails.veterinarianId,
        petOwnerId: bookingDetails.petOwnerId || user?.id || user?._id,
        petId: bookingDetails.petId,
        appointmentDate: bookingDetails.appointmentDate,
        appointmentTime: bookingDetails.appointmentTime,
        bookingType: bookingDetails.bookingType,
        reason: bookingDetails.reason,
        petSymptoms: bookingDetails.petSymptoms || undefined,
        timezoneOffset: bookingDetails.timezoneOffset,
      }

      const appointmentRes = await createAppointment.mutateAsync(appointmentPayload)
      const appointment = appointmentRes?.data?.data ?? appointmentRes?.data ?? appointmentRes
      const appointmentId = appointment?._id

      if (!appointmentId) {
        throw new Error('Failed to create appointment')
      }

      // 2. Process payment for the appointment
      await processPayment.mutateAsync({
        appointmentId,
        amount: totalAmount,
        paymentMethod,
      })

      toast.success('Payment successful! Appointment booked.')
      navigate(`/booking-success?appointmentId=${appointmentId}`)
    } catch (err) {
      console.error('Checkout error:', err)
      toast.error(err?.response?.data?.message || err?.message || 'Failed to process payment')
    } finally {
      setIsProcessing(false)
    }
  }

  // Redirect if no booking details
  if (!bookingDetails.veterinarianId || !bookingDetails.petId) {
    return (
      <div className="content">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 mx-auto">
              <div className="alert alert-warning">
                <h5>Invalid Booking</h5>
                <p>No booking details found. Please start from the booking page.</p>
                <Link className="btn btn-primary" to="/search">Find a Veterinarian</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="content">
        <div className="container">
          <div className="row">
            <div className="col-md-7 col-lg-8">
              <div className="card">
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    <div className="info-widget">
                      <h4 className="card-title">Patient Information</h4>
                      <div className="row">
                        <div className="col-md-6 col-sm-12">
                          <div className="mb-3 card-label">
                            <label className="mb-2">Name</label>
                            <input
                              className="form-control"
                              type="text"
                              value={user?.name || user?.fullName || ''}
                              disabled
                            />
                          </div>
                        </div>
                        <div className="col-md-6 col-sm-12">
                          <div className="mb-3 card-label">
                            <label className="mb-2">Email</label>
                            <input
                              className="form-control"
                              type="email"
                              value={user?.email || ''}
                              disabled
                            />
                          </div>
                        </div>
                        <div className="col-md-6 col-sm-12">
                          <div className="mb-3 card-label">
                            <label className="mb-2">Pet</label>
                            <input
                              className="form-control"
                              type="text"
                              value={selectedPet ? `${selectedPet.name} (${selectedPet.species || selectedPet.breed || 'Pet'})` : 'Loading...'}
                              disabled
                            />
                          </div>
                        </div>
                        <div className="col-md-6 col-sm-12">
                          <div className="mb-3 card-label">
                            <label className="mb-2">Reason</label>
                            <input
                              className="form-control"
                              type="text"
                              value={bookingDetails.reason || ''}
                              disabled
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="payment-widget">
                      <h4 className="card-title">Payment Method</h4>

                      <div className="payment-list">
                        <label className="payment-radio credit-card-option">
                          <input
                            type="radio"
                            name="paymentMethod"
                            checked={paymentMethod === 'CARD'}
                            onChange={() => setPaymentMethod('CARD')}
                          />
                          <span className="checkmark"></span>
                          Credit/Debit Card
                        </label>
                        {paymentMethod === 'CARD' && (
                          <div className="row mt-3">
                            <div className="col-md-6">
                              <div className="mb-3 card-label">
                                <label htmlFor="card_name">Name on Card</label>
                                <input className="form-control" id="card_name" type="text" placeholder="John Doe" />
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="mb-3 card-label">
                                <label htmlFor="card_number">Card Number</label>
                                <input className="form-control" id="card_number" placeholder="4242 4242 4242 4242" type="text" />
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="mb-3 card-label">
                                <label htmlFor="expiry_month">Expiry Month</label>
                                <input className="form-control" id="expiry_month" placeholder="MM" type="text" />
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="mb-3 card-label">
                                <label htmlFor="expiry_year">Expiry Year</label>
                                <input className="form-control" id="expiry_year" placeholder="YY" type="text" />
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="mb-3 card-label">
                                <label htmlFor="cvv">CVV</label>
                                <input className="form-control" id="cvv" type="text" placeholder="123" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="payment-list">
                        <label className="payment-radio paypal-option">
                          <input
                            type="radio"
                            name="paymentMethod"
                            checked={paymentMethod === 'PAYPAL'}
                            onChange={() => setPaymentMethod('PAYPAL')}
                          />
                          <span className="checkmark"></span>
                          PayPal
                        </label>
                      </div>

                      <div className="payment-list">
                        <label className="payment-radio">
                          <input
                            type="radio"
                            name="paymentMethod"
                            checked={paymentMethod === 'DUMMY'}
                            onChange={() => setPaymentMethod('DUMMY')}
                          />
                          <span className="checkmark"></span>
                          Test Payment (Demo)
                        </label>
                      </div>

                      <div className="terms-accept mt-4">
                        <div className="custom-checkbox">
                          <input
                            type="checkbox"
                            id="terms_accept"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                          />
                          <label htmlFor="terms_accept" className="ms-2">
                            I have read and accept <Link to="/terms-condition">Terms & Conditions</Link>
                          </label>
                        </div>
                      </div>

                      <div className="submit-section mt-4">
                        <button
                          type="button"
                          className="btn btn-outline-secondary me-3"
                          onClick={() => navigate(-1)}
                          disabled={isProcessing}
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary submit-btn"
                          disabled={isProcessing || !termsAccepted || !consultationFee}
                        >
                          {isProcessing ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Processing...
                            </>
                          ) : (
                            consultationFee ? `Confirm and Pay €${totalAmount.toFixed(2)}` : 'Fee not set'
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <div className="col-md-5 col-lg-4 theiaStickySidebar">
              <div className="card booking-card">
                <div className="card-header">
                  <h4 className="card-title">Booking Summary</h4>
                </div>
                <div className="card-body">
                  <div className="booking-doc-info">
                    <Link to={`/doctor-profile/${bookingDetails.veterinarianId}`} className="booking-doc-img">
                      <img src={vetImage} alt="Veterinarian" />
                    </Link>
                    <div className="booking-info">
                      <h4>
                        <Link to={`/doctor-profile/${bookingDetails.veterinarianId}`}>
                          {vetLoading ? 'Loading...' : vetName}
                        </Link>
                      </h4>
                      <p className="text-muted mb-0">Veterinarian</p>
                    </div>
                  </div>

                  <div className="booking-summary">
                    <div className="booking-item-wrap">
                      <ul className="booking-date">
                        <li>Date: <span>{bookingDetails.appointmentDate ? new Date(bookingDetails.appointmentDate).toLocaleDateString() : '—'}</span></li>
                        <li>Time: <span>{bookingDetails.appointmentTime || '—'}</span></li>
                        <li>Type: <span>{bookingDetails.bookingType === 'ONLINE' ? 'Video Consultation' : 'Clinic Visit'}</span></li>
                      </ul>
                      <ul className="booking-fee">
                        <li>Consultation Fee <span>{consultationFee ? `€${consultationFee.toFixed(2)}` : '—'}</span></li>
                      </ul>
                      <div className="booking-total">
                        <ul className="booking-total-list">
                          <li>
                            <span>Total</span>
                            <span className="total-cost">{consultationFee ? `€${totalAmount.toFixed(2)}` : '—'}</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Checkout

