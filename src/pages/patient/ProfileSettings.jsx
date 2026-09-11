import { Link } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { useAuth } from '../../contexts/AuthContext'
import { useUserById } from '../../queries'
import { useUpdateUserProfile, useUploadProfileImage } from '../../mutations'
import { getImageUrl } from '../../utils/apiConfig'
import { useLanguage } from '../../contexts/LanguageContext'

const ProfileSettings = () => {
  const { user: authUser, updateUser } = useAuth()
  const { t } = useLanguage()
  const userId = authUser?.id || authUser?._id

  const fileInputRef = useRef(null)

  const { data: userResponse, isLoading } = useUserById(userId)
  const updateProfile = useUpdateUserProfile()
  const uploadProfileImage = useUploadProfileImage()

  const backendUser = useMemo(() => userResponse?.data || {}, [userResponse])

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    dob: '',
    gender: '',
    bloodGroup: '',
    profileImage: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: '',
    zip: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
  })

  useEffect(() => {
    if (!backendUser || !backendUser._id) return

    const toDateInput = (d) => {
      if (!d) return ''
      const date = new Date(d)
      if (Number.isNaN(date.getTime())) return ''
      const yyyy = date.getFullYear()
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      const dd = String(date.getDate()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    }

    setForm((prev) => ({
      ...prev,
      name: backendUser.name || '',
      phone: backendUser.phone || '',
      email: backendUser.email || '',
      dob: toDateInput(backendUser.dob),
      gender: backendUser.gender || '',
      bloodGroup: backendUser.bloodGroup || '',
      profileImage: backendUser.profileImage || '',
      addressLine1: backendUser.address?.line1 || '',
      addressLine2: backendUser.address?.line2 || '',
      city: backendUser.address?.city || '',
      state: backendUser.address?.state || '',
      country: backendUser.address?.country || '',
      zip: backendUser.address?.zip || '',
      emergencyName: backendUser.emergencyContact?.name || '',
      emergencyPhone: backendUser.emergencyContact?.phone || '',
      emergencyRelation: backendUser.emergencyContact?.relation || '',
    }))
  }, [backendUser])

  const onChange = (key) => (e) => {
    const value = e?.target?.value
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleUpload = async (e) => {
    const file = e?.target?.files?.[0]
    if (!file) return

    try {
      const res = await uploadProfileImage.mutateAsync(file)
      const url = res?.data?.url
      if (!url) {
        toast.error(t('patient.settings.uploadFailed'))
        return
      }

      setForm((prev) => ({ ...prev, profileImage: url }))
      // Persist image immediately in backend so refresh shows it
      const updateRes = await updateProfile.mutateAsync({ profileImage: url })
      const updated = updateRes?.data
      if (updated) {
        updateUser({
          name: updated.name,
          phone: updated.phone,
          profileImage: updated.profileImage,
        })
      }
      toast.success(t('patient.settings.imageUpdated'))
    } catch (err) {
      toast.error(err?.message || t('patient.settings.imageUploadFailed'))
    } finally {
      // allow uploading same file again
      if (e?.target) e.target.value = ''
    }
  }

  const openFilePicker = () => {
    if (uploadProfileImage.isPending || updateProfile.isPending) return
    fileInputRef.current?.click()
  }

  const handleRemoveImage = async (e) => {
    e?.preventDefault?.()
    try {
      const updateRes = await updateProfile.mutateAsync({ profileImage: null })
      const updated = updateRes?.data
      setForm((prev) => ({ ...prev, profileImage: '' }))
      if (updated) {
        updateUser({
          name: updated.name,
          phone: updated.phone,
          profileImage: updated.profileImage,
        })
      }
      toast.success(t('patient.settings.imageRemoved'))
    } catch (err) {
      toast.error(err?.message || t('patient.settings.removeImageFailed'))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const payload = {
      name: form.name,
      phone: form.phone,
      dob: form.dob || null,
      gender: form.gender || null,
      bloodGroup: form.bloodGroup || null,
      profileImage: form.profileImage || null,
      address: {
        line1: form.addressLine1 || null,
        line2: form.addressLine2 || null,
        city: form.city || null,
        state: form.state || null,
        country: form.country || null,
        zip: form.zip || null,
      },
      emergencyContact: {
        name: form.emergencyName || null,
        phone: form.emergencyPhone || null,
        relation: form.emergencyRelation || null,
      },
    }

    try {
      const res = await updateProfile.mutateAsync(payload)
      const updated = res?.data

      if (updated) {
        updateUser({
          name: updated.name,
          phone: updated.phone,
          profileImage: updated.profileImage,
        })
      }

      toast.success(t('patient.settings.profileUpdated'))
    } catch (err) {
      toast.error(err?.message || t('patient.settings.updateFailed'))
    }
  }

  const profileImageUrl = getImageUrl(form.profileImage)

  return (
    <div className="content veterinary-dashboard patient-profile-settings-mobile">
      <div className="container-fluid">
        <div className="row">
          <div className="col-lg-3 col-xl-2 theiaStickySidebar">
            {/* PatientSidebar will be rendered by DashboardLayout */}
          </div>
          <div className="col-lg-12 col-xl-12">
            {/* Veterinary Dashboard Header */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="veterinary-dashboard-header">
                  <h2 className="dashboard-title">
                    <i className="fa-solid fa-user-pen me-3"></i>
                    {t('patient.settings.profile')}
                  </h2>
                  <p className="dashboard-subtitle">{t('patient.settings.profileSubtitle')}</p>
                </div>
              </div>
            </div>

            {/* Settings Navigation */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="dashboard-card veterinary-card">
                  <div className="dashboard-card-body p-0">
                    <nav className="settings-tab veterinary-settings-tab mb-0">
                      <ul className="nav nav-tabs-bottom" role="tablist">
                        <li className="nav-item" role="presentation">
                          <Link className="nav-link veterinary-nav-link active" to="/profile-settings">
                            <i className="fa-solid fa-user me-2"></i>{t('patient.settings.account')}
                          </Link>
                        </li>
                        <li className="nav-item" role="presentation">
                          <Link className="nav-link veterinary-nav-link" to="/change-password">
                            <i className="fa-solid fa-lock me-2"></i>{t('patient.settings.changePassword')}
                          </Link>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
            {/* Profile Form */}
            <div className="row">
              <div className="col-12">
                <div className="dashboard-card veterinary-card">
                  <div className="dashboard-card-body">
                    <div className="border-bottom pb-3 mb-4">
                      <h5 className="veterinary-section-title">
                        <i className="fa-solid fa-user-circle me-2"></i>
                        {t('patient.settings.profile')}
                      </h5>
                    </div>

                    <form onSubmit={handleSubmit}>
                      <div className="setting-card veterinary-setting-card">
                        <label className="form-label veterinary-form-label mb-3">
                          <i className="fa-solid fa-camera me-2"></i>
                          {t('patient.settings.photo')}
                        </label>
                        <div className="change-avatar img-upload veterinary-avatar-upload">
                          <div className="profile-img veterinary-profile-img">
                            {profileImageUrl ? (
                              <img
                                src={profileImageUrl}
                                alt={t('patient.settings.profile')}
                                style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }}
                              />
                            ) : (
                              <i className="fa-solid fa-file-image"></i>
                            )}
                          </div>
                          <div className="upload-img veterinary-upload-info">
                            <div className="imgs-load d-flex align-items-center">
                              <button
                                type="button"
                                className="change-photo veterinary-change-photo"
                                onClick={openFilePicker}
                                disabled={uploadProfileImage.isPending || updateProfile.isPending}
                              >
                                <i className="fa-solid fa-upload me-2"></i>
                                {t('patient.settings.uploadNew')}
                              </button>

                              <input
                                ref={fileInputRef}
                                type="file"
                                className="upload"
                                accept="image/*"
                                onChange={handleUpload}
                                style={{ display: 'none' }}
                              />
                              <a href="#" className="upload-remove veterinary-remove-btn" onClick={handleRemoveImage}>
                                <i className="fa-solid fa-trash me-1"></i>{t('patient.settings.remove')}
                              </a>
                            </div>
                            <p className="veterinary-upload-info">
                              <i className="fa-solid fa-info-circle me-1"></i>
                              {t('patient.settings.imageHint')}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="setting-card veterinary-setting-card">
                        <div className="row">
                          <div className="col-lg-4 col-md-6">
                            <div className="mb-3">
                              <label className="form-label veterinary-form-label">
                                <i className="fa-solid fa-user me-1"></i>
                                {t('patient.settings.firstName')} <span className="text-danger">*</span>
                              </label>
                              <input type="text" className="form-control veterinary-form-control" placeholder={t('patient.settings.enterName')} value={form.name} onChange={onChange('name')} disabled={isLoading || updateProfile.isPending} />
                            </div>
                          </div>
                          <div className="col-lg-4 col-md-6">
                            <div className="mb-3">
                              <label className="form-label veterinary-form-label">
                                <i className="fa-solid fa-user me-1"></i>
                                {t('patient.settings.gender')}
                              </label>
                              <select className="select veterinary-select" value={form.gender} onChange={onChange('gender')} disabled={isLoading || updateProfile.isPending}>
                                <option value="">{t('patient.settings.select')}</option>
                                <option value="MALE">{t('patient.settings.male')}</option>
                                <option value="FEMALE">{t('patient.settings.female')}</option>
                                <option value="OTHER">{t('patient.settings.other')}</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-lg-4 col-md-6">
                            <div className="mb-3">
                              <label className="form-label veterinary-form-label">
                                <i className="fa-solid fa-calendar-days me-1"></i>
                                {t('patient.settings.dateOfBirth')}
                              </label>
                              <div className="form-icon veterinary-form-icon">
                                <input type="date" className="form-control veterinary-form-control" value={form.dob} onChange={onChange('dob')} disabled={isLoading || updateProfile.isPending} />
                                <span className="icon"><i className="fa-solid fa-calendar-days"></i></span>
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-4 col-md-6">
                            <div className="mb-3">
                              <label className="form-label veterinary-form-label">
                                <i className="fa-solid fa-phone me-1"></i>
                                {t('patient.settings.phone')}
                              </label>
                              <input type="text" className="form-control veterinary-form-control" placeholder={t('patient.settings.enterPhone')} value={form.phone} onChange={onChange('phone')} disabled={isLoading || updateProfile.isPending} />
                            </div>
                          </div>
                          <div className="col-lg-4 col-md-6">
                            <div className="mb-3">
                              <label className="form-label veterinary-form-label">
                                <i className="fa-solid fa-envelope me-1"></i>
                                {t('patient.settings.email')}
                              </label>
                              <input type="email" className="form-control veterinary-form-control" placeholder={t('patient.settings.enterEmail')} value={form.email} disabled={true} />
                            </div>
                          </div>
                          <div className="col-lg-4 col-md-6">
                            <div className="mb-3">
                              <label className="form-label veterinary-form-label">
                                <i className="fa-solid fa-droplet me-1"></i>
                                {t('patient.settings.bloodGroup')}
                              </label>
                              <input type="text" className="form-control veterinary-form-control" placeholder={t('patient.settings.enterBloodGroup')} value={form.bloodGroup} onChange={onChange('bloodGroup')} disabled={isLoading || updateProfile.isPending} />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="setting-title veterinary-setting-title">
                        <h6>
                          <i className="fa-solid fa-location-dot me-2"></i>
                          {t('patient.settings.addressInfo')}
                        </h6>
                      </div>
                      <div className="setting-card veterinary-setting-card">
                        <div className="row">
                          <div className="col-lg-12">
                            <div className="mb-3">
                              <label className="form-label veterinary-form-label">
                                <i className="fa-solid fa-house me-1"></i>
                                {t('patient.settings.address')} <span className="text-danger">*</span>
                              </label>
                              <input type="text" className="form-control veterinary-form-control" placeholder={t('patient.settings.enterAddress')} value={form.addressLine1} onChange={onChange('addressLine1')} disabled={isLoading || updateProfile.isPending} />
                            </div>
                          </div>
                          <div className="col-lg-12">
                            <div className="mb-3">
                              <label className="form-label veterinary-form-label">
                                <i className="fa-solid fa-house me-1"></i>
                                {t('patient.settings.addressLine2')}
                              </label>
                              <input type="text" className="form-control veterinary-form-control" placeholder={t('patient.settings.apartment')} value={form.addressLine2} onChange={onChange('addressLine2')} disabled={isLoading || updateProfile.isPending} />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label veterinary-form-label">
                                <i className="fa-solid fa-city me-1"></i>
                                {t('patient.settings.city')}
                              </label>
                              <input type="text" className="form-control veterinary-form-control" placeholder={t('patient.settings.enterCity')} value={form.city} onChange={onChange('city')} disabled={isLoading || updateProfile.isPending} />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label veterinary-form-label">
                                <i className="fa-solid fa-map me-1"></i>
                                {t('patient.settings.state')}
                              </label>
                              <input type="text" className="form-control veterinary-form-control" placeholder={t('patient.settings.enterState')} value={form.state} onChange={onChange('state')} disabled={isLoading || updateProfile.isPending} />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label veterinary-form-label">
                                <i className="fa-solid fa-globe me-1"></i>
                                {t('patient.settings.country')}
                              </label>
                              <input type="text" className="form-control veterinary-form-control" placeholder={t('patient.settings.enterCountry')} value={form.country} onChange={onChange('country')} disabled={isLoading || updateProfile.isPending} />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label veterinary-form-label">
                                <i className="fa-solid fa-envelope me-1"></i>
                                {t('patient.settings.pincode')}
                              </label>
                              <input type="text" className="form-control veterinary-form-control" placeholder={t('patient.settings.enterPostal')} value={form.zip} onChange={onChange('zip')} disabled={isLoading || updateProfile.isPending} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="setting-title veterinary-setting-title">
                        <h6>
                          <i className="fa-solid fa-triangle-exclamation me-2"></i>
                          {t('patient.settings.emergencyContact')}
                        </h6>
                      </div>
                      <div className="setting-card veterinary-setting-card">
                        <div className="row">
                          <div className="col-md-4">
                            <div className="mb-3">
                              <label className="form-label veterinary-form-label">{t('patient.settings.name')}</label>
                              <input type="text" className="form-control veterinary-form-control" placeholder={t('patient.settings.emergencyName')} value={form.emergencyName} onChange={onChange('emergencyName')} disabled={isLoading || updateProfile.isPending} />
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="mb-3">
                              <label className="form-label veterinary-form-label">{t('patient.settings.phone')}</label>
                              <input type="text" className="form-control veterinary-form-control" placeholder={t('patient.settings.emergencyPhone')} value={form.emergencyPhone} onChange={onChange('emergencyPhone')} disabled={isLoading || updateProfile.isPending} />
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="mb-3">
                              <label className="form-label veterinary-form-label">{t('patient.settings.relation')}</label>
                              <input type="text" className="form-control veterinary-form-control" placeholder={t('patient.settings.relation')} value={form.emergencyRelation} onChange={onChange('emergencyRelation')} disabled={isLoading || updateProfile.isPending} />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="modal-btn veterinary-form-actions text-end">
                        <a href="#" className="btn veterinary-btn-outline btn-md rounded-pill me-2" onClick={(e) => { e.preventDefault(); window.location.reload(); }}>
                          <i className="fa-solid fa-times me-2"></i>{t('patient.settings.cancel')}
                        </a>
                        <button type="submit" className="btn veterinary-btn-primary btn-md rounded-pill" disabled={updateProfile.isPending || uploadProfileImage.isPending}>
                          <i className="fa-solid fa-save me-2"></i>{t('patient.settings.saveChanges')}
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

export default ProfileSettings

