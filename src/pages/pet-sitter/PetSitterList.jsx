import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { useLanguage } from '../../contexts/LanguageContext'
import { usePetSitters } from '../../queries/petSitterQueries'
import { getImageUrl } from '../../utils/apiConfig'

const unwrap = (response) => response?.data ?? response ?? {}
const label = (value) => String(value || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())

const PetSitterList = () => {
  const { t } = useLanguage()
  const [search, setSearch] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [petType, setPetType] = useState('')
  const query = usePetSitters({ search, postalCode, province, city, petType, page: 1, limit: 50 })
  const sitters = useMemo(() => unwrap(query.data).petSitters || [], [query.data])

  return <div className="content"><div className="container py-5">
    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4"><div><h2>{t('patient.sitters.title')}</h2><p className="text-muted mb-0">{t('patient.sitters.subtitle')}</p></div><Link to="/search" className="btn btn-outline-primary">{t('patient.sitters.findVeterinarians')}</Link></div>
    <div className="card mb-4"><div className="card-body"><div className="row g-3">
      <div className="col-md-6"><label className="form-label">{t('patient.sitters.nameKeyword')}</label><input className="form-control" placeholder={t('patient.search.searchName')} value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <div className="col-md-3"><label className="form-label">{t('patient.sitters.postalCode')}</label><input className="form-control" placeholder={t('patient.sitters.postalPlaceholder')} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} /></div>
      <div className="col-md-3"><label className="form-label">{t('patient.sitters.petType')}</label><select className="form-select" value={petType} onChange={(e) => setPetType(e.target.value)}><option value="">{t('patient.sitters.allPetTypes')}</option>{['DOG', 'CAT', 'BIRD', 'RABBIT', 'SMALL_PETS', 'REPTILE', 'FISH', 'OTHER'].map((item) => <option key={item} value={item}>{label(item)}</option>)}</select></div>
      <div className="col-md-6"><label className="form-label">{t('patient.sitters.province')}</label><input className="form-control" placeholder={t('patient.sitters.searchProvince')} value={province} onChange={(e) => setProvince(e.target.value)} /></div>
      <div className="col-md-6"><label className="form-label">{t('patient.sitters.city')}</label><input className="form-control" placeholder={t('patient.sitters.searchCity')} value={city} onChange={(e) => setCity(e.target.value)} /></div>
    </div></div></div>
    {query.isLoading ? <div className="text-center py-5"><div className="spinner-border text-primary" /></div> : query.isError ? <div className="alert alert-danger">{t('patient.sitters.loadFailed')}</div> : <div className="row g-4">{sitters.map((sitter) => { const profile = sitter.profile || {}; const location = [sitter.address?.city, sitter.address?.state, sitter.address?.zip].filter(Boolean).join(', '); return <div className="col-md-6 col-xl-4" key={sitter.id}><div className="card h-100 shadow-sm"><img src={getImageUrl(sitter.profileImage) || '/assets/img/doctors-dashboard/doctor-profile-img.jpg'} className="card-img-top" style={{ height: 210, objectFit: 'cover' }} alt={sitter.name} /><div className="card-body d-flex flex-column"><h5>{sitter.name}</h5><p className="text-muted mb-2"><i className="fa-solid fa-location-dot me-2" />{location || t('patient.sitters.locationUnavailable')}</p><p className="small text-muted">{t('patient.sitters.yearsExperience', { count: profile.experienceYears || 0 })} · {profile.isAvailable ? t('patient.sitters.available') : t('patient.sitters.unavailable')}</p><div className="d-flex flex-wrap gap-1 mb-3">{(profile.petTypes || []).slice(0, 4).map((item) => <span className="badge bg-light text-dark" key={item}>{label(item)}</span>)}</div><Link className="btn btn-primary mt-auto" to={`/pet-sitters/${sitter.id}`}>{t('patient.sitters.viewProfile')}</Link></div></div></div> })}</div>}
    {!query.isLoading && !sitters.length && <div className="text-center py-5"><h4>{t('patient.sitters.noResults')}</h4><p className="text-muted">{t('patient.sitters.noResultsHint')}</p></div>}
  </div></div>
}

export default PetSitterList
