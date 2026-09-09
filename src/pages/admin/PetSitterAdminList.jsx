import { useState } from 'react'
import { toast } from 'react-toastify'
import { useAdminPetSitters } from '../../queries/petSitterQueries'
import { useUpdateAdminPetSitterStatus } from '../../mutations/petSitterMutations'
import { getImageUrl } from '../../utils/apiConfig'

const unwrap = (response) => response?.data ?? response ?? {}
const PetSitterAdminList = () => {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const query = useAdminPetSitters({ search, status, page: 1, limit: 100 })
  const updateStatus = useUpdateAdminPetSitterStatus()
  const sitters = unwrap(query.data).petSitters || []
  const changeStatus = async (id, nextStatus) => { try { await updateStatus.mutateAsync({ id, status: nextStatus }); toast.success('Pet Sitter status updated') } catch (error) { toast.error(error?.message || 'Unable to update status') } }
  return <div className="content"><div className="container-fluid"><div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4"><div><h3 className="mb-1">Pet Sitters</h3><p className="text-muted mb-0">Review registrations, profiles, availability, and account status.</p></div></div><div className="card mb-4"><div className="card-body row g-3"><div className="col-md-8"><input className="form-control" placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} /></div><div className="col-md-4"><select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{['PENDING', 'APPROVED', 'REJECTED', 'BLOCKED'].map((item) => <option key={item} value={item}>{item}</option>)}</select></div></div></div>{query.isLoading ? <div className="text-center py-5"><div className="spinner-border text-primary" /></div> : <div className="card"><div className="table-responsive"><table className="table align-middle mb-0"><thead><tr><th>Pet Sitter</th><th>Location</th><th>Experience</th><th>Pet types</th><th>Status</th><th className="text-end">Manage</th></tr></thead><tbody>{sitters.map((sitter) => { const profile = sitter.profile || {}; return <tr key={sitter.id}><td><div className="d-flex align-items-center gap-2"><img src={getImageUrl(sitter.profileImage) || '/assets/img/doctors-dashboard/doctor-profile-img.jpg'} width="44" height="44" className="rounded-circle" style={{ objectFit: 'cover' }} alt="" /><div><strong>{sitter.name}</strong><div className="small text-muted">{sitter.email}</div></div></div></td><td>{sitter.address?.city || '—'}</td><td>{profile.experienceYears || 0} years</td><td>{(profile.petTypes || []).join(', ') || '—'}</td><td><span className={`badge ${sitter.status === 'APPROVED' ? 'bg-success' : sitter.status === 'BLOCKED' ? 'bg-dark' : 'bg-warning text-dark'}`}>{sitter.status}</span></td><td className="text-end"><div className="btn-group"><button className="btn btn-sm btn-outline-success" disabled={sitter.status === 'APPROVED'} onClick={() => changeStatus(sitter.id, 'APPROVED')}>Approve</button><button className="btn btn-sm btn-outline-danger" disabled={sitter.status === 'BLOCKED'} onClick={() => changeStatus(sitter.id, 'BLOCKED')}>Block</button></div></td></tr>})}</tbody></table></div>{!sitters.length && <div className="text-center text-muted py-5">No Pet Sitters found.</div>}</div>}</div></div>
}

export default PetSitterAdminList
