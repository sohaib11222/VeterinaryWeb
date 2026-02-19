import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { useAppointments, useVeterinarianDashboard, useWeeklySchedule } from '../../queries'
import { useAcceptAppointment, useRejectAppointment } from '../../mutations'
import { getImageUrl } from '../../utils/apiConfig'
import ProfileIncompleteModal from '../../components/common/ProfileIncompleteModal'
import AddTimingsModal from '../../components/common/AddTimingsModal'
import BuySubscriptionModal from '../../components/common/BuySubscriptionModal'

const DoctorDashboard = () => {
  const acceptAppointment = useAcceptAppointment()
  const rejectAppointment = useRejectAppointment()

  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showTimingsModal, setShowTimingsModal] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)

  const {
    data: dashboardResponse,
    isLoading: dashboardLoading,
  } = useVeterinarianDashboard()

  const dashboard = useMemo(() => dashboardResponse?.data ?? dashboardResponse, [dashboardResponse])

  const { data: scheduleResponse, isLoading: scheduleLoading } = useWeeklySchedule()
  const schedule = useMemo(() => scheduleResponse?.data ?? scheduleResponse, [scheduleResponse])

  const hasAnyWeeklySlot = useMemo(() => {
    const days = schedule?.data?.days ?? schedule?.days ?? []
    if (!Array.isArray(days)) return false
    return days.some((d) => Array.isArray(d?.timeSlots) && d.timeSlots.length > 0)
  }, [schedule])

  const profileCompleted = dashboard?.profileCompleted === true
  const hasActiveSubscription = dashboard?.subscription?.hasActiveSubscription === true

  useEffect(() => {
    if (dashboardLoading) return
    if (scheduleLoading) return

    let onboardingRequired = false
    try {
      onboardingRequired = localStorage.getItem('vet_onboarding_required') === '1'
    } catch {
      onboardingRequired = false
    }

    // Show onboarding modals only when flag is set; otherwise keep it silent.
    if (!onboardingRequired) {
      setShowProfileModal(false)
      setShowTimingsModal(false)
      setShowSubscriptionModal(false)
      return
    }

    if (!profileCompleted) {
      setShowProfileModal(true)
      setShowTimingsModal(false)
      setShowSubscriptionModal(false)
      return
    }

    if (!hasAnyWeeklySlot) {
      setShowProfileModal(false)
      setShowTimingsModal(true)
      setShowSubscriptionModal(false)
      return
    }

    if (!hasActiveSubscription) {
      setShowProfileModal(false)
      setShowTimingsModal(false)
      setShowSubscriptionModal(true)
      return
    }

    // All onboarding requirements met: clear flag.
    try {
      localStorage.removeItem('vet_onboarding_required')
    } catch {
      // ignore
    }
    setShowProfileModal(false)
    setShowTimingsModal(false)
    setShowSubscriptionModal(false)
  }, [dashboardLoading, scheduleLoading, profileCompleted, hasAnyWeeklySlot, hasActiveSubscription])

  const { data: appointmentsResponse, isLoading: appointmentsLoading } = useAppointments({ page: 1, limit: 1000 })
  const appointments = useMemo(() => {
    const payload = appointmentsResponse?.data?.data ?? appointmentsResponse?.data ?? appointmentsResponse
    const list = payload?.appointments ?? payload?.data?.appointments ?? payload
    return Array.isArray(list) ? list : []
  }, [appointmentsResponse])

  const weekSeries = useMemo(() => {
    const now = new Date()
    const start = new Date(now)
    start.setDate(now.getDate() - 6)
    start.setHours(0, 0, 0, 0)

    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      days.push({ key, label: d.toLocaleDateString(undefined, { weekday: 'short' }), date: d, appointments: 0 })
    }

    const byKey = new Map(days.map((d) => [d.key, d]))
    appointments.forEach((a) => {
      const ad = a?.appointmentDate ? new Date(a.appointmentDate) : null
      if (!ad || Number.isNaN(ad.getTime())) return
      const k = ad.toISOString().slice(0, 10)
      const entry = byKey.get(k)
      if (!entry) return
      const s = String(a?.status || '').toUpperCase()
      if (s === 'CANCELLED' || s === 'REJECTED') return
      entry.appointments += 1
    })

    return days
  }, [appointments])

  const formatMoney = (amount) => {
    const n = Number(amount)
    if (!Number.isFinite(n)) return '€0.00'
    return `€${n.toFixed(2)}`
  }

  const totalPets = useMemo(() => {
    const set = new Set()
    appointments.forEach((a) => {
      const pet = a?.petId
      const id = pet && typeof pet === 'object' ? pet._id : pet
      if (id) set.add(String(id))
    })
    return set.size
  }, [appointments])

  const todayPetsCount = useMemo(() => {
    const list = dashboard?.todayAppointments?.appointments
    if (!Array.isArray(list)) return 0
    const set = new Set()
    list.forEach((a) => {
      const pet = a?.petId
      const id = pet && typeof pet === 'object' ? pet._id : pet
      if (id) set.add(String(id))
    })
    return set.size
  }, [dashboard])

  const todayCounts = useMemo(() => {
    const list = dashboard?.todayAppointments?.appointments
    const counts = { completed: 0, pending: 0, cancelled: 0 }
    if (!Array.isArray(list)) return counts
    list.forEach((a) => {
      const s = String(a?.status || '').toUpperCase()
      if (s === 'COMPLETED') counts.completed += 1
      else if (s === 'CANCELLED' || s === 'REJECTED' || s === 'NO_SHOW') counts.cancelled += 1
      else counts.pending += 1
    })
    return counts
  }, [dashboard])

  const upcomingAppointments = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)

    const list = appointments
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

    return list
  }, [appointments])

  const nextAppointment = useMemo(() => (upcomingAppointments.length > 0 ? upcomingAppointments[0] : null), [upcomingAppointments])

  const recentPets = useMemo(() => {
    const petMap = new Map()
    appointments.forEach((a) => {
      const pet = a?.petId
      const petId = pet && typeof pet === 'object' ? pet._id : pet
      if (!petId) return

      const d = a?.appointmentDate ? new Date(a.appointmentDate) : null
      if (!d || Number.isNaN(d.getTime())) return

      const existing = petMap.get(String(petId))
      if (!existing || d > existing.lastDate) {
        petMap.set(String(petId), { pet: pet && typeof pet === 'object' ? pet : {}, owner: a?.petOwnerId || null, lastDate: d })
      }
    })

    return Array.from(petMap.values())
      .sort((a, b) => b.lastDate.getTime() - a.lastDate.getTime())
      .slice(0, 3)
  }, [appointments])

  const formatDateTime = (date, time) => {
    if (!date) return '—'
    const d = new Date(date)
    if (Number.isNaN(d.getTime())) return '—'
    const dateStr = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    if (!time) return dateStr
    const [hh, mm] = String(time).split(':')
    if (!hh || !mm) return `${dateStr} ${time}`
    const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), Number(hh), Number(mm))
    const timeStr = Number.isNaN(dt.getTime())
      ? String(time)
      : dt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    return `${dateStr} ${timeStr}`
  }

  const formatNextAppointmentTime = (a) => {
    if (!a?.appointmentDate) return '—'
    const d = new Date(a.appointmentDate)
    if (Number.isNaN(d.getTime())) return '—'

    const now = new Date()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    const that = new Date(d)
    that.setHours(0, 0, 0, 0)
    const isToday = today.getTime() === that.getTime()

    const timeStr = a?.appointmentTime
      ? formatDateTime(a.appointmentDate, a.appointmentTime).split(' ').slice(-1)[0]
      : ''

    return isToday ? `Today, ${timeStr}` : formatDateTime(a.appointmentDate, a.appointmentTime)
  }

  const handleAccept = async (appointmentId) => {
    if (!appointmentId) return
    try {
      await acceptAppointment.mutateAsync(appointmentId)
      toast.success('Appointment accepted')
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to accept appointment')
    }
  }

  const handleReject = async (appointmentId) => {
    if (!appointmentId) return
    try {
      await rejectAppointment.mutateAsync({ appointmentId, data: {} })
      toast.success('Appointment rejected')
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to reject appointment')
    }
  }

  useEffect(() => {
    // Initialize charts if needed
    if (typeof window !== 'undefined' && window.$) {
      // Initialize any carousels or charts here
    }
  }, [])

  return (
    <div className="content veterinary-dashboard">
      <ProfileIncompleteModal
        show={showProfileModal}
        onClose={() => {
          setShowProfileModal(false)
        }}
      />
      <AddTimingsModal
        show={showTimingsModal}
        onClose={() => {
          setShowTimingsModal(false)
        }}
      />
      <BuySubscriptionModal
        show={showSubscriptionModal}
        onClose={() => {
          setShowSubscriptionModal(false)
        }}
      />

      <div className="container-fluid">
        <div className="row">
          <div className="col-lg-3 col-xl-2 theiaStickySidebar">
            {/* Sidebar is handled by DashboardLayout */}
          </div>
          <div className="col-lg-12 col-xl-12">
            {/* Dashboard Header with Enhanced Spacing */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="veterinary-dashboard-header">
                  <h2 className="dashboard-title">
                    <i className="fa-solid fa-paw me-3"></i>
                    Veterinary Dashboard
                  </h2>
                  <p className="dashboard-subtitle">Manage your pet appointments and patients</p>
                </div>
              </div>
            </div>

            {/* Statistics Cards - Reorganized Layout */}
            <div className="row mb-4">
              <div className="col-lg-4 col-md-6 mb-3">
                <div className="dashboard-box-col">
                  <div className="dashboard-widget-box veterinary-widget">
                    <div className="dashboard-content-info">
                      <h6>Total Pets</h6>
                      <h4>{dashboardLoading || appointmentsLoading ? '—' : totalPets}</h4>
                      <span className="text-muted">Pet owners: {dashboardLoading ? '—' : dashboard?.totalPetOwners ?? 0}</span>
                    </div>
                    <div className="dashboard-widget-icon">
                      <span className="dash-icon-box"><i className="fa-solid fa-paw"></i></span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 col-md-6 mb-3">
                <div className="dashboard-box-col">
                  <div className="dashboard-widget-box veterinary-widget">
                    <div className="dashboard-content-info">
                      <h6>Pets Today</h6>
                      <h4>{dashboardLoading ? '—' : todayPetsCount}</h4>
                      <span className="text-muted">Appointments today: {dashboardLoading ? '—' : dashboard?.todayAppointments?.count ?? 0}</span>
                    </div>
                    <div className="dashboard-widget-icon">
                      <span className="dash-icon-box"><i className="fa-solid fa-dog"></i></span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 col-md-6 mb-3">
                <div className="dashboard-box-col">
                  <div className="dashboard-widget-box veterinary-widget">
                    <div className="dashboard-content-info">
                      <h6>Appointments Today</h6>
                      <h4>{dashboardLoading ? '—' : dashboard?.todayAppointments?.count ?? 0}</h4>
                      <span className="text-muted">This week: {dashboardLoading ? '—' : dashboard?.weeklyAppointments?.count ?? 0}</span>
                    </div>
                    <div className="dashboard-widget-icon">
                      <span className="dash-icon-box"><i className="fa-solid fa-calendar-days"></i></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area - Enhanced Layout */}
            <div className="row">
              {/* Appointments Section - Full Width */}
              <div className="col-xl-12 mb-4">
                <div className="dashboard-card veterinary-card">
                  <div className="dashboard-card-head">
                    <div className="header-title">
                      <h5><i className="fa-solid fa-paw me-2"></i>Pet Appointments</h5>
                    </div>
                    <div className="dropdown header-dropdown">
                      <a className="dropdown-toggle nav-tog" data-bs-toggle="dropdown" href="javascript:void(0);">
                        Last 7 Days
                      </a>
                      <div className="dropdown-menu dropdown-menu-end">
                        <a href="javascript:void(0);" className="dropdown-item">Today</a>
                        <a href="javascript:void(0);" className="dropdown-item">This Month</a>
                        <a href="javascript:void(0);" className="dropdown-item">Last 7 Days</a>
                      </div>
                    </div>
                  </div>
                  <div className="dashboard-card-body">
                    <div className="table-responsive">
                      <table className="table dashboard-table appoint-table veterinary-table">
                        <tbody>
                          {appointmentsLoading ? (
                            <tr>
                              <td colSpan="3" className="text-center py-4 text-muted">Loading...</td>
                            </tr>
                          ) : upcomingAppointments.length === 0 ? (
                            <tr>
                              <td colSpan="3" className="text-center py-4 text-muted">No upcoming appointments</td>
                            </tr>
                          ) : (
                            upcomingAppointments.slice(0, 5).map((apt) => {
                              const pet = apt?.petId || {}
                              const owner = apt?.petOwnerId || {}
                              const petName = pet?.name || 'Pet'
                              const petBreed = pet?.breed ? ` (${pet.breed})` : ''
                              const ownerName = owner?.name || owner?.fullName || 'Pet Owner'
                              const detailsUrl = apt?._id ? `/doctor-appointment-details?id=${apt._id}` : '/doctor-appointment-details'
                              const status = String(apt?.status || '').toUpperCase()
                              const canAct = status === 'PENDING'
                              const img = getImageUrl(pet?.photo) || '/assets/img/doctors-dashboard/profile-01.jpg'

                              return (
                                <tr key={apt._id}>
                                  <td>
                                    <div className="patient-info-profile">
                                      <Link to={detailsUrl} className="table-avatar">
                                        <img
                                          src={img}
                                          alt="Img"
                                          onError={(e) => {
                                            e.currentTarget.onerror = null
                                            e.currentTarget.src = '/assets/img/doctors-dashboard/profile-01.jpg'
                                          }}
                                        />
                                      </Link>
                                      <div className="patient-name-info">
                                        <span>{apt?.appointmentNumber || apt?._id}</span>
                                        <h5><Link to={detailsUrl}>{petName}{petBreed}</Link></h5>
                                        <small className="text-muted">Owner: {ownerName}</small>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="appointment-date-created">
                                      <h6>{formatDateTime(apt?.appointmentDate, apt?.appointmentTime)}</h6>
                                      <span className="badge table-badge">{apt?.reason || 'Consultation'}</span>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="apponiment-actions d-flex align-items-center">
                                      <a
                                        href="javascript:void(0);"
                                        className={`text-success-icon me-2 ${!canAct ? 'disabled' : ''}`}
                                        title="Approve"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          if (!canAct) return
                                          handleAccept(apt._id)
                                        }}
                                      >
                                        <i className="fa-solid fa-check"></i>
                                      </a>
                                      <a
                                        href="javascript:void(0);"
                                        className={`text-danger-icon ${!canAct ? 'disabled' : ''}`}
                                        title="Reject"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          if (!canAct) return
                                          handleReject(apt._id)
                                        }}
                                      >
                                        <i className="fa-solid fa-xmark"></i>
                                      </a>
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

              {/* Second Row - Next Appointment and Today's Overview */}
              <div className="row mb-4">
                <div className="col-xl-6 mb-4">
                  {/* Upcoming Appointment */}
                  <div className="dashboard-card veterinary-card">
                    <div className="dashboard-card-head">
                      <div className="header-title">
                        <h5><i className="fa-solid fa-clock me-2"></i>Next Appointment</h5>
                      </div>
                    </div>
                    <div className="dashboard-card-body">
                      {appointmentsLoading ? (
                        <div className="text-center py-3 text-muted">Loading...</div>
                      ) : !nextAppointment ? (
                        <div className="text-center py-3 text-muted">No upcoming appointments</div>
                      ) : (
                        <>
                          <div className="upcoming-patient-info">
                            <div className="info-details">
                              <span className="img-avatar">
                                <img
                                  src={getImageUrl(nextAppointment?.petId?.photo) || '/assets/img/doctors-dashboard/profile-01.jpg'}
                                  alt="Img"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null
                                    e.currentTarget.src = '/assets/img/doctors-dashboard/profile-01.jpg'
                                  }}
                                />
                              </span>
                              <div className="name-info">
                                <span>{nextAppointment?.appointmentNumber || nextAppointment?._id}</span>
                                <h6>
                                  {(nextAppointment?.petId?.name || 'Pet')}
                                  {nextAppointment?.petId?.breed ? ` (${nextAppointment.petId.breed})` : ''}
                                </h6>
                                <small className="text-muted">
                                  Owner: {(nextAppointment?.petOwnerId?.name || nextAppointment?.petOwnerId?.fullName || 'Pet Owner')}
                                </small>
                              </div>
                            </div>
                            <div className="date-details">
                              <span className="badge table-badge">{nextAppointment?.reason || 'Consultation'}</span>
                              <h6>{formatNextAppointmentTime(nextAppointment)}</h6>
                            </div>
                          </div>
                          <div className="appointment-card-footer">
                            <div className="btn-appointments">
                              <Link
                                to={nextAppointment?._id ? `/chat-doctor?appointmentId=${nextAppointment._id}` : '/chat-doctor'}
                                className="btn btn-outline-primary btn-sm me-2"
                              >
                                <i className="fa-solid fa-message me-1"></i>Chat
                              </Link>
                              {String(nextAppointment?.bookingType || '').toUpperCase() === 'ONLINE' &&
                              String(nextAppointment?.status || '').toUpperCase() === 'CONFIRMED' ? (
                                <Link
                                  to={nextAppointment?._id ? `/doctor/video-call?appointmentId=${nextAppointment._id}` : '/doctor/video-call'}
                                  className="btn btn-primary btn-sm"
                                >
                                  <i className="fa-solid fa-video me-1"></i>Start
                                </Link>
                              ) : (
                                <Link
                                  to={nextAppointment?._id ? `/doctor-appointment-details?id=${nextAppointment._id}` : '/doctor-appointment-details'}
                                  className="btn btn-primary btn-sm"
                                >
                                  <i className="fa-solid fa-eye me-1"></i>View
                                </Link>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-xl-6 mb-4">
                  {/* Quick Stats */}
                  <div className="dashboard-card veterinary-card">
                    <div className="dashboard-card-head">
                      <div className="header-title">
                        <h5><i className="fa-solid fa-chart-line me-2"></i>Today's Overview</h5>
                      </div>
                    </div>
                    <div className="dashboard-card-body">
                      <div className="quick-stats-grid">
                        <div className="stat-item">
                          <div className="stat-number">{dashboardLoading ? '—' : todayCounts.completed}</div>
                          <div className="stat-label">Completed</div>
                          <div className="stat-icon text-success">
                            <i className="fa-solid fa-check-circle"></i>
                          </div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-number">{dashboardLoading ? '—' : todayCounts.pending}</div>
                          <div className="stat-label">Pending</div>
                          <div className="stat-icon text-warning">
                            <i className="fa-solid fa-clock"></i>
                          </div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-number">{dashboardLoading ? '—' : todayCounts.cancelled}</div>
                          <div className="stat-label">Cancelled</div>
                          <div className="stat-icon text-danger">
                            <i className="fa-solid fa-times-circle"></i>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 text-muted" style={{ fontSize: 13 }}>
                        Unread messages: {dashboardLoading ? '—' : dashboard?.unreadMessagesCount ?? 0} &nbsp;|&nbsp; Unread notifications: {dashboardLoading ? '—' : dashboard?.unreadNotificationsCount ?? 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section - Charts and Recent Patients */}
              <div className="row">
                <div className="col-xl-6 mb-4">
                  <div className="dashboard-card veterinary-card">
                    <div className="dashboard-card-head border-0">
                      <div className="header-title">
                        <h5>
                          <i className="fa-solid fa-chart-bar me-2"></i>Weekly Overview
                        </h5>
                      </div>
                      <div className="chart-create-date">
                        <h6>Mar 14 - Mar 21</h6>
                      </div>
                    </div>
                    <div className="dashboard-card-body">
                      <div className="chart-tab">
                        <ul className="nav nav-pills product-licence-tab" id="pills-tab2" role="tablist">
                          <li className="nav-item" role="presentation">
                            <button
                              className="nav-link active"
                              id="pills-revenue-tab"
                              data-bs-toggle="pill"
                              data-bs-target="#pills-revenue"
                              type="button"
                              role="tab"
                              aria-controls="pills-revenue"
                              aria-selected="false"
                            >
                              Revenue
                            </button>
                          </li>
                          <li className="nav-item" role="presentation">
                            <button
                              className="nav-link"
                              id="pills-appointment-tab"
                              data-bs-toggle="pill"
                              data-bs-target="#pills-appointment"
                              type="button"
                              role="tab"
                              aria-controls="pills-appointment"
                              aria-selected="true"
                            >
                              Appointments
                            </button>
                          </li>
                        </ul>
                        <div className="tab-content w-100" id="v-pills-tabContent">
                          <div className="tab-pane fade show active" id="pills-revenue" role="tabpanel" aria-labelledby="pills-revenue-tab">
                            <div style={{ padding: 10 }}>
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                  <h6 className="mb-1">Total Earnings</h6>
                                  <h4 className="mb-0">{dashboardLoading ? '—' : formatMoney(dashboard?.earningsFromAppointments)}</h4>
                                </div>
                                <div className="text-end">
                                  <h6 className="mb-1">Subscription</h6>
                                  <div className="text-muted" style={{ fontSize: 13 }}>
                                    {dashboardLoading
                                      ? '—'
                                      : dashboard?.subscription?.hasActiveSubscription
                                      ? `Active (${dashboard?.subscription?.expiresInDays ?? 0} days left)`
                                      : 'Inactive'}
                                  </div>
                                </div>
                              </div>
                              <div className="text-muted" style={{ fontSize: 13 }}>
                                Profile strength: {dashboardLoading ? '—' : `${dashboard?.profileStrength ?? 0}%`}
                              </div>
                            </div>
                          </div>
                          <div className="tab-pane fade" id="pills-appointment" role="tabpanel" aria-labelledby="pills-appointment-tab">
                            <div style={{ width: '100%', height: 260 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weekSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="label" />
                                  <YAxis allowDecimals={false} />
                                  <Tooltip />
                                  <Bar dataKey="appointments" fill="#0d6efd" radius={[6, 6, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-xl-6 mb-4">
                  <div className="dashboard-card veterinary-card">
                    <div className="dashboard-card-head">
                      <div className="header-title">
                        <h5>
                          <i className="fa-solid fa-users me-2"></i>Recent Pets
                        </h5>
                      </div>
                      <div className="card-view-link">
                        <Link to="/my-patients">View All</Link>
                      </div>
                    </div>
                    <div className="dashboard-card-body">
                      <div className="d-flex recent-patient-grid-boxes">
                        {appointmentsLoading ? (
                          <div className="text-center py-3 text-muted w-100">Loading...</div>
                        ) : recentPets.length === 0 ? (
                          <div className="text-center py-3 text-muted w-100">No pets yet</div>
                        ) : (
                          recentPets.map((item, idx) => {
                            const pet = item.pet || {}
                            const img = getImageUrl(pet?.photo) || `/assets/img/doctors-dashboard/profile-0${idx + 1}.jpg`
                            const lastVisit = item.lastDate
                              ? item.lastDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
                              : '—'

                            return (
                              <div key={`${pet?._id || idx}`} className="recent-patient-grid">
                                <Link to="/my-patients" className="patient-img">
                                  <img
                                    src={img}
                                    alt="Img"
                                    onError={(e) => {
                                      e.currentTarget.onerror = null
                                      e.currentTarget.src = '/assets/img/doctors-dashboard/profile-01.jpg'
                                    }}
                                  />
                                </Link>
                                <h5>
                                  <Link to="/my-patients">{pet?.name || 'Pet'}</Link>
                                </h5>
                                <span className="text-muted">{pet?.breed || pet?.species || '—'}</span>
                                <div className="date-info">
                                  <p>Last Visit<br />{lastVisit}</p>
                                </div>
                              </div>
                            )
                          })
                        )}
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

export default DoctorDashboard
