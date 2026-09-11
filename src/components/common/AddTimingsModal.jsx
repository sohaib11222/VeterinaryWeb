import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'

const AddTimingsModal = ({ show, onClose }) => {
  const navigate = useNavigate()
  const { t } = useLanguage()

  const handleGoToTimings = () => {
    navigate('/available-timings')
    onClose?.()
  }

  if (!show) return null

  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose} style={{ zIndex: 1040 }}></div>

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
                <i className="fa-solid fa-calendar-day text-primary me-2"></i>
                {t('doctorModals.addTimings')}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label={t('doctorModals.close')}></button>
            </div>
            <div className="modal-body">
              <div className="text-center mb-4">
                <i className="fa-solid fa-clock" style={{ fontSize: '64px', color: '#0d6efd' }}></i>
              </div>
              <h6 className="text-center mb-3">{t('doctorModals.addTimingTitle')}</h6>
              <p className="text-muted text-center mb-4">
                {t('doctorModals.addTimingDescription')}
              </p>
              <div className="alert alert-info mb-0">
                <i className="fa-solid fa-info-circle me-2"></i>
                <strong>{t('doctorModals.tip')}</strong> {t('doctorModals.timingExample')}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                {t('doctorModals.close')}
              </button>
              <button type="button" className="btn btn-primary" onClick={handleGoToTimings}>
                <i className="fa-solid fa-calendar-plus me-2"></i>
                {t('doctorModals.addTimingsNow')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AddTimingsModal
