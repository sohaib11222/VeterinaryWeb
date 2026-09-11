import EmailVerifiedPasswordChangeForm from '../../components/auth/EmailVerifiedPasswordChangeForm'
import { useLanguage } from '../../contexts/LanguageContext'

const PetSitterChangePassword = () => {
  const { t } = useLanguage()
  return <div className="content"><div className="container-fluid"><h3 className="mb-1"><i className="fa-solid fa-lock me-2" />{t('auth.changePassword.title')}</h3><p className="text-muted mb-4">{t('auth.changePassword.securityNote', { account: t('petSitterPanel.nav.role') })}</p><EmailVerifiedPasswordChangeForm accountLabel={t('petSitterPanel.nav.role')} /></div></div>
}

export default PetSitterChangePassword
