import { Link, useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useMyPetStore } from '../../queries/petStoreQueries'
import { getImageUrl } from '../../utils/apiConfig'

const Sidebar = ({ userType = 'patient' }) => {
  const location = useLocation()
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  const { user } = useAuth()
  const role = String(user?.role || '').toUpperCase()
  const storeEnabled = userType === 'pharmacy_admin' && (role === 'PET_STORE' || role === 'PARAPHARMACY')
  const myPetStoreQuery = useMyPetStore({ enabled: storeEnabled })
  const petStore = useMemo(() => {
    const payload = myPetStoreQuery.data?.data ?? myPetStoreQuery.data
    return payload?.data ?? payload
  }, [myPetStoreQuery.data])

  if (userType === 'doctor') {
    return (
      <div className="sidebar sidebar-doctor">
        <div className="sidebar-inner">
          <ul className="sidebar-menu">
            <li className={isActive('/doctor-dashboard') ? 'active' : ''}>
              <Link to="/doctor-dashboard">
                <i className="feather-grid"></i> <span>Dashboard</span>
              </Link>
            </li>
            <li className={isActive('/appointments') ? 'active' : ''}>
              <Link to="/appointments">
                <i className="feather-calendar"></i> <span>Appointments</span>
              </Link>
            </li>
            <li className={isActive('/my-patients') ? 'active' : ''}>
              <Link to="/my-patients">
                <i className="feather-users"></i> <span>My Patients</span>
              </Link>
            </li>
            <li className={isActive('/schedule-timings') ? 'active' : ''}>
              <Link to="/schedule-timings">
                <i className="feather-clock"></i> <span>Schedule Timings</span>
              </Link>
            </li>
            <li className={isActive('/available-timings') ? 'active' : ''}>
              <Link to="/available-timings">
                <i className="feather-calendar"></i> <span>Available Timings</span>
              </Link>
            </li>
            <li className={isActive('/invoices') ? 'active' : ''}>
              <Link to="/invoices">
                <i className="feather-file-text"></i> <span>Invoices</span>
              </Link>
            </li>
            <li className={isActive('/reviews') ? 'active' : ''}>
              <Link to="/reviews">
                <i className="feather-star"></i> <span>Reviews</span>
              </Link>
            </li>
            <li className={isActive('/doctor-profile-settings') ? 'active' : ''}>
              <Link to="/doctor-profile-settings">
                <i className="feather-user"></i> <span>Profile Settings</span>
              </Link>
            </li>
            <li className={isActive('/doctor-change-password') ? 'active' : ''}>
              <Link to="/doctor-change-password">
                <i className="feather-lock"></i> <span>Change Password</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    )
  }

  if (userType === 'patient') {
    return (
      <div className="sidebar sidebar-patient">
        <div className="sidebar-inner">
          <ul className="sidebar-menu">
            <li className={isActive('/patient-dashboard') ? 'active' : ''}>
              <Link to="/patient-dashboard">
                <i className="feather-grid"></i> <span>Dashboard</span>
              </Link>
            </li>
            <li className={isActive('/patient-appointments') ? 'active' : ''}>
              <Link to="/patient-appointments">
                <i className="feather-calendar"></i> <span>Appointments</span>
              </Link>
            </li>
            <li className={isActive('/favourites') ? 'active' : ''}>
              <Link to="/favourites">
                <i className="feather-heart"></i> <span>Favourites</span>
              </Link>
            </li>
            <li className={isActive('/chat') ? 'active' : ''}>
              <Link to="/chat">
                <i className="feather-message-circle"></i> <span>Messages</span>
              </Link>
            </li>
            <li className={isActive('/profile-settings') ? 'active' : ''}>
              <Link to="/profile-settings">
                <i className="feather-user"></i> <span>Profile Settings</span>
              </Link>
            </li>
            <li className={isActive('/change-password') ? 'active' : ''}>
              <Link to="/change-password">
                <i className="feather-lock"></i> <span>Change Password</span>
              </Link>
            </li>
            <li className={isActive('/dependent') ? 'active' : ''}>
              <Link to="/dependent">
                <i className="feather-users"></i> <span>Dependent</span>
              </Link>
            </li>
            <li className={isActive('/patient-accounts') ? 'active' : ''}>
              <Link to="/patient-accounts">
                <i className="feather-credit-card"></i> <span>Accounts</span>
              </Link>
            </li>
            <li className={isActive('/patient-invoices') ? 'active' : ''}>
              <Link to="/patient-invoices">
                <i className="feather-file-text"></i> <span>Invoices</span>
              </Link>
            </li>
            <li className={isActive('/medical-records') ? 'active' : ''}>
              <Link to="/medical-records">
                <i className="feather-file"></i> <span>Medical Records</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    )
  }

  if (userType === 'admin') {
    return (
      <div className="sidebar sidebar-admin">
        <div className="sidebar-inner">
          <ul className="sidebar-menu">
            <li className={isActive('/admin/index_admin') ? 'active' : ''}>
              <Link to="/admin/index_admin">
                <i className="feather-grid"></i> <span>Dashboard</span>
              </Link>
            </li>
            <li className={isActive('/admin/appointment-list') ? 'active' : ''}>
              <Link to="/admin/appointment-list">
                <i className="feather-calendar"></i> <span>Appointments</span>
              </Link>
            </li>
            <li className={isActive('/admin/specialities') ? 'active' : ''}>
              <Link to="/admin/specialities">
                <i className="feather-layers"></i> <span>Specialities</span>
              </Link>
            </li>
            <li className={isActive('/admin/doctor-list') ? 'active' : ''}>
              <Link to="/admin/doctor-list">
                <i className="feather-users"></i> <span>Doctor List</span>
              </Link>
            </li>
            <li className={isActive('/admin/patient-list') ? 'active' : ''}>
              <Link to="/admin/patient-list">
                <i className="feather-users"></i> <span>Patient List</span>
              </Link>
            </li>
            <li className={isActive('/admin/reviews') ? 'active' : ''}>
              <Link to="/admin/reviews">
                <i className="feather-star"></i> <span>Reviews</span>
              </Link>
            </li>
            <li className={isActive('/admin/transactions-list') ? 'active' : ''}>
              <Link to="/admin/transactions-list">
                <i className="feather-credit-card"></i> <span>Transactions</span>
              </Link>
            </li>
            <li className={isActive('/admin/subscription-plans') ? 'active' : ''}>
              <Link to="/admin/subscription-plans">
                <i className="feather-award"></i> <span>Subscriptions</span>
              </Link>
            </li>
            <li className={isActive('/admin/settings') ? 'active' : ''}>
              <Link to="/admin/settings">
                <i className="feather-settings"></i> <span>Settings</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    )
  }

  if (userType === 'pharmacy_admin') {
    const displayName =
      petStore?.name ||
      user?.fullName ||
      user?.name ||
      (role === 'PARAPHARMACY' ? 'Parapharmacy' : 'Pharmacy')
    const profileImage =
      getImageUrl(petStore?.logo) ||
      getImageUrl(user?.profileImage) ||
      '/assets/img/doctors-dashboard/doctor-profile-img.jpg'
    const roleLabel = role === 'PARAPHARMACY' ? 'Parapharmacy' : 'Pharmacy'

    return (
      <div className="profile-sidebar veterinary-sidebar">
        <div className="widget-profile veterinary-profile-widget">
          <div className="profile-info-widget">
            <Link to="/pharmacy-admin/profile" className="booking-doc-img">
              <img
                src={profileImage}
                alt="Store"
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.src = '/assets/img/doctors-dashboard/doctor-profile-img.jpg'
                }}
              />
              <div className="profile-badge">
                <i className="fa-solid fa-paw"></i>
              </div>
            </Link>
            <div className="profile-det-info">
              <h3>
                <Link to="/pharmacy-admin/profile">{displayName}</Link>
              </h3>
              <div className="patient-details">
                <h5 className="mb-0">{roleLabel} ID : {user?.id || user?._id || '—'}</h5>
              </div>
              <span className="badge veterinary-role-badge">
                <i className="fa-solid fa-circle"></i>{roleLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="dashboard-widget veterinary-dashboard-menu">
          <nav className="dashboard-menu">
            <ul>
              <li className={isActive('/pharmacy-admin/dashboard') ? 'active' : ''}>
                <Link to="/pharmacy-admin/dashboard">
                  <i className="fa-solid fa-shapes"></i>
                  <span>Dashboard</span>
                  <div className="menu-indicator"></div>
                </Link>
              </li>
              <li className={isActive('/pharmacy-admin/orders') ? 'active' : ''}>
                <Link to="/pharmacy-admin/orders">
                  <i className="fa-solid fa-shopping-bag"></i>
                  <span>Orders</span>
                  <div className="menu-indicator"></div>
                </Link>
              </li>
              <li className={isActive('/pharmacy-admin/products') ? 'active' : ''}>
                <Link to="/pharmacy-admin/products">
                  <i className="fa-solid fa-box"></i>
                  <span>Products</span>
                  <div className="menu-indicator"></div>
                </Link>
              </li>
              <li className={isActive('/pharmacy-admin/payouts') ? 'active' : ''}>
                <Link to="/pharmacy-admin/payouts">
                  <i className="fa-solid fa-money-bill-1"></i>
                  <span>Payouts</span>
                  <div className="menu-indicator"></div>
                </Link>
              </li>
              <li className={isActive('/pharmacy-admin/subscription') ? 'active' : ''}>
                <Link to="/pharmacy-admin/subscription">
                  <i className="fa-solid fa-crown"></i>
                  <span>Subscription</span>
                  <div className="menu-indicator"></div>
                </Link>
              </li>
              <li className={isActive('/pharmacy-admin/profile') ? 'active' : ''}>
                <Link to="/pharmacy-admin/profile">
                  <i className="fa-solid fa-user-pen"></i>
                  <span>Profile</span>
                  <div className="menu-indicator"></div>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    )
  }

  return null
}

export default Sidebar

