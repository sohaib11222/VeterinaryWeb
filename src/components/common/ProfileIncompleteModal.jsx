import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'

const ProfileIncompleteModal = ({ show, onClose }) => {
  const navigate = useNavigate()
  const { t } = useLanguage()

  const handleGoToProfile = () => {
    navigate('/doctor-profile-settings')
    onClose?.()
  }

  if (!show) return null

  return (
    <>
      <div
        className="modal-backdrop fade show"
        onClick={onClose}
        style={{ zIndex: 1040 }}
      ></div>

      <div
        className="modal fade show"
        style={{
          display: 'block',
          zIndex: 1055,
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        onClick={(e) => {
          if (e.target.classList.contains('modal')) {
            onClose?.()
          }
        }}
      >
        <div className="modal-dialog modal-dialog-centered" style={{ zIndex: 1056 }} onClick={(e) => e.stopPropagation()}>
          <div className="modal-content" style={{ position: 'relative', zIndex: 1057 }}>
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fa-solid fa-exclamation-triangle text-warning me-2"></i>
                {t('doctorModals.profileIncomplete')}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label={t('doctorModals.close')}
              ></button>
            </div>
            <div className="modal-body">
              <div className="text-center mb-4">
                <i className="fa-solid fa-user-circle" style={{ fontSize: '64px', color: '#ffc107' }}></i>
              </div>
              <h6 className="text-center mb-3">{t('doctorModals.profileNotComplete')}</h6>
              <p className="text-muted text-center mb-4">
                {t('doctorModals.profileDescription')}
              </p>
              <ul className="list-unstyled mb-4">
                <li className="mb-2">
                  <i className="fa-solid fa-check-circle text-success me-2"></i>
                  <strong>{t('doctorModals.titleDesignation')}</strong>
                </li>
                <li className="mb-2">
                  <i className="fa-solid fa-check-circle text-success me-2"></i>
                  <strong>{t('doctorModals.biography')}</strong>
                </li>
                <li className="mb-2">
                  <i className="fa-solid fa-check-circle text-success me-2"></i>
                  <strong>{t('doctorModals.specialization')}</strong>
                </li>
                <li className="mb-2">
                  <i className="fa-solid fa-check-circle text-success me-2"></i>
                  <strong>{t('doctorModals.clinic')}</strong>
                </li>
                <li className="mb-2">
                  <i className="fa-solid fa-check-circle text-success me-2"></i>
                  <strong>{t('doctorModals.service')}</strong>
                </li>
              </ul>
              <div className="alert alert-warning mb-0">
                <i className="fa-solid fa-info-circle me-2"></i>
                <strong>{t('doctorModals.note')}</strong> {t('doctorModals.cannotReceive')}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                {t('doctorModals.close')}
              </button>
              <button type="button" className="btn btn-primary" onClick={handleGoToProfile}>
                <i className="fa-solid fa-user-edit me-2"></i>
                {t('doctorModals.completeNow')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ProfileIncompleteModal
