import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import DoctorProfileTabs from '../../components/doctor/DoctorProfileTabs'
import { useVeterinarianProfile } from '../../queries/veterinarianQueries'
import { useUpdateVeterinarianProfile } from '../../mutations/veterinarianMutations'
import { api } from '../../utils/api'
import { API_ROUTES } from '../../utils/apiConfig'
import { getNextTabPath } from '../../utils/profileSettingsTabs'

const SocialMedia = () => {
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

  const validateUrlOrEmpty = (value, label) => {
    const trimmed = (value || '').trim()
    if (!trimmed) return ''
    try {
      new URL(trimmed)
      return trimmed
    } catch {
      toast.error(`Invalid ${label} URL`)
      return null
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const cleaned = {
      facebook: validateUrlOrEmpty(socialLinks.facebook, 'Facebook'),
      instagram: validateUrlOrEmpty(socialLinks.instagram, 'Instagram'),
      linkedin: validateUrlOrEmpty(socialLinks.linkedin, 'LinkedIn'),
      twitter: validateUrlOrEmpty(socialLinks.twitter, 'Twitter'),
      website: validateUrlOrEmpty(socialLinks.website, 'Website'),
    }

    if (Object.values(cleaned).some((v) => v === null)) {
      return
    }

    try {
      await updateProfile.mutateAsync({ socialLinks: cleaned })
      toast.success('Social media links updated successfully')

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
      const message = err?.response?.data?.message || err?.message || 'Failed to update social media links'
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
                    Veterinary Social Media
                  </h2>
                  <p className="dashboard-subtitle">Connect with pet owners through social media platforms</p>
                </div>
              </div>
            </div>
            <DoctorProfileTabs />

            <div className="card veterinary-card">
              <div className="card-body">
                <form className="social-media-form" onSubmit={handleSubmit}>
                  <div className="social-media-links d-flex align-items-center mb-3">
                    <div className="input-block input-block-new select-social-link me-3" style={{ minWidth: 160 }}>
                      <label className="col-form-label mb-0">Facebook</label>
                    </div>
                    <div className="input-block input-block-new flex-fill me-3">
                      <input
                        type="url"
                        className="form-control veterinary-input"
                        placeholder="Add Facebook URL"
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
                      <label className="col-form-label mb-0">Instagram</label>
                    </div>
                    <div className="input-block input-block-new flex-fill me-3">
                      <input
                        type="url"
                        className="form-control veterinary-input"
                        placeholder="Add Instagram URL"
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
                      <label className="col-form-label mb-0">LinkedIn</label>
                    </div>
                    <div className="input-block input-block-new flex-fill me-3">
                      <input
                        type="url"
                        className="form-control veterinary-input"
                        placeholder="Add LinkedIn URL"
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
                      <label className="col-form-label mb-0">Twitter</label>
                    </div>
                    <div className="input-block input-block-new flex-fill me-3">
                      <input
                        type="url"
                        className="form-control veterinary-input"
                        placeholder="Add Twitter URL"
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
                      <label className="col-form-label mb-0">Website</label>
                    </div>
                    <div className="input-block input-block-new flex-fill me-3">
                      <input
                        type="url"
                        className="form-control veterinary-input"
                        placeholder="Add Website URL"
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
                      Cancel
                    </Link>
                    <button type="submit" className="btn veterinary-btn-primary" disabled={isLoading || updateProfile.isPending}>
                      <i className="fa-solid fa-save me-2"></i>
                      {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
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
                  <h6 className="alert-heading">Veterinary Social Media Tips</h6>
                  <p className="mb-2 small">
                    <strong>Best practices for veterinary practices:</strong>
                  </p>
                  <ul className="small mb-0">
                    <li>Share pet care tips and educational content</li>
                    <li>Post before/after treatment success stories (with permission)</li>
                    <li>Feature your clinic team and facilities</li>
                    <li>Engage with pet owners through Q&A sessions</li>
                    <li>Share seasonal pet health reminders</li>
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

