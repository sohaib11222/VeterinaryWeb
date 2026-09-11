import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import DoctorProfileTabs from '../../components/doctor/DoctorProfileTabs'
import { useVeterinarianProfile } from '../../queries/veterinarianQueries'
import { useUpdateVeterinarianProfile } from '../../mutations/veterinarianMutations'
import { toast } from 'react-toastify'
import { useLanguage } from '../../contexts/LanguageContext'
import { api } from '../../utils/api'
import { API_ROUTES } from '../../utils/apiConfig'
import { getNextTabPath } from '../../utils/profileSettingsTabs'

const emptyClinic = () => ({
  name: '',
  address: '',
  city: '',
  state: '',
  region: '',
  country: '',
  zip: '',
  phone: '',
  lat: null,
  lng: null,
  images: [],
  timings: [],
})

const DoctorClinicsSettings = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const { data, isLoading } = useVeterinarianProfile()
  const updateProfile = useUpdateVeterinarianProfile()

  const profile = data?.data || {}
  const initialClinics = Array.isArray(profile.clinics) ? profile.clinics : []

  const [clinics, setClinics] = useState([emptyClinic()])

  useEffect(() => {
    if (initialClinics.length > 0) {
      setClinics(
        initialClinics.map((c) => ({
          name: c.name || '',
          address: c.address || '',
          city: c.city || '',
          state: c.state || '',
          region: c.region || '',
          country: c.country || '',
          zip: c.zip || '',
          phone: c.phone || '',
          lat: c.lat ?? null,
          lng: c.lng ?? null,
          images: Array.isArray(c.images) ? c.images : [],
          timings: Array.isArray(c.timings) ? c.timings : [],
        }))
      )
    }
  }, [JSON.stringify(initialClinics)])

  const handleChange = (index, field, value) => {
    setClinics((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    )
  }

  const addClinic = () => {
    setClinics((prev) => [...prev, emptyClinic()])
  }

  const removeClinic = (index) => {
    setClinics((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const cleaned = clinics
        .map((c) => ({
          name: (c.name || '').trim(),
          address: (c.address || '').trim(),
          city: (c.city || '').trim(),
          state: (c.state || '').trim(),
          region: (c.region || '').trim(),
          country: (c.country || '').trim(),
          zip: (c.zip || '').trim(),
          phone: (c.phone || '').trim(),
          lat: c.lat != null && c.lat !== '' ? Number(c.lat) : null,
          lng: c.lng != null && c.lng !== '' ? Number(c.lng) : null,
          images: Array.isArray(c.images) ? c.images : [],
          timings: Array.isArray(c.timings) ? c.timings : [],
        }))
        .filter((c) => c.name)

      if (cleaned.length === 0) {
      toast.error(t('doctorRemaining.clinics.nameRequired'))
        return
      }

      await updateProfile.mutateAsync({ clinics: cleaned })
      toast.success(t('doctorRemaining.clinics.updated'))

      const refreshed = await api.get(API_ROUTES.VETERINARIANS.PROFILE)
      const nextProfile = refreshed?.data ?? refreshed
      const isProfileCompleted = nextProfile?.profileCompleted === true
      if (!isProfileCompleted) {
        const nextTabPath = getNextTabPath(location.pathname)
        if (nextTabPath) {
          setTimeout(() => navigate(nextTabPath), 500)
        }
      }
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || t('doctorRemaining.clinics.updateFailed')
      toast.error(message)
    }
  }

  if (isLoading) {
    return (
      <div
        className="content veterinary-dashboard d-flex justify-content-center align-items-center"
        style={{ minHeight: '60vh' }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t('doctorRemaining.profile.loading')}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="content veterinary-dashboard">
      <div className="container-fluid">
        <div className="row">
          <div className="col-lg-3 col-xl-2 theiaStickySidebar">
            {/* Sidebar is handled by DashboardLayout */}
          </div>
          <div className="col-lg-12 col-xl-12">
            {/* Veterinary Clinics Header */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="veterinary-dashboard-header">
                  <h2 className="dashboard-title">
                    <i className="fa-solid fa-clinic-medical me-3"></i>
                    {t('doctorRemaining.clinics.title')}
                  </h2>
                  <p className="dashboard-subtitle">
                    {t('doctorRemaining.clinics.subtitle')}
                  </p>
                </div>
              </div>
            </div>

            <DoctorProfileTabs />

            <div className="row">
              <div className="col-12">
                <div className="dashboard-card veterinary-card">
                  <div className="dashboard-card-body">
                    <form onSubmit={handleSubmit}>
                      <div className="row mb-3">
                        <div className="col-12 d-flex justify-content-between align-items-center">
                          <h5 className="card-title mb-0">
                            <i className="fa-solid fa-hospital me-2"></i>
                            {t('doctorRemaining.clinics.section')}
                          </h5>
                          <button
                            type="button"
                            className="btn veterinary-start-btn"
                            onClick={addClinic}
                          >
                            <i className="fa-solid fa-plus me-2"></i>
                            {t('doctorRemaining.clinics.add')}
                          </button>
                        </div>
                      </div>

                      <div className="accordions clinic-infos veterinary-clinics-accordions">
                        {clinics.map((clinic, index) => (
                          <div key={index} className="user-accordion-item mb-3">
                            <div className="content-collapse p-3 border rounded">
                              <div className="row align-items-center">
                                <div className="col-md-12">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      <i className="fa-solid fa-hospital me-2"></i>
                                      {t('doctorRemaining.clinics.name')} <span className="text-danger">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control veterinary-input"
                                      value={clinic.name}
                                      onChange={(e) => handleChange(index, 'name', e.target.value)}
                                      placeholder={t('doctorRemaining.clinics.namePlaceholder')}
                                    />
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      <i className="fa-solid fa-map-marker-alt me-2"></i>
                                      {t('doctorRemaining.clinics.city')}
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control veterinary-input"
                                      value={clinic.city}
                                      onChange={(e) => handleChange(index, 'city', e.target.value)}
                                      placeholder={t('doctorRemaining.clinics.city')}
                                    />
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      <i className="fa-solid fa-map me-2"></i>
                                      {t('doctorRemaining.clinics.state')}
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control veterinary-input"
                                      value={clinic.state}
                                      onChange={(e) => handleChange(index, 'state', e.target.value)}
                                      placeholder={t('doctorRemaining.clinics.state')}
                                    />
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      <i className="fa-solid fa-map-location-dot me-2"></i>
                                      {t('doctorRemaining.clinics.region')}
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control veterinary-input"
                                      value={clinic.region}
                                      onChange={(e) => handleChange(index, 'region', e.target.value)}
                                      placeholder={t('doctorRemaining.clinics.region')}
                                    />
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      <i className="fa-solid fa-globe me-2"></i>
                                      {t('doctorRemaining.clinics.country')}
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control veterinary-input"
                                      value={clinic.country}
                                      onChange={(e) => handleChange(index, 'country', e.target.value)}
                                      placeholder={t('doctorRemaining.clinics.country')}
                                    />
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      <i className="fa-solid fa-envelopes-bulk me-2"></i>
                                      {t('doctorRemaining.clinics.postalCode')}
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control veterinary-input"
                                      value={clinic.zip}
                                      onChange={(e) => handleChange(index, 'zip', e.target.value)}
                                      placeholder={t('doctorRemaining.clinics.postalCode')}
                                    />
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      <i className="fa-solid fa-phone me-2"></i>
                                      {t('doctorRemaining.clinics.phone')}
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control veterinary-input"
                                      value={clinic.phone}
                                      onChange={(e) => handleChange(index, 'phone', e.target.value)}
                                      placeholder={t('doctorRemaining.clinics.phonePlaceholder')}
                                    />
                                  </div>
                                </div>
                                <div className="col-md-12">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      <i className="fa-solid fa-home me-2"></i>
                                      {t('doctorRemaining.clinics.address')}
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control veterinary-input"
                                      value={clinic.address}
                                      onChange={(e) => handleChange(index, 'address', e.target.value)}
                                      placeholder={t('doctorRemaining.clinics.addressPlaceholder')}
                                    />
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      <i className="fa-solid fa-location-dot me-2"></i>
                                      {t('doctorRemaining.clinics.latitude')}
                                    </label>
                                    <input
                                      type="number"
                                      step="any"
                                      className="form-control veterinary-input"
                                      value={clinic.lat != null && clinic.lat !== '' ? clinic.lat : ''}
                                      onChange={(e) => {
                                        const v = e.target.value.trim()
                                        const n = v === '' ? null : parseFloat(v)
                                        if (v === '' || (!isNaN(n) && n >= -90 && n <= 90)) {
                                          handleChange(index, 'lat', n)
                                        }
                                      }}
                                      placeholder={t('doctorRemaining.clinics.latitudePlaceholder')}
                                    />
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      <i className="fa-solid fa-location-dot me-2"></i>
                                      {t('doctorRemaining.clinics.longitude')}
                                    </label>
                                    <input
                                      type="number"
                                      step="any"
                                      className="form-control veterinary-input"
                                      value={clinic.lng != null && clinic.lng !== '' ? clinic.lng : ''}
                                      onChange={(e) => {
                                        const v = e.target.value.trim()
                                        const n = v === '' ? null : parseFloat(v)
                                        if (v === '' || (!isNaN(n) && n >= -180 && n <= 180)) {
                                          handleChange(index, 'lng', n)
                                        }
                                      }}
                                      placeholder={t('doctorRemaining.clinics.longitudePlaceholder')}
                                    />
                                  </div>
                                </div>
                                <div className="col-md-12 text-end mt-2">
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => removeClinic(index)}
                                  >
                                    <i className="fa-solid fa-trash me-1"></i>
                                    {t('doctorRemaining.clinics.remove')}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="modal-btn text-end mt-3">
                        <button
                          type="submit"
                          className="btn veterinary-start-btn prime-btn"
                          disabled={updateProfile.isPending}
                        >
                          <i className="fa-solid fa-save me-1"></i>
                          {updateProfile.isPending ? t('doctorRemaining.clinics.saving') : t('doctorRemaining.clinics.save')}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorClinicsSettings
