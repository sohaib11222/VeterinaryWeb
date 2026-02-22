import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useUnreadChatCount } from '../../queries/chatQueries'
import { useUnreadNotificationsCount } from '../../queries/notificationQueries'
import { useUserById } from '../../queries/userQueries'
import { getImageUrl } from '../../utils/apiConfig'

const PatientSidebar = () => {
  const { user } = useAuth()
  const userId = user?.id || user?._id
  const { data: userRes } = useUserById(userId, { enabled: Boolean(userId) })
  const latestUser = userRes?.data?.data || userRes?.data || userRes || null
  const { data: unreadRes } = useUnreadChatCount({ enabled: Boolean(user) })
  const unreadCount = unreadRes?.data?.unreadCount ?? 0
  const { data: unreadNotificationsRes } = useUnreadNotificationsCount({ enabled: Boolean(user) })
  const unreadNotifications = unreadNotificationsRes?.data?.unreadCount ?? 0
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
              <h5 className="mb-0">Pet Owner ID : {latestUser?._id || latestUser?.id || user?.id || user?._id || '—'}</h5>
            </div>
            <span className="badge veterinary-role-badge">
              <i className="fa-solid fa-circle"></i>Pet Owner
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
                <span>Pet Dashboard</span>
                <div className="menu-indicator"></div>
              </Link>
            </li>
            <li className={isActive(['/patient-appointments', '/patient-appointments-grid', '/patient-upcoming-appointment', '/patient-completed-appointment', '/patient-cancelled-appointment', '/patient-appointment-details']) ? 'active' : ''}>
              <Link to="/patient-appointments">
                <i className="fa-solid fa-calendar-days"></i>
                <span>Pet Appointments</span>
                <div className="menu-indicator"></div>
              </Link>
            </li>
            <li className={isActive('/favourites') ? 'active' : ''}>
              <Link to="/favourites">
                <i className="fa-solid fa-star"></i>
                <span>Favorite Veterinarians</span>
                <div className="menu-indicator"></div>
              </Link>
            </li>
            <li className={isActive('/dependent') ? 'active' : ''}>
              <Link to="/dependent">
                <i className="fa-solid fa-dog"></i>
                <span>My Pets</span>
                <div className="menu-indicator"></div>
              </Link>
            </li>
            <li className={isActive('/medical-records') ? 'active' : ''}>
              <Link to="/medical-records">
                <i className="fa-solid fa-file-lines"></i>
                <span>Pet Medical Records</span>
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
                <span>Veterinary Invoices</span>
                <div className="menu-indicator"></div>
              </Link>
            </li>
            <li className={isActive('/order-history') ? 'active' : ''}>
              <Link to="/order-history">
                <i className="fa-solid fa-shopping-bag"></i>
                <span>Pet Supply Orders</span>
                <div className="menu-indicator"></div>
              </Link>
            </li>
          
            <li className={isActive('/patient-notifications') ? 'active' : ''}>
              <Link to="/patient-notifications">
                <i className="fa-solid fa-bell"></i>
                <span>Notifications</span>
                {unreadNotifications > 0 && (
                  <small className="unread-msg veterinary-badge">{unreadNotifications}</small>
                )}
              </Link>
            </li>
            <li className={isActive('/chat') ? 'active' : ''}>
              <Link to="/chat">
                <i className="fa-solid fa-comments"></i>
                <span>Veterinarian Messages</span>
                {unreadCount > 0 && (
                  <small className="unread-msg veterinary-badge">{unreadCount}</small>
                )}
              </Link>
            </li>
          
            <li className={isActive('/clinic-map') ? 'active' : ''}>
              <Link to="/clinic-map">
                <i className="fa-solid fa-map-location-dot"></i>
                <span>Nearby Clinics</span>
                <div className="menu-indicator"></div>
              </Link>
            </li>
            <li className={isActive('/weight-records') ? 'active' : ''}>
              <Link to="/weight-records">
                <i className="fa-solid fa-weight-scale"></i>
                <span>Weight Records</span>
                <div className="menu-indicator"></div>
              </Link>
            </li>
            <li className={isActive('/profile-settings') ? 'active' : ''}>
              <Link to="/profile-settings">
                <i className="fa-solid fa-user-pen"></i>
                <span>Account Settings</span>
                <div className="menu-indicator"></div>
              </Link>
            </li>
            <li className="logout-item">
              <Link to="/login">
                <i className="fa-solid fa-sign-out-alt"></i>
                <span>Logout</span>
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

