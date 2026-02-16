import { Link, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { useUnreadChatCount } from '../../queries/chatQueries'
import { useUnreadAnnouncementCount } from '../../queries/announcementQueries'
import { useUnreadNotificationsCount } from '../../queries/notificationQueries'
import { useVeterinarianProfile } from '../../queries/veterinarianQueries'
import { useAppointments } from '../../queries/appointmentQueries'
import { useUpdateVeterinarianProfile } from '../../mutations/veterinarianMutations'
import { getImageUrl } from '../../utils/apiConfig'

const DoctorSidebar = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: unreadRes } = useUnreadChatCount({ enabled: Boolean(user) })
  const unreadCount = unreadRes?.data?.unreadCount ?? 0
  const { data: unreadAnnouncementsRes } = useUnreadAnnouncementCount({ enabled: Boolean(user) })
  const unreadAnnouncements = unreadAnnouncementsRes?.data?.unreadCount ?? 0
  const { data: unreadNotificationsRes } = useUnreadNotificationsCount({ enabled: Boolean(user) })
  const unreadNotifications = unreadNotificationsRes?.data?.unreadCount ?? 0
  const { data: vetProfileRes } = useVeterinarianProfile()
  const updateVetProfile = useUpdateVeterinarianProfile()

  const pendingParams = useMemo(() => ({ status: 'PENDING', page: 1, limit: 1 }), [])
  const { data: pendingRes } = useAppointments(pendingParams)
  const pendingCount = pendingRes?.data?.pagination?.total ?? pendingRes?.pagination?.total ?? 0

  const vetProfile = useMemo(() => vetProfileRes?.data?.data || vetProfileRes?.data || vetProfileRes || null, [vetProfileRes])
  const vetUser = vetProfile?.userId || null
  const location = useLocation()
  const isActive = (paths) => {
    if (Array.isArray(paths)) {
      return paths.some(path => location.pathname === path || location.pathname.startsWith(path + '/'))
    }
    return location.pathname === paths || location.pathname.startsWith(paths + '/')
  }

  const displayName = vetUser?.fullName || vetUser?.name || user?.fullName || user?.name || 'Veterinarian'
  const profileImage =
    getImageUrl(vetUser?.profileImage) ||
    getImageUrl(user?.profileImage) ||
    '/assets/img/doctors-dashboard/doctor-profile-img.jpg'

  // Availability (mirrors react-conversion: isAvailableOnline false => not available)
  const currentAvailabilityValue = useMemo(() => {
    if (vetProfile?.isAvailableOnline === false) return 'not-available'
    return 'available'
  }, [vetProfile?.isAvailableOnline])

  const [availability, setAvailability] = useState(currentAvailabilityValue)
  useEffect(() => {
    setAvailability(currentAvailabilityValue)
  }, [currentAvailabilityValue])

  const handleUpdateAvailability = async () => {
    try {
      const isAvailableOnline = availability === 'available'
      await updateVetProfile.mutateAsync({ isAvailableOnline })
      queryClient.invalidateQueries({ queryKey: ['veterinarian', 'profile'] })
      toast.success('Availability updated successfully')
    } catch (err) {
      toast.error(err?.message || 'Failed to update availability')
    }
  }

  return (
    <div className="profile-sidebar veterinary-sidebar">
      {/* Veterinary Profile Widget */}
      <div className="widget-profile veterinary-profile-widget">
        <div className="profile-info-widget">
          <Link to="/doctor-profile" className="booking-doc-img">
            <img
              src={profileImage}
              alt="Veterinarian Image"
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
              <Link to="/doctor-profile">{displayName}</Link>
            </h3>
            <div className="patient-details">
              <h5 className="mb-0">Veterinarian ID : {user?.id || user?._id || '—'}</h5>
            </div>
            <span className="badge veterinary-role-badge">
              <i className="fa-solid fa-circle"></i>Veterinarian
            </span>
          </div>
        </div>
      </div>

      {/* Veterinary Availability */}
      <div className="veterinary-available-head">
        <div className="input-block input-block-new">
          <label className="form-label">
            <i className="fa-solid fa-clock me-2"></i>
            Availability <span className="text-danger">*</span>
          </label>
          <select
            className="select form-control veterinary-select"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            disabled={updateVetProfile.isPending}
          >
            <option value="available">I am Available Now</option>
            <option value="not-available">Not Available</option>
          </select>
          <button
            type="button"
            className="btn btn-primary btn-sm w-100 mt-2"
            onClick={handleUpdateAvailability}
            disabled={updateVetProfile.isPending}
            style={{ marginTop: '10px' }}
          >
            {updateVetProfile.isPending ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>

      {/* Veterinary Dashboard Menu */}
      <div className="dashboard-widget veterinary-dashboard-menu">
        <nav className="dashboard-menu">
          <ul>
            <li className={isActive('/doctor/dashboard') ? 'active' : ''}>
              <Link to="/doctor/dashboard">
                <i className="fa-solid fa-shapes"></i>
                <span>Dashboard</span>
                <div className="menu-indicator"></div>
              </Link>
            </li>
            <li className={isActive('/doctor-request') ? 'active' : ''}>
              <Link to="/doctor-request">
                <i className="fa-solid fa-calendar-check"></i>
                <span>Pet Requests</span>
                {pendingCount > 0 && (
                  <small className="unread-msg veterinary-badge">{pendingCount}</small>
                )}
              </Link>
            </li>
            <li className={isActive(['/appointments', '/doctor-appointments-grid', '/doctor-appointment-details', '/doctor-upcoming-appointment', '/doctor-completed-appointment', '/doctor-cancelled-appointment', '/doctor-appointment-start']) ? 'active' : ''}>
              <Link to="/appointments">
                <i className="fa-solid fa-calendar-days"></i>
                <span>Pet Appointments</span>
                <div className="menu-indicator"></div>
              </Link>
            </li>
            <li className={isActive('/available-timings') ? 'active' : ''}>
              <Link to="/available-timings">
                <i className="fa-solid fa-calendar-day"></i>
                <span>Clinic Hours</span>
                <div className="menu-indicator"></div>
              </Link>
            </li>
            <li className={isActive(['/my-patients', '/patient-profile']) ? 'active' : ''}>
              <Link to="/my-patients">
                <i className="fa-solid fa-dog"></i>
                <span>My Pets</span>
                <div className="menu-indicator"></div>
              </Link>
            </li>
            <li className={isActive('/doctor/vaccinations') ? 'active' : ''}>
              <Link to="/doctor/vaccinations">
                <i className="fa-solid fa-syringe"></i>
                <span>Vaccinations</span>
                <div className="menu-indicator"></div>
              </Link>
            </li>
            
            <li className={isActive('/reviews') ? 'active' : ''}>
              <Link to="/reviews">
                <i className="fas fa-star"></i>
                <span>Pet Owner Reviews</span>
                <div className="menu-indicator"></div>
              </Link>
            </li>
            <li className={isActive('/invoices') ? 'active' : ''}>
              <Link to="/invoices">
                <i className="fa-solid fa-file-lines"></i>
                <span>Invoices</span>
                <div className="menu-indicator"></div>
              </Link>
            </li>
            <li className={isActive('/doctor-payment') ? 'active' : ''}>
              <Link to="/doctor-payment">
                <i className="fa-solid fa-money-bill-1"></i>
                <span>Payment Settings</span>
                <div className="menu-indicator"></div>
              </Link>
            </li>
            <li className={isActive('/doctor/reschedule-requests') ? 'active' : ''}>
              <Link to="/doctor/reschedule-requests">
                <i className="fa-solid fa-calendar-days"></i>
                <span>Reschedule Requests</span>
                <div className="menu-indicator"></div>
              </Link>
            </li>
            <li className={isActive('/chat-doctor') ? 'active' : ''}>
              <Link to="/chat-doctor">
                <i className="fa-solid fa-comments"></i>
                <span>Messages</span>
                {unreadCount > 0 && (
                  <small className="unread-msg veterinary-badge">{unreadCount}</small>
                )}
              </Link>
            </li>
            <li className={isActive('/doctor/admin-chat') ? 'active' : ''}>
              <Link to="/doctor/admin-chat">
                <i className="fa-solid fa-headset"></i>
                <span>Admin Messages</span>
              </Link>
            </li>
            <li className={isActive('/doctor/notifications') ? 'active' : ''}>
              <Link to="/doctor/notifications">
                <i className="fa-solid fa-bell"></i>
                <span>Notifications</span>
                {unreadNotifications > 0 && (
                  <small className="unread-msg veterinary-badge">{unreadNotifications}</small>
                )}
              </Link>
            </li>
            <li className={isActive(['/doctor/blog', '/doctor/blog/create', '/doctor/blog/edit']) ? 'active' : ''}>
              <Link to="/doctor/blog">
                <i className="fa-solid fa-blog"></i>
                <span>Blog Posts</span>
                <div className="menu-indicator"></div>
              </Link>
            </li>
            <li className={isActive('/doctor/announcements') ? 'active' : ''}>
              <Link to="/doctor/announcements">
                <i className="fa-solid fa-bullhorn"></i>
                <span>Clinic Announcements</span>
                {unreadAnnouncements > 0 && (
                  <small className="unread-msg veterinary-badge">{unreadAnnouncements}</small>
                )}
              </Link>
            </li>
            <li className={isActive('/doctor/subscription-plans') ? 'active' : ''}>
              <Link to="/doctor/subscription-plans">
                <i className="fa-solid fa-crown"></i>
                <span>Subscription</span>
                <div className="menu-indicator"></div>
              </Link>
            </li>
            <li className={isActive(['/doctor-profile-settings', '/doctor-experience-settings', '/doctor-education-settings', '/doctor-awards-settings', '/doctor-insurance-settings', '/doctor-clinics-settings', '/doctor-business-settings']) ? 'active' : ''}>
              <Link to="/doctor-profile-settings">
                <i className="fa-solid fa-user-pen"></i>
                <span>Profile Settings</span>
                <div className="menu-indicator"></div>
              </Link>
            </li>
            <li className={isActive('/social-media') ? 'active' : ''}>
              <Link to="/social-media">
                <i className="fa-solid fa-shield-halved"></i>
                <span>Social Media</span>
                <div className="menu-indicator"></div>
              </Link>
            </li>
            <li className={isActive('/doctor-change-password') ? 'active' : ''}>
              <Link to="/doctor-change-password">
                <i className="fa-solid fa-key"></i>
                <span>Change Password</span>
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

export default DoctorSidebar
