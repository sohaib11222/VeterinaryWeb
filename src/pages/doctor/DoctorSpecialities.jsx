import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import DoctorProfileTabs from '../../components/doctor/DoctorProfileTabs'
import { useVeterinarianProfile } from '../../queries/veterinarianQueries'
import { useSpecializations } from '../../queries/specializationQueries'
import { useUpdateVeterinarianProfile } from '../../mutations/veterinarianMutations'
import { toast } from 'react-toastify'
import { api } from '../../utils/api'
import { API_ROUTES } from '../../utils/apiConfig'
import { getNextTabPath } from '../../utils/profileSettingsTabs'

const DoctorSpecialities = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: profileResponse, isLoading: profileLoading } = useVeterinarianProfile()
  const { data: specializationsResponse, isLoading: specsLoading } = useSpecializations()
  const updateProfile = useUpdateVeterinarianProfile()

  const profile = profileResponse?.data || {}
  const specializationsList = Array.isArray(specializationsResponse?.data)
    ? specializationsResponse.data
    : Array.isArray(specializationsResponse) ? specializationsResponse : []

  const profileSpecializations = profile.specializations || []
  const profileServices = Array.isArray(profile.services) ? profile.services : []

  // This holds the enum code used in VeterinarianProfile.specializations (e.g. 'CARDIOLOGY')
  const [selectedSpecializationCode, setSelectedSpecializationCode] = useState('')
  const [services, setServices] = useState([{ name: '', price: '', description: '' }])

  // Initialize selected specialization from profile (enum string or populated object)
  useEffect(() => {
    if (profileSpecializations.length === 0) {
      setSelectedSpecializationCode('')
      return
    }

    const first = profileSpecializations[0]

    // If backend already returns populated specialization objects
    if (first && typeof first === 'object') {
      const code = first.type || ''
      setSelectedSpecializationCode(code)
      return
    }

    // Otherwise it's an enum string (e.g. 'CARDIOLOGY') stored on the profile
    if (typeof first === 'string') {
      setSelectedSpecializationCode(first)
    } else {
      setSelectedSpecializationCode('')
    }
  }, [JSON.stringify(profileSpecializations)])

  useEffect(() => {
    if (profileServices.length > 0) {
      setServices(
        profileServices.map((s) => ({
          name: s.name || '',
          price: s.price != null ? s.price : '',
          description: s.description || '',
        }))
      )
    } else {
      setServices([{ name: '', price: '', description: '' }])
    }
  }, [JSON.stringify(profileServices)])

  const handleSpecializationChange = (e) => {
    setSelectedSpecializationCode(e.target.value)
  }

  const handleServiceChange = (index, field, value) => {
    setServices((prev) =>
      prev.map((s, i) =>
        i === index ? { ...s, [field]: field === 'price' ? (value === '' ? '' : Number(value)) : value } : s
      )
    )
  }

  const addService = () => {
    setServices((prev) => [...prev, { name: '', price: '', description: '' }])
  }

  const removeService = (index) => {
    setServices((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedSpecializationCode) {
      toast.error('Please select a specialization')
      return
    }

    const validServices = services
      .map((s) => ({
        name: (s.name || '').trim(),
        price: s.price === '' ? null : Number(s.price),
        description: (s.description || '').trim() || null,
      }))
      .filter((s) => s.name)
    if (validServices.length === 0) {
      toast.error('Please add at least one service with a name')
      return
    }
    try {
      await updateProfile.mutateAsync({
        // Backend schema uses enum strings for specializations
        specializations: [selectedSpecializationCode],
        services: validServices,
      })
      toast.success('Specialties & services updated successfully')

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
      const message = err?.response?.data?.message || err?.message || 'Failed to update'
      toast.error(message)
    }
  }

  if (profileLoading || specsLoading) {
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
            <div className="row mb-4">
              <div className="col-12">
                <div className="veterinary-dashboard-header">
                  <h2 className="dashboard-title">
                    <i className="fa-solid fa-stethoscope me-3"></i>
                    Veterinary Services
                  </h2>
                  <p className="dashboard-subtitle">
                    Manage your veterinary specialties and service offerings
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
                            <i className="fa-solid fa-list me-2"></i>
                            Specialties & Services
                          </h5>
                        </div>
                      </div>

                      <div className="accordions veterinary-accordions">
                        <div className="user-accordion-item mb-3">
                          <div className="content-collapse p-3 border rounded">
                            <div className="row mb-3">
                              <div className="col-md-6">
                                <div className="form-wrap">
                                  <label className="col-form-label">
                                    <i className="fa-solid fa-stethoscope me-2"></i>
                                    Specialty <span className="text-danger">*</span>
                                  </label>
                                  <select
                                    className="form-select veterinary-input"
                                    value={selectedSpecializationCode}
                                    onChange={handleSpecializationChange}
                                    required
                                  >
                                    <option value="">Select specialization</option>
                                    {specializationsList.map((spec) => {
                                      // Prefer explicit enum code from backend; otherwise derive from name/slug
                                      const derivedCodeFromName =
                                        spec.name?.toUpperCase().replace(/\s+/g, '_')
                                      const derivedCodeFromSlug =
                                        spec.slug?.toUpperCase().replace(/-/g, '_')
                                      const code = spec.type || derivedCodeFromName || derivedCodeFromSlug
                                      if (!code) return null
                                      return (
                                        <option key={spec._id} value={code}>
                                          {spec.name}
                                        </option>
                                      )
                                    })}
                                  </select>
                                  {specializationsList.length === 0 && (
                                    <p className="text-muted small mt-1 mb-0">
                                      No specializations available. Contact admin to add specializations.
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {selectedSpecializationCode && (
                              <>
                                <div className="row align-items-center mb-2">
                                  <div className="col-12">
                                    <h6 className="mb-0">
                                      <i className="fa-solid fa-paw me-2"></i>
                                      Services
                                    </h6>
                                  </div>
                                </div>
                                {services.map((service, index) => (
                                  <div key={index} className="row align-items-end mb-3">
                                    <div className="col-md-4">
                                      <div className="form-wrap">
                                        <label className="col-form-label">Service name</label>
                                        <input
                                          type="text"
                                          className="form-control veterinary-input"
                                          value={service.name}
                                          onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                                          placeholder="e.g. General Checkup"
                                        />
                                      </div>
                                    </div>
                                    <div className="col-md-2">
                                      <div className="form-wrap">
                                        <label className="col-form-label">Price (€)</label>
                                        <input
                                          type="number"
                                          className="form-control veterinary-input"
                                          value={service.price}
                                          onChange={(e) => handleServiceChange(index, 'price', e.target.value)}
                                          placeholder="0"
                                          min="0"
                                          step="0.01"
                                        />
                                      </div>
                                    </div>
                                    <div className="col-md-5">
                                      <div className="form-wrap">
                                        <label className="col-form-label">Description</label>
                                        <input
                                          type="text"
                                          className="form-control veterinary-input"
                                          value={service.description}
                                          onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                                          placeholder="Optional description"
                                        />
                                      </div>
                                    </div>
                                    <div className="col-md-1 text-end">
                                      <button
                                        type="button"
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={() => removeService(index)}
                                        aria-label="Remove service"
                                      >
                                        <i className="fa-solid fa-trash"></i>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                <div className="mb-3">
                                  <button
                                    type="button"
                                    className="btn veterinary-btn-secondary btn-sm"
                                    onClick={addService}
                                  >
                                    <i className="fa-solid fa-plus me-1"></i>
                                    Add service
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="modal-btn text-end mt-3">
                        <button
                          type="submit"
                          className="btn veterinary-start-btn prime-btn"
                          disabled={updateProfile.isPending || !selectedSpecializationCode}
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

export default DoctorSpecialities
