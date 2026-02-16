import { Link, useSearchParams } from 'react-router-dom'
import Breadcrumb from '../../components/common/Breadcrumb'
import { useAppointment } from '../../queries'

const BookingSuccess = () => {
  const [searchParams] = useSearchParams()
  const appointmentId = searchParams.get('appointmentId')
  const { data: appointmentResponse } = useAppointment(appointmentId)

  const appointment = appointmentResponse?.data ?? appointmentResponse
  const vetName =
    appointment?.veterinarianId?.name ||
    appointment?.veterinarianId?.fullName ||
    appointment?.veterinarianId?.email ||
    'Veterinarian'

  const dateStr = appointment?.appointmentDate
    ? new Date(appointment.appointmentDate).toLocaleDateString()
    : null
  const timeStr = appointment?.appointmentTime || null

  return (
    <>
      <Breadcrumb title="Patient" li1="Booking" li2="Booking" />
      <div className="content success-page-cont">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <div className="card success-card">
                <div className="card-body">
                  <div className="success-cont">
                    <i className="fas fa-check"></i>
                    <h3>Appointment booked Successfully!</h3>
                    <p>
                      Appointment booked with <strong>{vetName}</strong>
                      {dateStr && timeStr ? (
                        <>
                          <br /> on <strong>{dateStr} {timeStr}</strong>
                        </>
                      ) : null}
                    </p>
                    <Link to="/invoice-view" className="btn btn-primary view-inv-btn">
                      View Invoice
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

