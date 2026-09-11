import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { useMyPetSitterProfile } from '../../queries/petSitterQueries'
import { useUpdatePetSitterProfile } from '../../mutations/petSitterMutations'
import { api } from '../../utils/api'
import { API_ROUTES } from '../../utils/apiConfig'
import { useLanguage } from '../../contexts/LanguageContext'

const unwrap = (response) => response?.data ?? response ?? {}
const arrays = (value) => Array.isArray(value) ? value : []
const petOptions = ['DOG', 'CAT', 'BIRD', 'RABBIT', 'SMALL_PETS', 'REPTILE', 'FISH', 'OTHER']
const serviceOptions = ['DOG_SITTING', 'CAT_SITTING', 'HOME_BOARDING', 'HOME_VISITS', 'DOG_WALKING', 'MEDICATION_ADMINISTRATION', 'PET_TAXI', 'OTHER']

const PetSitterProfileSettings = () => {
  const { t } = useLanguage()
  const query = useMyPetSitterProfile()
  const updateProfile = useUpdatePetSitterProfile()
  const [form, setForm] = useState({ fullName: '', phone: '', address: '', city: '', province: '', region: '', postalCode: '', country: '', bio: '', petSittingExperience: '', experienceYears: 0, isAvailable: true, petTypes: [], servicesOffered: [], availability: [] })
  const [photo, setPhoto] = useState(null)
  const sitter = unwrap(query.data)

  useEffect(() => {
    const profile = sitter.profile || {}
    if (sitter.id) setForm({ fullName: sitter.name || '', phone: sitter.phone || '', address: sitter.address?.line1 || '', city: sitter.address?.city || '', province: sitter.address?.state || '', region: sitter.address?.region || sitter.address?.country || '', postalCode: sitter.address?.zip || '', country: sitter.address?.country || '', bio: profile.bio || '', petSittingExperience: profile.petSittingExperience || '', experienceYears: profile.experienceYears || 0, isAvailable: profile.isAvailable !== false, petTypes: arrays(profile.petTypes), servicesOffered: arrays(profile.servicesOffered), availability: arrays(profile.availability) })
  }, [sitter.id])

  const optionLabel = (value) => {
    const key = String(value).toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    return t(`petSitterPanel.profile.option.${key}`) || value.replace(/_/g, ' ')
  }
  const toggle = (key, value) => setForm((current) => ({ ...current, [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value] }))
  const save = async (event) => {
    event.preventDefault()
    try {
      let profileImage = sitter.profileImage
      if (photo) { const body = new FormData(); body.append('file', photo); const response = await api.upload(API_ROUTES.UPLOAD.PROFILE, body); const uploaded = unwrap(response); profileImage = uploaded.url || uploaded.data?.url }
      await updateProfile.mutateAsync({ fullName: form.fullName, phone: form.phone, profileImage, address: { line1: form.address, city: form.city, state: form.province, region: form.region, zip: form.postalCode, country: form.country || form.region }, bio: form.bio, petSittingExperience: form.petSittingExperience, experienceYears: form.experienceYears, isAvailable: form.isAvailable, petTypes: form.petTypes, servicesOffered: form.servicesOffered, availability: form.availability })
      toast.success(t('petSitterPanel.profile.updated'))
    } catch (error) { toast.error(error?.message || t('petSitterPanel.profile.updateFailed')) }
  }

  return <div className="content"><div className="container-fluid"><h3 className="mb-1">{t('petSitterPanel.profile.title')}</h3><p className="text-muted mb-4">{t('petSitterPanel.profile.subtitle')}</p><form onSubmit={save}><div className="card mb-4"><div className="card-body"><div className="row g-3">
    <div className="col-md-6"><label className="form-label">{t('petSitterPanel.profile.fullName')}</label><input className="form-control" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></div>
    <div className="col-md-6"><label className="form-label">{t('petSitterPanel.profile.profilePhoto')}</label><input type="file" className="form-control" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPhoto(e.target.files?.[0] || null)} /></div>
    <div className="col-md-6"><label className="form-label">{t('petSitterPanel.profile.phone')}</label><input className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
    <div className="col-md-6"><label className="form-label">{t('petSitterPanel.profile.city')}</label><input className="form-control" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
    <div className="col-md-4"><label className="form-label">{t('common.searchProviders.province')}</label><input className="form-control" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} /></div>
    <div className="col-md-4"><label className="form-label">{t('common.searchProviders.region')}</label><input className="form-control" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} /></div>
    <div className="col-md-4"><label className="form-label">{t('common.searchProviders.postalCode')}</label><input className="form-control" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} /></div>
    <div className="col-12"><label className="form-label">{t('petSitterPanel.profile.address')}</label><input className="form-control" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
    <div className="col-md-6"><label className="form-label">{t('petSitterPanel.profile.experienceYears')}</label><input className="form-control" type="number" min="0" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} /></div>
    <div className="col-md-6 d-flex align-items-end"><label className="form-check"><input className="form-check-input" type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} /> <span className="form-check-label">{t('petSitterPanel.profile.acceptingRequests')}</span></label></div>
    <div className="col-md-6"><label className="form-label">{t('petSitterPanel.profile.aboutMe')}</label><textarea className="form-control" rows="5" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
    <div className="col-md-6"><label className="form-label">{t('petSitterPanel.profile.sittingExperience')}</label><textarea className="form-control" rows="5" value={form.petSittingExperience} onChange={(e) => setForm({ ...form, petSittingExperience: e.target.value })} /></div>
  </div></div></div><div className="card mb-4"><div className="card-body"><h5>{t('petSitterPanel.profile.petsServices')}</h5><div className="row g-2">{petOptions.map((item) => <label className="col-sm-6 col-lg-3 form-check" key={item}><input className="form-check-input" type="checkbox" checked={form.petTypes.includes(item)} onChange={() => toggle('petTypes', item)} /> <span className="form-check-label">{optionLabel(item)}</span></label>)}</div><hr /><div className="row g-2">{serviceOptions.map((item) => <label className="col-sm-6 col-lg-3 form-check" key={item}><input className="form-check-input" type="checkbox" checked={form.servicesOffered.includes(item)} onChange={() => toggle('servicesOffered', item)} /> <span className="form-check-label">{optionLabel(item)}</span></label>)}</div></div></div><button className="btn btn-primary" disabled={updateProfile.isPending}>{updateProfile.isPending ? t('petSitterPanel.profile.saving') : t('petSitterPanel.profile.save')}</button></form></div></div>
}

export default PetSitterProfileSettings
