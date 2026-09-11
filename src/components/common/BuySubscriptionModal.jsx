import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'

const BuySubscriptionModal = ({ show, onClose }) => {
  const navigate = useNavigate()
  const { t } = useLanguage()

  const handleGoToSubscription = () => {
    navigate('/doctor/subscription-plans')
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
                <i className="fa-solid fa-crown text-warning me-2"></i>
                {t('doctorModals.buySubscription')}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label={t('doctorModals.close')}></button>
            </div>
            <div className="modal-body">
              <div className="text-center mb-4">
                <i className="fa-solid fa-crown" style={{ fontSize: '64px', color: '#ffc107' }}></i>
              </div>
              <h6 className="text-center mb-3">{t('doctorModals.profileComplete')}</h6>
              <p className="text-muted text-center mb-4">
                {t('doctorModals.subscriptionDescription')}
              </p>
              <div className="alert alert-warning mb-0">
                <i className="fa-solid fa-exclamation-triangle me-2"></i>
                <strong>{t('doctorModals.important')}</strong> {t('doctorModals.noBooking')}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                {t('doctorModals.later')}
              </button>
              <button type="button" className="btn btn-primary" onClick={handleGoToSubscription}>
                <i className="fa-solid fa-crown me-2"></i>
                {t('doctorModals.viewPlans')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default BuySubscriptionModal
