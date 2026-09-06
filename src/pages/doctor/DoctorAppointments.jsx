import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'

import { useAppointments } from '../../queries'
import { getImageUrl } from '../../utils/apiConfig'
import { useAppointmentChat } from '../../hooks/useAppointmentChat'

const unwrapAppointments = (response) => {
  const outer = response?.data ?? response
  const payload = outer?.data ?? outer
  return Array.isArray(payload) ? payload : Array.isArray(payload?.appointments) ? payload.appointments : []
}

const statusBadgeClass = (status) => {
  if (status === 'CONFIRMED') return 'bg-success'
  if (status === 'PENDING' || status === 'PENDING_PAYMENT') return 'bg-warning text-dark'
  if (status === 'COMPLETED') return 'bg-primary'
  return 'bg-secondary'
}

const DoctorAppointments = () => {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [chatAlert, setChatAlert] = useState('')
  const { openChat: openAppointmentChat, openingAppointmentId, isOpening } = useAppointmentChat('/chat-doctor')
  const appointmentsQuery = useAppointments({ limit: 50, search: search.trim() || undefined })
  const appointments = useMemo(() => unwrapAppointments(appointmentsQuery.data), [appointmentsQuery.data])

  const mappedAppointments = useMemo(() => appointments.map((appointment) => {
    const pet = appointment?.petId || {}
    const owner = appointment?.petOwnerId || {}
    const status = String(appointment?.status || '').toUpperCase()
    return {
      id: appointment?._id,
      number: appointment?.appointmentNumber || appointment?._id,
      detailsUrl: `/doctor-appointment-details?id=${encodeURIComponent(String(appointment?._id || ''))}`,
      petName: pet?.name || 'Pet', petBreed: pet?.breed || '', petImage: getImageUrl(pet?.photo) || '/assets/img/doctors-dashboard/profile-01.jpg',
      ownerName: owner?.name || owner?.fullName || owner?.email || 'Pet Owner', ownerEmail: owner?.email || '', ownerPhone: owner?.phone || '',
      date: appointment?.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString() : 'Date unavailable', time: appointment?.appointmentTime || 'Time unavailable', status,
      type: appointment?.bookingType === 'ONLINE' ? 'Video consultation' : 'Clinic visit', reason: appointment?.reason || 'Consultation', raw: appointment,
    }
  }), [appointments])

  const visibleAppointments = useMemo(() => {
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0)
    if (activeTab === 'upcoming') return mappedAppointments.filter((item) => ['PENDING', 'CONFIRMED', 'PENDING_PAYMENT'].includes(item.status) && (!item.raw?.appointmentDate || new Date(item.raw.appointmentDate) >= startOfToday))
    if (activeTab === 'completed') return mappedAppointments.filter((item) => item.status === 'COMPLETED')
    if (activeTab === 'cancelled') return mappedAppointments.filter((item) => ['CANCELLED', 'REJECTED', 'NO_SHOW', 'RESCHEDULED'].includes(item.status))
    return mappedAppointments
  }, [activeTab, mappedAppointments])
  const counts = useMemo(() => ({ all: mappedAppointments.length, upcoming: mappedAppointments.filter((item) => ['PENDING', 'CONFIRMED', 'PENDING_PAYMENT'].includes(item.status)).length, completed: mappedAppointments.filter((item) => item.status === 'COMPLETED').length, cancelled: mappedAppointments.filter((item) => ['CANCELLED', 'REJECTED', 'NO_SHOW', 'RESCHEDULED'].includes(item.status)).length }), [mappedAppointments])
  const tabItems = [['all', 'All'], ['upcoming', 'Upcoming'], ['completed', 'Completed'], ['cancelled', 'Closed']]

  const openChat = async (appointment) => {
    try {
      setChatAlert('')
      await openAppointmentChat(appointment)
    } catch (error) {
      setChatAlert(error?.data?.message || error?.message || 'Unable to open this appointment chat.')
    }
  }

  return (
    <section className="veterinary-dashboard">
      <div className="veterinary-dashboard-header mb-4"><h2 className="dashboard-title"><i className="fa-solid fa-calendar-check me-3" />Appointments</h2><p className="dashboard-subtitle">Review your pet appointments, owner details, and upcoming video consultations.</p></div>
      {openingAppointmentId ? <div className="alert alert-info" role="status"><i className="fa-solid fa-spinner fa-spin me-2" />Opening chat…</div> : chatAlert && <div className="alert alert-warning alert-dismissible fade show" role="alert">{chatAlert}<button type="button" className="btn-close" onClick={() => setChatAlert('')} aria-label="Close" /></div>}
      <div className="dashboard-card veterinary-card mb-4"><div className="dashboard-card-body"><label className="visually-hidden" htmlFor="doctor-appointments-search">Search appointments</label><div className="input-group" style={{ maxWidth: 620 }}><span className="input-group-text bg-white"><i className="fa-solid fa-magnifying-glass text-muted" /></span><input id="doctor-appointments-search" type="search" className="form-control" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search pets, owners, appointment number, reason, or status" />{search && <button type="button" className="btn btn-outline-secondary" onClick={() => setSearch('')}>Clear</button>}</div></div></div>
      <div className="d-flex flex-wrap gap-2 mb-4" role="tablist" aria-label="Appointment status">{tabItems.map(([key, label]) => <button key={key} type="button" className={`btn ${activeTab === key ? 'btn-primary' : 'btn-outline-primary'} rounded-pill`} onClick={() => setActiveTab(key)}>{label}<span className="ms-2 badge text-bg-light">{counts[key]}</span></button>)}</div>
      <div className="dashboard-card veterinary-card"><div className="dashboard-card-body">
        {appointmentsQuery.isLoading ? <div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading appointments</span></div></div> : appointmentsQuery.isError ? <div className="alert alert-danger mb-0">{appointmentsQuery.error?.message || 'Unable to load appointments.'}</div> : visibleAppointments.length === 0 ? <div className="text-center text-muted py-5"><i className="fa-regular fa-calendar-xmark fa-2x mb-3" /><p className="mb-0">No appointments match this view.</p></div> : visibleAppointments.map((appointment) => <article key={appointment.id} className="appointment-wrap veterinary-appointment mb-3"><ul>
          <li><div className="patinet-information"><Link to={appointment.detailsUrl}><img src={appointment.petImage} alt="Pet" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/assets/img/doctors-dashboard/profile-01.jpg' }} /></Link><div className="patient-info"><p>{appointment.number}</p><h6><Link to={appointment.detailsUrl}>{appointment.petName}{appointment.petBreed ? ` · ${appointment.petBreed}` : ''}</Link></h6><small className="text-muted">Owner: {appointment.ownerName}</small></div></div></li>
          <li className="appointment-info"><p><i className="fa-solid fa-clock" />{appointment.date} · {appointment.time}</p><div className="d-flex flex-wrap gap-2"><span className="badge veterinary-badge">{appointment.type}</span><span className="badge veterinary-badge">{appointment.reason}</span><span className={`badge ${statusBadgeClass(appointment.status)}`}>{appointment.status.replace('_', ' ')}</span></div><small className="d-block text-muted mt-2">{appointment.ownerEmail}{appointment.ownerPhone ? ` · ${appointment.ownerPhone}` : ''}</small></li>
          <li className="appointment-action"><ul><li><Link to={appointment.detailsUrl} className="veterinary-action-btn" title="View appointment"><i className="fa-solid fa-eye" /></Link></li><li><button type="button" className="veterinary-action-btn appointment-chat-action" title="Open chat" onClick={() => openChat(appointment)} disabled={isOpening(appointment.id)} aria-label={isOpening(appointment.id) ? 'Opening chat' : 'Open chat'}>{isOpening(appointment.id) ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-comments" />}</button></li></ul></li>
          <li className="appointment-start">{appointment.raw?.bookingType === 'ONLINE' && appointment.status === 'CONFIRMED' ? <Link to={`/doctor/video-call?appointmentId=${encodeURIComponent(String(appointment.id))}`} className="start-link veterinary-start-btn">Start video call</Link> : <Link to={appointment.detailsUrl} className="start-link veterinary-start-btn">View appointment</Link>}</li>
        </ul></article>)}
      </div></div>
    </section>
  )
}

export default DoctorAppointments
