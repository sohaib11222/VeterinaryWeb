import { Link, useParams } from 'react-router-dom'
import { usePetSitter } from '../../queries/petSitterQueries'
import { getImageUrl } from '../../utils/apiConfig'
import { useAuth } from '../../contexts/AuthContext'

const label = (value) => String(value || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
const unwrap = (response) => response?.data ?? response ?? {}

const PetSitterProfile = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const query = usePetSitter(id)
  const sitter = unwrap(query.data)
  const profile = sitter.profile || {}
  if (query.isLoading) return <div className="content"><div className="container text-center py-5"><div className="spinner-border text-primary" /></div></div>
  if (query.isError || !sitter.id) return <div className="content"><div className="container py-5"><div className="alert alert-danger">Pet Sitter profile not found.</div></div></div>
  return <div className="content"><div className="container py-5"><div className="card shadow-sm overflow-hidden"><div className="row g-0"><div className="col-md-4 bg-light d-flex align-items-center justify-content-center p-4"><img src={getImageUrl(sitter.profileImage) || '/assets/img/doctors-dashboard/doctor-profile-img.jpg'} className="img-fluid rounded" style={{ maxHeight: 360, objectFit: 'cover' }} alt={sitter.name} /></div><div className="col-md-8"><div className="card-body p-4"><span className="badge bg-primary mb-2">Pet Sitter</span><h2>{sitter.name}</h2><p className="text-muted"><i className="fa-solid fa-location-dot me-2" />{sitter.address?.city || 'Location not provided'}</p><p className="mb-3">{profile.bio || 'This Pet Sitter has not added a bio yet.'}</p><div className="row g-3 mb-4"><div className="col-sm-4"><strong>Experience</strong><div>{profile.experienceYears || 0} years</div></div><div className="col-sm-4"><strong>Availability</strong><div>{profile.isAvailable ? 'Available' : 'Unavailable'}</div></div><div className="col-sm-4"><strong>Contact</strong><div>{sitter.phone || 'Available in chat'}</div></div></div><h5>Pets I handle</h5><div className="d-flex flex-wrap gap-2 mb-3">{(profile.petTypes || []).map((item) => <span className="badge bg-light text-dark" key={item}>{label(item)}</span>)}</div><h5>Services</h5><div className="d-flex flex-wrap gap-2 mb-4">{(profile.servicesOffered || []).map((item) => <span className="badge bg-light text-dark" key={item}>{label(item)}</span>)}</div>{user?.role === 'PET_OWNER' ? <Link className="btn btn-primary" to={`/chat?petSitterId=${encodeURIComponent(sitter.id)}`}><i className="fa-solid fa-comments me-2" />Start chat</Link> : <Link className="btn btn-primary" to="/login">Login to start chat</Link>}</div></div></div></div></div></div>
}

export default PetSitterProfile
