import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useLanguage } from '../../contexts/LanguageContext'
import DoctorProfileTabs from '../../components/doctor/DoctorProfileTabs'
import { useActiveInsuranceCompanies } from '../../queries/insuranceQueries'
import { useVeterinarianProfile } from '../../queries/veterinarianQueries'
import { useUpdateVeterinarianProfile } from '../../mutations/veterinarianMutations'
import { api } from '../../utils/api'
import { getImageUrl } from '../../utils/apiConfig'
import { API_ROUTES } from '../../utils/apiConfig'
import { getNextTabPath } from '../../utils/profileSettingsTabs'

const DoctorInsuranceSettings = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const { data: profileRes, isLoading: profileLoading } = useVeterinarianProfile()
  const profile = useMemo(() => profileRes?.data ?? profileRes ?? null, [profileRes])

  const { data: insuranceRes, isLoading: insuranceLoading } = useActiveInsuranceCompanies({
    refetchOnWindowFocus: false,
  })

  const insuranceCompanies = useMemo(() => {
    const payload = insuranceRes?.data ?? insuranceRes
    if (Array.isArray(payload)) return payload
    return []
  }, [insuranceRes])

  const [convenzionato, setConvenzionato] = useState(false)
  const [selectedInsuranceIds, setSelectedInsuranceIds] = useState([])

  useEffect(() => {
    if (!profile) return
    setConvenzionato(profile?.convenzionato === true)
    const list = Array.isArray(profile?.insuranceCompanies) ? profile.insuranceCompanies : []
    const ids = list
      .map((i) => (typeof i === 'object' && i !== null ? i._id || i.id : i))
      .filter(Boolean)
      .map(String)
    setSelectedInsuranceIds(ids)
  }, [profile])

  const updateProfile = useUpdateVeterinarianProfile()

  const handleConvenzionatoChange = (e) => {
    const enabled = e.target.checked
    setConvenzionato(enabled)
    if (!enabled) {
      setSelectedInsuranceIds([])
    }
  }

  const handleInsuranceToggle = (insuranceId) => {
    const idStr = String(insuranceId)
    setSelectedInsuranceIds((prev) => (prev.includes(idStr) ? prev.filter((x) => x !== idStr) : [...prev, idStr]))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (convenzionato && selectedInsuranceIds.length === 0) {
      toast.warning(t('doctorRemaining.insurance.required'))
      return
    }

    updateProfile.mutate(
      {
        convenzionato: convenzionato === true,
        acceptsInsurance: convenzionato === true,
        insuranceCompanies: convenzionato ? selectedInsuranceIds : [],
      },
      {
        onSuccess: async () => {
          toast.success(t('doctorRemaining.insurance.updated'))

          try {
            const refreshed = await api.get(API_ROUTES.VETERINARIANS.PROFILE)
            const nextProfile = refreshed?.data ?? refreshed
            const isProfileCompleted = nextProfile?.profileCompleted === true
            if (!isProfileCompleted) {
              const nextTabPath = getNextTabPath(location.pathname)
              if (nextTabPath) {
                setTimeout(() => navigate(nextTabPath), 500)
              }
            }
          } catch {
            const nextTabPath = getNextTabPath(location.pathname)
            if (nextTabPath) {
              setTimeout(() => navigate(nextTabPath), 500)
            }
          }
        },
        onError: (err) => toast.error(err?.data?.message || err?.message || t('doctorRemaining.insurance.updateFailed')),
      }
    )
  }

  return (
    <div className="content veterinary-dashboard">
      <div className="container-fluid">
        <div className="row">
          <div className="col-lg-3 col-xl-2 theiaStickySidebar">
            {/* Sidebar will be rendered by DashboardLayout */}
          </div>
          <div className="col-lg-12 col-xl-12">
            <div className="row mb-4">
              <div className="col-12">
                <div className="veterinary-dashboard-header">
                  <h2 className="dashboard-title">
                    <i className="fa-solid fa-shield-alt me-3"></i>
                    {t('doctorRemaining.insurance.title')}
                  </h2>
                  <p className="dashboard-subtitle">{t('doctorRemaining.insurance.subtitle')}</p>
                </div>
              </div>
            </div>

            <DoctorProfileTabs />

            <div className="dashboard-header border-0 mb-0">
              <h3>{t('doctorRemaining.insurance.section')}</h3>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="dashboard-card veterinary-card">
                <div className="dashboard-card-body">
                  <div className="form-wrap mb-4">
                    <label className="col-form-label">
                      {t('doctorRemaining.insurance.accept')} <span className="text-danger">*</span>
                    </label>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="convenzionato"
                        checked={convenzionato}
                        onChange={handleConvenzionatoChange}
                        disabled={updateProfile.isPending || profileLoading}
                      />
                      <label className="form-check-label" htmlFor="convenzionato">
                        {convenzionato ? t('doctorRemaining.insurance.yes') : t('doctorRemaining.insurance.no')}
                      </label>
                    </div>
                    <small className="form-text text-muted">
                      {t('doctorRemaining.insurance.acceptHint')}
                    </small>
                  </div>

                  {convenzionato && (
                    <div className="form-wrap">
                      <label className="col-form-label mb-3">
                        {t('doctorRemaining.insurance.companies')} <span className="text-danger">*</span>
                      </label>

                      {insuranceLoading ? (
                        <div className="text-center py-4">
                          <div className="spinner-border spinner-border-sm" role="status">
                            <span className="visually-hidden">{t('doctorRemaining.insurance.loading')}</span>
                          </div>
                          <p className="mt-2 mb-0">{t('doctorRemaining.insurance.loading')}</p>
                        </div>
                      ) : insuranceCompanies.length === 0 ? (
                        <div className="alert alert-warning mb-0">
                          <i className="fa-solid fa-exclamation-triangle me-2"></i>
                          {t('doctorRemaining.insurance.none')}
                        </div>
                      ) : (
                        <div className="row">
                          {insuranceCompanies.map((insurance) => {
                            const insuranceId = insurance._id || insurance.id
                            const idStr = String(insuranceId)
                            const isSelected = selectedInsuranceIds.includes(idStr)
                            const logoUrl = getImageUrl(insurance.logo)

                            return (
                              <div key={idStr} className="col-md-4 col-lg-3 mb-3">
                                <div
                                  className={`card insurance-company-card ${isSelected ? 'border-primary' : ''}`}
                                  style={{
                                    cursor: 'pointer',
                                    border: isSelected ? '2px solid #0E82FD' : '1px solid #dee2e6',
                                    transition: 'all 0.2s',
                                  }}
                                  onClick={() => handleInsuranceToggle(insuranceId)}
                                >
                                  <div className="card-body text-center p-3">
                                    {logoUrl ? (
                                      <img
                                        src={logoUrl}
                                        alt={insurance.name}
                                        style={{
                                          maxWidth: '100%',
                                          maxHeight: '60px',
                                          objectFit: 'contain',
                                          marginBottom: '10px',
                                        }}
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none'
                                          const next = e.currentTarget.nextSibling
                                          if (next?.style) next.style.display = 'flex'
                                        }}
                                      />
                                    ) : null}
                                    <div
                                      className="insurance-placeholder"
                                      style={{
                                        display: logoUrl ? 'none' : 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '60px',
                                        marginBottom: '10px',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '4px',
                                      }}
                                    >
                                      <i className="fa-solid fa-shield-halved fa-2x text-muted"></i>
                                    </div>
                                    <h6 className="mb-0" style={{ fontSize: '14px' }}>
                                      {insurance.name}
                                    </h6>
                                    <div className="mt-2">
                                      {isSelected ? (
                                        <i className="fa-solid fa-check-circle text-primary"></i>
                                      ) : (
                                        <i className="fa-regular fa-circle text-muted"></i>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {convenzionato && selectedInsuranceIds.length === 0 && insuranceCompanies.length > 0 && (
                        <div className="alert alert-info mt-3 mb-0">
                          <i className="fa-solid fa-info-circle me-2"></i>
                          {t('doctorRemaining.insurance.required')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-btn text-end mt-4">
                <Link to="/doctor/dashboard" className="btn veterinary-btn-secondary me-2">
                  <i className="fa-solid fa-times me-1"></i>{t('doctorRemaining.insurance.cancel')}
                </Link>
                <button
                  type="submit"
                  className="btn veterinary-start-btn prime-btn"
                  disabled={updateProfile.isPending || profileLoading || (convenzionato && insuranceLoading)}
                >
                  {updateProfile.isPending ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      {t('doctorRemaining.insurance.saving')}
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-save me-1"></i>{t('doctorRemaining.insurance.save')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorInsuranceSettings

