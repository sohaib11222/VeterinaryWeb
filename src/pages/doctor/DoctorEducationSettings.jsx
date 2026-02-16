import { useEffect, useState } from 'react'
import DoctorProfileTabs from '../../components/doctor/DoctorProfileTabs'
import { useVeterinarianProfile } from '../../queries/veterinarianQueries'
import { useUpdateVeterinarianProfile } from '../../mutations/veterinarianMutations'
import { toast } from 'react-toastify'

const DoctorEducationSettings = () => {
  const { data, isLoading } = useVeterinarianProfile()
  const updateProfile = useUpdateVeterinarianProfile()

  const profile = data?.data || {}
  const initialEducation = Array.isArray(profile.education) ? profile.education : []

  const [educations, setEducations] = useState([
    { degree: '', college: '', year: '' },
  ])

  useEffect(() => {
    if (initialEducation.length > 0) {
      setEducations(
        initialEducation.map((edu) => ({
          degree: edu.degree || '',
          college: edu.college || '',
          year: edu.year || '',
        }))
      )
    }
  }, [JSON.stringify(initialEducation)])

  const handleChange = (index, field, value) => {
    setEducations((prev) =>
      prev.map((edu, i) => (i === index ? { ...edu, [field]: value } : edu))
    )
  }

  const addEducation = () => {
    setEducations((prev) => [...prev, { degree: '', college: '', year: '' }])
  }

  const removeEducation = (index) => {
    setEducations((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const cleaned = educations
        .map((edu) => ({
          degree: (edu.degree || '').trim(),
          college: (edu.college || '').trim(),
          year: (edu.year || '').trim(),
        }))
        .filter((edu) => edu.degree || edu.college || edu.year)

      await updateProfile.mutateAsync({
        education: cleaned,
      })

      toast.success('Education updated successfully')
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Failed to update education'
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
            {/* Veterinary Education Header */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="veterinary-dashboard-header">
                  <h2 className="dashboard-title">
                    <i className="fa-solid fa-graduation-cap me-3"></i>
                    Veterinary Education
                  </h2>
                  <p className="dashboard-subtitle">
                    Manage your veterinary education background and academic credentials
                  </p>
                </div>
              </div>
            </div>

            {/* Settings Tabs */}
            <DoctorProfileTabs />

            {/* Education Form */}
            <div className="row">
              <div className="col-12">
                <div className="dashboard-card veterinary-card">
                  <div className="dashboard-card-body">
                    <form onSubmit={handleSubmit}>
                      <div className="row mb-3">
                        <div className="col-12 d-flex justify-content-between align-items-center">
                          <h5 className="card-title mb-0">
                            <i className="fa-solid fa-university me-2"></i>
                            Academic Background
                          </h5>
                          <button
                            type="button"
                            className="btn veterinary-start-btn"
                            onClick={addEducation}
                          >
                            <i className="fa-solid fa-plus me-2"></i>
                            Add New Education
                          </button>
                        </div>
                      </div>

                      <div className="accordions education-infos veterinary-education-accordions">
                        {educations.map((edu, index) => (
                          <div key={index} className="user-accordion-item mb-3">
                            <div className="content-collapse p-3 border rounded">
                              <div className="row align-items-center">
                                <div className="col-md-6">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      <i className="fa-solid fa-university me-2"></i>
                                      Institution / College
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control veterinary-input"
                                      value={edu.college}
                                      onChange={(e) => handleChange(index, 'college', e.target.value)}
                                      placeholder="e.g., University of Veterinary Medicine"
                                    />
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      <i className="fa-solid fa-book-medical me-2"></i>
                                      Course / Degree
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control veterinary-input"
                                      value={edu.degree}
                                      onChange={(e) => handleChange(index, 'degree', e.target.value)}
                                      placeholder="e.g., Doctor of Veterinary Medicine"
                                    />
                                  </div>
                                </div>
                                <div className="col-md-4">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      <i className="fa-solid fa-calendar-check me-2"></i>
                                      Year
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control veterinary-input"
                                      value={edu.year}
                                      onChange={(e) => handleChange(index, 'year', e.target.value)}
                                      placeholder="e.g., 2015"
                                    />
                                  </div>
                                </div>
                                <div className="col-md-12 text-end mt-2">
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => removeEducation(index)}
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

export default DoctorEducationSettings
