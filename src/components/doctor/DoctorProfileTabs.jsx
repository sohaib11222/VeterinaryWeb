import { Link, useLocation } from 'react-router-dom'

const tabs = [
  { to: '/doctor-profile-settings', icon: 'fa-user', label: 'Basic Details' },
  { to: '/doctor-specialities', icon: 'fa-stethoscope', label: 'Specialties & Services' },
  { to: '/doctor-experience-settings', icon: 'fa-briefcase', label: 'Experience' },
  { to: '/doctor-education-settings', icon: 'fa-graduation-cap', label: 'Education' },
  { to: '/doctor-awards-settings', icon: 'fa-award', label: 'Awards' },
  { to: '/doctor-insurance-settings', icon: 'fa-shield-alt', label: 'Insurances' },
  { to: '/doctor-clinics-settings', icon: 'fa-clinic-medical', label: 'Clinics' },
  { to: '/doctor-business-settings', icon: 'fa-clock', label: 'Business Hours' },
  { to: '/social-media', icon: 'fa-share-nodes', label: 'Social Media' },
]

const DoctorProfileTabs = () => {
  const location = useLocation()

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <div className="row mb-4">
      <div className="col-12">
        <div className="dashboard-card veterinary-card">
          <div className="setting-tab">
            <div className="appointment-tabs">
              <ul className="nav veterinary-nav-tabs">
                {tabs.map((tab) => (
                  <li key={tab.to} className="nav-item">
                    <Link
                      className={`nav-link veterinary-tab ${isActive(tab.to) ? 'active' : ''}`}
                      to={tab.to}
                    >
                      <i className={`fa-solid ${tab.icon} me-2`}></i>
                      {tab.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorProfileTabs

