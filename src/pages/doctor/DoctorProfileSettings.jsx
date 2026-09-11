import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import DoctorProfileTabs from '../../components/doctor/DoctorProfileTabs'
import { useVeterinarianProfile } from '../../queries/veterinarianQueries'
import { useUpdateVeterinarianProfile } from '../../mutations/veterinarianMutations'
import { api } from '../../utils/api'
import { API_ROUTES, getImageUrl } from '../../utils/apiConfig'
import { toast } from 'react-toastify'
import { useLanguage } from '../../contexts/LanguageContext'
import { getNextTabPath } from '../../utils/profileSettingsTabs'

const DoctorProfileSettings = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const { data, isLoading } = useVeterinarianProfile()
  const updateProfile = useUpdateVeterinarianProfile()

  const profile = data?.data || {}
  const user = profile.userId || {}

  const [profileImageUrl, setProfileImageUrl] = useState(user.profileImage || '')

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    title: '',
    biography: '',
    clinicFee: '',
    onlineFee: '',
    memberships: [''],
  })

  useEffect(() => {
    if (!profile) return

    const clinicFee = profile.consultationFees?.clinic ?? ''
    const onlineFee = profile.consultationFees?.online ?? ''
    const memberships = Array.isArray(profile.memberships)
      ? profile.memberships.map((m) => m?.name || '')
      : []

    const fullName = user.name || ''
    const [firstName, ...rest] = fullName.split(' ')

    setForm({
      firstName: firstName || '',
      lastName: rest.join(' ') || '',
      displayName: user.name || '',
      title: profile.title || '',
      biography: profile.biography || '',
      clinicFee: clinicFee === null ? '' : clinicFee,
      onlineFee: onlineFee === null ? '' : onlineFee,
      memberships: memberships.length > 0 ? memberships : [''],
    })
    setProfileImageUrl(user.profileImage || '')
  }, [profile, user.name, profile.title, profile.biography, profile.consultationFees, profile.memberships, user.profileImage])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleMembershipChange = (index, value) => {
    setForm((prev) => {
      const next = [...prev.memberships]
      next[index] = value
      return { ...prev, memberships: next }
    })
  }

  const addMembershipRow = () => {
    setForm((prev) => ({ ...prev, memberships: [...prev.memberships, ''] }))
  }

  const removeMembershipRow = (index) => {
    setForm((prev) => {
      const next = prev.memberships.filter((_, i) => i !== index)
      return { ...prev, memberships: next.length > 0 ? next : [''] }
    })
  }

  const handleProfileImageChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    // Backend uploadSingleImage expects field name 'file'
    formData.append('file', file)

    try {
      const res = await api.upload(API_ROUTES.UPLOAD.PROFILE, formData)
      const url = res?.data?.url || res?.url
      if (!url) {
        throw new Error(t('doctorRemaining.profile.uploadFailed'))
      }

      // Persist on User.profileImage
      await api.put(API_ROUTES.USERS.UPDATE_PROFILE, { profileImage: url })

      setProfileImageUrl(url)
      toast.success(t('doctorRemaining.profile.uploadSuccess'))
    } catch (err) {
      toast.error(err?.message || t('doctorRemaining.profile.uploadFailed'))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Update basic user name as first + last
      const name = `${form.firstName} ${form.lastName}`.trim()
      if (name) {
        await api.put(API_ROUTES.USERS.UPDATE_PROFILE, { name })
      }

      await updateProfile.mutateAsync({
        title: form.title,
        biography: form.biography,
        consultationFees: {
          clinic: form.clinicFee !== '' ? Number(form.clinicFee) : null,
          online: form.onlineFee !== '' ? Number(form.onlineFee) : null,
        },
        memberships: form.memberships
          .map((name) => name.trim())
          .filter(Boolean)
          .map((name) => ({ name })),
      })
      toast.success(t('doctorRemaining.profile.updated'))

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
      toast.error(err?.message || t('doctorRemaining.profile.updateFailed'))
    }
  }

  if (isLoading && !profile) {
    return (
      <div className="content veterinary-dashboard d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t('doctorRemaining.profile.loading')}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="content veterinary-dashboard doctor-profile-settings-mobile">
      <div className="container-fluid">
        <div className="row">
          <div className="col-lg-3 col-xl-2 theiaStickySidebar">
            {/* Sidebar is handled by DashboardLayout */}
          </div>
          <div className="col-lg-12 col-xl-12">
            {/* Veterinary Profile Settings Header */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="veterinary-dashboard-header">
                  <h2 className="dashboard-title">
                    <i className="fa-solid fa-user-cog me-3"></i>
                    {t('doctorRemaining.profile.title')}
                  </h2>
                  <p className="dashboard-subtitle">{t('doctorRemaining.profile.subtitle')}</p>
                </div>
              </div>
            </div>

            {/* Settings Tabs */}
            <DoctorProfileTabs />

            {/* Profile Form */}
            <div className="row">
              <div className="col-12">
                <div className="dashboard-card veterinary-card">
                  <div className="dashboard-card-body">
                    <form onSubmit={handleSubmit}>
                      {/* Profile Image Section */}
                      <div className="setting-title">
                        <h5>
                          <i className="fa-solid fa-camera me-2"></i>
                          {t('doctorRemaining.profile.profileImage')}
                        </h5>
                      </div>
                      <div className="setting-card veterinary-setting-card">
                        <div className="change-avatar img-upload veterinary-avatar-upload">
                          <div className="profile-img veterinary-profile-img">
                            {profileImageUrl ? (
                              <img
                                src={getImageUrl(profileImageUrl) || profileImageUrl}
                                alt={t('doctorRemaining.profile.profileAlt')}
                                className="img-fluid rounded-circle"
                              />
                            ) : (
                              <i className="fa-solid fa-camera"></i>
                            )}
                            <div className="avatar-overlay">
                              <span>{t('doctorRemaining.profile.uploadPhoto')}</span>
                            </div>
                          </div>
                          <div className="upload-img">
                            <h5>{t('doctorRemaining.profile.professionalPhoto')}</h5>
                            <div className="imgs-load d-flex align-items-center">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleProfileImageChange}
                              />
                            </div>
                            <p className="form-text veterinary-form-text">
                              <i className="fa-solid fa-info-circle me-1"></i>
                              {t('doctorRemaining.profile.imageHint')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Basic Information Section */}
                      <div className="setting-title">
                        <h5>
                          <i className="fa-solid fa-info-circle me-2"></i>
                          {t('doctorRemaining.profile.basicInformation')}
                        </h5>
                      </div>
                      <div className="setting-card veterinary-setting-card">
                        <div className="row">
                          <div className="col-lg-4 col-md-6">
                            <div className="form-wrap">
                              <label className="form-label">
                                <i className="fa-solid fa-user me-2"></i>
                                {t('doctorRemaining.profile.firstName')} <span className="text-danger">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-control veterinary-input"
                                name="firstName"
                                placeholder={t('doctorRemaining.profile.firstName')}
                                value={form.firstName}
                                onChange={handleChange}
                              />
                            </div>
                          </div>
                          <div className="col-lg-4 col-md-6">
                            <div className="form-wrap">
                              <label className="form-label">
                                <i className="fa-solid fa-user me-2"></i>
                                {t('doctorRemaining.profile.lastName')} <span className="text-danger">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-control veterinary-input"
                                name="lastName"
                                placeholder={t('doctorRemaining.profile.lastName')}
                                value={form.lastName}
                                onChange={handleChange}
                              />
                            </div>
                          </div>
                          <div className="col-lg-4 col-md-6">
                            <div className="form-wrap">
                              <label className="form-label">
                                <i className="fa-solid fa-id-badge me-2"></i>
                                {t('doctorRemaining.profile.displayName')} <span className="text-danger">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-control veterinary-input"
                                name="displayName"
                                placeholder={t('doctorRemaining.profile.displayNamePlaceholder')}
                                value={`${form.firstName} ${form.lastName}`.trim()}
                                readOnly
                                disabled
                              />
                            </div>
                          </div>
                          <div className="col-lg-4 col-md-6">
                            <div className="form-wrap">
                              <label className="form-label">
                                <i className="fa-solid fa-stethoscope me-2"></i>
                                {t('doctorRemaining.profile.professionalTitle')} <span className="text-danger">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-control veterinary-input"
                                name="title"
                                placeholder={t('doctorRemaining.profile.professionalTitlePlaceholder')}
                                value={form.title}
                                onChange={handleChange}
                              />
                            </div>
                          </div>
                          <div className="col-lg-4 col-md-6">
                            <div className="form-wrap">
                              <label className="form-label">
                                <i className="fa-solid fa-phone me-2"></i>
                                {t('doctorRemaining.profile.phone')} <span className="text-danger">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-control veterinary-input"
                                placeholder={t('doctorRemaining.profile.phone')}
                                value={user.phone || ''}
                                disabled
                              />
                            </div>
                          </div>
                          <div className="col-lg-4 col-md-6">
                            <div className="form-wrap">
                              <label className="form-label">
                                <i className="fa-solid fa-envelope me-2"></i>
                                {t('doctorRemaining.profile.email')} <span className="text-danger">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-control veterinary-input"
                                placeholder={t('doctorRemaining.profile.email')}
                                value={user.email || ''}
                                disabled
                              />
                            </div>
                          </div>
                          <div className="col-lg-12">
                            <div className="form-wrap">
                              <label className="form-label">
                                <i className="fa-solid fa-file-alt me-2"></i>
                                {t('doctorRemaining.profile.biography')}
                              </label>
                              <textarea
                                className="form-control veterinary-input"
                                name="biography"
                                rows="4"
                                placeholder={t('doctorRemaining.profile.biographyPlaceholder')}
                                value={form.biography}
                                onChange={handleChange}
                              ></textarea>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Consultation Fees */}
                      <div className="setting-title">
                        <h5>
                          <i className="fa-solid fa-dollar-sign me-2"></i>
                          {t('doctorRemaining.profile.consultationFees')}
                        </h5>
                      </div>
                      <div className="setting-card veterinary-setting-card">
                        <div className="row">
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="form-label">
                                <i className="fa-solid fa-clinic-medical me-2"></i>
                                {t('doctorRemaining.profile.clinicFee')}
                              </label>
                              <input
                                type="number"
                                className="form-control veterinary-input"
                                name="clinicFee"
                                placeholder={t('doctorRemaining.profile.feePlaceholder')}
                                value={form.clinicFee}
                                onChange={handleChange}
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="form-label">
                                <i className="fa-solid fa-video me-2"></i>
                                {t('doctorRemaining.profile.onlineFee')}
                              </label>
                              <input
                                type="number"
                                className="form-control veterinary-input"
                                name="onlineFee"
                                placeholder={t('doctorRemaining.profile.feePlaceholder')}
                                value={form.onlineFee}
                                onChange={handleChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Professional Memberships */}
                      <div className="setting-title">
                        <h5>
                          <i className="fa-solid fa-certificate me-2"></i>
                          {t('doctorRemaining.profile.memberships')}
                        </h5>
                      </div>
                      <div className="setting-card veterinary-setting-card">
                        {form.memberships.map((value, index) => (
                          <div key={index} className="row align-items-center mb-2">
                            <div className="col-lg-10 col-md-9">
                              <div className="form-wrap mb-0">
                                <label className="form-label">
                                  <i className="fa-solid fa-award me-2"></i>
                                  {t('doctorRemaining.profile.organization')}
                                </label>
                                <input
                                  type="text"
                                  className="form-control veterinary-input"
                                  placeholder={t('doctorRemaining.profile.organizationPlaceholder')}
                                  value={value}
                                  onChange={(e) => handleMembershipChange(index, e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="col-lg-2 col-md-3">
                              <label className="col-form-label d-block">&nbsp;</label>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeMembershipRow(index)}
                              >
                                <i className="fa-solid fa-trash me-1"></i>
                                {t('doctorRemaining.profile.remove')}
                              </button>
                            </div>
                          </div>
                        ))}
                        <div className="text-end">
                          <button
                            type="button"
                            className="btn veterinary-btn-secondary more-item"
                            onClick={addMembershipRow}
                          >
                            <i className="fa-solid fa-plus me-1"></i>
                            {t('doctorRemaining.profile.addMembership')}
                          </button>
                        </div>
                      </div>

                      {/* Form Actions */}
                      <div className="modal-btn text-end">
                        <a href="#" className="btn veterinary-btn-secondary me-2">
                          <i className="fa-solid fa-times me-1"></i>{t('doctorRemaining.profile.cancel')}
                        </a>
                        <button type="submit" className="btn veterinary-start-btn prime-btn">
                          <i className="fa-solid fa-save me-1"></i>{updateProfile.isPending ? t('doctorRemaining.profile.saving') : t('doctorRemaining.profile.save')}
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

export default DoctorProfileSettings
