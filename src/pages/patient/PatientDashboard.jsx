import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../../contexts/AuthContext'
import {
  useAppointments,
  useMedicalRecords,
  useMyPrescriptions,
  useNotifications,
  usePetOwnerDashboard,
  usePetOwnerPayments,
} from '../../queries'
import { useFavorites } from '../../queries/favoriteQueries'
import { getImageUrl } from '../../utils/apiConfig'

const PatientDashboard = () => {
  const { user } = useAuth()
  const petOwnerId = user?.id || user?._id

  const { data: dashboardRes, isLoading: dashboardLoading } = usePetOwnerDashboard()
  const dashboardOuter = useMemo(() => dashboardRes?.data ?? dashboardRes, [dashboardRes])
  const dashboard = useMemo(() => dashboardOuter?.data ?? dashboardOuter, [dashboardOuter])

  const { data: appointmentsResponse, isLoading: appointmentsLoading } = useAppointments({ page: 1, limit: 50 })
  const appointments = useMemo(() => {
    const payload = appointmentsResponse?.data?.data ?? appointmentsResponse?.data ?? appointmentsResponse
    const list = payload?.appointments ?? payload
    return Array.isArray(list) ? list : []
  }, [appointmentsResponse])

  const { data: favoritesRes, isLoading: favoritesLoading } = useFavorites(petOwnerId, { page: 1, limit: 4 })
  const favoritesPayload = useMemo(() => favoritesRes?.data ?? favoritesRes, [favoritesRes])
  const favorites = useMemo(() => favoritesPayload?.favorites ?? [], [favoritesPayload])

  const { data: notificationsRes, isLoading: notificationsLoading } = useNotifications({ page: 1, limit: 5 })
  const notificationsPayload = useMemo(() => notificationsRes?.data ?? notificationsRes, [notificationsRes])
  const notifications = useMemo(() => notificationsPayload?.notifications ?? [], [notificationsPayload])

  const { data: medicalRes, isLoading: medicalLoading } = useMedicalRecords({ page: 1, limit: 5 })
  const medicalPayload = useMemo(() => medicalRes?.data ?? medicalRes, [medicalRes])
  const medicalRecords = useMemo(() => {
    const list = medicalPayload?.records ?? medicalPayload?.medicalRecords ?? []
    return Array.isArray(list) ? list : []
  }, [medicalPayload])

  const { data: prescriptionsRes, isLoading: prescriptionsLoading } = useMyPrescriptions(
    { page: 1, limit: 5 },
    { enabled: Boolean(user) }
  )
  const prescriptionsOuter = useMemo(() => prescriptionsRes?.data ?? prescriptionsRes, [prescriptionsRes])
  const prescriptionsPayload = useMemo(() => prescriptionsOuter?.data ?? prescriptionsOuter, [prescriptionsOuter])
  const prescriptions = useMemo(() => {
    const list = prescriptionsPayload?.prescriptions ?? prescriptionsPayload?.items ?? prescriptionsPayload ?? []
    return Array.isArray(list) ? list : []
  }, [prescriptionsPayload])

  const { data: paymentsRes, isLoading: paymentsLoading } = usePetOwnerPayments({ page: 1, limit: 5 })
  const paymentsOuter = useMemo(() => paymentsRes?.data ?? paymentsRes, [paymentsRes])
  const paymentsPayload = useMemo(() => paymentsOuter?.data ?? paymentsOuter, [paymentsOuter])
  const transactions = useMemo(() => {
    const list = paymentsPayload?.transactions ?? paymentsPayload?.items ?? paymentsPayload ?? []
    return Array.isArray(list) ? list : []
  }, [paymentsPayload])

  const upcomingAppointments = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)

    return appointments
      .filter((a) => {
        const status = String(a?.status || '').toUpperCase()
        if (!['PENDING', 'CONFIRMED'].includes(status)) return false
        if (!a?.appointmentDate) return true
        const d = new Date(a.appointmentDate)
        return Number.isNaN(d.getTime()) ? true : d >= startOfToday
      })
      .map((a) => {
        const d = a?.appointmentDate ? new Date(a.appointmentDate) : null
        const time = String(a?.appointmentTime || '')
        const [hh, mm] = time.split(':').map((x) => Number(x))
        const dt = d && !Number.isNaN(d.getTime()) && Number.isFinite(hh) && Number.isFinite(mm)
          ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh, mm, 0, 0)
          : d
        return { ...a, __dateTime: dt }
      })
      .sort((a, b) => {
        const da = a.__dateTime ? new Date(a.__dateTime).getTime() : 0
        const db = b.__dateTime ? new Date(b.__dateTime).getTime() : 0
        return da - db
      })
      .slice(0, 3)
  }, [appointments])

  const reportAppointments = useMemo(() => appointments.slice(0, 5), [appointments])

  const formatDateTime = (date, time) => {
    if (!date) return '—'
    const d = new Date(date)
    if (Number.isNaN(d.getTime())) return '—'
    const dateStr = d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
    if (!time) return dateStr
    const [hh, mm] = String(time).split(':')
    if (!hh || !mm) return `${dateStr} ${time}`
    const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), Number(hh), Number(mm))
    const timeStr = Number.isNaN(dt.getTime())
      ? String(time)
      : dt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    return `${dateStr} - ${timeStr}`
  }

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Just now'
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return 'Just now'
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`

    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    const d = new Date(dateString)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatCurrency = (amount, currency = 'EUR') => {
    if (amount === null || amount === undefined) return '—'
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'EUR' }).format(amount)
    } catch {
      return String(amount)
    }
  }

  useEffect(() => {
    // Initialize carousels if needed
  }, [])

  return (
    <div className="content veterinary-dashboard">
      <div className="container-fluid">
        <div className="row">
          {/* Sidebar is handled by DashboardLayout */}
          <div className="col-12">
            {/* Veterinary Dashboard Header */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="veterinary-dashboard-header">
                  <h2 className="dashboard-title">
                    <i className="fa-solid fa-paw me-3"></i>
                    Pet Dashboard
                  </h2>
                  <p className="dashboard-subtitle">Manage your pets' health and veterinary appointments</p>
                </div>
              </div>
            </div>
            
            <div className="row mb-4">
              <div className="col-12">
                <div className="row g-3">
                  <div className="col-12 col-sm-6 col-lg-3">
                    <div className="dashboard-widget-box veterinary-widget h-100">
                      <div className="dashboard-content-info">
                        <h6>My Pets</h6>
                        <h4>{dashboardLoading ? '—' : (dashboard?.petsCount ?? 0)}</h4>
                      </div>
                      <div className="dashboard-widget-icon">
                        <span className="dash-icon-box"><i className="fa-solid fa-dog"></i></span>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6 col-lg-3">
                    <div className="dashboard-widget-box veterinary-widget h-100">
                      <div className="dashboard-content-info">
                        <h6>Upcoming</h6>
                        <h4>{dashboardLoading ? '—' : (dashboard?.upcomingAppointments?.count ?? 0)}</h4>
                      </div>
                      <div className="dashboard-widget-icon">
                        <span className="dash-icon-box"><i className="fa-solid fa-calendar-check"></i></span>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6 col-lg-3">
                    <div className="dashboard-widget-box veterinary-widget h-100">
                      <div className="dashboard-content-info">
                        <h6>Favorites</h6>
                        <h4>{dashboardLoading ? '—' : (dashboard?.favoriteVeterinariansCount ?? 0)}</h4>
                      </div>
                      <div className="dashboard-widget-icon">
                        <span className="dash-icon-box"><i className="fa-solid fa-star"></i></span>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6 col-lg-3">
                    <div className="dashboard-widget-box veterinary-widget h-100">
                      <div className="dashboard-content-info">
                        <h6>Unread Alerts</h6>
                        <h4>{dashboardLoading ? '—' : (dashboard?.unreadNotificationsCount ?? 0)}</h4>
                      </div>
                      <div className="dashboard-widget-icon">
                        <span className="dash-icon-box"><i className="fa-solid fa-bell"></i></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Main Content Row - Favorite Veterinarians and Appointments */}
            <div className="row g-4">
              <div className="col-xl-6 d-flex">
                <div className="favourites-dashboard w-100">
                  <div className="book-appointment-head veterinary-appointment-head">
                    <h3><span><i className="fa-solid fa-calendar-plus me-2"></i>Book a new</span>Pet Appointment</h3>
                    <span className="add-icon"><Link to="/search"><i className="fa-solid fa-circle-plus"></i></Link></span>
                  </div>
                  <div className="dashboard-card w-100 veterinary-card">
                    <div className="dashboard-card-head">
                      <div className="header-title">
                        <h5>
                          <i className="fa-solid fa-star me-2"></i>
                          Favorite Veterinarians
                        </h5>
                      </div>
                      <div className="card-view-link">
                        <Link to="/favourites">View All</Link>
                      </div>
                    </div>
                    <div className="dashboard-card-body">
                      {favoritesLoading ? (
                        <div className="text-center py-4">
                          <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      ) : !favorites || favorites.length === 0 ? (
                        <div className="text-center py-4 text-muted">
                          <p className="mb-0">No favorites yet</p>
                          <small>Add veterinarians from search to see them here.</small>
                        </div>
                      ) : (
                        favorites.map((fav) => {
                          const vet = fav?.veterinarianId || {}
                          const vetId = vet?._id || vet?.id
                          const name = vet?.fullName || vet?.name || vet?.email || 'Veterinarian'
                          const image = getImageUrl(vet?.profileImage) || '/assets/img/doctors-dashboard/doctor-profile-img.jpg'
                          const profileUrl = vetId ? `/doctor-profile/${vetId}` : '/doctor-profile'
                          return (
                            <div key={fav?._id || vetId} className="doctor-fav-list">
                              <div className="doctor-info-profile">
                                <Link to={profileUrl} className="table-avatar">
                                  <img
                                    src={image}
                                    alt="Veterinarian"
                                    onError={(e) => {
                                      e.currentTarget.onerror = null
                                      e.currentTarget.src = '/assets/img/doctors-dashboard/doctor-profile-img.jpg'
                                    }}
                                  />
                                </Link>
                                <div className="doctor-name-info">
                                  <h5><Link to={profileUrl}>{name}</Link></h5>
                                  <span>Veterinarian</span>
                                </div>
                              </div>
                              <Link to={profileUrl} className="cal-plus-icon" title="View profile">
                                <i className="fa-solid fa-calendar-plus"></i>
                              </Link>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-xl-6 d-flex">
                <div className="dashboard-card w-100 veterinary-card">
                  <div className="dashboard-card-head">
                    <div className="header-title">
                      <h5>
                        <i className="fa-solid fa-calendar-days me-2"></i>
                        Upcoming Pet Appointments
                      </h5>
                    </div>
                    <div className="card-view-link">
                      <Link to="/patient-appointments">View All</Link>
                    </div>
                  </div>
                  <div className="dashboard-card-body">
                    {appointmentsLoading ? (
                      <div className="text-center py-4">
                        <div className="spinner-border" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    ) : upcomingAppointments.length === 0 ? (
                      <div className="text-center py-4 text-muted">
                        <p className="mb-0">No upcoming appointments</p>
                        <small>Book a new appointment to see it here.</small>
                      </div>
                    ) : (
                      <div className="apponiment-dates">
                        {upcomingAppointments.map((a) => {
                          const aptId = a?._id
                          const detailsUrl = aptId ? `/patient-appointment-details?id=${aptId}` : '/patient-appointment-details'
                          const vet = a?.veterinarianId || {}
                          const pet = a?.petId || {}
                          const vetName = vet?.name || vet?.fullName || vet?.email || 'Veterinarian'
                          const vetImage = getImageUrl(vet?.profileImage) || '/assets/img/doctors-dashboard/doctor-profile-img.jpg'
                          const when = formatDateTime(a?.appointmentDate, a?.appointmentTime)
                          const isOnline = String(a?.bookingType || '').toUpperCase() === 'ONLINE'
                          return (
                            <div key={aptId} className="appointment-dash-card">
                              <div className="doctor-fav-list">
                                <div className="doctor-info-profile">
                                  <Link to={detailsUrl} className="table-avatar">
                                    <img
                                      src={vetImage}
                                      alt="Veterinarian"
                                      onError={(e) => {
                                        e.currentTarget.onerror = null
                                        e.currentTarget.src = '/assets/img/doctors-dashboard/doctor-profile-img.jpg'
                                      }}
                                    />
                                  </Link>
                                  <div className="doctor-name-info">
                                    <h5><Link to={detailsUrl}>{vetName}</Link></h5>
                                    <span className="fs-12 fw-medium">{pet?.name ? `Pet: ${pet.name}` : 'Appointment'}</span>
                                  </div>
                                </div>
                                <span className="cal-plus-icon" title={isOnline ? 'Online' : 'Clinic'}>
                                  <i className={isOnline ? 'fa-solid fa-video' : 'fa-solid fa-hospital'}></i>
                                </span>
                              </div>
                              <div className="date-time">
                                <p><i className="fa-solid fa-clock"></i>{when}</p>
                              </div>
                              <div className="card-btns gap-3">
                                <Link
                                  to={aptId ? `/chat?appointmentId=${aptId}` : '/chat'}
                                  className="btn veterinary-btn-secondary btn-md rounded-pill"
                                >
                                  <i className="fa-solid fa-comments me-2"></i>Chat Now
                                </Link>
                                <Link to={detailsUrl} className="btn veterinary-btn-primary btn-md rounded-pill">
                                  <i className="fa-solid fa-calendar-check me-2"></i>View
                                </Link>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Second Row - Notifications and Past Appointments */}
            <div className="row g-4">
              <div className="col-xl-6 d-flex">
                <div className="dashboard-card w-100 veterinary-card">
                  <div className="dashboard-card-head">
                    <div className="header-title">
                      <h5>
                        <i className="fa-solid fa-bell me-2"></i>
                        Pet Notifications
                      </h5>
                    </div>
                    <div className="card-view-link">
                      <Link to="/patient-notifications">View All</Link>
                    </div>
                  </div>
                  <div className="dashboard-card-body">
                    <div className="table-responsive">
                      <table className="table dashboard-table veterinary-table">
                        <tbody>
                          {notificationsLoading ? (
                            <tr>
                              <td>
                                <div className="text-center py-4">
                                  <div className="spinner-border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ) : !notifications || notifications.length === 0 ? (
                            <tr>
                              <td>
                                <div className="text-center py-4 text-muted">
                                  <p className="mb-0">No notifications</p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            notifications.map((n) => (
                              <tr key={n?._id}>
                                <td>
                                  <div className="table-noti-info">
                                    <div className="table-noti-icon color-violet">
                                      <i className="fa-solid fa-bell"></i>
                                    </div>
                                    <div className="table-noti-message">
                                      <h6><Link to="/patient-notifications">{n?.title || 'Notification'}</Link></h6>
                                      <span className="message-time">{formatTimeAgo(n?.createdAt)}</span>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-xl-6 d-flex">
                <div className="dashboard-card w-100 veterinary-card">
                  <div className="dashboard-card-head">
                    <div className="header-title">
                      <h5>
                        <i className="fa-solid fa-chart-line me-2"></i>
                        Overview
                      </h5>
                    </div>
                    <div className="card-view-link">
                      <Link to="/patient-appointments">Appointments</Link>
                    </div>
                  </div>
                  <div className="dashboard-card-body">
                    <div className="row g-3">
                      <div className="col-6">
                        <div className="p-3 border rounded-3 h-100">
                          <div className="text-muted">Completed</div>
                          <div className="fs-4 fw-bold">{dashboardLoading ? '—' : (dashboard?.totalCompletedAppointments ?? 0)}</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-3 border rounded-3 h-100">
                          <div className="text-muted">Vets Visited</div>
                          <div className="fs-4 fw-bold">{dashboardLoading ? '—' : (dashboard?.totalVeterinariansVisited ?? 0)}</div>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="d-flex gap-2 flex-wrap">
                          <Link to="/dependent" className="btn veterinary-btn-outline btn-md rounded-pill">My Pets</Link>
                          <Link to="/search" className="btn veterinary-btn-primary btn-md rounded-pill">Book Appointment</Link>
                          <Link to="/patient-notifications" className="btn veterinary-btn-secondary btn-md rounded-pill">Notifications</Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-xl-12 d-flex">
                <div className="dashboard-card w-100">
                  <div className="dashboard-card-head">
                    <div className="header-title">
                      <h5>Reports</h5>
                    </div>
                  </div>
                  <div className="dashboard-card-body">
                    <div className="account-detail-table">
                      <nav className="patient-dash-tab border-0 pb-0">
                        <ul className="nav nav-tabs-bottom">
                          <li className="nav-item">
                            <a className="nav-link active" href="#appoint-tab" data-bs-toggle="tab">Appointments</a>
                          </li>
                          <li className="nav-item">
                            <a className="nav-link" href="#medical-tab" data-bs-toggle="tab">Medical Records</a>
                          </li>
                          <li className="nav-item">
                            <a className="nav-link" href="#prsc-tab" data-bs-toggle="tab">Prescriptions</a>
                          </li>
                          <li className="nav-item">
                            <a className="nav-link" href="#invoice-tab" data-bs-toggle="tab">Invoices</a>
                          </li>
                        </ul>
                      </nav>
                      <div className="tab-content pt-0">
                        <div id="appoint-tab" className="tab-pane fade show active">
                          <div className="custom-new-table">
                            <div className="table-responsive">
                              <table className="table table-hover table-center mb-0">
                                <thead>
                                  <tr>
                                    <th>ID</th>
                                    <th>Doctor</th>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {appointmentsLoading ? (
                                    <tr>
                                      <td colSpan="5" className="text-center py-4">
                                        <div className="spinner-border" role="status">
                                          <span className="visually-hidden">Loading...</span>
                                        </div>
                                      </td>
                                    </tr>
                                  ) : reportAppointments.length === 0 ? (
                                    <tr>
                                      <td colSpan="5" className="text-center py-4 text-muted">No appointments found</td>
                                    </tr>
                                  ) : (
                                    reportAppointments.map((a) => {
                                      const vet = a?.veterinarianId || {}
                                      const aptId = a?._id
                                      const detailsUrl = aptId ? `/patient-appointment-details?id=${aptId}` : '/patient-appointment-details'
                                      const doctor = vet?.name || vet?.fullName || vet?.email || 'Veterinarian'
                                      const img = getImageUrl(vet?.profileImage) || '/assets/img/doctors/doctor-thumb-21.jpg'
                                      const when = formatDateTime(a?.appointmentDate, a?.appointmentTime)
                                      const type = String(a?.bookingType || '').toUpperCase() === 'ONLINE' ? 'Video call' : 'Clinic Visit'
                                      const status = String(a?.status || '').toUpperCase() || 'PENDING'
                                      return (
                                        <tr key={aptId}>
                                          <td>
                                            <Link to={detailsUrl}><span className="link-primary">{a?.appointmentNumber || `#${String(aptId || '').slice(-6)}`}</span></Link>
                                          </td>
                                          <td>
                                            <h2 className="table-avatar">
                                              <Link to={detailsUrl} className="avatar avatar-sm me-2">
                                                <img
                                                  className="avatar-img rounded-3"
                                                  src={img}
                                                  alt="Veterinarian"
                                                  onError={(e) => {
                                                    e.currentTarget.onerror = null
                                                    e.currentTarget.src = '/assets/img/doctors/doctor-thumb-21.jpg'
                                                  }}
                                                />
                                              </Link>
                                              <Link to={detailsUrl}>{doctor}</Link>
                                            </h2>
                                          </td>
                                          <td>{when}</td>
                                          <td>{type}</td>
                                          <td>
                                            <span className="badge badge-xs p-2 badge-soft-purple inline-flex align-items-center">
                                              <i className="fa-solid fa-circle me-1 fs-5"></i>{status}
                                            </span>
                                          </td>
                                        </tr>
                                      )
                                    })
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                        <div className="tab-pane fade" id="medical-tab">
                          <div className="custom-table">
                            <div className="table-responsive">
                              <table className="table table-center mb-0">
                                <thead>
                                  <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Date</th>
                                    <th>Record For</th>
                                    <th>Comments</th>
                                    <th>Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {medicalLoading ? (
                                    <tr>
                                      <td colSpan="6" className="text-center py-4">
                                        <div className="spinner-border" role="status">
                                          <span className="visually-hidden">Loading...</span>
                                        </div>
                                      </td>
                                    </tr>
                                  ) : medicalRecords.length === 0 ? (
                                    <tr>
                                      <td colSpan="6" className="text-center py-4 text-muted">No medical records found</td>
                                    </tr>
                                  ) : (
                                    medicalRecords.slice(0, 5).map((r) => {
                                      const recordId = r?._id
                                      const recordUrl = '/medical-records'
                                      const fileUrl = getImageUrl(r?.fileUrl)
                                      return (
                                        <tr key={recordId}>
                                          <td>
                                            <Link to={recordUrl} className="link-primary">
                                              #{String(recordId || '').slice(-6).toUpperCase()}
                                            </Link>
                                          </td>
                                          <td>
                                            <Link to={recordUrl} className="lab-icon">{r?.title || 'Medical Record'}</Link>
                                          </td>
                                          <td>{formatDate(r?.uploadedDate || r?.createdAt)}</td>
                                          <td>{r?.petId?.name || '—'}</td>
                                          <td>{r?.description || '—'}</td>
                                          <td>
                                            <div className="action-item">
                                              <Link to={recordUrl} title="View">
                                                <i className="isax isax-link-2"></i>
                                              </Link>
                                              {fileUrl ? (
                                                <a href={fileUrl} target="_blank" rel="noreferrer" title="Download">
                                                  <i className="isax isax-import"></i>
                                                </a>
                                              ) : null}
                                            </div>
                                          </td>
                                        </tr>
                                      )
                                    })
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                        <div className="tab-pane fade" id="prsc-tab">
                          <div className="custom-table">
                            <div className="table-responsive">
                              <table className="table table-center mb-0">
                                <thead>
                                  <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Date</th>
                                    <th>Prescriped By</th>
                                    <th>Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {prescriptionsLoading ? (
                                    <tr>
                                      <td colSpan="5" className="text-center py-4">
                                        <div className="spinner-border" role="status">
                                          <span className="visually-hidden">Loading...</span>
                                        </div>
                                      </td>
                                    </tr>
                                  ) : prescriptions.length === 0 ? (
                                    <tr>
                                      <td colSpan="5" className="text-center py-4 text-muted">No prescriptions found</td>
                                    </tr>
                                  ) : (
                                    prescriptions.slice(0, 5).map((rx) => {
                                      const prescriptionId = rx?._id
                                      const appointmentId = rx?.appointmentId?._id || rx?.appointmentId
                                      const viewUrl = appointmentId ? `/patient/prescription?appointmentId=${appointmentId}` : '/medical-records'
                                      const veterinarian = rx?.veterinarianId || {}
                                      const vetName = veterinarian?.fullName || veterinarian?.name || veterinarian?.email || '—'
                                      const petName = rx?.petId?.name
                                      return (
                                        <tr key={prescriptionId}>
                                          <td className="link-primary">
                                            <Link to={viewUrl}>#{String(prescriptionId || '').slice(-6).toUpperCase()}</Link>
                                          </td>
                                          <td>
                                            <Link to={viewUrl} className="lab-icon prescription">Prescription{petName ? ` (${petName})` : ''}</Link>
                                          </td>
                                          <td>{formatDate(rx?.issuedAt || rx?.createdAt)}</td>
                                          <td>
                                            <h2 className="table-avatar">
                                              <Link to="/search" className="avatar avatar-sm me-2">
                                                <img
                                                  className="avatar-img rounded-3"
                                                  src={getImageUrl(veterinarian?.profileImage) || '/assets/img/doctors/doctor-thumb-21.jpg'}
                                                  alt="Veterinarian"
                                                  onError={(e) => {
                                                    e.currentTarget.onerror = null
                                                    e.currentTarget.src = '/assets/img/doctors/doctor-thumb-21.jpg'
                                                  }}
                                                />
                                              </Link>
                                              <Link to={viewUrl}>{vetName}</Link>
                                            </h2>
                                          </td>
                                          <td>
                                            <div className="action-item">
                                              <Link to={viewUrl} title="View">
                                                <i className="isax isax-link-2"></i>
                                              </Link>
                                            </div>
                                          </td>
                                        </tr>
                                      )
                                    })
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                        <div className="tab-pane fade" id="invoice-tab">
                          <div className="custom-table">
                            <div className="table-responsive">
                              <table className="table table-center mb-0">
                                <thead>
                                  <tr>
                                    <th>ID</th>
                                    <th>Doctor</th>
                                    <th>Appointment Date</th>
                                    <th>Booked on</th>
                                    <th>Amount</th>
                                    <th>Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {paymentsLoading ? (
                                    <tr>
                                      <td colSpan="6" className="text-center py-4">
                                        <div className="spinner-border" role="status">
                                          <span className="visually-hidden">Loading...</span>
                                        </div>
                                      </td>
                                    </tr>
                                  ) : transactions.length === 0 ? (
                                    <tr>
                                      <td colSpan="6" className="text-center py-4 text-muted">No invoices found</td>
                                    </tr>
                                  ) : (
                                    transactions.slice(0, 5).map((txn) => {
                                      const txnId = txn?._id
                                      const appointment = txn?.relatedAppointmentId || {}
                                      const veterinarian = appointment?.veterinarianId || {}
                                      const detailsUrl = txnId ? `/patient-invoices/${txnId}` : '/patient-invoices'
                                      return (
                                        <tr key={txnId}>
                                          <td>
                                            <Link to={detailsUrl} className="link-primary">#{String(txnId || '').slice(-6).toUpperCase()}</Link>
                                          </td>
                                          <td>
                                            <h2 className="table-avatar">
                                              <Link to={detailsUrl} className="avatar avatar-sm me-2">
                                                <img
                                                  className="avatar-img rounded-3"
                                                  src={getImageUrl(veterinarian?.profileImage) || '/assets/img/doctors/doctor-thumb-21.jpg'}
                                                  alt="Veterinarian"
                                                  onError={(e) => {
                                                    e.currentTarget.onerror = null
                                                    e.currentTarget.src = '/assets/img/doctors/doctor-thumb-21.jpg'
                                                  }}
                                                />
                                              </Link>
                                              <Link to={detailsUrl}>{veterinarian?.name || veterinarian?.fullName || veterinarian?.email || '—'}</Link>
                                            </h2>
                                          </td>
                                          <td>{formatDate(appointment?.appointmentDate)}</td>
                                          <td>{formatDate(txn?.createdAt)}</td>
                                          <td>{formatCurrency(txn?.amount, txn?.currency)}</td>
                                          <td>
                                            <div className="action-item">
                                              <Link to={detailsUrl} title="View">
                                                <i className="isax isax-link-2"></i>
                                              </Link>
                                            </div>
                                          </td>
                                        </tr>
                                      )
                                    })
                                  )}
                                </tbody>
                              </table>
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
  )
}

export default PatientDashboard
