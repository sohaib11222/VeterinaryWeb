import EmailVerifiedPasswordChangeForm from '../../components/auth/EmailVerifiedPasswordChangeForm'
import { useLanguage } from '../../contexts/LanguageContext'

const DoctorChangePassword = () => {
  const { t } = useLanguage()

  return <div className="content veterinary-dashboard">
    <div className="container-fluid">
      <div className="veterinary-dashboard-header mb-4">
        <h2 className="dashboard-title"><i className="fa-solid fa-lock me-3" />{t('doctorRemaining.changePassword.title')}</h2>
        <p className="dashboard-subtitle">{t('doctorRemaining.changePassword.subtitle')}</p>
      </div>
      <EmailVerifiedPasswordChangeForm accountLabel="doctor" />
    </div>
  </div>
}

export default DoctorChangePassword
