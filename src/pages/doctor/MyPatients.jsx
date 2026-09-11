import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'

import { useLanguage } from '../../contexts/LanguageContext'
import { useAppointments } from '../../queries'
import { getImageUrl } from '../../utils/apiConfig'

const unwrapAppointments = (response) => {
  const outer = response?.data ?? response
  const payload = outer?.data ?? outer
  return Array.isArray(payload) ? payload : Array.isArray(payload?.appointments) ? payload.appointments : []
}

const formatDate = (date, language) => date ? new Date(date).toLocaleDateString(language === 'it' ? 'it-IT' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const formatDateTime = (date, time, language) => `${formatDate(date, language)}${time ? ` · ${time}` : ''}`

const getAgeText = (pet, t) => {
  if (pet?.dateOfBirth) {
    const birth = new Date(pet.dateOfBirth); const now = new Date()
    let years = now.getFullYear() - birth.getFullYear()
    const monthDifference = now.getMonth() - birth.getMonth()
    if (monthDifference < 0 || (monthDifference === 0 && now.getDate() < birth.getDate())) years -= 1
    if (years >= 0) return t('doctorPets.ageYears', { count: years })
  }
  if (Number.isFinite(Number(pet?.age))) return Number(pet.age) >= 12 ? t('doctorPets.ageYears', { count: Math.floor(Number(pet.age) / 12) }) : t('doctorPets.ageMonths', { count: pet.age })
  return null
}

const MyPatients = () => {
  const { t, language } = useLanguage()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('active')
  const appointmentsQuery = useAppointments({ page: 1, limit: 1000, search: search.trim() || undefined })
  const appointments = useMemo(() => unwrapAppointments(appointmentsQuery.data), [appointmentsQuery.data])

  const pets = useMemo(() => {
    const petMap = new Map()
    appointments.forEach((appointment) => {
      const pet = appointment?.petId
      const id = typeof pet === 'object' ? pet?._id : pet
      if (!id) return
      const key = String(id)
      const existing = petMap.get(key) || { id, pet, owner: appointment?.petOwnerId || {}, appointments: [], lastAppointment: null, active: false }
      existing.appointments.push(appointment)
      if (!existing.lastAppointment || new Date(appointment?.appointmentDate || 0) > new Date(existing.lastAppointment?.appointmentDate || 0)) {
        existing.lastAppointment = appointment
        existing.pet = pet || existing.pet
        existing.owner = appointment?.petOwnerId || existing.owner
      }
      if (['PENDING', 'CONFIRMED', 'PENDING_PAYMENT'].includes(String(appointment?.status || '').toUpperCase())) existing.active = true
      petMap.set(key, existing)
    })
    return Array.from(petMap.values()).sort((left, right) => new Date(right.lastAppointment?.appointmentDate || 0) - new Date(left.lastAppointment?.appointmentDate || 0))
  }, [appointments])

  const counts = useMemo(() => ({ active: pets.filter((pet) => pet.active).length, inactive: pets.filter((pet) => !pet.active).length }), [pets])
  const visiblePets = useMemo(() => pets.filter((pet) => tab === 'active' ? pet.active : !pet.active), [pets, tab])

  return <section className="veterinary-dashboard">
    <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4"><div className="veterinary-dashboard-header mb-0"><h2 className="dashboard-title"><i className="fa-solid fa-paw me-3" />{t('doctorPets.title')}</h2><p className="dashboard-subtitle">{t('doctorPets.subtitle')}</p></div><span className="badge text-bg-light border px-3 py-2">{t('doctorPets.petCount', { count: pets.length })}</span></div>
    <div className="dashboard-card veterinary-card mb-4"><div className="dashboard-card-body"><label htmlFor="my-pets-search" className="visually-hidden">{t('doctorPets.searchLabel')}</label><div className="input-group" style={{ maxWidth: 560 }}><span className="input-group-text bg-white"><i className="fa-solid fa-magnifying-glass text-muted" /></span><input id="my-pets-search" type="search" className="form-control" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('doctorPets.searchPlaceholder')} />{search && <button type="button" className="btn btn-outline-secondary" onClick={() => setSearch('')}>{t('doctorPets.clear')}</button>}</div></div></div>
    <div className="d-flex flex-wrap gap-2 mb-4"><button type="button" className={`btn rounded-pill ${tab === 'active' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTab('active')}>{t('doctorPets.activeCare')} <span className="badge text-bg-light ms-2">{counts.active}</span></button><button type="button" className={`btn rounded-pill ${tab === 'inactive' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTab('inactive')}>{t('doctorPets.pastPets')} <span className="badge text-bg-light ms-2">{counts.inactive}</span></button></div>
    {appointmentsQuery.isLoading ? <div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">{t('doctorPets.loading')}</span></div></div> : appointmentsQuery.isError ? <div className="alert alert-danger">{appointmentsQuery.error?.message || t('doctorPets.loadFailed')}</div> : visiblePets.length === 0 ? <div className="dashboard-card veterinary-card"><div className="dashboard-card-body text-center text-muted py-5"><i className="fa-solid fa-paw fa-2x mb-3" /><p className="mb-0">{t('doctorPets.empty')}</p></div></div> : <div className="row g-4">{visiblePets.map((entry) => {
      const pet = entry.pet || {}; const owner = entry.owner || {}; const last = entry.lastAppointment || {}
      const detailsUrl = last?._id ? `/doctor-appointment-details?id=${encodeURIComponent(String(last._id))}` : '/appointments'
      const image = getImageUrl(pet?.photo) || '/assets/img/doctors-dashboard/profile-01.jpg'
      const traits = [[pet?.species, 'fa-paw'], [pet?.breed, 'fa-dna'], [getAgeText(pet, t), 'fa-cake-candles'], [pet?.weight?.value != null ? `${pet.weight.value} ${pet.weight.unit || 'kg'}` : null, 'fa-weight-scale']].filter(([value]) => value)
      return <div className="col-xl-4 col-md-6" key={entry.id}><article className="card border-0 shadow-sm h-100 overflow-hidden"><div className="card-body p-4"><div className="d-flex align-items-start gap-3 mb-4"><img src={image} alt={pet?.name || t('doctorPets.petImage')} className="rounded-circle object-fit-cover" style={{ width: 72, height: 72 }} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/assets/img/doctors-dashboard/profile-01.jpg' }} /><div className="min-w-0 flex-grow-1"><div className="d-flex justify-content-between gap-2"><div><h3 className="h5 mb-1 text-truncate">{pet?.name || t('doctorPets.pet')}</h3><div className="text-muted small">{owner?.name || owner?.fullName || owner?.email || t('doctorPets.petOwner')}</div></div><span className={`badge ${entry.active ? 'bg-success' : 'bg-secondary'}`}>{entry.active ? t('doctorPets.active') : t('doctorPets.past')}</span></div></div></div><div className="d-flex flex-wrap gap-2 mb-4">{traits.map(([value, icon]) => <span key={icon} className="badge text-bg-light border text-dark"><i className={`fa-solid ${icon} me-1 text-primary`} />{value}</span>)}</div><div className="border-top pt-3 small"><div className="d-flex justify-content-between gap-2"><span className="text-muted">{t('doctorPets.lastAppointment')}</span><span className="text-end">{formatDateTime(last?.appointmentDate, last?.appointmentTime, language)}</span></div><div className="d-flex justify-content-between gap-2 mt-2"><span className="text-muted">{t('doctorPets.reason')}</span><span className="text-end">{last?.reason || t('doctorPets.unavailable')}</span></div></div></div><div className="card-footer bg-white border-0 px-4 pb-4"><Link className="btn btn-outline-primary w-100" to={detailsUrl}><i className="fa-solid fa-file-medical me-2" />{t('doctorPets.viewAppointment')}</Link></div></article></div>
    })}</div>}
  </section>
}

export default MyPatients
