import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { useAuth } from '../../contexts/AuthContext'
import { useSubscriptionPlans } from '../../queries/subscriptionQueries'
import { useMyPetStoreSubscription } from '../../queries/petStoreQueries'
import { useBuyPetStoreSubscription } from '../../mutations/petStoreMutations'

const PharmacyAdminSubscription = () => {
  const { user } = useAuth()
  const role = String(user?.role || '').toUpperCase()

  const [selectedPlan, setSelectedPlan] = useState(null)

  const plansQuery = useSubscriptionPlans({ planType: 'PET_STORE' })
  const mySubQuery = useMyPetStoreSubscription({ enabled: role === 'PET_STORE' })
  const buy = useBuyPetStoreSubscription()

  const plans = useMemo(() => {
    const payload = plansQuery.data?.data ?? plansQuery.data
    const data = payload?.data ?? payload
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.plans)) return data.plans
    return []
  }, [plansQuery.data])

  const mySub = useMemo(() => {
    const payload = mySubQuery.data?.data ?? mySubQuery.data
    return payload?.data ?? payload
  }, [mySubQuery.data])

  const currentPlanId = mySub?.subscriptionPlan?._id || mySub?.subscriptionPlan

  const formatPrice = (price) => {
    if (price === undefined || price === null) return '€0.00'
    return `€${Number(price).toFixed(2)}`
  }

  const formatPlanTitle = (name) => {
    const n = String(name || '').trim().toUpperCase()
    if (n === 'STARTER') return 'Starter Plan'
    if (n === 'PRO') return 'Pro Plan'
    if (n === 'PREMIUM') return 'Premium Plan'
    return name || 'Plan'
  }

  const formatDuration = (days) => {
    const d = Number(days)
    if (!Number.isFinite(d) || d <= 0) return '—'
    const months = Math.round(d / 30)
    if (months <= 1) return '1 month'
    return `${months} months`
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const onConfirmBuy = async () => {
    if (!selectedPlan?._id) return
    try {
      await buy.mutateAsync({ planId: selectedPlan._id })
      toast.success('Subscription updated')
      setSelectedPlan(null)
    } catch (error) {
      toast.error(error?.message || 'Failed to purchase subscription')
    }
  }

  return (
    <div>
      <div className="page-header">
        <h3 className="page-title">Subscription</h3>
      </div>

      {role === 'PARAPHARMACY' && (
        <div className="alert alert-info">
          Parapharmacy accounts do not require a subscription.
        </div>
      )}

      {role !== 'PET_STORE' ? null : plansQuery.isLoading || mySubQuery.isLoading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : plansQuery.isError ? (
        <div className="alert alert-danger">{plansQuery.error?.message || 'Failed to load plans'}</div>
      ) : mySubQuery.isError ? (
        <div className="alert alert-danger">{mySubQuery.error?.message || 'Failed to load subscription'}</div>
      ) : (
        <>
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap" style={{ gap: 12 }}>
                <div>
                  <h5 className="mb-1">Current Subscription</h5>
                  {mySub?.subscriptionPlan ? (
                    <>
                      <div className="text-muted">
                        Plan: <strong>{formatPlanTitle(mySub.subscriptionPlan?.name) || '—'}</strong>
                      </div>
                      <div className="text-muted">
                        {mySub?.hasActiveSubscription ? (
                          <>Expires on: {formatDate(mySub.subscriptionExpiresAt)}</>
                        ) : (
                          <>Expired on: {formatDate(mySub.subscriptionExpiresAt)}</>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-muted">No active subscription</div>
                  )}
                </div>
                <div>
                  <span className={`badge ${mySub?.hasActiveSubscription ? 'bg-success' : 'bg-danger'}`}>
                    {mySub?.hasActiveSubscription ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {plans.length === 0 ? (
            <div className="alert alert-info">No plans available.</div>
          ) : (
            <div className="row">
              {plans.map((plan) => {
                const isCurrent = plan?._id && plan._id === currentPlanId
                return (
                  <div key={plan._id} className="col-lg-4 col-md-6 mb-4">
                    <div className={`card ${isCurrent ? 'border-success' : ''}`}>
                      <div className="card-body text-center">
                        <h4 className="mb-2">{formatPlanTitle(plan.name)}</h4>
                        <div className="mb-3">
                          <h2 className="mb-0">{formatPrice(plan.price)}</h2>
                          <div className="text-muted small">Full access for {formatDuration(plan.durationInDays)}</div>
                        </div>

                        <div className="mb-3">
                          {plan.features && plan.features.length > 0 ? (
                            <ul className="list-unstyled mb-0">
                              {plan.features.map((f, idx) => (
                                <li key={idx} className="mb-1">
                                  <i className="fe fe-check-circle text-success me-2"></i>
                                  {f}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="text-muted">Full access</div>
                          )}
                        </div>

                        {isCurrent ? (
                          <button className="btn btn-outline-success w-100" disabled>
                            Current Plan
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary w-100"
                            onClick={() => setSelectedPlan(plan)}
                            disabled={buy.isPending}
                          >
                            Buy Plan
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {selectedPlan && (
            <>
              <div
                className="modal-backdrop fade show"
                onClick={() => setSelectedPlan(null)}
                style={{ zIndex: 1040 }}
              ></div>
              <div
                className="modal fade show"
                style={{ display: 'block', zIndex: 1050 }}
                tabIndex="-1"
                role="dialog"
                aria-modal="true"
                onClick={(e) => {
                  if (e.target.classList.contains('modal')) setSelectedPlan(null)
                }}
              >
                <div className="modal-dialog modal-dialog-centered" role="document" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Confirm Purchase</h5>
                      <button type="button" className="btn-close" onClick={() => setSelectedPlan(null)}></button>
                    </div>
                    <div className="modal-body">
                      <div className="mb-2">
                        Plan: <strong>{selectedPlan.name}</strong>
                      </div>
                      <div className="mb-2">
                        Price: <strong>{formatPrice(selectedPlan.price)}</strong>
                      </div>
                      <div className="text-muted small">This will activate immediately.</div>
                    </div>
                    <div className="modal-footer">
                      <button className="btn btn-secondary" onClick={() => setSelectedPlan(null)} disabled={buy.isPending}>
                        Cancel
                      </button>
                      <button className="btn btn-primary" onClick={onConfirmBuy} disabled={buy.isPending}>
                        {buy.isPending ? 'Processing...' : 'Confirm & Pay'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default PharmacyAdminSubscription
