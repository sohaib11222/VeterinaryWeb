import { useState, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { useAuth } from '../../contexts/AuthContext'
import { useVeterinarianPublicProfile, usePets } from '../../queries'
import { useCreateAppointment } from '../../mutations/appointmentMutations'
import { useProcessAppointmentPayment } from '../../mutations/paymentMutations'
import { getImageUrl } from '../../utils/apiConfig'
import { useLanguage } from '../../contexts/LanguageContext'

const Checkout = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

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
    timezone: searchParams.get('timezone') || 'Europe/Rome',
    timezoneOffset: parseInt(searchParams.get('timezoneOffset') || '0', 10),
  }), [searchParams])

  const { data: vetProfileResponse, isLoading: vetLoading } = useVeterinarianPublicProfile(bookingDetails.veterinarianId)
  const vetProfile = useMemo(() => vetProfileResponse?.data ?? vetProfileResponse ?? null, [vetProfileResponse])
  const vetName = vetProfile?.userId?.name || vetProfile?.userId?.fullName || vetProfile?.name || t('booking.veterinarian')
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
  const paymentMethod = 'STRIPE'

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!termsAccepted) {
      toast.error(t('booking.acceptTerms'))
      return
    }

    if (!consultationFee) {
      toast.error(t('booking.feeMissing'))
      return
    }

    if (!bookingDetails.veterinarianId || !bookingDetails.petId) {
      toast.error(t('booking.invalidHint'))
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
        timezone: bookingDetails.timezone,
        timezoneOffset: bookingDetails.timezoneOffset,
      }

      const appointmentRes = await createAppointment.mutateAsync(appointmentPayload)
      const appointment = appointmentRes?.data?.data ?? appointmentRes?.data ?? appointmentRes
      const appointmentId = appointment?._id

      if (!appointmentId) {
        throw new Error(t('booking.paymentFailed'))
      }

      // 2. Process payment for the appointment
      await processPayment.mutateAsync({
        appointmentId,
        amount: totalAmount,
        paymentMethod,
      })

      toast.success(t('booking.paymentSuccess'))
      navigate(`/booking-success?appointmentId=${appointmentId}`)
    } catch (err) {
      console.error('Checkout error:', err)
      toast.error(err?.response?.data?.message || err?.message || t('booking.paymentFailed'))
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
                <h5>{t('booking.invalid')}</h5>
                <p>{t('booking.invalidHint')}</p>
                <Link className="btn btn-primary" to="/search">{t('booking.findVet')}</Link>
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
                      <h4 className="card-title">{t('booking.petInformation')}</h4>
                      <div className="row">
                        <div className="col-md-6 col-sm-12">
                          <div className="mb-3 card-label">
                            <label className="mb-2">{t('booking.name')}</label>
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
                            <label className="mb-2">{t('booking.email')}</label>
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
                            <label className="mb-2">{t('booking.pet')}</label>
                            <input
                              className="form-control"
                              type="text"
                              value={selectedPet ? `${selectedPet.name} (${selectedPet.species || selectedPet.breed || t('booking.pet')})` : t('booking.loading')}
                              disabled
                            />
                          </div>
                        </div>
                        <div className="col-md-6 col-sm-12">
                          <div className="mb-3 card-label">
                            <label className="mb-2">{t('booking.reason')}</label>
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
                      <h4 className="card-title">{t('booking.paymentMethod')}</h4>

                      <div className="payment-list">
                        <div className="payment-radio paypal-option d-flex align-items-center">
                          <span className="checkmark"></span>
                          <div>
                            <strong>{t('booking.stripe')}</strong>
                            <small className="d-block text-muted">{t('booking.secureStripe')}</small>
                          </div>
                        </div>
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
                            {t('booking.termsAccept')} <Link to="/terms-condition">{t('booking.terms')}</Link>
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
                          {t('booking.back')}
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary submit-btn"
                          disabled={isProcessing || !termsAccepted || !consultationFee}
                        >
                          {isProcessing ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              {t('booking.processing')}
                            </>
                          ) : (
                            consultationFee ? t('booking.confirmPay', { amount: `€${totalAmount.toFixed(2)}` }) : t('booking.feeNotSet')
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
                  <h4 className="card-title">{t('booking.summary')}</h4>
                </div>
                <div className="card-body">
                  <div className="booking-doc-info">
                    <Link to={`/doctor-profile/${bookingDetails.veterinarianId}`} className="booking-doc-img">
                      <img src={vetImage} alt={t('booking.veterinarian')} />
                    </Link>
                    <div className="booking-info">
                      <h4>
                        <Link to={`/doctor-profile/${bookingDetails.veterinarianId}`}>
                          {vetLoading ? t('booking.loading') : vetName}
                        </Link>
                      </h4>
                      <p className="text-muted mb-0">{t('booking.veterinarian')}</p>
                    </div>
                  </div>

                  <div className="booking-summary">
                    <div className="booking-item-wrap">
                      <ul className="booking-date">
                        <li>{t('booking.date')}: <span>{bookingDetails.appointmentDate ? new Date(bookingDetails.appointmentDate).toLocaleDateString() : '—'}</span></li>
                        <li>{t('booking.time')}: <span>{bookingDetails.appointmentTime || '—'}</span></li>
                        <li>{t('booking.type')}: <span>{bookingDetails.bookingType === 'ONLINE' ? t('booking.onlineConsultation') : t('booking.clinicVisit')}</span></li>
                      </ul>
                      <ul className="booking-fee">
                        <li>{t('booking.consultationFee')} <span>{consultationFee ? `€${consultationFee.toFixed(2)}` : '—'}</span></li>
                      </ul>
                      <div className="booking-total">
                        <ul className="booking-total-list">
                          <li>
                            <span>{t('booking.total')}</span>
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

