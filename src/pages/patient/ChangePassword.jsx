import { Link } from 'react-router-dom'
import EmailVerifiedPasswordChangeForm from '../../components/auth/EmailVerifiedPasswordChangeForm'
import { useLanguage } from '../../contexts/LanguageContext'

const ChangePassword = () => {
  const { t } = useLanguage()
  return <div className="content doctor-content">
    <div className="container">
      <nav className="settings-tab mb-1">
        <ul className="nav nav-tabs-bottom" role="tablist">
          <li className="nav-item"><Link className="nav-link" to="/profile-settings">{t('patient.settings.account')}</Link></li>
          <li className="nav-item"><Link className="nav-link active" to="/change-password">{t('patient.settings.changePassword')}</Link></li>
        </ul>
      </nav>
      <EmailVerifiedPasswordChangeForm accountLabel={t('patient.settings.account').toLowerCase()} />
    </div>
  </div>
}

export default ChangePassword
