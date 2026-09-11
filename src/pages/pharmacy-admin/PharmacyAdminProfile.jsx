import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { useAuth } from '../../contexts/AuthContext'
import { useMyPetStore } from '../../queries/petStoreQueries'
import { useCreatePetStore, useUpdatePetStore } from '../../mutations/petStoreMutations'
import { api } from '../../utils/api'
import { API_ROUTES, getImageUrl } from '../../utils/apiConfig'
import { useLanguage } from '../../contexts/LanguageContext'

const PharmacyAdminProfile = () => {
  const { user } = useAuth()
  const { t } = useLanguage()
  const role = String(user?.role || '').toUpperCase()

  const myPetStoreQuery = useMyPetStore()
  const createPetStore = useCreatePetStore()
  const updatePetStore = useUpdatePetStore()

  const petStore = useMemo(() => {
    const payload = myPetStoreQuery.data?.data ?? myPetStoreQuery.data
    return payload?.data ?? payload
  }, [myPetStoreQuery.data])

  const [form, setForm] = useState({
    name: '',
    phone: '',
    logo: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      country: '',
      zip: '',
    },
    location: {
      lat: '',
      lng: '',
    },
    isActive: true,
  })
  const [logoPreview, setLogoPreview] = useState('')

  useEffect(() => () => {
    if (logoPreview.startsWith('blob:')) URL.revokeObjectURL(logoPreview)
  }, [logoPreview])

  useEffect(() => {
    if (!petStore) return
    setForm({
      name: petStore?.name || '',
      phone: petStore?.phone || '',
      logo: petStore?.logo || '',
      address: {
        line1: petStore?.address?.line1 || '',
        line2: petStore?.address?.line2 || '',
        city: petStore?.address?.city || '',
        state: petStore?.address?.state || '',
        country: petStore?.address?.country || '',
        zip: petStore?.address?.zip || '',
      },
      location: {
        lat: petStore?.location?.lat !== null && petStore?.location?.lat !== undefined ? String(petStore.location.lat) : '',
        lng: petStore?.location?.lng !== null && petStore?.location?.lng !== undefined ? String(petStore.location.lng) : '',
      },
      isActive: petStore?.isActive !== false,
    })
  }, [petStore])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    if (name.startsWith('address.')) {
      const field = name.split('.')[1]
      setForm((prev) => ({ ...prev, address: { ...prev.address, [field]: value } }))
      return
    }

    if (name.startsWith('location.')) {
      const field = name.split('.')[1]
      setForm((prev) => ({ ...prev, location: { ...prev.location, [field]: value } }))
      return
    }

    if (type === 'checkbox') {
      setForm((prev) => ({ ...prev, [name]: checked }))
      return
    }

    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const uploadLogo = async (file) => {
    const formData = new FormData()
    formData.append('file', file)

    const res = await api.upload(API_ROUTES.UPLOAD.PET_STORE, formData)
    const payload = res?.data ?? res
    const url = payload?.url || payload?.data?.url

    if (!url) {
      throw new Error(t('pharmacyAdmin.profile.logoUploadFailed'))
    }

    return url
  }

  const handleLogoFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error(t('pharmacyAdmin.profile.chooseLogo'))
      e.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('pharmacyAdmin.profile.logoSize'))
      e.target.value = ''
      return
    }

    const localPreview = URL.createObjectURL(file)
    setLogoPreview((previous) => {
      if (previous.startsWith('blob:')) URL.revokeObjectURL(previous)
      return localPreview
    })

    try {
      const url = await uploadLogo(file)
      setForm((prev) => ({ ...prev, logo: url }))
      setLogoPreview((previous) => {
        if (previous.startsWith('blob:')) URL.revokeObjectURL(previous)
        return ''
      })
      toast.success(t('pharmacyAdmin.profile.logoUploaded'))
    } catch (error) {
      setLogoPreview((previous) => {
        if (previous.startsWith('blob:')) URL.revokeObjectURL(previous)
        return ''
      })
      toast.error(error?.message || t('pharmacyAdmin.profile.logoUploadFailed'))
    } finally {
      e.target.value = ''
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()

    const name = String(form.name || '').trim()
    if (!name) {
      toast.error(t('pharmacyAdmin.profile.storeRequired'))
      return
    }
    const requiredProfileFields = [
      [t('pharmacyAdmin.profile.phone'), form.phone],
      [t('pharmacyAdmin.profile.address1'), form.address.line1],
      [t('pharmacyAdmin.profile.city'), form.address.city],
      [t('pharmacyAdmin.profile.country'), form.address.country],
      [t('pharmacyAdmin.profile.zip'), form.address.zip],
    ]
    const missingField = requiredProfileFields.find(([, value]) => !String(value || '').trim())
    if (missingField) {
      toast.error(t('pharmacyAdmin.profile.fieldRequired', { field: missingField[0] }))
      return
    }

    const payload = {
      name,
      phone: String(form.phone || '').trim() || null,
      logo: form.logo || null,
      isActive: !!form.isActive,
      address: {
        line1: String(form.address.line1 || '').trim() || null,
        line2: String(form.address.line2 || '').trim() || null,
        city: String(form.address.city || '').trim() || null,
        state: String(form.address.state || '').trim() || null,
        country: String(form.address.country || '').trim() || null,
        zip: String(form.address.zip || '').trim() || null,
      },
    }

    const lat = form.location.lat ? Number(form.location.lat) : null
    const lng = form.location.lng ? Number(form.location.lng) : null
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      payload.location = { lat, lng }
    }

    try {
      if (petStore?._id) {
        await updatePetStore.mutateAsync({ petStoreId: petStore._id, data: payload })
        toast.success(t('pharmacyAdmin.profile.updated'))
      } else {
        await createPetStore.mutateAsync(payload)
        toast.success(t('pharmacyAdmin.profile.created'))
      }
    } catch (error) {
      toast.error(error?.message || t('pharmacyAdmin.profile.saveFailed'))
    }
  }

  const title = role === 'PARAPHARMACY' ? t('pharmacyAdmin.profile.parapharmacyTitle') : t('pharmacyAdmin.profile.pharmacyTitle')

  return (
    <div>
      <div className="page-header">
        <h3 className="page-title">{title}</h3>
        <div className="text-muted">{t('pharmacyAdmin.profile.subtitle')}</div>
      </div>

      <div className="card">
        <div className="card-body">
          {myPetStoreQuery.isLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">{t('pharmacyAdmin.profile.loading')}</span>
              </div>
            </div>
          ) : myPetStoreQuery.isError ? (
            <div className="alert alert-danger">{myPetStoreQuery.error?.message || t('pharmacyAdmin.profile.failed')}</div>
          ) : (
            <form onSubmit={onSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">{t('pharmacyAdmin.profile.storeName')} <span className="text-danger">*</span></label>
                  <input className="form-control" name="name" value={form.name} onChange={handleChange} required />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">{t('pharmacyAdmin.profile.phone')} <span className="text-danger">*</span></label>
                  <input className="form-control" name="phone" value={form.phone} onChange={handleChange} required />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">{t('pharmacyAdmin.profile.logo')}</label>
                  <input className="form-control" type="file" accept="image/*" onChange={handleLogoFile} />
                  {(logoPreview || form.logo) && (
                    <div className="mt-3 d-flex align-items-center gap-3 rounded border bg-light p-2">
                      <img
                        src={logoPreview || getImageUrl(form.logo)}
                        alt={t('pharmacyAdmin.profile.logoPreview')}
                        style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover', background: '#fff' }}
                      />
                      <div className="small text-muted"><strong className="d-block text-dark">{t('pharmacyAdmin.profile.logoPreview')}</strong>{t('pharmacyAdmin.profile.logoHint')}</div>
                    </div>
                  )}
                </div>

                <div className="col-md-6 mb-3 d-flex align-items-end">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="isActive"
                      checked={!!form.isActive}
                      onChange={handleChange}
                      id="isActive"
                    />
                    <label className="form-check-label" htmlFor="isActive">
                      {t('pharmacyAdmin.profile.active')}
                    </label>
                  </div>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">{t('pharmacyAdmin.profile.address1')} <span className="text-danger">*</span></label>
                  <input className="form-control" name="address.line1" value={form.address.line1} onChange={handleChange} required />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">{t('pharmacyAdmin.profile.address2')}</label>
                  <input className="form-control" name="address.line2" value={form.address.line2} onChange={handleChange} />
                </div>

                <div className="col-md-4 mb-3">
                  <label className="form-label">{t('pharmacyAdmin.profile.city')} <span className="text-danger">*</span></label>
                  <input className="form-control" name="address.city" value={form.address.city} onChange={handleChange} required />
                </div>

                <div className="col-md-4 mb-3">
                  <label className="form-label">{t('pharmacyAdmin.profile.state')}</label>
                  <input className="form-control" name="address.state" value={form.address.state} onChange={handleChange} />
                </div>

                <div className="col-md-4 mb-3">
                  <label className="form-label">{t('pharmacyAdmin.profile.zip')} <span className="text-danger">*</span></label>
                  <input className="form-control" name="address.zip" value={form.address.zip} onChange={handleChange} required />
                </div>

                <div className="col-md-4 mb-3">
                  <label className="form-label">{t('pharmacyAdmin.profile.country')} <span className="text-danger">*</span></label>
                  <input className="form-control" name="address.country" value={form.address.country} onChange={handleChange} required />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">{t('pharmacyAdmin.profile.latitude')}</label>
                  <input className="form-control" name="location.lat" value={form.location.lat} onChange={handleChange} />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">{t('pharmacyAdmin.profile.longitude')}</label>
                  <input className="form-control" name="location.lng" value={form.location.lng} onChange={handleChange} />
                </div>

                <div className="col-12">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={createPetStore.isPending || updatePetStore.isPending}
                  >
                    {createPetStore.isPending || updatePetStore.isPending ? t('pharmacyAdmin.profile.saving') : t('pharmacyAdmin.profile.save')}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default PharmacyAdminProfile
