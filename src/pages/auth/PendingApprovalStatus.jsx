import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../utils/api'
import { API_ROUTES } from '../../utils/apiConfig'
import { toast } from 'react-toastify'
import { useLanguage } from '../../contexts/LanguageContext'

const PendingApprovalStatus = () => {
  const navigate = useNavigate()
  const { user, logout, updateUser } = useAuth()
  const { t } = useLanguage()
  const [checkingStatus, setCheckingStatus] = useState(true)

  useEffect(() => {
    const checkApprovalStatus = async () => {
      try {
        const res = await api.get(API_ROUTES.USERS.ME)
        const me = res?.data ?? res
        if (me) updateUser(me)

        const role = String(me?.role || user?.role || '').toUpperCase()
        const status = String(me?.status || user?.status || '').toUpperCase()
        if (status === 'APPROVED') {
          navigate(role === 'VETERINARIAN' ? '/doctor/dashboard' : (role === 'PET_STORE' || role === 'PARAPHARMACY') ? '/pharmacy-admin/dashboard' : role === 'PET_SITTER' ? '/pet-sitter/dashboard' : '/')
          return
        }
        if (status === 'REJECTED' || status === 'BLOCKED') toast.error(t('auth.pending.rejected'))
        setCheckingStatus(false)
      } catch (error) {
        console.error('Error checking approval status:', error)
        setCheckingStatus(false)
      }
    }

    checkApprovalStatus()
    const interval = setInterval(checkApprovalStatus, 30000)
    return () => clearInterval(interval)
  }, [navigate, updateUser, user?.role, user?.status])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const role = String(user?.role || '').toUpperCase()
  const isPharmacy = role === 'PET_STORE' || role === 'PARAPHARMACY'
  const accountLabel = role === 'PARAPHARMACY' ? t('auth.pharmacy.parapharmacy') : role === 'PET_STORE' ? t('auth.pharmacy.pharmacy') : role === 'PET_SITTER' ? t('nav.becomePetSitter') : t('nav.doctors')
  const updateDocsPath = role === 'VETERINARIAN' ? '/doctor-verification-upload' : '/pet-store-verification-upload'

  return (
    <div className="auth-pharmacy-flow">
      {isPharmacy && <div className="auth-pharmacy-flow__steps" aria-label={t('auth.authLayout.featuresAria')}>
        <span className="is-complete"><i className="fa-solid fa-check"></i><b>{t('auth.verification.account')}</b></span>
        <span className="is-complete"><i className="fa-solid fa-check"></i><b>{t('auth.verification.phone')}</b></span>
        <span className="is-complete"><i className="fa-solid fa-check"></i><b>{t('auth.verification.documents')}</b></span>
        <span className="is-active"><i className="fa-solid fa-circle-check"></i><b>{t('auth.verification.approval')}</b></span>
      </div>}
      <div className="auth-pharmacy-flow__panel">
        {checkingStatus ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">{t('common.loading')}</span></div><p className="mt-3 text-muted mb-0">{t('auth.pending.checking')}</p></div>
        ) : (
          <>
            <div className="auth-pharmacy-flow__header">
              <div className="logo-icon"><i className="fa-solid fa-clock" /></div>
              <div><h3>{t('auth.pending.title')}</h3><p>{t('auth.pending.description', { account: accountLabel })}</p></div>
            </div>
            <div className="row g-3 mt-1">
              {[
                ['fa-file-circle-check', 'Documents submitted', 'Your documents are securely in the review queue.'],
                ['fa-magnifying-glass', 'Review in progress', 'Our team is confirming your application details.'],
                ['fa-bell', 'Automatic update', 'This page checks for approval automatically every 30 seconds.'],
              ].map(([icon, title, description]) => <div className="col-md-4" key={title}><div className="border rounded-3 p-3 h-100"><i className={`fa-solid ${icon} text-primary mb-3`} style={{ fontSize: 22 }}></i><div className="fw-semibold mb-1">{title}</div><div className="small text-muted">{description}</div></div></div>)}
            </div>
            <div className="d-flex justify-content-end gap-2 flex-wrap mt-4 pt-3 border-top">
              <Link to={updateDocsPath} className="btn btn-outline-primary"><i className="fa-solid fa-pen me-2"></i>{t('auth.pending.update')}</Link>
              <button type="button" className="btn btn-primary-gradient" onClick={() => window.location.reload()}><i className="fa-solid fa-rotate me-2"></i>{t('auth.pending.checkNow')}</button>
            </div>
          </>
        )}
      </div>
      <div className="d-flex justify-content-center gap-3 mt-3 small"><Link to="/contact-us" className="text-muted">{t('nav.contactUs')}</Link><button type="button" className="btn btn-link text-muted p-0" onClick={handleLogout}>{t('common.logout')}</button></div>
    </div>
  )
}

export default PendingApprovalStatus
