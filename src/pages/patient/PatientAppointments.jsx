import { Link } from 'react-router-dom'
import { useMemo } from 'react'

import { useAppointments } from '../../queries'
import { getImageUrl } from '../../utils/apiConfig'

const PatientAppointments = () => {
  const { data: appointmentsResponse, isLoading } = useAppointments({ limit: 50 })

  const appointments = useMemo(() => {
    const payload = appointmentsResponse?.data?.data ?? appointmentsResponse?.data ?? appointmentsResponse
    const list = payload?.appointments ?? payload
    return Array.isArray(list) ? list : []
  }, [appointmentsResponse])

  const mapAppointmentCard = (a) => {
    const vet = a.veterinarianId || {}
    const pet = a.petId || {}
    const dateStr = a.appointmentDate ? new Date(a.appointmentDate).toLocaleDateString() : ''
    const timeStr = a.appointmentTime || ''
    const appointmentId = a._id
    const detailsUrl = appointmentId ? `/patient-appointment-details?id=${appointmentId}` : '/patient-appointment-details'

    return {
      id: a.appointmentNumber || a._id,
      appointmentId,
      detailsUrl,
      doctor: vet.name || vet.fullName || vet.email || 'Veterinarian',
      doctorImg: getImageUrl(vet.profileImage) || '/assets/img/doctors/doctor-thumb-21.jpg',
      date: `${dateStr} ${timeStr}`.trim(),
      types: [a.reason || 'Consultation', a.bookingType === 'ONLINE' ? 'Video Call' : 'Clinic Visit'],
      email: vet.email || '',
      phone: vet.phone || '',
      pet: pet.name ? `${pet.name}${pet.breed ? ` (${pet.breed})` : ''}` : 'Pet',
      _raw: a,
    }
  }

  const upcomingAppointments = useMemo(() => {
    const now = new Date()
    return appointments
      .filter((a) => {
        const status = String(a.status || '').toUpperCase()
        if (!['PENDING', 'CONFIRMED'].includes(status)) return false
        const d = a.appointmentDate ? new Date(a.appointmentDate) : null
        return !d || d >= new Date(now.setHours(0, 0, 0, 0))
      })
      .map(mapAppointmentCard)
  }, [appointments])

  const allAppointments = useMemo(
    () => appointments.map(mapAppointmentCard),
    [appointments]
  )

  const cancelledAppointments = useMemo(
    () => appointments
      .filter((a) => ['CANCELLED', 'REJECTED', 'NO_SHOW'].includes(String(a.status || '').toUpperCase()))
      .map(mapAppointmentCard),
    [appointments]
  )

  const completedAppointments = useMemo(
    () => appointments
      .filter((a) => String(a.status || '').toUpperCase() === 'COMPLETED')
      .map(mapAppointmentCard),
    [appointments]
  )

  const renderAppointmentList = (list, emptyText) => {
    if (isLoading) {
      return (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )
    }

    if (!list || list.length === 0) {
      return (
        <div className="text-center py-5 text-muted">
          <p className="mb-0">{emptyText}</p>
        </div>
      )
    }

    return list.map((apt, index) => (
      <div key={apt.appointmentId || index} className="appointment-wrap veterinary-appointment">
        <ul>
          <li>
            <div className="patinet-information">
              <Link to={apt.detailsUrl}>
                <img
                  src={apt.doctorImg}
                  alt="Veterinarian"
                  onError={(e) => {
                    e.currentTarget.onerror = null
                    e.currentTarget.src = '/assets/img/doctors/doctor-thumb-21.jpg'
                  }}
                />
              </Link>
              <div className="patient-info">
                <p>{apt.id}</p>
                <h6><Link to={apt.detailsUrl}>{apt.doctor}</Link></h6>
                <small className="text-muted">Pet: {apt.pet}</small>
              </div>
            </div>
          </li>
          <li className="appointment-info">
            <p><i className="fa-solid fa-clock"></i>{apt.date}</p>
            <ul className="d-flex apponitment-types">
              {apt.types.map((type, i) => (
                <li key={i} className="badge veterinary-badge">{type}</li>
              ))}
            </ul>
          </li>
          <li className="mail-info-patient">
            <ul>
              <li><i className="fa-solid fa-envelope"></i>{apt.email}</li>
              <li><i className="fa-solid fa-phone"></i>{apt.phone}</li>
            </ul>
          </li>
          <li className="appointment-action">
            <ul>
              <li>
                <Link to={apt.detailsUrl} className="veterinary-action-btn" title="View Details">
                  <i className="fa-solid fa-eye"></i>
                </Link>
              </li>
              <li>
                <Link
                  to={apt.appointmentId ? `/chat?appointmentId=${apt.appointmentId}` : '/chat'}
                  className="veterinary-action-btn"
                  title="Chat"
                >
                  <i className="fa-solid fa-comments"></i>
                </Link>
              </li>
            </ul>
          </li>
          <li className="appointment-start">
            {apt?._raw?.bookingType === 'ONLINE' && String(apt?._raw?.status || '').toUpperCase() === 'CONFIRMED' ? (
              <Link
                to={`/video-call?appointmentId=${apt.appointmentId}`}
                className="start-link veterinary-start-btn"
              >
                Join Video Call
              </Link>
            ) : (
              <Link to={apt.detailsUrl} className="start-link veterinary-start-btn">View</Link>
            )}
          </li>
        </ul>
      </div>
    ))
  }

  return (
    <div className="content veterinary-dashboard">
      <div className="container-fluid">
        <div className="row">
          <div className="col-lg-3 col-xl-2 theiaStickySidebar">
            {/* PatientSidebar will be rendered by DashboardLayout */}
          </div>
          <div className="col-lg-12 col-xl-12">
            {/* Veterinary Appointments Header */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="veterinary-dashboard-header">
                  <h2 className="dashboard-title">
                    <i className="fa-solid fa-calendar-check me-3"></i>
                    Pet Appointments
                  </h2>
                  <p className="dashboard-subtitle">Manage your pets' veterinary appointments and schedules</p>
                </div>
              </div>
            </div>

            {/* Appointments Controls */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="dashboard-card veterinary-card">
                  <div className="dashboard-card-body">
                    <div className="row align-items-center">
                      <div className="col-lg-4 mb-3 mb-lg-0">
                        <div className="input-block dash-search-input">
                          <input type="text" className="form-control" placeholder="Search veterinarians or pets..." />
                          <span className="search-icon"><i className="fa-solid fa-magnifying-glass"></i></span>
                        </div>
                      </div>
                      <div className="col-lg-8">
                        <div className="d-flex justify-content-lg-end align-items-center gap-2 flex-wrap">
                          <div className="view-icons">
                            <Link to="/patient-appointments" className="active veterinary-btn-icon">
                              <i className="fa-solid fa-list"></i>
                            </Link>
                          </div>
                          <div className="view-icons">
                            <Link to="/patient-appointments-grid" className="veterinary-btn-icon">
                              <i className="fa-solid fa-th"></i>
                            </Link>
                          </div>
                          <div className="view-icons">
                            <a href="#" className="veterinary-btn-icon">
                              <i className="fa-solid fa-calendar-days"></i>
                            </a>
                          </div>
                          <div className="form-sorts dropdown">
                            <a href="javascript:void(0);" className="dropdown-toggle veterinary-dropdown-btn" id="table-filter">
                              <i className="fa-solid fa-filter me-2"></i>Filter By
                            </a>
                            <div className="filter-dropdown-menu">
                              <div className="filter-set-view">
                                <div className="accordion" id="accordionExample">
                                  <div className="filter-set-content">
                                    <div className="filter-set-content-head">
                                      <a href="#" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                                        Veterinarian<i className="fa-solid fa-chevron-right"></i>
                                      </a>
                                    </div>
                                    <div className="filter-set-contents accordion-collapse collapse show" id="collapseTwo" data-bs-parent="#accordionExample">
                                      <ul>
                                        <li>
                                          <div className="input-block dash-search-input w-100">
                                            <input type="text" className="form-control" placeholder="Search vets..." />
                                            <span className="search-icon"><i className="fa-solid fa-magnifying-glass"></i></span>
                                          </div>
                                        </li>
                                      </ul>
                                    </div>
                                  </div>
                                  <div className="filter-set-content">
                                    <div className="filter-set-content-head">
                                      <a href="#" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                                        Appointment Type<i className="fa-solid fa-chevron-right"></i>
                                      </a>
                                    </div>
                                    <div className="filter-set-contents accordion-collapse collapse show" id="collapseOne" data-bs-parent="#accordionExample">
                                      <ul>
                                        <li>
                                          <div className="filter-checks">
                                            <label className="checkboxs">
                                              <input type="checkbox" defaultChecked />
                                              <span className="checkmarks"></span>
                                              <span className="check-title">All Types</span>
                                            </label>
                                          </div>
                                        </li>
                                        <li>
                                          <div className="filter-checks">
                                            <label className="checkboxs">
                                              <input type="checkbox" />
                                              <span className="checkmarks"></span>
                                              <span className="check-title">Video Call</span>
                                            </label>
                                          </div>
                                        </li>
                                        <li>
                                          <div className="filter-checks">
                                            <label className="checkboxs">
                                              <input type="checkbox" />
                                              <span className="checkmarks"></span>
                                              <span className="check-title">Clinic Visit</span>
                                            </label>
                                          </div>
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
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment Tabs */}
            <div className="row">
              <div className="col-12">
                <div className="dashboard-card veterinary-card">
                  <div className="dashboard-card-body p-0">
                    <div className="appointment-tab-head">
                      <div className="appointment-tabs">
                        <ul className="nav nav-pills inner-tab" id="pills-tab" role="tablist">
                          <li className="nav-item" role="presentation">
                            <button className="nav-link active veterinary-tab" id="pills-all-tab" data-bs-toggle="pill" data-bs-target="#pills-all" type="button" role="tab" aria-controls="pills-all" aria-selected="true">
                              <i className="fa-solid fa-list me-2"></i>
                              <span className="tab-text">All</span>
                              <span className="veterinary-tab-badge">{allAppointments.length}</span>
                            </button>
                          </li>
                          <li className="nav-item" role="presentation">
                            <button className="nav-link veterinary-tab" id="pills-upcoming-tab" data-bs-toggle="pill" data-bs-target="#pills-upcoming" type="button" role="tab" aria-controls="pills-upcoming" aria-selected="false">
                              <i className="fa-solid fa-clock me-2"></i>
                              <span className="tab-text">Upcoming</span>
                              <span className="veterinary-tab-badge">{upcomingAppointments.length}</span>
                            </button>
                          </li>
                          <li className="nav-item" role="presentation">
                            <button className="nav-link veterinary-tab" id="pills-cancel-tab" data-bs-toggle="pill" data-bs-target="#pills-cancel" type="button" role="tab" aria-controls="pills-cancel" aria-selected="true">
                              <i className="fa-solid fa-times-circle me-2"></i>
                              <span className="tab-text">Cancelled</span>
                              <span className="veterinary-tab-badge">{cancelledAppointments.length}</span>
                            </button>
                          </li>
                          <li className="nav-item" role="presentation">
                            <button className="nav-link veterinary-tab" id="pills-complete-tab" data-bs-toggle="pill" data-bs-target="#pills-complete" type="button" role="tab" aria-controls="pills-complete" aria-selected="true">
                              <i className="fa-solid fa-check-circle me-2"></i>
                              <span className="tab-text">Completed</span>
                              <span className="veterinary-tab-badge">{completedAppointments.length}</span>
                            </button>
                          </li>
                        </ul>
                      </div>
                      <div className="filter-head">
                        <div className="position-relative daterange-wraper me-2">
                          <div className="input-groupicon calender-input">
                            <input type="text" className="form-control date-range bookingrange" placeholder="From Date - To Date" />
                          </div>
                          <i className="fa-solid fa-calendar-days"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment Content */}
            <div className="row">
              <div className="col-12">
                <div className="tab-content appointment-tab-content">
                  <div className="tab-pane fade show active" id="pills-all" role="tabpanel" aria-labelledby="pills-all-tab">
                    <div className="dashboard-card veterinary-card">
                      <div className="dashboard-card-body">
                        {renderAppointmentList(allAppointments, 'No appointments found')}
                      </div>
                    </div>
                  </div>

                  <div className="tab-pane fade" id="pills-upcoming" role="tabpanel" aria-labelledby="pills-upcoming-tab">
                    <div className="dashboard-card veterinary-card">
                      <div className="dashboard-card-body">
                        {/* Appointment List */}
                        {renderAppointmentList(upcomingAppointments, 'No upcoming appointments')}
                      </div>
                    </div>
                  </div>

                  <div className="tab-pane fade" id="pills-cancel" role="tabpanel" aria-labelledby="pills-cancel-tab">
                    <div className="dashboard-card veterinary-card">
                      <div className="dashboard-card-body">
                        {renderAppointmentList(cancelledAppointments, 'No cancelled appointments')}
                      </div>
                    </div>
                  </div>

                  <div className="tab-pane fade" id="pills-complete" role="tabpanel" aria-labelledby="pills-complete-tab">
                    <div className="dashboard-card veterinary-card">
                      <div className="dashboard-card-body">
                        {renderAppointmentList(completedAppointments, 'No completed appointments')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientAppointments

