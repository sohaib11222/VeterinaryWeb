import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import DoctorProfileTabs from '../../components/doctor/DoctorProfileTabs'
import { useVeterinarianProfile } from '../../queries/veterinarianQueries'
import { useUpdateVeterinarianProfile } from '../../mutations/veterinarianMutations'
import { toast } from 'react-toastify'
import { api } from '../../utils/api'
import { API_ROUTES } from '../../utils/apiConfig'
import { getNextTabPath } from '../../utils/profileSettingsTabs'

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const DoctorBusinessSettings = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { data, isLoading } = useVeterinarianProfile()
  const updateProfile = useUpdateVeterinarianProfile()

  const profile = data?.data || {}
  const initialClinics = Array.isArray(profile.clinics) ? profile.clinics : []

  const [businessHours, setBusinessHours] = useState({})

  useEffect(() => {
    if (initialClinics.length > 0) {
      const firstClinic = initialClinics[0]
      const timings = Array.isArray(firstClinic?.timings) ? firstClinic.timings : []
      const hours = {}
      timings.forEach((t) => {
        if (t.dayOfWeek) {
          hours[t.dayOfWeek] = {
            startTime: t.startTime || '',
            endTime: t.endTime || '',
          }
        }
      })
      setBusinessHours(hours)
    } else {
      setBusinessHours({})
    }
  }, [JSON.stringify(initialClinics)])

  const handleTimeChange = (day, field, value) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: {
        ...(prev[day] || { startTime: '', endTime: '' }),
        [field]: value,
      },
    }))
  }

  const toggleDay = (day) => {
    setBusinessHours((prev) => {
      if (prev[day]) {
        const copy = { ...prev }
        delete copy[day]
        return copy
      }
      return { ...prev, [day]: { startTime: '', endTime: '' } }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const timings = Object.keys(businessHours)
        .filter((day) => businessHours[day].startTime && businessHours[day].endTime)
        .map((day) => ({
          dayOfWeek: day,
          startTime: businessHours[day].startTime,
          endTime: businessHours[day].endTime,
        }))

      let clinics = initialClinics.length > 0 ? [...initialClinics] : [{ name: 'Main Clinic', timings: [] }]
      clinics = clinics.map((clinic, idx) =>
        idx === 0 ? { ...clinic, timings } : clinic
      )

      await updateProfile.mutateAsync({ clinics })
      toast.success('Business hours updated successfully')

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
      const message =
        err?.response?.data?.message || err?.message || 'Failed to update business hours'
      toast.error(message)
    }
  }

  const activeDays = days.filter(
    (day) => businessHours[day]?.startTime && businessHours[day]?.endTime
  )

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
            {/* Veterinary Business Hours Header */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="veterinary-dashboard-header">
                  <h2 className="dashboard-title">
                    <i className="fa-solid fa-clock me-3"></i>
                    Veterinary Clinic Hours
                  </h2>
                  <p className="dashboard-subtitle">
                    Manage your veterinary clinic operating hours and availability
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
                      <div className="business-wrap veterinary-business-wrap">
                        <h4>
                          <i className="fa-solid fa-calendar-week me-2"></i>
                          Select Clinic Days
                        </h4>
                        <ul className="business-nav veterinary-day-nav">
                          {days.map((day) => {
                            const dayId = day.toLowerCase()
                            const isActive = !!businessHours[day]
                            return (
                              <li key={day}>
                                <a
                                  href="#"
                                  className={`tab-link veterinary-day-tab ${
                                    isActive ? 'active' : ''
                                  }`}
                                  data-tab={`day-${dayId}`}
                                  onClick={(e) => {
                                    e.preventDefault()
                                    toggleDay(day)
                                  }}
                                >
                                  <i className="fa-solid fa-calendar-day me-1"></i>
                                  {day}
                                </a>
                              </li>
                            )
                          })}
                        </ul>
                      </div>

                      <div
                        className="accordions business-info veterinary-business-accordions"
                        id="list-accord"
                      >
                        {days.map((day, index) => {
                          const dayId = day.toLowerCase()
                          const isActive = !!businessHours[day]
                          const isFirst = index === 0 && isActive
                          const dayHours = businessHours[day] || { startTime: '', endTime: '' }

                          if (!isActive) return null

                          return (
                            <div
                              key={day}
                              className="user-accordion-item tab-items veterinary-business-item active"
                              id={`day-${dayId}`}
                            >
                              <div className="content-collapse pb-0 p-3 border rounded">
                                <div className="row align-items-center">
                                  <div className="col-md-6">
                                    <div className="form-wrap">
                                      <label className="col-form-label">
                                        <i className="fa-solid fa-clock me-2"></i>
                                        Opening Time <span className="text-danger">*</span>
                                      </label>
                                      <div className="form-icon">
                                        <input
                                          type="time"
                                          className="form-control veterinary-input"
                                          value={dayHours.startTime}
                                          onChange={(e) =>
                                            handleTimeChange(day, 'startTime', e.target.value)
                                          }
                                        />
                                        <span className="icon">
                                          <i className="fa-solid fa-clock"></i>
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="col-md-6">
                                    <div className="form-wrap">
                                      <label className="col-form-label">
                                        <i className="fa-solid fa-clock me-2"></i>
                                        Closing Time <span className="text-danger">*</span>
                                      </label>
                                      <div className="form-icon">
                                        <input
                                          type="time"
                                          className="form-control veterinary-input"
                                          value={dayHours.endTime}
                                          onChange={(e) =>
                                            handleTimeChange(day, 'endTime', e.target.value)
                                          }
                                        />
                                        <span className="icon">
                                          <i className="fa-solid fa-clock"></i>
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
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

export default DoctorBusinessSettings
