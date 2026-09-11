import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { useSupportTickets } from '../../queries/supportTicketQueries'
import { SUPPORT_CATEGORIES, SUPPORT_STATUSES, priorityBadgeClass, supportBadgeClass, supportLabel, unwrapApiData } from '../../constants/supportTickets'
import { useLanguage } from '../../contexts/LanguageContext'

const dateTime = (value) => value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'
const supportTranslationKey = (value) => ({
  OPEN: 'open', IN_PROGRESS: 'inProgress', WAITING_FOR_PATIENT: 'waitingForPatient', RESOLVED: 'resolved', CLOSED: 'closed',
  LOW: 'low', MEDIUM: 'medium', HIGH: 'high', URGENT: 'urgent',
  APPOINTMENT: 'appointmentIssue', RESCHEDULE: 'rescheduleIssue', VIDEO_CALL: 'videoCallIssue', PAYMENT: 'paymentIssue',
  PHARMACY_ORDER: 'pharmacyOrderIssue', PARAPHARMACY_ORDER: 'parapharmacyOrderIssue', DELIVERY: 'deliveryIssue', REFUND: 'refundIssue',
  PRESCRIPTION: 'prescriptionIssue', ACCOUNT_REGISTRATION: 'accountRegistrationIssue', PET_PROFILE: 'petProfileIssue', VETERINARIAN: 'veterinarianIssue', TECHNICAL: 'technicalIssue', OTHER: 'other',
}[String(value || '').toUpperCase()])

const SupportTickets = () => {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const { t } = useLanguage()
  const localizeSupportValue = (value) => {
    const key = supportTranslationKey(value)
    return key ? t(`patient.support.${key}`) : supportLabel(value)
  }
  const location = useLocation()
  const basePath = location.pathname.startsWith('/pet-sitter') ? '/pet-sitter' : '/patient'
  const ticketsQuery = useSupportTickets({ page: 1, limit: 50, search, status, category })
  const data = useMemo(() => unwrapApiData(ticketsQuery.data) || {}, [ticketsQuery.data])
  const tickets = Array.isArray(data.tickets) ? data.tickets : []

  return (
    <div className="content">
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
          <div>
            <h3 className="mb-1"><i className="fa-solid fa-headset text-primary me-2" />{t('patient.supportCenter')}</h3>
            <p className="text-muted mb-0">{t('patient.supportDescription')}</p>
          </div>
          <Link to={`${basePath}/support-tickets/new`} className="btn btn-primary"><i className="fa-solid fa-plus me-2" />{t('patient.createSupportTicket')}</Link>
        </div>

        <div className="card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-lg-6"><input className="form-control" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('patient.searchTicket')} /></div>
              <div className="col-sm-6 col-lg-3"><select className="form-select" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">{t('patient.allStatuses')}</option>{SUPPORT_STATUSES.map((value) => <option key={value} value={value}>{localizeSupportValue(value)}</option>)}</select></div>
              <div className="col-sm-6 col-lg-3"><select className="form-select" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">{t('patient.allCategories')}</option>{SUPPORT_CATEGORIES.map(([value]) => <option key={value} value={value}>{localizeSupportValue(value)}</option>)}</select></div>
            </div>
          </div>
        </div>

        {ticketsQuery.isLoading ? <div className="text-center py-5"><div className="spinner-border text-primary" /></div> : ticketsQuery.isError ? <div className="alert alert-danger">{ticketsQuery.error?.message || t('patient.unableSupportTickets')}</div> : tickets.length === 0 ? (
          <div className="card"><div className="card-body text-center py-5"><i className="fa-regular fa-life-ring fa-3x text-muted mb-3" /><h4>{t('patient.noSupportTickets')}</h4><p className="text-muted">{t('patient.needHelp')}</p><Link className="btn btn-outline-primary" to={`${basePath}/support-tickets/new`}>{t('patient.contactSupport')}</Link></div></div>
        ) : (
          <div className="card"><div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr><th>{t('patient.ticket')}</th><th>{t('patient.category')}</th><th>{t('patient.status')}</th><th>{t('patient.priority')}</th><th>{t('patient.lastUpdated')}</th><th className="text-end">{t('patient.action')}</th></tr></thead><tbody>{tickets.map((ticket) => (
            <tr key={ticket._id}>
              <td><strong>{ticket.ticketNumber}</strong><div className="small text-muted text-truncate" style={{ maxWidth: 320 }}>{ticket.subject}</div></td>
              <td>{localizeSupportValue(ticket.category)}</td>
              <td><span className={`badge ${supportBadgeClass(ticket.status)}`}>{localizeSupportValue(ticket.status)}</span></td>
              <td><span className={`badge ${priorityBadgeClass(ticket.priority)}`}>{localizeSupportValue(ticket.priority)}</span></td>
              <td><small>{dateTime(ticket.lastMessageAt || ticket.updatedAt)}</small>{ticket.unreadForPatient && <span className="badge bg-danger ms-2">{t('patient.newReply')}</span>}</td>
              <td className="text-end"><Link className="btn btn-sm btn-outline-primary" to={`${basePath}/support-tickets/${ticket._id}`}>{t('common.view', 'View')}</Link></td>
            </tr>
          ))}</tbody></table></div></div>
        )}
      </div>
    </div>
  )
}

export default SupportTickets
