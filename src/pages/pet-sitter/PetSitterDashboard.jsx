import { Link } from 'react-router-dom'
import { useMyPetSitterProfile } from '../../queries/petSitterQueries'
import { getImageUrl } from '../../utils/apiConfig'
import { useLanguage } from '../../contexts/LanguageContext'

const unwrap = (response) => response?.data ?? response ?? {}
const label = (value) => String(value || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())

const PetSitterDashboard = () => {
  const { t } = useLanguage()
  const query = useMyPetSitterProfile()
  const sitter = unwrap(query.data)
  const profile = sitter.profile || {}

  return (
    <div className="content"><div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4"><div><h3 className="mb-1">{t('petSitterPanel.dashboard.title')}</h3><p className="text-muted mb-0">{t('petSitterPanel.dashboard.subtitle')}</p></div><Link to="/pet-sitter/profile" className="btn btn-primary"><i className="fa-solid fa-user-pen me-2" />{t('petSitterPanel.dashboard.editProfile')}</Link></div>
      {query.isLoading ? <div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">{t('petSitterPanel.dashboard.loading')}</span></div></div> : <>
        <div className="card mb-4"><div className="card-body d-flex align-items-center gap-3"><img src={getImageUrl(sitter.profileImage) || '/assets/img/doctors-dashboard/doctor-profile-img.jpg'} alt={t('petSitterPanel.nav.role')} className="rounded-circle" width="82" height="82" style={{ objectFit: 'cover' }} /><div><h4 className="mb-1">{t('petSitterPanel.dashboard.welcome', { name: sitter.name || t('petSitterPanel.dashboard.fallbackName') })}</h4><p className="text-muted mb-1">{sitter.address?.city || t('petSitterPanel.dashboard.addLocation')} · {t('petSitterPanel.dashboard.yearsExperience', { count: profile.experienceYears || 0 })}</p><span className={`badge ${profile.isAvailable ? 'bg-success' : 'bg-secondary'}`}>{profile.isAvailable ? t('petSitterPanel.dashboard.available') : t('petSitterPanel.dashboard.unavailable')}</span></div></div></div>
        <div className="row g-4"><div className="col-md-4"><div className="card h-100"><div className="card-body"><i className="fa-solid fa-paw text-primary fa-2x mb-3" /><h5>{t('petSitterPanel.dashboard.petTypes')}</h5><p className="text-muted">{(profile.petTypes || []).map(label).join(', ') || t('petSitterPanel.dashboard.notConfigured')}</p><Link to="/pet-sitter/profile">{t('petSitterPanel.dashboard.updatePreferences')}</Link></div></div></div><div className="col-md-4"><div className="card h-100"><div className="card-body"><i className="fa-solid fa-comments text-primary fa-2x mb-3" /><h5>{t('petSitterPanel.dashboard.ownerChats')}</h5><p className="text-muted">{t('petSitterPanel.dashboard.replyDirectly')}</p><Link to="/pet-sitter/chats">{t('petSitterPanel.dashboard.openMessages')}</Link></div></div></div><div className="col-md-4"><div className="card h-100"><div className="card-body"><i className="fa-solid fa-headset text-primary fa-2x mb-3" /><h5>{t('petSitterPanel.dashboard.support')}</h5><p className="text-muted">{t('petSitterPanel.dashboard.getHelp')}</p><Link to="/pet-sitter/support-tickets">{t('petSitterPanel.dashboard.openSupport')}</Link></div></div></div></div>
      </>}
    </div></div>
  )
}

export default PetSitterDashboard
