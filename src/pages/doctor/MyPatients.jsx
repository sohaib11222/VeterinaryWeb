import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'

import { useAppointments } from '../../queries'
import { getImageUrl } from '../../utils/apiConfig'

const MyPatients = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('active')

  const params = useMemo(() => ({ page: 1, limit: 1000 }), [])
  const { data: appointmentsResponse, isLoading } = useAppointments(params)

  const appointments = useMemo(() => {
    const payload = appointmentsResponse?.data ?? appointmentsResponse
    const list = payload?.appointments ?? payload?.data?.appointments ?? payload
    return Array.isArray(list) ? list : []
  }, [appointmentsResponse])

  const pets = useMemo(() => {
    if (!appointments.length) return []

    const petMap = new Map()

    appointments.forEach((apt) => {
      const pet = apt?.petId
      if (!pet) return

      const petId = typeof pet === 'object' ? pet._id : pet
      if (!petId) return

      const owner = apt?.petOwnerId || null

      if (!petMap.has(String(petId))) {
        petMap.set(String(petId), {
          _id: petId,
          pet,
          owner,
          appointments: [],
          lastBookingDate: null,
          lastAppointment: null,
          hasActiveAppointment: false,
        })
      }

      const entry = petMap.get(String(petId))
      entry.appointments.push(apt)

      const aptDate = apt?.appointmentDate ? new Date(apt.appointmentDate) : null
      if (aptDate && (!entry.lastBookingDate || aptDate > entry.lastBookingDate)) {
        entry.lastBookingDate = aptDate
        entry.lastAppointment = apt
        entry.owner = owner || entry.owner
        entry.pet = pet || entry.pet
      }

      const status = String(apt?.status || '').toUpperCase()
      if (status === 'CONFIRMED' || status === 'PENDING') {
        entry.hasActiveAppointment = true
      }
    })

    return Array.from(petMap.values())
  }, [appointments])

  const activeCount = useMemo(() => pets.filter((p) => p.hasActiveAppointment).length, [pets])
  const inactiveCount = useMemo(() => pets.filter((p) => !p.hasActiveAppointment).length, [pets])

  const filteredByTab = useMemo(() => {
    return activeTab === 'active'
      ? pets.filter((p) => p.hasActiveAppointment)
      : pets.filter((p) => !p.hasActiveAppointment)
  }, [pets, activeTab])

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return filteredByTab

    return filteredByTab.filter((p) => {
      const petName = String(p?.pet?.name || '').toLowerCase()
      const breed = String(p?.pet?.breed || '').toLowerCase()
      const species = String(p?.pet?.species || '').toLowerCase()
      const ownerName = String(p?.owner?.fullName || p?.owner?.name || '').toLowerCase()
      return petName.includes(q) || breed.includes(q) || species.includes(q) || ownerName.includes(q)
    })
  }, [filteredByTab, searchQuery])

  const formatDate = (date) => {
    if (!date) return '—'
    const d = new Date(date)
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatDateTime = (date, time) => {
    if (!date) return '—'
    const d = new Date(date)
    const dateStr = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    return time ? `${dateStr} ${time}` : dateStr
  }

  const getAgeText = (pet) => {
    if (!pet) return ''
    if (pet.dateOfBirth) {
      const birth = new Date(pet.dateOfBirth)
      const now = new Date()
      let years = now.getFullYear() - birth.getFullYear()
      const m = now.getMonth() - birth.getMonth()
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) years--
      if (years >= 0) return `${years} years`
    }
    if (typeof pet.age === 'number') {
      const years = Math.floor(pet.age / 12)
      return years > 0 ? `${years} years` : `${pet.age} months`
    }
    return ''
  }

  const getWeightText = (pet) => {
    const w = pet?.weight
    if (!w) return ''
    if (typeof w === 'object' && w.value != null) {
      return `${w.value} ${w.unit || 'kg'}`
    }
    return ''
  }

  return (
    <div className="content veterinary-dashboard">
      <div className="container-fluid">
        <div className="row">
          <div className="col-lg-3 col-xl-2 theiaStickySidebar">{/* Sidebar is handled by DashboardLayout */}</div>
          <div className="col-lg-12 col-xl-12">
            <div className="row mb-4">
              <div className="col-12">
                <div className="veterinary-dashboard-header">
                  <h2 className="dashboard-title">
                    <i className="fa-solid fa-dog me-3"></i>
                    My Pets
                  </h2>
                  <p className="dashboard-subtitle">Pets that have booked appointments with you</p>
                </div>
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-12">
                <div className="dashboard-card veterinary-card">
                  <div className="dashboard-card-body">
                    <div className="row align-items-center">
                      <div className="col-lg-4 mb-3 mb-lg-0">
                        <div className="input-block dash-search-input">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search pets or owners..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                          <span className="search-icon"><i className="fa-solid fa-magnifying-glass"></i></span>
                        </div>
                      </div>
                      <div className="col-lg-8">
                        <div className="d-flex justify-content-lg-end align-items-center gap-2 flex-wrap">
                          <div className="view-icons">
                            <Link to="/my-patients" className="active veterinary-btn-icon">
                              <i className="fa-solid fa-th"></i>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-12">
                <div className="dashboard-card veterinary-card">
                  <div className="appointment-tab-head">
                    <div className="appointment-tabs">
                      <ul className="nav nav-pills veterinary-nav-tabs" role="tablist">
                        <li className="nav-item" role="presentation">
                          <button
                            type="button"
                            className={`nav-link veterinary-tab ${activeTab === 'active' ? 'active' : ''}`}
                            onClick={() => setActiveTab('active')}
                          >
                            <i className="fa-solid fa-paw me-2"></i>
                            <span className="tab-text">Active</span>
                            <span className="veterinary-tab-badge">{activeCount}</span>
                          </button>
                        </li>
                        <li className="nav-item" role="presentation">
                          <button
                            type="button"
                            className={`nav-link veterinary-tab ${activeTab === 'inactive' ? 'active' : ''}`}
                            onClick={() => setActiveTab('inactive')}
                          >
                            <i className="fa-solid fa-times-circle me-2"></i>
                            <span className="tab-text">Inactive</span>
                            <span className="veterinary-tab-badge">{inactiveCount}</span>
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {isLoading && (
              <div className="text-center py-5">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}

            {!isLoading && filtered.length === 0 && (
              <div className="text-center py-5">
                <p className="text-muted">No pets found</p>
              </div>
            )}

            {!isLoading && filtered.length > 0 && (
              <div className="row">
                {filtered.map((entry) => {
                  const pet = entry?.pet || {}
                  const owner = entry?.owner || {}
                  const lastApt = entry?.lastAppointment || {}

                  const detailsUrl = lastApt?._id ? `/doctor-appointment-details?id=${lastApt._id}` : '/doctor-appointment-details'

                  const petName = pet?.name || 'Pet'
                  const petBreed = pet?.breed || pet?.species || ''
                  const ownerName = owner?.fullName || owner?.name || 'Pet Owner'

                  const petImage = getImageUrl(pet?.photo) || '/assets/img/doctors-dashboard/profile-01.jpg'
                  const typeText = pet?.species ? String(pet.species) : 'Pet'

                  const ageText = getAgeText(pet)
                  const genderText = pet?.gender ? String(pet.gender) : ''
                  const weightText = getWeightText(pet)

                  return (
                    <div key={String(entry._id)} className="col-xl-4 col-lg-6 col-md-6 d-flex mb-4">
                      <div className={`appointment-wrap appointment-grid-wrap veterinary-pet-card ${entry.hasActiveAppointment ? '' : 'inactive'}`}>
                        <ul>
                          <li>
                            <div className="appointment-grid-head">
                              <div className="patinet-information">
                                <Link to={detailsUrl}>
                                  <img
                                    src={petImage}
                                    alt="Pet Image"
                                    onError={(e) => {
                                      e.currentTarget.onerror = null
                                      e.currentTarget.src = '/assets/img/doctors-dashboard/profile-01.jpg'
                                    }}
                                  />
                                  <div className="pet-type-badge">
                                    <span className="badge veterinary-badge">{typeText}</span>
                                  </div>
                                </Link>
                                <div className="patient-info">
                                  <p>#{String(entry._id).slice(-6).toUpperCase()}</p>
                                  <h6><Link to={detailsUrl}>{petName}</Link></h6>
                                  <ul className="pet-details">
                                    {petBreed && (
                                      <li>
                                        <i className="fa-solid fa-paw me-1"></i>
                                        {petBreed}
                                      </li>
                                    )}
                                    {ageText && (
                                      <li>
                                        <i className="fa-solid fa-birthday-cake me-1"></i>
                                        {ageText}
                                      </li>
                                    )}
                                    {genderText && (
                                      <li>
                                        <i className="fa-solid fa-venus-mars me-1"></i>
                                        {genderText}
                                      </li>
                                    )}
                                    {weightText && (
                                      <li>
                                        <i className="fa-solid fa-weight me-1"></i>
                                        {weightText}
                                      </li>
                                    )}
                                  </ul>
                                  <div className="owner-info">
                                    <small className="text-muted">Owner: {ownerName}</small>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                          <li className="appointment-info">
                            <p>
                              <i className="fa-solid fa-clock"></i>
                              {formatDateTime(lastApt?.appointmentDate, lastApt?.appointmentTime)}
                            </p>
                            <p className="mb-0">
                              <i className="fa-solid fa-notes-medical"></i>
                              {lastApt?.reason || '—'}
                            </p>
                          </li>
                          <li className="appointment-action">
                            <div className="patient-book">
                              <p>
                                <i className="fa-solid fa-calendar-check"></i>
                                Last Booking <span>{entry.lastBookingDate ? formatDate(entry.lastBookingDate) : '—'}</span>
                              </p>
                              <div className="pet-status">
                                <span className="badge veterinary-badge">{entry.hasActiveAppointment ? 'Active' : 'Inactive'}</span>
                              </div>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyPatients
