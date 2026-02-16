import { Link } from 'react-router-dom'
import { useMemo } from 'react'

import { useAppointments } from '../../queries'
import { getImageUrl } from '../../utils/apiConfig'

const PatientAppointmentsGrid = () => {
  const { data: appointmentsResponse, isLoading } = useAppointments({ limit: 50 })

  const appointments = useMemo(() => {
    const payload = appointmentsResponse?.data ?? appointmentsResponse
    const list = payload?.appointments ?? payload
    return Array.isArray(list) ? list : []
  }, [appointmentsResponse])

  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter((a) => ['PENDING', 'CONFIRMED'].includes(String(a.status || '').toUpperCase()))
      .map((a) => {
        const vet = a.veterinarianId || {}
        const dateStr = a.appointmentDate ? new Date(a.appointmentDate).toLocaleDateString() : ''
        const timeStr = a.appointmentTime || ''
        const icon = a.bookingType === 'ONLINE' ? 'video' : 'hospital'
        const appointmentId = a._id
        const detailsUrl = appointmentId ? `/patient-appointment-details?id=${appointmentId}` : '/patient-appointment-details'
        return {
          _id: a._id,
          id: a.appointmentNumber || a._id,
          appointmentId,
          doctor: vet.name || vet.fullName || vet.email || 'Veterinarian',
          doctorImg: getImageUrl(vet.profileImage) || '/assets/img/doctors/doctor-thumb-21.jpg',
          date: dateStr,
          time: timeStr,
          visitType: a.reason || 'Consultation',
          icon,
          detailsUrl,
        }
      })
  }, [appointments])

  const getIcon = (iconType) => {
    switch(iconType) {
      case 'video': return <i className="isax isax-video5"></i>
      case 'hospital': return <i className="isax isax-hospital5"></i>
      case 'call': return <i className="isax isax-call5"></i>
      default: return <i className="isax isax-video5"></i>
    }
  }

  return (
    <div className="content doctor-content">
      <div className="container">
        <div className="row">
          <div className="col-lg-4 col-xl-3 theiaStickySidebar">
            {/* PatientSidebar will be rendered by DashboardLayout */}
          </div>
          <div className="col-lg-8 col-xl-9">
            <div className="dashboard-header">
              <h3>Appointments</h3>
              <ul className="header-list-btns">
                <li>
                  <div className="input-block dash-search-input">
                    <input type="text" className="form-control" placeholder="Search" />
                    <span className="search-icon"><i className="isax isax-search-normal"></i></span>
                  </div>
                </li>
                <li>
                  <div className="view-icons">
                    <Link to="/patient-appointments"><i className="isax isax-grid-7"></i></Link>
                  </div>
                </li>
                <li>
                  <div className="view-icons">
                    <Link to="/patient-appointments-grid" className="active"><i className="fa-solid fa-th"></i></Link>
                  </div>
                </li>
              </ul>
            </div>
            <div className="appointment-tab-head">
              <div className="appointment-tabs">
                <ul className="nav nav-pills inner-tab" id="pills-tab" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button className="nav-link active" id="pills-upcoming-tab" data-bs-toggle="pill" data-bs-target="#pills-upcoming" type="button" role="tab">Upcoming<span>21</span></button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button className="nav-link" id="pills-cancel-tab" data-bs-toggle="pill" data-bs-target="#pills-cancel" type="button" role="tab">Cancelled<span>16</span></button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button className="nav-link" id="pills-complete-tab" data-bs-toggle="pill" data-bs-target="#pills-complete" type="button" role="tab">Completed<span>214</span></button>
                  </li>
                </ul>
              </div>
              <div className="filter-head">
                <div className="position-relative daterange-wraper me-2">
                  <div className="input-groupicon calender-input">
                    <input type="text" className="form-control date-range bookingrange" placeholder="From Date - To Date" />
                  </div>
                  <i className="isax isax-calendar-1"></i>
                </div>
                <div className="form-sorts dropdown">
                  <a href="javascript:void(0);" className="dropdown-toggle" id="table-filter"><i className="isax isax-filter me-2"></i>Filter By</a>
                </div>
              </div>
            </div>

            <div className="tab-content appointment-tab-content appoint-patient">
              <div className="tab-pane fade show active" id="pills-upcoming" role="tabpanel">
                <div className="row">
                  {isLoading ? (
                    <div className="col-12 text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : upcomingAppointments.map((apt, index) => (
                    <div key={index} className="col-xl-4 col-lg-6 col-md-12 d-flex">
                      <div className="appointment-wrap appointment-grid-wrap">
                        <ul>
                          <li>
                            <div className="appointment-grid-head">
                              <div className="patinet-information">
                                <Link to={apt.detailsUrl}>
                                  <img src={apt.doctorImg} alt="User Image" />
                                </Link>
                                <div className="patient-info">
                                  <p>{apt.id}</p>
                                  <h6><Link to={apt.detailsUrl}>{apt.doctor}</Link></h6>
                                  <p className="visit">{apt.visitType}</p>
                                </div>
                              </div>
                              <div className="grid-user-msg">
                                <span className={`${apt.icon === 'video' ? 'video' : apt.icon === 'hospital' ? 'hospital' : 'telephone'}-icon`}>
                                  <a href="#">{getIcon(apt.icon)}</a>
                                </span>
                              </div>
                            </div>
                          </li>
                          <li className="appointment-info">
                            <p><i className="isax isax-calendar5"></i>{apt.date}</p>
                            <p><i className="isax isax-clock5"></i>{apt.time}</p>
                          </li>
                          <li className="appointment-action">
                            <ul>
                              <li>
                                <Link to={apt.detailsUrl}><i className="isax isax-eye4"></i></Link>
                              </li>
                              <li>
                                <Link to={apt.appointmentId ? `/chat?appointmentId=${apt.appointmentId}` : '/chat'}>
                                  <i className="isax isax-messages-25"></i>
                                </Link>
                              </li>
                              <li>
                                <a href="#"><i className="isax isax-close-circle5"></i></a>
                              </li>
                            </ul>
                            <div className="appointment-detail-btn">
                              <a href="#" className="start-link"><i className="isax isax-calendar-tick5 me-1"></i>Attend</a>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientAppointmentsGrid

