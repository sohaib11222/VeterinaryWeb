import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useUnreadChatCount } from '../../queries/chatQueries'
import { useUnreadNotificationsCount } from '../../queries/notificationQueries'
import { useUserById } from '../../queries/userQueries'
import { useAppointments } from '../../queries/appointmentQueries'
import { useOrders } from '../../queries/orderQueries'
import { useRescheduleRequests } from '../../queries/scheduleQueries'
import { useSupportTicketUnreadCount } from '../../queries/supportTicketQueries'
import { getImageUrl } from '../../utils/apiConfig'
import { useLanguage } from '../../contexts/LanguageContext'

const getPaginatedCount = (response) => {
  const outer = response?.data ?? response
  const payload = outer?.data ?? outer
  return Number(payload?.pagination?.total || 0)
}

const PatientSidebar = () => {
  const { user } = useAuth()
  const { t } = useLanguage()
  const userId = user?.id || user?._id
  const { data: userRes } = useUserById(userId, { enabled: Boolean(userId) })
  const latestUser = userRes?.data?.data || userRes?.data || userRes || null
  const { data: unreadRes } = useUnreadChatCount({ enabled: Boolean(user) })
  const unreadCount = unreadRes?.data?.unreadCount ?? 0
  const { data: unreadNotificationsRes } = useUnreadNotificationsCount({ enabled: Boolean(user) })
  const unreadNotifications = unreadNotificationsRes?.data?.unreadCount ?? 0
  const { data: unreadSupportRes } = useSupportTicketUnreadCount({ enabled: Boolean(user) })
  const unreadSupportCount = unreadSupportRes?.data?.unreadCount ?? 0
  const { data: pendingAppointmentsRes } = useAppointments(
    { status: 'PENDING', page: 1, limit: 1 },
    { enabled: Boolean(user) }
  )
  const { data: pendingOrdersRes } = useOrders(
    { status: 'PENDING', page: 1, limit: 1 },
    { enabled: Boolean(user) }
  )
  const { data: rescheduleRequestsRes } = useRescheduleRequests(
    { page: 1, limit: 100 },
    { enabled: Boolean(user) }
  )
  const pendingAppointmentsCount = getPaginatedCount(pendingAppointmentsRes)
  const pendingOrdersCount = getPaginatedCount(pendingOrdersRes)
  const rescheduleRequestsPayload = rescheduleRequestsRes?.data?.data ?? rescheduleRequestsRes?.data ?? rescheduleRequestsRes
  const rescheduleRequests = Array.isArray(rescheduleRequestsPayload)
    ? rescheduleRequestsPayload
    : Array.isArray(rescheduleRequestsPayload?.requests)
      ? rescheduleRequestsPayload.requests
      : []
  const pendingReschedulePaymentCount = rescheduleRequests.filter((request) => {
    const appointment = request?.newAppointmentId || {}
    return String(request?.status || '').toUpperCase() === 'APPROVED'
      && String(appointment?.paymentStatus || '').toUpperCase() !== 'PAID'
      && Number(request?.rescheduleFee) > 0
  }).length
  const location = useLocation()
  const isActive = (paths) => {
    if (Array.isArray(paths)) {
      return paths.some(path => location.pathname === path || location.pathname.startsWith(path + '/'))
    }
    return location.pathname === paths || location.pathname.startsWith(paths + '/')
  }

  const displayName = latestUser?.fullName || latestUser?.name || user?.fullName || user?.name || 'Pet Owner'
  const profileImage =
    getImageUrl(latestUser?.profileImage) ||
    getImageUrl(user?.profileImage) ||
    '/assets/img/doctors-dashboard/profile-06.jpg'

  return (
    <div className="profile-sidebar veterinary-sidebar">
      {/* Veterinary Profile Widget */}
      <div className="widget-profile veterinary-profile-widget">
        <div className="profile-info-widget">
          <Link to="/profile-settings" className="booking-doc-img">
            <img
              src={profileImage}
              alt="Pet Owner Image"
              onError={(e) => {
                e.currentTarget.onerror = null
                e.currentTarget.src = '/assets/img/doctors-dashboard/profile-06.jpg'
              }}
            />
            <div className="profile-badge">
              <i className="fa-solid fa-paw"></i>
            </div>
          </Link>
          <div className="profile-det-info">
            <h3>
              <Link to="/profile-settings">{displayName}</Link>
            </h3>
            <div className="patient-details">
              <h5 className="mb-0">{t('patient.petOwnerId')} : {latestUser?._id || latestUser?.id || user?.id || user?._id || '—'}</h5>
            </div>
            <span className="badge veterinary-role-badge">
              <i className="fa-solid fa-circle"></i>{t('patient.petOwner')}
            </span>
          </div>
        </div>
      </div>

      {/* Veterinary Dashboard Menu */}
      <div className="dashboard-widget veterinary-dashboard-menu">
        <nav className="dashboard-menu">
          <ul>
            <li className={isActive('/patient/dashboard') ? 'active' : ''}>
              <Link to="/patient/dashboard">
                <i className="fa-solid fa-shapes"></i>
                <span>{t('patient.dashboard')}</span>
                <div className="menu-indicator"></div>
              </Link>
            </li>
            <li className={isActive(['/patient-appointments', '/patient-appointments-grid', '/patient-upcoming-appointment', '/patient-completed-appointment', '/patient-cancelled-appointment', '/patient-appointment-details']) ? 'active' : ''}>
              <Link to="/patient-appointments">
                <i className="fa-solid fa-calendar-days"></i>
                <span>{t('patient.petAppointments')}</span>
                {pendingAppointmentsCount > 0 && (
                  <small className="unread-msg veterinary-badge">{pendingAppointmentsCount}</small>
                )}
                <div className="menu-indicator"></div>
              </Link>
            </li>
            <li className={isActive('/patient/reschedule-requests') ? 'active' : ''}>
              <Link to="/patient/reschedule-requests">
                <i className="fa-solid fa-calendar-days"></i>
                <span>{t('patient.rescheduleRequests')}</span>
                {pendingReschedulePaymentCount > 0 && (
                  <small className="unread-msg veterinary-badge">{pendingReschedulePaymentCount}</small>
                )}
                <div className="menu-indicator"></div>
              </Link>
            </li>
            <li className={isActive('/favourites') ? 'active' : ''}>
              <Link to="/favourites">
                <i className="fa-solid fa-star"></i>
                <span>{t('patient.favoriteVeterinariansMenu')}</span>
                <div className="menu-indicator"></div>
              </Link>
            </li>
            <li className={isActive('/dependent') ? 'active' : ''}>
              <Link to="/dependent">
                <i className="fa-solid fa-dog"></i>
                <span>{t('patient.myPets')}</span>
                <div className="menu-indicator"></div>
              </Link>
            </li>
            <li className={isActive('/medical-records') ? 'active' : ''}>
              <Link to="/medical-records">
                <i className="fa-solid fa-file-lines"></i>
                <span>{t('patient.medicalRecords')}</span>
                <div className="menu-indicator"></div>
              </Link>
            </li>
            {/* <li className={isActive('/patient-accounts') ? 'active' : ''}>
              <Link to="/patient-accounts">
                <i className="fa-solid fa-wallet"></i>
                <span>Wallet</span>
                <div className="menu-indicator"></div>
              </Link>
            </li> */}
            <li className={isActive('/patient-invoices') ? 'active' : ''}>
              <Link to="/patient-invoices">
                <i className="fa-solid fa-file-invoice"></i>
                <span>{t('patient.veterinaryInvoices')}</span>
                <div className="menu-indicator"></div>
              </Link>
            </li>
            <li className={isActive('/order-history') ? 'active' : ''}>
              <Link to="/order-history">
                <i className="fa-solid fa-shopping-bag"></i>
                <span>{t('patient.petSupplyOrders')}</span>
                {pendingOrdersCount > 0 && (
                  <small className="unread-msg veterinary-badge">{pendingOrdersCount}</small>
                )}
                <div className="menu-indicator"></div>
              </Link>
            </li>
          
            <li className={isActive('/patient-notifications') ? 'active' : ''}>
              <Link to="/patient-notifications">
                <i className="fa-solid fa-bell"></i>
                <span>{t('patient.notifications')}</span>
                {unreadNotifications > 0 && (
                  <small className="unread-msg veterinary-badge">{unreadNotifications}</small>
                )}
              </Link>
            </li>
            <li className={isActive('/chat') ? 'active' : ''}>
              <Link to="/chat">
                <i className="fa-solid fa-comments"></i>
                <span>{t('patient.veterinarianMessages')}</span>
                {unreadCount > 0 && (
                  <small className="unread-msg veterinary-badge">{unreadCount}</small>
                )}
              </Link>
            </li>
            <li className={isActive('/patient/support-tickets') ? 'active' : ''}>
              <Link to="/patient/support-tickets">
                <i className="fa-solid fa-headset"></i>
                <span>{t('patient.supportTickets')}</span>
                {unreadSupportCount > 0 && (
                  <small className="unread-msg veterinary-badge">{unreadSupportCount}</small>
                )}
                <div className="menu-indicator"></div>
              </Link>
            </li>
          
            <li className={isActive('/clinic-map') ? 'active' : ''}>
              <Link to="/clinic-map">
                <i className="fa-solid fa-map-location-dot"></i>
                <span>{t('patient.nearbyClinics')}</span>
                <div className="menu-indicator"></div>
              </Link>
            </li>
            <li className={isActive('/weight-records') ? 'active' : ''}>
              <Link to="/weight-records">
                <i className="fa-solid fa-weight-scale"></i>
                <span>{t('patient.weightRecords')}</span>
                <div className="menu-indicator"></div>
              </Link>
            </li>
            <li className={isActive('/profile-settings') ? 'active' : ''}>
              <Link to="/profile-settings">
                <i className="fa-solid fa-user-pen"></i>
                <span>{t('patient.accountSettings')}</span>
                <div className="menu-indicator"></div>
              </Link>
            </li>
            <li className="logout-item">
              <Link to="/login">
                <i className="fa-solid fa-sign-out-alt"></i>
                <span>{t('patient.logout')}</span>
                <div className="menu-indicator"></div>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}

export default PatientSidebar

