import { useState } from 'react'
import { toast } from 'react-toastify'
import { useAdminSupportTickets } from '../../queries/adminSupportTicketQueries'
import { useUpdateAdminSupportTicket } from '../../mutations/adminSupportTicketMutations'

const unwrap = (response) => response?.data ?? response ?? {}
const roleLabel = (role) => ({ PET_OWNER: 'Pet Owner', VETERINARIAN: 'Doctor', PET_STORE: 'Pharmacy', PARAPHARMACY: 'Parapharmacy', PET_SITTER: 'Pet Sitter' }[role] || role || 'Unknown')
const AdminSupportTickets = () => {
  const [search, setSearch] = useState('')
  const [userRole, setUserRole] = useState('')
  const query = useAdminSupportTickets({ page: 1, limit: 100, search, userRole })
  const update = useUpdateAdminSupportTicket()
  const tickets = unwrap(query.data).tickets || []
  const resolve = async (ticketId) => { try { await update.mutateAsync({ ticketId, data: { status: 'RESOLVED' } }); toast.success('Ticket resolved') } catch (error) { toast.error(error?.message || 'Unable to update ticket') } }
  return <div className="content"><div className="container-fluid"><div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4"><div><h3 className="mb-1">Support Tickets</h3><p className="text-muted mb-0">See who submitted each request, including Pet Sitter tickets.</p></div></div><div className="card mb-4"><div className="card-body row g-3"><div className="col-md-8"><input className="form-control" placeholder="Search ticket number or subject" value={search} onChange={(e) => setSearch(e.target.value)} /></div><div className="col-md-4"><select className="form-select" value={userRole} onChange={(e) => setUserRole(e.target.value)}><option value="">All user types</option>{['PET_OWNER', 'VETERINARIAN', 'PET_STORE', 'PARAPHARMACY', 'PET_SITTER'].map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}</select></div></div></div><div className="card"><div className="table-responsive"><table className="table align-middle mb-0"><thead><tr><th>Ticket</th><th>Submitted by</th><th>Category</th><th>Status</th><th>Last update</th><th className="text-end">Action</th></tr></thead><tbody>{tickets.map((ticket) => <tr key={ticket._id}><td><strong>{ticket.ticketNumber}</strong><div className="small text-muted">{ticket.subject}</div></td><td><span className={`badge ${ticket.creatorRole === 'PET_SITTER' ? 'bg-primary' : 'bg-light text-dark'}`}>{roleLabel(ticket.creatorRole)}</span><div className="small text-muted">{ticket.patientId?.fullName || ticket.patientId?.name || ticket.patientId?.email || '—'}</div></td><td>{ticket.category}</td><td><span className="badge bg-light text-dark">{ticket.status}</span></td><td>{ticket.lastMessageAt ? new Date(ticket.lastMessageAt).toLocaleString() : '—'}</td><td className="text-end">{ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && <button className="btn btn-sm btn-outline-success" onClick={() => resolve(ticket._id)}>Resolve</button>}</td></tr>)}</tbody></table></div>{!query.isLoading && !tickets.length && <div className="text-center text-muted py-5">No support tickets found.</div>}</div></div></div>
}
export default AdminSupportTickets
