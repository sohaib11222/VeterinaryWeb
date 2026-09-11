import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'

import { useAppointments } from '../../queries'
import { getImageUrl } from '../../utils/apiConfig'
import { useAppointmentChat } from '../../hooks/useAppointmentChat'
import { useLanguage } from '../../contexts/LanguageContext'

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
  const { t, language } = useLanguage()
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
       petName: pet?.name || t('doctorAppointments.pet'), petBreed: pet?.breed || '', petImage: getImageUrl(pet?.photo) || '/assets/img/doctors-dashboard/profile-01.jpg',
       ownerName: owner?.name || owner?.fullName || owner?.email || t('doctorAppointments.owner'), ownerEmail: owner?.email || '', ownerPhone: owner?.phone || '',
       date: appointment?.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString(language === 'it' ? 'it-IT' : 'en-GB') : t('doctorAppointments.dateUnavailable'), time: appointment?.appointmentTime || t('doctorAppointments.timeUnavailable'), status,
       type: appointment?.bookingType === 'ONLINE' ? t('doctorAppointments.videoConsultation') : t('doctorAppointments.clinicVisit'), reason: appointment?.reason || t('doctorAppointments.consultation'), raw: appointment,
    }
  }), [appointments, language, t])

  const visibleAppointments = useMemo(() => {
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0)
    if (activeTab === 'upcoming') return mappedAppointments.filter((item) => ['PENDING', 'CONFIRMED', 'PENDING_PAYMENT'].includes(item.status) && (!item.raw?.appointmentDate || new Date(item.raw.appointmentDate) >= startOfToday))
    if (activeTab === 'completed') return mappedAppointments.filter((item) => item.status === 'COMPLETED')
    if (activeTab === 'cancelled') return mappedAppointments.filter((item) => ['CANCELLED', 'REJECTED', 'NO_SHOW', 'RESCHEDULED'].includes(item.status))
    return mappedAppointments
  }, [activeTab, mappedAppointments])
  const counts = useMemo(() => ({ all: mappedAppointments.length, upcoming: mappedAppointments.filter((item) => ['PENDING', 'CONFIRMED', 'PENDING_PAYMENT'].includes(item.status)).length, completed: mappedAppointments.filter((item) => item.status === 'COMPLETED').length, cancelled: mappedAppointments.filter((item) => ['CANCELLED', 'REJECTED', 'NO_SHOW', 'RESCHEDULED'].includes(item.status)).length }), [mappedAppointments])
  const tabItems = [['all', t('doctorAppointments.all')], ['upcoming', t('doctorAppointments.upcoming')], ['completed', t('doctorAppointments.completed')], ['cancelled', t('doctorAppointments.closed')]]

  const statusLabel = (status) => {
    const keys = {
      CONFIRMED: 'statusConfirmed', PENDING: 'statusPending', PENDING_PAYMENT: 'statusPendingPayment', COMPLETED: 'statusCompleted', CANCELLED: 'statusCancelled', REJECTED: 'statusRejected', NO_SHOW: 'statusNoShow', RESCHEDULED: 'statusRescheduled',
    }
    return t(`doctorAppointments.${keys[status] || 'statusPending'}`)
  }

  const openChat = async (appointment) => {
    try {
      setChatAlert('')
      await openAppointmentChat(appointment)
    } catch (error) {
      setChatAlert(error?.data?.message || error?.message || t('doctorAppointments.openChatFailed', 'Unable to open this appointment chat.'))
    }
  }

  return (
    <section className="veterinary-dashboard">
      <div className="veterinary-dashboard-header mb-4"><h2 className="dashboard-title"><i className="fa-solid fa-calendar-check me-3" />{t('doctorAppointments.title')}</h2><p className="dashboard-subtitle">{t('doctorAppointments.subtitle')}</p></div>
      {openingAppointmentId ? <div className="alert alert-info" role="status"><i className="fa-solid fa-spinner fa-spin me-2" />{t('doctorAppointments.openingChat')}</div> : chatAlert && <div className="alert alert-warning alert-dismissible fade show" role="alert">{chatAlert}<button type="button" className="btn-close" onClick={() => setChatAlert('')} aria-label={t('doctorAppointments.close')} /></div>}
      <div className="dashboard-card veterinary-card mb-4"><div className="dashboard-card-body"><label className="visually-hidden" htmlFor="doctor-appointments-search">{t('doctorAppointments.searchLabel')}</label><div className="input-group" style={{ maxWidth: 620 }}><span className="input-group-text bg-white"><i className="fa-solid fa-magnifying-glass text-muted" /></span><input id="doctor-appointments-search" type="search" className="form-control" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('doctorAppointments.searchPlaceholder')} />{search && <button type="button" className="btn btn-outline-secondary" onClick={() => setSearch('')}>{t('doctorAppointments.clear')}</button>}</div></div></div>
      <div className="d-flex flex-wrap gap-2 mb-4" role="tablist" aria-label={t('doctorAppointments.statusLabel')}>{tabItems.map(([key, label]) => <button key={key} type="button" className={`btn ${activeTab === key ? 'btn-primary' : 'btn-outline-primary'} rounded-pill`} onClick={() => setActiveTab(key)}>{label}<span className="ms-2 badge text-bg-light">{counts[key]}</span></button>)}</div>
      <div className="dashboard-card veterinary-card"><div className="dashboard-card-body">
        {appointmentsQuery.isLoading ? <div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">{t('doctorAppointments.loading')}</span></div></div> : appointmentsQuery.isError ? <div className="alert alert-danger mb-0">{appointmentsQuery.error?.message || t('doctorAppointments.loadFailed')}</div> : visibleAppointments.length === 0 ? <div className="text-center text-muted py-5"><i className="fa-regular fa-calendar-xmark fa-2x mb-3" /><p className="mb-0">{t('doctorAppointments.empty')}</p></div> : visibleAppointments.map((appointment) => <article key={appointment.id} className="appointment-wrap veterinary-appointment mb-3"><ul>
          <li><div className="patinet-information"><Link to={appointment.detailsUrl}><img src={appointment.petImage} alt={t('doctorAppointments.pet')} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/assets/img/doctors-dashboard/profile-01.jpg' }} /></Link><div className="patient-info"><p>{appointment.number}</p><h6><Link to={appointment.detailsUrl}>{appointment.petName}{appointment.petBreed ? ` · ${appointment.petBreed}` : ''}</Link></h6><small className="text-muted">{t('doctorAppointments.owner')}: {appointment.ownerName}</small></div></div></li>
          <li className="appointment-info"><p><i className="fa-solid fa-clock" />{appointment.date} · {appointment.time}</p><div className="d-flex flex-wrap gap-2"><span className="badge veterinary-badge">{appointment.type}</span><span className="badge veterinary-badge">{appointment.reason}</span><span className={`badge ${statusBadgeClass(appointment.status)}`}>{statusLabel(appointment.status)}</span></div><small className="d-block text-muted mt-2">{appointment.ownerEmail}{appointment.ownerPhone ? ` · ${appointment.ownerPhone}` : ''}</small></li>
          <li className="appointment-action"><ul><li><Link to={appointment.detailsUrl} className="veterinary-action-btn" title={t('doctorAppointments.viewAppointment')}><i className="fa-solid fa-eye" /></Link></li><li><button type="button" className="veterinary-action-btn appointment-chat-action" title={t('doctorAppointments.openChat')} onClick={() => openChat(appointment)} disabled={isOpening(appointment.id)} aria-label={isOpening(appointment.id) ? t('doctorAppointments.openingChat') : t('doctorAppointments.openChat')}>{isOpening(appointment.id) ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-comments" />}</button></li></ul></li>
          <li className="appointment-start">{appointment.raw?.bookingType === 'ONLINE' && appointment.status === 'CONFIRMED' ? <Link to={`/doctor/video-call?appointmentId=${encodeURIComponent(String(appointment.id))}`} className="start-link veterinary-start-btn">{t('doctorAppointments.startVideoCall')}</Link> : <Link to={appointment.detailsUrl} className="start-link veterinary-start-btn">{t('doctorAppointments.viewAppointment')}</Link>}</li>
        </ul></article>)}
      </div></div>
    </section>
  )
}

export default DoctorAppointments
