import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useLanguage } from '../../contexts/LanguageContext'
import DoctorProfileTabs from '../../components/doctor/DoctorProfileTabs'
import { useVeterinarianProfile } from '../../queries/veterinarianQueries'
import { useUpdateVeterinarianProfile } from '../../mutations/veterinarianMutations'
import { api } from '../../utils/api'
import { API_ROUTES } from '../../utils/apiConfig'
import { getNextTabPath } from '../../utils/profileSettingsTabs'

const SocialMedia = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()

  const { data: profileRes, isLoading } = useVeterinarianProfile()
  const updateProfile = useUpdateVeterinarianProfile()

  const profile = profileRes?.data || {}

  const [socialLinks, setSocialLinks] = useState({
    facebook: '',
    instagram: '',
    linkedin: '',
    twitter: '',
    website: '',
  })

  useEffect(() => {
    const existing = profile?.socialLinks || {}
    setSocialLinks({
      facebook: existing.facebook || '',
      instagram: existing.instagram || '',
      linkedin: existing.linkedin || '',
      twitter: existing.twitter || '',
      website: existing.website || '',
    })
  }, [JSON.stringify(profile?.socialLinks || {})])

  const handleChange = (key, value) => {
    setSocialLinks((prev) => ({ ...prev, [key]: value }))
  }

  const normalizeUrlOrEmpty = (value, label) => {
    const trimmed = (value || '').trim()
    if (!trimmed) return ''
    try {
      const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`
      const url = new URL(candidate)
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported protocol')
      return url.toString()
    } catch {
      toast.error(t('doctorRemaining.social.invalidUrl', { label }))
      return null
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const cleaned = {
      facebook: normalizeUrlOrEmpty(socialLinks.facebook, 'Facebook'),
      instagram: normalizeUrlOrEmpty(socialLinks.instagram, 'Instagram'),
      linkedin: normalizeUrlOrEmpty(socialLinks.linkedin, 'LinkedIn'),
      twitter: normalizeUrlOrEmpty(socialLinks.twitter, 'X / Twitter'),
      website: normalizeUrlOrEmpty(socialLinks.website, 'Website'),
    }

    if (Object.values(cleaned).some((v) => v === null)) {
      return
    }

    try {
      await updateProfile.mutateAsync({ socialLinks: cleaned })
      toast.success(t('doctorRemaining.social.updated'))

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
      const message = err?.response?.data?.message || err?.message || t('doctorRemaining.social.updateFailed')
      toast.error(message)
    }
  }

  return (
    <div className="content veterinary-dashboard">
      <div className="container-fluid">
        <div className="row">
          <div className="col-lg-3 col-xl-2 theiaStickySidebar">
            {/* Sidebar is handled by DashboardLayout */}
          </div>
          <div className="col-lg-12 col-xl-12">
            {/* Veterinary Social Media Header */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="veterinary-dashboard-header">
                  <h2 className="dashboard-title">
                    <i className="fa-solid fa-share-nodes me-3"></i>
                    {t('doctorRemaining.social.title')}
                  </h2>
                  <p className="dashboard-subtitle">{t('doctorRemaining.social.subtitle')}</p>
                </div>
              </div>
            </div>
            <DoctorProfileTabs />

            <div className="card veterinary-card">
              <div className="card-body">
                <form className="social-media-form" onSubmit={handleSubmit}>
                  <div className="social-media-links d-flex align-items-center mb-3">
                    <div className="input-block input-block-new select-social-link me-3" style={{ minWidth: 160 }}>
                      <label className="col-form-label mb-0">{t('doctorRemaining.social.facebook')}</label>
                    </div>
                    <div className="input-block input-block-new flex-fill me-3">
                      <input
                        type="text"
                        inputMode="url"
                        className="form-control veterinary-input"
                        placeholder={t('doctorRemaining.social.addUrl', { network: t('doctorRemaining.social.facebook') })}
                        value={socialLinks.facebook}
                        onChange={(e) => handleChange('facebook', e.target.value)}
                        disabled={isLoading || updateProfile.isPending}
                      />
                    </div>
                    <div className="social-media-icon me-2">
                      <i className="fa-brands fa-facebook fa-lg text-primary"></i>
                    </div>
                  </div>

                  <div className="social-media-links d-flex align-items-center mb-3">
                    <div className="input-block input-block-new select-social-link me-3" style={{ minWidth: 160 }}>
                      <label className="col-form-label mb-0">{t('doctorRemaining.social.instagram')}</label>
                    </div>
                    <div className="input-block input-block-new flex-fill me-3">
                      <input
                        type="text"
                        inputMode="url"
                        className="form-control veterinary-input"
                        placeholder={t('doctorRemaining.social.addUrl', { network: t('doctorRemaining.social.instagram') })}
                        value={socialLinks.instagram}
                        onChange={(e) => handleChange('instagram', e.target.value)}
                        disabled={isLoading || updateProfile.isPending}
                      />
                    </div>
                    <div className="social-media-icon me-2">
                      <i className="fa-brands fa-instagram fa-lg text-danger"></i>
                    </div>
                  </div>

                  <div className="social-media-links d-flex align-items-center mb-3">
                    <div className="input-block input-block-new select-social-link me-3" style={{ minWidth: 160 }}>
                      <label className="col-form-label mb-0">{t('doctorRemaining.social.linkedin')}</label>
                    </div>
                    <div className="input-block input-block-new flex-fill me-3">
                      <input
                        type="text"
                        inputMode="url"
                        className="form-control veterinary-input"
                        placeholder={t('doctorRemaining.social.addUrl', { network: t('doctorRemaining.social.linkedin') })}
                        value={socialLinks.linkedin}
                        onChange={(e) => handleChange('linkedin', e.target.value)}
                        disabled={isLoading || updateProfile.isPending}
                      />
                    </div>
                    <div className="social-media-icon me-2">
                      <i className="fa-brands fa-linkedin fa-lg text-primary"></i>
                    </div>
                  </div>

                  <div className="social-media-links d-flex align-items-center mb-3">
                    <div className="input-block input-block-new select-social-link me-3" style={{ minWidth: 160 }}>
                      <label className="col-form-label mb-0">{t('doctorRemaining.social.twitter')}</label>
                    </div>
                    <div className="input-block input-block-new flex-fill me-3">
                      <input
                        type="text"
                        inputMode="url"
                        className="form-control veterinary-input"
                        placeholder={t('doctorRemaining.social.addUrl', { network: t('doctorRemaining.social.twitter') })}
                        value={socialLinks.twitter}
                        onChange={(e) => handleChange('twitter', e.target.value)}
                        disabled={isLoading || updateProfile.isPending}
                      />
                    </div>
                    <div className="social-media-icon me-2">
                      <i className="fa-brands fa-twitter fa-lg text-info"></i>
                    </div>
                  </div>

                  <div className="social-media-links d-flex align-items-center mb-3">
                    <div className="input-block input-block-new select-social-link me-3" style={{ minWidth: 160 }}>
                      <label className="col-form-label mb-0">{t('doctorRemaining.social.website')}</label>
                    </div>
                    <div className="input-block input-block-new flex-fill me-3">
                      <input
                        type="text"
                        inputMode="url"
                        className="form-control veterinary-input"
                        placeholder={t('doctorRemaining.social.addUrl', { network: t('doctorRemaining.social.website') })}
                        value={socialLinks.website}
                        onChange={(e) => handleChange('website', e.target.value)}
                        disabled={isLoading || updateProfile.isPending}
                      />
                    </div>
                    <div className="social-media-icon me-2">
                      <i className="fa-solid fa-globe fa-lg text-secondary"></i>
                    </div>
                  </div>

                  <div className="form-set-button mt-4">
                    <Link to="/doctor/dashboard" className="btn veterinary-btn-secondary me-2">
                      <i className="fa-solid fa-times me-2"></i>
                      {t('doctorRemaining.social.cancel')}
                    </Link>
                    <button type="submit" className="btn veterinary-btn-primary" disabled={isLoading || updateProfile.isPending}>
                      <i className="fa-solid fa-save me-2"></i>
                      {updateProfile.isPending ? t('doctorRemaining.social.saving') : t('doctorRemaining.social.save')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            {/* Social Media Tips */}
            <div className="alert alert-info mt-4 veterinary-alert">
              <div className="d-flex">
                <div className="flex-shrink-0">
                  <i className="fa-solid fa-lightbulb"></i>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="alert-heading">{t('doctorRemaining.social.tipsTitle')}</h6>
                  <p className="mb-2 small">
                    <strong>{t('doctorRemaining.social.bestPractices')}</strong>
                  </p>
                  <ul className="small mb-0">
                    <li>{t('doctorRemaining.social.tip1')}</li>
                    <li>{t('doctorRemaining.social.tip2')}</li>
                    <li>{t('doctorRemaining.social.tip3')}</li>
                    <li>{t('doctorRemaining.social.tip4')}</li>
                    <li>{t('doctorRemaining.social.tip5')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SocialMedia

