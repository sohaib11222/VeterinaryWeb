import { Link, useSearchParams } from 'react-router-dom'
import Breadcrumb from '../../components/common/Breadcrumb'
import { useAppointment } from '../../queries'
import { useLanguage } from '../../contexts/LanguageContext'

const BookingSuccess = () => {
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const appointmentId = searchParams.get('appointmentId')
  const { data: appointmentResponse } = useAppointment(appointmentId)

  const appointment = appointmentResponse?.data ?? appointmentResponse
  const vetName =
    appointment?.veterinarianId?.name ||
    appointment?.veterinarianId?.fullName ||
    appointment?.veterinarianId?.email ||
    t('booking.veterinarian')

  const dateStr = appointment?.appointmentDate
    ? new Date(appointment.appointmentDate).toLocaleDateString()
    : null
  const timeStr = appointment?.appointmentTime || null

  return (
    <>
      <Breadcrumb title={t('booking.pet')} li1={t('booking.booking')} li2={t('booking.success')} />
      <div className="content success-page-cont">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <div className="card success-card">
                <div className="card-body">
                  <div className="success-cont">
                    <i className="fas fa-check"></i>
                    <h3>{t('booking.appointmentBooked')}</h3>
                    <p>
                      {t('booking.bookedWith')} <strong>{vetName}</strong>
                      {dateStr && timeStr ? (
                        <>
                          <br /> {t('booking.on')} <strong>{dateStr} {timeStr}</strong>
                        </>
                      ) : null}
                    </p>
                    <Link to="/patient-appointments" className="btn btn-primary view-inv-btn">
                      {t('booking.viewInvoice')}
                    </Link>
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

export default BookingSuccess

