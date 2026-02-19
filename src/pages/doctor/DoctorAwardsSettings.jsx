import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import DoctorProfileTabs from '../../components/doctor/DoctorProfileTabs'
import { useVeterinarianProfile } from '../../queries/veterinarianQueries'
import { useUpdateVeterinarianProfile } from '../../mutations/veterinarianMutations'
import { toast } from 'react-toastify'
import { api } from '../../utils/api'
import { API_ROUTES } from '../../utils/apiConfig'
import { getNextTabPath } from '../../utils/profileSettingsTabs'

const DoctorAwardsSettings = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { data, isLoading } = useVeterinarianProfile()
  const updateProfile = useUpdateVeterinarianProfile()

  const profile = data?.data || {}
  const initialAwards = Array.isArray(profile.awards) ? profile.awards : []

  const [awards, setAwards] = useState([{ title: '', year: '' }])

  useEffect(() => {
    if (initialAwards.length > 0) {
      setAwards(
        initialAwards.map((award) => ({
          title: award.title || '',
          year: award.year || '',
        }))
      )
    }
  }, [JSON.stringify(initialAwards)])

  const handleChange = (index, field, value) => {
    setAwards((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    )
  }

  const addAward = () => {
    setAwards((prev) => [...prev, { title: '', year: '' }])
  }

  const removeAward = (index) => {
    setAwards((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const cleaned = awards
        .map((a) => ({
          title: (a.title || '').trim(),
          year: (a.year || '').trim(),
        }))
        .filter((a) => a.title)

      await updateProfile.mutateAsync({ awards: cleaned })
      toast.success('Awards updated successfully')

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
      const message = err?.response?.data?.message || err?.message || 'Failed to update awards'
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
            {/* Veterinary Awards Header */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="veterinary-dashboard-header">
                  <h2 className="dashboard-title">
                    <i className="fa-solid fa-trophy me-3"></i>
                    Veterinary Awards & Recognition
                  </h2>
                  <p className="dashboard-subtitle">
                    Manage your veterinary awards, certifications, and professional recognition
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
                            <i className="fa-solid fa-award me-2"></i>
                            Professional Recognition
                          </h5>
                          <button
                            type="button"
                            className="btn veterinary-start-btn"
                            onClick={addAward}
                          >
                            <i className="fa-solid fa-plus me-2"></i>
                            Add New Award
                          </button>
                        </div>
                      </div>

                      <div className="accordions awrad-infos veterinary-awards-accordions">
                        {awards.map((award, index) => (
                          <div key={index} className="user-accordion-item mb-3">
                            <div className="content-collapse p-3 border rounded">
                              <div className="row align-items-center">
                                <div className="col-md-6">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      <i className="fa-solid fa-trophy me-2"></i>
                                      Award Name <span className="text-danger">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control veterinary-input"
                                      value={award.title}
                                      onChange={(e) => handleChange(index, 'title', e.target.value)}
                                      placeholder="e.g., Excellence in Veterinary Medicine"
                                    />
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      <i className="fa-solid fa-calendar-alt me-2"></i>
                                      Award Year
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control veterinary-input"
                                      value={award.year}
                                      onChange={(e) => handleChange(index, 'year', e.target.value)}
                                      placeholder="e.g., 2023"
                                    />
                                  </div>
                                </div>
                                <div className="col-md-12 text-end mt-2">
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => removeAward(index)}
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

export default DoctorAwardsSettings
