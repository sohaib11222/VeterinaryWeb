import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { useSupportTickets } from '../../queries/supportTicketQueries'
import { SUPPORT_CATEGORIES, SUPPORT_STATUSES, priorityBadgeClass, supportBadgeClass, supportLabel, unwrapApiData } from '../../constants/supportTickets'

const dateTime = (value) => value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'

const SupportTickets = () => {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const ticketsQuery = useSupportTickets({ page: 1, limit: 50, search, status, category })
  const data = useMemo(() => unwrapApiData(ticketsQuery.data) || {}, [ticketsQuery.data])
  const tickets = Array.isArray(data.tickets) ? data.tickets : []

  return (
    <div className="content">
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
          <div>
            <h3 className="mb-1"><i className="fa-solid fa-headset text-primary me-2" />Support Center</h3>
            <p className="text-muted mb-0">Track your requests and keep every reply, document, and update in one secure place.</p>
          </div>
          <Link to="/patient/support-tickets/new" className="btn btn-primary"><i className="fa-solid fa-plus me-2" />Create support ticket</Link>
        </div>

        <div className="card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-lg-6"><input className="form-control" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by ticket number or subject" /></div>
              <div className="col-sm-6 col-lg-3"><select className="form-select" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option>{SUPPORT_STATUSES.map((value) => <option key={value} value={value}>{supportLabel(value)}</option>)}</select></div>
              <div className="col-sm-6 col-lg-3"><select className="form-select" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{SUPPORT_CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
            </div>
          </div>
        </div>

        {ticketsQuery.isLoading ? <div className="text-center py-5"><div className="spinner-border text-primary" /></div> : ticketsQuery.isError ? <div className="alert alert-danger">{ticketsQuery.error?.message || 'Unable to load your support tickets.'}</div> : tickets.length === 0 ? (
          <div className="card"><div className="card-body text-center py-5"><i className="fa-regular fa-life-ring fa-3x text-muted mb-3" /><h4>No support tickets yet</h4><p className="text-muted">Need help with an appointment, payment, or order? Create a ticket and our support team can investigate.</p><Link className="btn btn-outline-primary" to="/patient/support-tickets/new">Contact support</Link></div></div>
        ) : (
          <div className="card"><div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr><th>Ticket</th><th>Category</th><th>Status</th><th>Priority</th><th>Last updated</th><th className="text-end">Action</th></tr></thead><tbody>{tickets.map((ticket) => (
            <tr key={ticket._id}>
              <td><strong>{ticket.ticketNumber}</strong><div className="small text-muted text-truncate" style={{ maxWidth: 320 }}>{ticket.subject}</div></td>
              <td>{supportLabel(ticket.category)}</td>
              <td><span className={`badge ${supportBadgeClass(ticket.status)}`}>{supportLabel(ticket.status)}</span></td>
              <td><span className={`badge ${priorityBadgeClass(ticket.priority)}`}>{supportLabel(ticket.priority)}</span></td>
              <td><small>{dateTime(ticket.lastMessageAt || ticket.updatedAt)}</small>{ticket.unreadForPatient && <span className="badge bg-danger ms-2">New reply</span>}</td>
              <td className="text-end"><Link className="btn btn-sm btn-outline-primary" to={`/patient/support-tickets/${ticket._id}`}>View</Link></td>
            </tr>
          ))}</tbody></table></div></div>
        )}
      </div>
    </div>
  )
}

export default SupportTickets
