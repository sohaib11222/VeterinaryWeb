import { Link, useParams } from 'react-router-dom'

import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { usePetSitter } from '../../queries/petSitterQueries'
import { getImageUrl } from '../../utils/apiConfig'

const label = (value) => String(value || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
const unwrap = (response) => response?.data ?? response ?? {}

const PetSitterProfile = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const { t } = useLanguage()
  const query = usePetSitter(id)
  const sitter = unwrap(query.data)
  const profile = sitter.profile || {}
  if (query.isLoading) return <div className="content"><div className="container text-center py-5"><div className="spinner-border text-primary" /></div></div>
  if (query.isError || !sitter.id) return <div className="content"><div className="container py-5"><div className="alert alert-danger">{t('patient.sitters.profileNotFound')}</div></div></div>

  return <div className="content"><div className="container py-5"><div className="card shadow-sm overflow-hidden"><div className="row g-0">
    <div className="col-md-4 bg-light d-flex align-items-center justify-content-center p-4"><img src={getImageUrl(sitter.profileImage) || '/assets/img/doctors-dashboard/doctor-profile-img.jpg'} className="img-fluid rounded" style={{ maxHeight: 360, objectFit: 'cover' }} alt={sitter.name} /></div>
    <div className="col-md-8"><div className="card-body p-4"><span className="badge bg-primary mb-2">{t('patient.sitters.petSitter')}</span><h2>{sitter.name}</h2><p className="text-muted"><i className="fa-solid fa-location-dot me-2" />{sitter.address?.city || t('patient.sitters.locationUnavailable')}</p><p className="mb-3">{profile.bio || t('patient.sitters.noBio')}</p>
      <div className="row g-3 mb-4"><div className="col-sm-4"><strong>{t('patient.sitters.experience')}</strong><div>{t('patient.sitters.years', { count: profile.experienceYears || 0 })}</div></div><div className="col-sm-4"><strong>{t('patient.sitters.availability')}</strong><div>{profile.isAvailable ? t('patient.sitters.available') : t('patient.sitters.unavailable')}</div></div><div className="col-sm-4"><strong>{t('patient.sitters.contact')}</strong><div>{sitter.phone || t('patient.sitters.availableInChat')}</div></div></div>
      <h5>{t('patient.sitters.petsHandled')}</h5><div className="d-flex flex-wrap gap-2 mb-3">{(profile.petTypes || []).map((item) => <span className="badge bg-light text-dark" key={item}>{label(item)}</span>)}</div><h5>{t('patient.sitters.services')}</h5><div className="d-flex flex-wrap gap-2 mb-4">{(profile.servicesOffered || []).map((item) => <span className="badge bg-light text-dark" key={item}>{label(item)}</span>)}</div>{user?.role === 'PET_OWNER' ? <Link className="btn btn-primary" to={`/chat?petSitterId=${encodeURIComponent(sitter.id)}`}><i className="fa-solid fa-comments me-2" />{t('patient.sitters.startChat')}</Link> : <Link className="btn btn-primary" to="/login">{t('patient.sitters.loginChat')}</Link>}</div></div>
  </div></div></div></div>
}

export default PetSitterProfile
