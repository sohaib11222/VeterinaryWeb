import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import DoctorProfileTabs from '../../components/doctor/DoctorProfileTabs'
import { useVeterinarianProfile } from '../../queries/veterinarianQueries'
import { useUpdateVeterinarianProfile } from '../../mutations/veterinarianMutations'
import { toast } from 'react-toastify'
import { api } from '../../utils/api'
import { API_ROUTES } from '../../utils/apiConfig'
import { getNextTabPath } from '../../utils/profileSettingsTabs'

const emptyClinic = () => ({
  name: '',
  address: '',
  city: '',
  state: '',
  country: '',
  phone: '',
  lat: null,
  lng: null,
  images: [],
  timings: [],
})

const DoctorClinicsSettings = () => {
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
          country: c.country || '',
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
          country: (c.country || '').trim(),
          phone: (c.phone || '').trim(),
          lat: c.lat != null && c.lat !== '' ? Number(c.lat) : null,
          lng: c.lng != null && c.lng !== '' ? Number(c.lng) : null,
          images: Array.isArray(c.images) ? c.images : [],
          timings: Array.isArray(c.timings) ? c.timings : [],
        }))
        .filter((c) => c.name)

      if (cleaned.length === 0) {
        toast.error('Add at least one clinic with a name')
        return
      }

      await updateProfile.mutateAsync({ clinics: cleaned })
      toast.success('Clinics updated successfully')

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
      const message = err?.response?.data?.message || err?.message || 'Failed to update clinics'
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
          <span className="visually-hidden">Loading...</span>
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
                    Veterinary Clinics
                  </h2>
                  <p className="dashboard-subtitle">
                    Manage your veterinary clinic locations and facilities
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
                            Clinic Locations
                          </h5>
                          <button
                            type="button"
                            className="btn veterinary-start-btn"
                            onClick={addClinic}
                          >
                            <i className="fa-solid fa-plus me-2"></i>
                            Add New Clinic
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
                                      Veterinary Clinic Name <span className="text-danger">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control veterinary-input"
                                      value={clinic.name}
                                      onChange={(e) => handleChange(index, 'name', e.target.value)}
                                      placeholder="e.g., MyPetPlus Veterinary Clinic"
                                    />
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      <i className="fa-solid fa-map-marker-alt me-2"></i>
                                      City
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control veterinary-input"
                                      value={clinic.city}
                                      onChange={(e) => handleChange(index, 'city', e.target.value)}
                                      placeholder="City"
                                    />
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      <i className="fa-solid fa-map me-2"></i>
                                      State
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control veterinary-input"
                                      value={clinic.state}
                                      onChange={(e) => handleChange(index, 'state', e.target.value)}
                                      placeholder="State"
                                    />
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      <i className="fa-solid fa-globe me-2"></i>
                                      Country
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control veterinary-input"
                                      value={clinic.country}
                                      onChange={(e) => handleChange(index, 'country', e.target.value)}
                                      placeholder="Country"
                                    />
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      <i className="fa-solid fa-phone me-2"></i>
                                      Phone
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control veterinary-input"
                                      value={clinic.phone}
                                      onChange={(e) => handleChange(index, 'phone', e.target.value)}
                                      placeholder="Phone number"
                                    />
                                  </div>
                                </div>
                                <div className="col-md-12">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      <i className="fa-solid fa-home me-2"></i>
                                      Address
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control veterinary-input"
                                      value={clinic.address}
                                      onChange={(e) => handleChange(index, 'address', e.target.value)}
                                      placeholder="Full address"
                                    />
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      <i className="fa-solid fa-location-dot me-2"></i>
                                      Latitude
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
                                      placeholder="e.g., 40.7128"
                                    />
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      <i className="fa-solid fa-location-dot me-2"></i>
                                      Longitude
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
                                      placeholder="e.g., -74.0060"
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
                                    Remove
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
                          {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
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
