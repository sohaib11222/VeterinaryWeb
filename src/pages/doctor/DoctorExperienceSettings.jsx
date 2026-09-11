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

const DoctorExperienceSettings = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const { data, isLoading } = useVeterinarianProfile()
  const updateProfile = useUpdateVeterinarianProfile()

  const profile = data?.data || {}
  const initialExperiences = Array.isArray(profile.experience) ? profile.experience : []

  const [experiences, setExperiences] = useState([
    { hospital: '', fromYear: '', toYear: '', designation: '' },
  ])

  useEffect(() => {
    if (initialExperiences.length > 0) {
      setExperiences(
        initialExperiences.map((exp) => ({
          hospital: exp.hospital || '',
          fromYear: exp.fromYear || '',
          toYear: exp.toYear || '',
          designation: exp.designation || '',
        }))
      )
    }
  }, [JSON.stringify(initialExperiences)])

  const handleChange = (index, field, value) => {
    setExperiences((prev) =>
      prev.map((exp, i) => (i === index ? { ...exp, [field]: value } : exp))
    )
  }

  const addExperience = () => {
    setExperiences((prev) => [...prev, { hospital: '', fromYear: '', toYear: '', designation: '' }])
  }

  const removeExperience = (index) => {
    setExperiences((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const cleaned = experiences
        .map((exp) => ({
          hospital: exp.hospital.trim(),
          fromYear: exp.fromYear.trim(),
          toYear: exp.toYear.trim(),
          designation: exp.designation.trim(),
        }))
        .filter((exp) => exp.hospital || exp.designation || exp.fromYear || exp.toYear)

      await updateProfile.mutateAsync({
        experience: cleaned,
      })

      toast.success(t('doctorRemaining.experience.updated'))

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
      const message = err?.response?.data?.message || err?.message || t('doctorRemaining.experience.updateFailed')
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
            {/* Veterinary Experience Header */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="veterinary-dashboard-header">
                  <h2 className="dashboard-title">
                    <i className="fa-solid fa-briefcase me-3"></i>
                    {t('doctorRemaining.experience.title')}
                  </h2>
                  <p className="dashboard-subtitle">
                    {t('doctorRemaining.experience.subtitle')}
                  </p>
                </div>
              </div>
            </div>

            {/* Settings Tabs */}
            <DoctorProfileTabs />

            {/* Experience Form */}
            <div className="row">
              <div className="col-12">
                <div className="dashboard-card veterinary-card">
                  <div className="dashboard-card-body">
                    <form onSubmit={handleSubmit}>
                      <div className="row mb-3">
                        <div className="col-12 d-flex justify-content-between align-items-center">
                          <h5 className="card-title mb-0">
                            <i className="fa-solid fa-briefcase me-2"></i>
                            {t('doctorRemaining.experience.section')}
                          </h5>
                          <button
                            type="button"
                            className="btn veterinary-start-btn"
                            onClick={addExperience}
                          >
                            <i className="fa-solid fa-plus me-2"></i>
                            {t('doctorRemaining.experience.add')}
                          </button>
                        </div>
                      </div>

                      <div className="accordions experience-infos veterinary-experience-accordions">
                        {experiences.map((exp, index) => (
                          <div key={index} className="user-accordion-item mb-3">
                            <div className="content-collapse p-3 border rounded">
                              <div className="row align-items-center">
                                <div className="col-md-6">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      <i className="fa-solid fa-clinic-medical me-2"></i>
                                      {t('doctorRemaining.experience.clinic')}
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control veterinary-input"
                                      value={exp.hospital}
                                      onChange={(e) => handleChange(index, 'hospital', e.target.value)}
                                      placeholder={t('doctorRemaining.experience.clinicPlaceholder')}
                                    />
                                  </div>
                                </div>
                                <div className="col-md-3">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      <i className="fa-solid fa-calendar-check me-2"></i>
                                      {t('doctorRemaining.experience.from')}
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control veterinary-input"
                                      value={exp.fromYear}
                                      onChange={(e) => handleChange(index, 'fromYear', e.target.value)}
                                      placeholder={t('doctorRemaining.experience.fromPlaceholder')}
                                    />
                                  </div>
                                </div>
                                <div className="col-md-3">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      <i className="fa-solid fa-calendar-times me-2"></i>
                                      {t('doctorRemaining.experience.to')}
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control veterinary-input"
                                      value={exp.toYear}
                                      onChange={(e) => handleChange(index, 'toYear', e.target.value)}
                                      placeholder={t('doctorRemaining.experience.toPlaceholder')}
                                    />
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      <i className="fa-solid fa-user-tie me-2"></i>
                                      {t('doctorRemaining.experience.role')}
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control veterinary-input"
                                      value={exp.designation}
                                      onChange={(e) =>
                                        handleChange(index, 'designation', e.target.value)
                                      }
                                      placeholder={t('doctorRemaining.experience.rolePlaceholder')}
                                    />
                                  </div>
                                </div>
                                <div className="col-md-12 text-end mt-2">
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => removeExperience(index)}
                                  >
                                    <i className="fa-solid fa-trash me-1"></i>
                                    {t('doctorRemaining.experience.remove')}
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
                          {updateProfile.isPending ? t('doctorRemaining.experience.saving') : t('doctorRemaining.experience.save')}
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

export default DoctorExperienceSettings
