import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'

const tabs = [
  { to: '/doctor-profile-settings', icon: 'fa-user', key: 'basic' },
  { to: '/doctor-specialities', icon: 'fa-stethoscope', key: 'specialties' },
  { to: '/doctor-experience-settings', icon: 'fa-briefcase', key: 'experience' },
  { to: '/doctor-education-settings', icon: 'fa-graduation-cap', key: 'education' },
  { to: '/doctor-awards-settings', icon: 'fa-award', key: 'awards' },
  { to: '/doctor-insurance-settings', icon: 'fa-shield-alt', key: 'insurance' },
  { to: '/doctor-clinics-settings', icon: 'fa-clinic-medical', key: 'clinics' },
  { to: '/doctor-business-settings', icon: 'fa-clock', key: 'business' },
  { to: '/social-media', icon: 'fa-share-nodes', key: 'social' },
]

const DoctorProfileTabs = () => {
  const location = useLocation()
  const { t } = useLanguage()

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
                      {t(`doctorRemaining.tabs.${tab.key}`)}
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

