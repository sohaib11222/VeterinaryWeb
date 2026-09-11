import EmailVerifiedPasswordChangeForm from '../../components/auth/EmailVerifiedPasswordChangeForm'
import { useLanguage } from '../../contexts/LanguageContext'

const PharmacyAdminChangePassword = () => {
  const { t } = useLanguage()
  return (
    <div className="content">
      <div className="container">
        <div className="dashboard-header mb-4">
          <h3>{t('pharmacyAdmin.changePassword.title')}</h3>
          <p className="text-muted mb-0">{t('pharmacyAdmin.changePassword.description')}</p>
        </div>
        <EmailVerifiedPasswordChangeForm accountLabel="pharmacy" />
      </div>
    </div>
  )
}

export default PharmacyAdminChangePassword
