import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { useMySubscription, useSubscriptionPlans } from '../../queries'
import { usePurchaseSubscriptionPlan } from '../../mutations'

const SubscriptionPlans = () => {
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const { data: plansResponse, isLoading: plansLoading } = useSubscriptionPlans()
  const { data: myResponse, isLoading: myLoading } = useMySubscription()
  const purchase = usePurchaseSubscriptionPlan()

  const plans = useMemo(() => {
    const payload = plansResponse?.data ?? plansResponse
    const list = payload?.data ?? payload
    if (!Array.isArray(list)) return []

    const uniqueByName = new Map()
    list.forEach((p) => {
      const key = String(p?.name || '').trim().toUpperCase()
      if (!key) return
      if (!uniqueByName.has(key)) uniqueByName.set(key, p)
    })

    return Array.from(uniqueByName.values())
  }, [plansResponse])

  const mySubscription = useMemo(() => {
    const payload = myResponse?.data ?? myResponse
    return payload?.data ?? payload
  }, [myResponse])

  const currentPlanId = mySubscription?.subscriptionPlan?._id
  const expiresAt = mySubscription?.expiresAt
  const hasActiveSubscription = !!mySubscription?.hasActiveSubscription
  const usage = mySubscription?.usage
  const remaining = mySubscription?.remaining

  const handleUpgrade = (plan) => {
    setSelectedPlan(plan)
    setShowPaymentModal(true)
  }

  const handlePayment = async () => {
    if (!selectedPlan?._id) return
    try {
      await purchase.mutateAsync({ planId: selectedPlan._id })
      toast.success('Subscription updated')
      setShowPaymentModal(false)
      setSelectedPlan(null)
    } catch (err) {
      toast.error(err?.message || 'Failed to purchase subscription')
    }
  }

  return (
    <div className="content veterinary-dashboard">
      <div className="container-fluid">
        <div className="row">
          <div className="col-lg-3 col-xl-2 theiaStickySidebar">
            {/* Sidebar is handled by DashboardLayout */}
          </div>
          <div className="col-lg-12 col-xl-12">
            {/* Veterinary Subscription Header */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="veterinary-dashboard-header">
                  <h2 className="dashboard-title">
                    <i className="fa-solid fa-paw me-3"></i>
                    Veterinary Subscription Plans
                  </h2>
                  <p className="dashboard-subtitle">Choose a plan that best fits your veterinary practice needs</p>
                </div>
              </div>
            </div>

            {/* Current Plan Info */}
            <div className="card veterinary-card mb-4">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h5 className="mb-1">
                      Current Plan: {hasActiveSubscription ? (mySubscription?.subscriptionPlan?.name || '—') : 'No active plan'}
                    </h5>
                    <p className="text-muted mb-0">
                      {hasActiveSubscription && expiresAt ? `Renews on: ${new Date(expiresAt).toLocaleDateString()}` : 'Subscribe to unlock booking & chat'}
                    </p>
                    {hasActiveSubscription && usage && remaining && (
                      <p className="text-muted mb-0 mt-2">
                        Usage:
                        {' '}
                        Private {usage.privateConsultations} / {remaining.privateConsultations === null ? 'Unlimited' : usage.privateConsultations + (remaining.privateConsultations || 0)}
                        , Video {usage.videoConsultations} / {remaining.videoConsultations === null ? 'Unlimited' : usage.videoConsultations + (remaining.videoConsultations || 0)}
                        , Chat {usage.chatSessions} / {remaining.chatSessions === null ? 'Unlimited' : usage.chatSessions + (remaining.chatSessions || 0)}
                      </p>
                    )}
                  </div>
                  <div>
                    <span className={`badge ${hasActiveSubscription ? 'bg-success' : 'bg-secondary'}`}>
                      {hasActiveSubscription ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Plans */}
            <div className="row">
              {plansLoading ? (
                <div className="col-12 text-center py-5 text-muted">Loading plans...</div>
              ) : (
                plans.map((plan) => {
                  const isCurrent = currentPlanId && String(plan._id) === String(currentPlanId)
                  const popular = String(plan?.name || '').toUpperCase() === 'PRO'
                  return (
                    <div key={plan._id} className="col-lg-4 col-md-6 mb-4">
                      <div className={`card veterinary-subscription-card ${popular ? 'popular-plan' : ''} ${isCurrent ? 'current-plan' : ''}`}>
                        {popular && (
                          <div className="popular-badge">
                            <span className="badge bg-primary">Most Popular</span>
                          </div>
                        )}
                        {isCurrent && (
                          <div className="current-badge">
                            <span className="badge bg-success">Current Plan</span>
                          </div>
                        )}
                        <div className="card-body text-center">
                          <h4 className="mb-3">
                            <i className="fa-solid fa-paw me-2"></i>
                            {plan?.name} PLAN
                          </h4>
                          <div className="pricing mb-4">
                            <h2 className="mb-0">€{plan?.price}</h2>
                            <p className="text-muted">per month</p>
                          </div>
                          <ul className="list-unstyled plan-features mb-4">
                            {(plan?.features || []).map((feature, index) => (
                              <li key={index} className="mb-2">
                                <i className="fa-solid fa-check-circle text-success me-2"></i>
                                {feature}
                              </li>
                            ))}
                          </ul>
                          {isCurrent ? (
                            <button type="button" className="btn veterinary-btn-secondary w-100" disabled>
                              Current Plan
                            </button>
                          ) : (
                            <button
                              className={`btn w-100 veterinary-btn-primary ${popular ? '' : 'veterinary-btn-outline'}`}
                              onClick={() => handleUpgrade(plan)}
                            >
                              Choose Plan
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
              <>
                <div
                  className="modal-backdrop fade show"
                  style={{ zIndex: 1040 }}
                  onMouseDown={() => setShowPaymentModal(false)}
                ></div>
                <div className="modal fade show" style={{ display: 'block', zIndex: 1050 }} tabIndex="-1">
                <div
                  className="modal-dialog modal-dialog-centered"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="modal-content veterinary-modal">
                    <div className="modal-header">
                      <h5 className="modal-title">
                        <i className="fa-solid fa-paw me-2"></i>
                        Upgrade Veterinary Subscription
                      </h5>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => setShowPaymentModal(false)}
                      ></button>
                    </div>
                    <div className="modal-body">
                      <div className="mb-3">
                        <h6>
                          <i className="fa-solid fa-box me-2"></i>
                          Selected Plan: {selectedPlan?.name} PLAN
                        </h6>
                        <p className="text-muted">
                          <i className="fa-solid fa-dollar-sign me-2"></i>
                          Price: €{selectedPlan?.price} per month
                        </p>
                      </div>
                      <div className="payment-methods mb-3">
                        <h6 className="mb-3">
                          <i className="fa-solid fa-credit-card me-2"></i>
                          Payment Method
                        </h6>
                        <div className="form-check mb-2">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="paymentMethod"
                            id="card"
                            defaultChecked
                          />
                          <label className="form-check-label" htmlFor="card">
                            <i className="fa-solid fa-credit-card me-2"></i>
                            Credit/Debit Card
                          </label>
                        </div>
                        <div className="form-check mb-2">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="paymentMethod"
                            id="paypal"
                          />
                          <label className="form-check-label" htmlFor="paypal">
                            <i className="fa-solid fa-dollar-sign me-2"></i>
                            PayPal
                          </label>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="paymentMethod"
                            id="bank"
                          />
                          <label className="form-check-label" htmlFor="bank">
                            <i className="fa-solid fa-building-columns me-2"></i>
                            Bank Transfer
                          </label>
                        </div>
                      </div>
                      <div className="card-details">
                        <div className="mb-3">
                          <label className="form-label">Card Number</label>
                          <input type="text" className="form-control veterinary-input" placeholder="1234 5678 9012 3456" />
                        </div>
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label className="form-label">Expiry Date</label>
                            <input type="text" className="form-control veterinary-input" placeholder="MM/YY" />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">CVV</label>
                            <input type="text" className="form-control veterinary-input" placeholder="123" />
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Cardholder Name</label>
                          <input type="text" className="form-control veterinary-input" placeholder="John Doe" />
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn veterinary-btn-secondary"
                        onClick={() => setShowPaymentModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn veterinary-btn-primary"
                        onClick={handlePayment}
                        disabled={purchase.isPending}
                      >
                        <i className="fa-solid fa-lock me-2"></i>
                        {purchase.isPending ? 'Processing...' : 'Pay Now'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              </>
            )}

            {/* Info Alert */}
            <div className="alert alert-info mt-4 veterinary-alert">
              <div className="d-flex">
                <div className="flex-shrink-0">
                  <i className="fa-solid fa-info-circle"></i>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="alert-heading">Veterinary Subscription Information</h6>
                  <p className="mb-0 small">
                    You can upgrade or downgrade your veterinary care plan at any time. Changes will be reflected immediately, 
                    and billing will be prorated. Cancel anytime with no long-term commitment for your pet practice.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionPlans

