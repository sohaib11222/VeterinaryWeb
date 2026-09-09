import { Link } from 'react-router-dom'
import { useMyPetSitterProfile } from '../../queries/petSitterQueries'
import { getImageUrl } from '../../utils/apiConfig'

const unwrap = (response) => response?.data ?? response ?? {}
const label = (value) => String(value || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())

const PetSitterDashboard = () => {
  const query = useMyPetSitterProfile()
  const sitter = unwrap(query.data)
  const profile = sitter.profile || {}
  return <div className="content"><div className="container-fluid"><div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4"><div><h3 className="mb-1">Pet Sitter Dashboard</h3><p className="text-muted mb-0">Manage your profile and conversations with Pet Owners.</p></div><Link to="/pet-sitter/profile" className="btn btn-primary"><i className="fa-solid fa-user-pen me-2" />Edit profile</Link></div>{query.isLoading ? <div className="text-center py-5"><div className="spinner-border text-primary" /></div> : <><div className="card mb-4"><div className="card-body d-flex align-items-center gap-3"><img src={getImageUrl(sitter.profileImage) || '/assets/img/doctors-dashboard/doctor-profile-img.jpg'} alt="" className="rounded-circle" width="82" height="82" style={{ objectFit: 'cover' }} /><div><h4 className="mb-1">Welcome, {sitter.name || 'Pet Sitter'}</h4><p className="text-muted mb-1">{sitter.address?.city || 'Add your location'} · {profile.experienceYears || 0} years experience</p><span className={`badge ${profile.isAvailable ? 'bg-success' : 'bg-secondary'}`}>{profile.isAvailable ? 'Available for requests' : 'Currently unavailable'}</span></div></div></div><div className="row g-4"><div className="col-md-4"><div className="card h-100"><div className="card-body"><i className="fa-solid fa-paw text-primary fa-2x mb-3" /><h5>Pet types</h5><p className="text-muted">{(profile.petTypes || []).map(label).join(', ') || 'Not configured yet'}</p><Link to="/pet-sitter/profile">Update preferences</Link></div></div></div><div className="col-md-4"><div className="card h-100"><div className="card-body"><i className="fa-solid fa-comments text-primary fa-2x mb-3" /><h5>Pet Owner chats</h5><p className="text-muted">Reply directly to owners without an appointment.</p><Link to="/pet-sitter/chats">Open messages</Link></div></div></div><div className="col-md-4"><div className="card h-100"><div className="card-body"><i className="fa-solid fa-headset text-primary fa-2x mb-3" /><h5>Support</h5><p className="text-muted">Get help from the MyPetPlus team.</p><Link to="/pet-sitter/support-tickets">Open support</Link></div></div></div></div></>}</div></div>
}

export default PetSitterDashboard
