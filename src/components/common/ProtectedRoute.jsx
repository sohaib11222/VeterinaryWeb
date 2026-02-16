import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-toastify'

/**
 * ProtectedRoute (Veterinary)
 *
 * - Ensures authentication
 * - Restricts by role (PET_OWNER, VETERINARIAN, ADMIN, PET_STORE)
 * - For veterinarians, can require APPROVED status or allow PENDING
 *
 * Props:
 * - role: string | string[] (allowed roles)
 * - requireApproved: boolean (for vets; default false)
 * - allowPending: boolean (allow PENDING vets; default false)
 * - requireAuth: boolean (default true)
 */
const ProtectedRoute = ({
  children,
  role = null,
  requireApproved = false,
  allowPending = false,
  requireAuth = true,
}) => {
  const { user, loading } = useAuth()

  const userRole = user?.role

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (userRole === 'PET_STORE' || userRole === 'PARAPHARMACY') {
    const status = user?.status

    if (requireApproved && status !== 'APPROVED') {
      if (status === 'PENDING') {
        toast.info('Your account is pending approval. Please wait for admin approval.')
        return <Navigate to="/pending-approval" replace />
      }
      if (status === 'REJECTED' || status === 'BLOCKED') {
        toast.error('Your account has been rejected or blocked. Please contact support.')
        return <Navigate to="/login" replace />
      }
      toast.info('Your account needs to be approved to access this page.')
      return <Navigate to="/pending-approval" replace />
    }

    if (!allowPending && status === 'PENDING' && !requireApproved) {
      const currentPath = window.location.pathname
      if (currentPath !== '/pending-approval' && (currentPath.startsWith('/pet-store') || currentPath.startsWith('/parapharmacy') || currentPath.startsWith('/pharmacy-admin'))) {
        return <Navigate to="/pending-approval" replace />
      }
    }
  }

  if (requireAuth && !user) {
    toast.error('Please login to access this page')
    return <Navigate to="/login" replace />
  }

  if (!role) {
    return children
  }

  const allowedRoles = Array.isArray(role) ? role : [role]

  if (!allowedRoles.includes(userRole)) {
    toast.error('You do not have permission to access this page')
    return <Navigate to="/" replace />
  }

  // Extra status handling for veterinarians
  if (userRole === 'VETERINARIAN') {
    const status = user?.status

    if (requireApproved && status !== 'APPROVED') {
      if (status === 'PENDING') {
        toast.info('Your account is pending approval. Please wait for admin approval.')
        return <Navigate to="/pending-approval" replace />
      }
      if (status === 'REJECTED' || status === 'BLOCKED') {
        toast.error('Your account has been rejected or blocked. Please contact support.')
        return <Navigate to="/login" replace />
      }
      toast.info('Your account needs to be approved to access this page.')
      return <Navigate to="/pending-approval" replace />
    }

    if (!allowPending && status === 'PENDING' && !requireApproved) {
      const currentPath = window.location.pathname
      if (currentPath !== '/pending-approval' && currentPath.startsWith('/doctor')) {
        return <Navigate to="/pending-approval" replace />
      }
    }
  }

  return children
}

export default ProtectedRoute

