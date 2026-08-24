import { Link } from 'react-router-dom'

const PharmacySetupModal = ({ setup, role }) => {
  if (!setup || setup.isPublic) return null

  const isParapharmacy = String(role || '').toUpperCase() === 'PARAPHARMACY'
  const accountLabel = isParapharmacy ? 'Parapharmacy' : 'Pharmacy'
  const requirements = Array.isArray(setup.requirements) ? setup.requirements : []

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
      <div className="modal fade show" style={{ display: 'block', zIndex: 1050 }} role="dialog" aria-modal="true" aria-label={`${accountLabel} setup`}>
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content border-0 shadow-lg overflow-hidden">
            <div className="p-4 text-white" style={{ background: 'linear-gradient(135deg, #0b5d5b, #118f8a)' }}>
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 50, height: 50, background: 'rgba(255,255,255,.16)' }}><i className="fa-solid fa-store" style={{ fontSize: 20 }}></i></div>
                <div><h4 className="mb-1">Finish your {accountLabel} setup</h4><div className="small" style={{ opacity: .9 }}>Complete the required steps to publish your profile and manage products.</div></div>
              </div>
            </div>
            <div className="modal-body p-4">
              <div className="d-grid gap-3">
                {requirements.map((requirement) => (
                  <div key={requirement.key} className="d-flex align-items-center gap-3 border rounded-3 p-3">
                    <div className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${requirement.complete ? 'bg-success text-white' : 'bg-light text-muted'}`} style={{ width: 38, height: 38 }}>
                      <i className={`fa-solid ${requirement.complete ? 'fa-check' : requirement.key === 'subscription' ? 'fa-crown' : 'fa-user-pen'}`}></i>
                    </div>
                    <div className="flex-grow-1"><div className="fw-semibold">{requirement.label}</div><div className={`small ${requirement.complete ? 'text-success' : 'text-muted'}`}>{requirement.complete ? 'Completed' : 'Required to continue'}</div></div>
                    {!requirement.complete && <Link to={requirement.key === 'subscription' ? '/pharmacy-admin/subscription' : '/pharmacy-admin/profile'} className="btn btn-sm btn-outline-primary">Open</Link>}
                  </div>
                ))}
              </div>
              <div className="alert alert-light border mt-4 mb-0 small"><i className="fa-solid fa-circle-info me-2 text-primary"></i>Your profile becomes visible and product management unlocks automatically as soon as every required step is complete.</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default PharmacySetupModal
