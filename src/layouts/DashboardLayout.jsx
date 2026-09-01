import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import Header from '../components/common/Header'
import DoctorSidebar from '../components/common/DoctorSidebar'
import PatientSidebar from '../components/common/PatientSidebar'
import Sidebar from '../components/common/Sidebar'
import Footer from '../components/common/Footer'
import Breadcrumb from '../components/common/Breadcrumb'
import IncomingCallNotifier from '../components/video/IncomingCallNotifier'
import '../assets/css/dashboard-drawer.css'

const DashboardLayout = ({ children, breadcrumb }) => {
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCompactLayout, setIsCompactLayout] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(max-width: 991.98px)').matches
  ))
  const isDoctorRoute = location.pathname.startsWith('/doctor') || 
                        location.pathname === '/appointments' ||
                        location.pathname === '/doctor-appointments-grid' ||
                        location.pathname === '/doctor-upcoming-appointment' ||
                        location.pathname === '/doctor-completed-appointment' ||
                        location.pathname === '/doctor-cancelled-appointment' ||
                        location.pathname === '/doctor-appointment-details' ||
                        location.pathname === '/doctor-appointment-start' ||
                        location.pathname === '/available-timings' ||
                        location.pathname === '/my-patients' ||
                        location.pathname === '/doctor-specialities' ||
                        location.pathname === '/reviews' ||
                        location.pathname === '/invoices' ||
                        location.pathname.startsWith('/invoice-view') ||
                        location.pathname === '/doctor-request' ||
                        location.pathname === '/chat-doctor' ||
                        location.pathname === '/doctor/prescription' ||
                        location.pathname === '/social-media'
  const isPatientRoute = location.pathname.startsWith('/patient') ||
                        location.pathname === '/patient-appointments' ||
                        location.pathname === '/patient-appointments-grid' ||
                        location.pathname === '/patient-upcoming-appointment' ||
                        location.pathname === '/patient-completed-appointment' ||
                        location.pathname === '/patient-cancelled-appointment' ||
                        location.pathname === '/patient-appointment-details' ||
                        location.pathname === '/patient-profile' ||
                        location.pathname.startsWith('/patient-invoices') ||
                        location.pathname === '/patient-accounts' ||
                        location.pathname === '/profile-settings' ||
                        location.pathname === '/change-password' ||
                        location.pathname === '/favourites' ||
                        location.pathname === '/chat' ||
                        location.pathname === '/dependent' ||
                        location.pathname === '/medical-records' ||
                        location.pathname === '/medical-details' ||
                        location.pathname === '/patient/prescription'
  const isAdminRoute = location.pathname.startsWith('/admin')
  const isPharmacyAdminRoute = location.pathname.startsWith('/pharmacy-admin')
  const isChatRoute = location.pathname === '/chat' || location.pathname === '/chat-doctor' || location.pathname === '/doctor/admin-chat' || location.pathname === '/pharmacy-admin/admin-chat'
  const showSidebar = !isChatRoute && (isDoctorRoute || isPatientRoute || isPharmacyAdminRoute)

  useEffect(() => {
    setIsSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 991.98px)')
    const syncLayout = () => setIsCompactLayout(mediaQuery.matches)
    syncLayout()
    mediaQuery.addEventListener('change', syncLayout)
    return () => mediaQuery.removeEventListener('change', syncLayout)
  }, [])

  useEffect(() => {
    if (!isCompactLayout) setIsSidebarOpen(false)
  }, [isCompactLayout])

  useEffect(() => {
    if (!isSidebarOpen || !isCompactLayout) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.classList.add('dashboard-drawer-open')
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.classList.remove('dashboard-drawer-open')
      document.body.style.overflow = previousOverflow
    }
  }, [isCompactLayout, isSidebarOpen])

  const sidebar = isDoctorRoute
    ? <DoctorSidebar />
    : isPatientRoute
      ? <PatientSidebar />
      : isPharmacyAdminRoute
        ? <Sidebar userType="pharmacy_admin" />
        : null

  const closeSidebarAfterNavigation = (event) => {
    if (event.target.closest('a[href]')) setIsSidebarOpen(false)
  }

  const renderSidebar = (mobile = false) => (
    <aside
      id={mobile ? 'dashboard-navigation' : undefined}
      className={mobile
        ? 'dashboard-mobile-drawer'
        : 'col-lg-4 col-xl-3 theiaStickySidebar dashboard-sidebar-column'}
      aria-label="Dashboard navigation"
      onClick={closeSidebarAfterNavigation}
    >
      {mobile && (
        <button
          type="button"
          className="dashboard-mobile-menu-close"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close dashboard menu"
        >
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
      )}
      {sidebar}
    </aside>
  )

  return (
    <div className="main-wrapper">
      <Header />
      {breadcrumb && <Breadcrumb {...breadcrumb} />}
      <div className="content">
        {isChatRoute ? (
          children
        ) : (
          <div className="container dashboard-layout-container">
              {showSidebar && (
                <button
                  type="button"
                  className="dashboard-mobile-menu-trigger"
                onClick={() => setIsSidebarOpen(true)}
                aria-expanded={isSidebarOpen}
                aria-controls="dashboard-navigation"
              >
                <i className="fa-solid fa-bars" aria-hidden="true" />
                <span>Menu</span>
              </button>
            )}
            <div className="row">
              {showSidebar && !isCompactLayout && renderSidebar()}
              <main className={`dashboard-main-column ${(isDoctorRoute || isPatientRoute) && !isChatRoute
                ? "col-lg-8 col-xl-9"
                : isPharmacyAdminRoute && !isChatRoute
                  ? "col-lg-8 col-xl-9"
                  : "col-12"}`}>
                {children}
              </main>
            </div>
          </div>
        )}
      </div>
      {showSidebar && isCompactLayout && isSidebarOpen && typeof document !== 'undefined' && createPortal(
        <>
          <button
            type="button"
            className="dashboard-sidebar-overlay is-open"
            aria-label="Close dashboard menu"
            onClick={() => setIsSidebarOpen(false)}
          />
          {renderSidebar(true)}
        </>,
        document.body,
      )}
      <Footer />
      <IncomingCallNotifier />
    </div>
  )
}

export default DashboardLayout

