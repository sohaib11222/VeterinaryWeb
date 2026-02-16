import { Link } from 'react-router-dom'
import { useMemo } from 'react'

import { useAppointments } from '../../queries'
import { getImageUrl } from '../../utils/apiConfig'

const DoctorAppointments = () => {
  const { data: appointmentsResponse, isLoading } = useAppointments({ limit: 50 })

  const appointments = useMemo(() => {
    const payload = appointmentsResponse?.data?.data ?? appointmentsResponse?.data ?? appointmentsResponse
    const list = payload?.appointments ?? payload
    return Array.isArray(list) ? list : []
  }, [appointmentsResponse])

  const mapped = useMemo(() => {
    return appointments.map((a) => {
      const pet = a.petId || {}
      const owner = a.petOwnerId || {}
      const dateStr = a.appointmentDate ? new Date(a.appointmentDate).toLocaleDateString() : ''
      const timeStr = a.appointmentTime || ''
      const detailsUrl = a._id ? `/doctor-appointment-details?id=${a._id}` : '/doctor-appointment-details'
      const status = String(a.status || '').toUpperCase()

      return {
        _id: a._id,
        appointmentNumber: a.appointmentNumber || a._id,
        petName: pet.name || 'Pet',
        petBreed: pet.breed || '',
        petImg: getImageUrl(pet.photo) || '/assets/img/doctors-dashboard/profile-01.jpg',
        ownerName: owner.name || owner.fullName || 'Pet Owner',
        ownerEmail: owner.email || '',
        ownerPhone: owner.phone || '',
        dateTime: `${dateStr} ${timeStr}`.trim(),
        reason: a.reason || 'Consultation',
        bookingType: a.bookingType === 'ONLINE' ? 'Video Call' : 'Clinic Visit',
        detailsUrl,
        status,
        appointmentDate: a.appointmentDate,
      }
    })
  }, [appointments])

  const upcomingAppointments = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(now.setHours(0, 0, 0, 0))
    return mapped.filter((a) => {
      if (!['PENDING', 'CONFIRMED'].includes(a.status)) return false
      if (!a.appointmentDate) return true
      const d = new Date(a.appointmentDate)
      return Number.isNaN(d.getTime()) ? true : d >= startOfToday
    })
  }, [mapped])

  const allAppointments = useMemo(() => mapped, [mapped])

  const cancelledAppointments = useMemo(
    () => mapped.filter((a) => ['CANCELLED', 'REJECTED', 'NO_SHOW'].includes(a.status)),
    [mapped]
  )
  const completedAppointments = useMemo(
    () => mapped.filter((a) => a.status === 'COMPLETED'),
    [mapped]
  )

  const renderAppointmentList = (list, emptyTitle, emptyText) => {
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
        <div className="text-center py-5">
          <h5>{emptyTitle}</h5>
          <p className="text-muted">{emptyText}</p>
        </div>
      )
    }

    return list.map((apt) => (
      <div key={apt._id} className="appointment-wrap veterinary-appointment">
        <ul>
          <li>
            <div className="patinet-information">
              <Link to={apt.detailsUrl}>
                <img
                  src={apt.petImg}
                  alt="Pet Image"
                  onError={(e) => {
                    e.currentTarget.onerror = null
                    e.currentTarget.src = '/assets/img/doctors-dashboard/profile-01.jpg'
                  }}
                />
              </Link>
              <div className="patient-info">
                <p>{apt.appointmentNumber}</p>
                <h6>
                  <Link to={apt.detailsUrl}>
                    {apt.petName}{apt.petBreed ? ` (${apt.petBreed})` : ''}
                  </Link>
                </h6>
                <small className="text-muted">Owner: {apt.ownerName}</small>
              </div>
            </div>
          </li>
          <li className="appointment-info">
            <p><i className="fa-solid fa-clock"></i>{apt.dateTime}</p>
            <ul className="d-flex apponitment-types">
              <li className="badge veterinary-badge">{apt.reason}</li>
              <li className="badge veterinary-badge">{apt.bookingType}</li>
            </ul>
          </li>
          <li className="mail-info-patient">
            <ul>
              <li><i className="fa-solid fa-envelope"></i>{apt.ownerEmail}</li>
              <li><i className="fa-solid fa-phone"></i>{apt.ownerPhone}</li>
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
                  to={apt._id ? `/chat-doctor?appointmentId=${apt._id}` : '/chat-doctor'}
                  className="veterinary-action-btn"
                  title="Chat"
                >
                  <i className="fa-solid fa-comments"></i>
                </Link>
              </li>
            </ul>
          </li>
          <li className="appointment-start">
            {apt.bookingType === 'Video Call' && apt.status === 'CONFIRMED' ? (
              <Link to={`/doctor/video-call?appointmentId=${apt._id}`} className="start-link veterinary-start-btn">
                Start Video Call
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
            {/* Sidebar is handled by DashboardLayout */}
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
                  <p className="dashboard-subtitle">Manage your pet appointments and schedules</p>
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
                          <input type="text" className="form-control" placeholder="Search pets or owners..." />
                          <span className="search-icon"><i className="fa-solid fa-magnifying-glass"></i></span>
                        </div>
                      </div>
                      <div className="col-lg-8">
                        <div className="d-flex justify-content-lg-end align-items-center gap-2 flex-wrap">
                          <div className="view-icons">
                            <Link to="/appointments" className="active veterinary-btn-icon">
                              <i className="fa-solid fa-list"></i>
                            </Link>
                          </div>
                          <div className="view-icons">
                            <Link to="/doctor-appointments-grid" className="veterinary-btn-icon">
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
                                        Pet Name<i className="fa-solid fa-chevron-right"></i>
                                      </a>
                                    </div>
                                    <div className="filter-set-contents accordion-collapse collapse show" id="collapseTwo" data-bs-parent="#accordionExample">
                                      <ul>
                                        <li>
                                          <div className="input-block dash-search-input w-100">
                                            <input type="text" className="form-control" placeholder="Search pets..." />
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
                                        <li>
                                          <div className="filter-checks">
                                            <label className="checkboxs">
                                              <input type="checkbox" />
                                              <span className="checkmarks"></span>
                                              <span className="check-title">Home Visit</span>
                                            </label>
                                          </div>
                                        </li>
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                                <div className="filter-reset-btns">
                                  <Link to="/appointments" className="btn btn-light">Reset</Link>
                                  <Link to="/appointments" className="btn btn-primary">Filter Now</Link>
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
            <div className="row mb-4">
              <div className="col-12">
                <div className="dashboard-card veterinary-card">
                  <div className="appointment-tab-head">
                    <div className="appointment-tabs">
                      <ul className="nav nav-pills veterinary-nav-tabs" id="pills-tab" role="tablist">
                        <li className="nav-item" role="presentation">
                          <button className="nav-link veterinary-tab active" id="pills-all-tab" data-bs-toggle="pill" data-bs-target="#pills-all" type="button" role="tab" aria-controls="pills-all" aria-selected="true">
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

            {/* Appointment Content */}
            <div className="row">
              <div className="col-12">
                <div className="tab-content appointment-tab-content">
                  <div className="tab-pane fade show active" id="pills-all" role="tabpanel" aria-labelledby="pills-all-tab">
                    <div className="dashboard-card veterinary-card">
                      <div className="dashboard-card-body">
                        {renderAppointmentList(allAppointments, 'No Appointments', "You don't have any appointments.")}
                      </div>
                    </div>
                  </div>

                  <div className="tab-pane fade" id="pills-upcoming" role="tabpanel" aria-labelledby="pills-upcoming-tab">
                    <div className="dashboard-card veterinary-card">
                      <div className="dashboard-card-body">
                        {/* Appointment List */}
                        {renderAppointmentList(upcomingAppointments, 'No Upcoming Appointments', "You don't have any upcoming appointments.")}
                      </div>
                    </div>
                  </div>

                  <div className="tab-pane fade" id="pills-cancel" role="tabpanel" aria-labelledby="pills-cancel-tab">
                    <div className="dashboard-card veterinary-card">
                      <div className="dashboard-card-body">
                        {renderAppointmentList(cancelledAppointments, 'No Cancelled Appointments', "You don't have any cancelled appointments at the moment.")}
                      </div>
                    </div>
                  </div>

                  <div className="tab-pane fade" id="pills-complete" role="tabpanel" aria-labelledby="pills-complete-tab">
                    <div className="dashboard-card veterinary-card">
                      <div className="dashboard-card-body">
                        {renderAppointmentList(completedAppointments, 'No Completed Appointments', "You don't have any completed appointments yet.")}
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

export default DoctorAppointments
