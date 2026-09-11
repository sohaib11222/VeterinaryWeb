import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { useBalance, useWithdrawalRequests } from '../../queries/balanceQueries'
import { useRequestWithdrawal } from '../../mutations/balanceMutations'
import { useLanguage } from '../../contexts/LanguageContext'

const normalizeListPayload = (payload) => {
  const outer = payload?.data ?? payload
  const list = outer?.items ?? outer?.requests ?? outer?.data?.items ?? outer?.data?.requests
  const total = outer?.total ?? outer?.count ?? outer?.data?.total ?? outer?.data?.count
  if (Array.isArray(list)) {
    return { items: list, total: typeof total === 'number' ? total : list.length }
  }
  if (Array.isArray(outer)) {
    return { items: outer, total: outer.length }
  }
  return { items: [], total: 0 }
}

const PharmacyAdminPayouts = () => {
  const { t, language } = useLanguage()
  const balanceQuery = useBalance()
  const requestsQuery = useWithdrawalRequests()
  const requestWithdrawal = useRequestWithdrawal()

  const [amount, setAmount] = useState('')
  const paymentMethod = 'STRIPE'
  const [stripeAccountId, setStripeAccountId] = useState('')
  const [paymentDetails, setPaymentDetails] = useState('')

  const balance = useMemo(() => {
    const payload = balanceQuery.data?.data ?? balanceQuery.data
    return payload?.balance ?? payload?.data?.balance ?? 0
  }, [balanceQuery.data])

  const { items: requests } = useMemo(
    () => normalizeListPayload(requestsQuery.data),
    [requestsQuery.data]
  )

  const submit = async (e) => {
    e.preventDefault()
    const n = Number(amount)
    if (!Number.isFinite(n) || n <= 0) {
      toast.error(t('pharmacyAdmin.payouts.enterAmount'))
      return
    }
    const normalizedStripeAccountId = stripeAccountId.trim()
    if (!/^acct_[A-Za-z0-9]+$/.test(normalizedStripeAccountId)) {
      toast.error(t('pharmacyAdmin.payouts.validStripe'))
      return
    }

    try {
      await requestWithdrawal.mutateAsync({
        amount: n,
        paymentMethod,
        stripeAccountId: normalizedStripeAccountId,
        paymentDetails: paymentDetails.trim(),
      })
      toast.success(t('pharmacyAdmin.payouts.submitted'))
      setAmount('')
      setStripeAccountId('')
      setPaymentDetails('')
    } catch (error) {
      toast.error(error?.message || t('pharmacyAdmin.payouts.failedSubmit'))
    }
  }

  return (
    <div>
      <div className="page-header">
        <h3 className="page-title">{t('pharmacyAdmin.payouts.title')}</h3>
      </div>

      <div className="card">
        <div className="card-body">
          {balanceQuery.isLoading ? (
            <div className="text-center py-2">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">{t('pharmacyAdmin.payouts.loading')}</span>
              </div>
            </div>
          ) : balanceQuery.isError ? (
            <div className="alert alert-danger">{balanceQuery.error?.message || t('pharmacyAdmin.payouts.failedBalance')}</div>
          ) : (
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div>
                <div className="text-muted">{t('pharmacyAdmin.payouts.availableBalance')}</div>
                <h4 className="mb-0">{typeof balance === 'number' ? balance.toFixed(2) : balance}</h4>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h5 className="mb-3">{t('pharmacyAdmin.payouts.requestWithdrawal')}</h5>
          <p className="text-muted mb-3">
            {t('pharmacyAdmin.payouts.description')}
          </p>
          <form onSubmit={submit}>
            <div className="row">
              <div className="col-lg-3 mb-3">
                <label className="form-label">{t('pharmacyAdmin.payouts.amount')}</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="col-lg-3 mb-3">
                <label className="form-label">{t('pharmacyAdmin.payouts.paymentMethod')}</label>
                <div className="form-control bg-light" aria-label={t('pharmacyAdmin.payouts.paymentMethod')}>Stripe</div>
              </div>
              <div className="col-lg-3 mb-3">
                <label className="form-label" htmlFor="stripe-account-id">{t('pharmacyAdmin.payouts.stripeAccount')}</label>
                <input
                  id="stripe-account-id"
                  className="form-control"
                  placeholder="acct_..."
                  value={stripeAccountId}
                  onChange={(e) => setStripeAccountId(e.target.value)}
                  autoCapitalize="none"
                  spellCheck="false"
                />
              </div>
              <div className="col-lg-3 mb-3">
                <label className="form-label" htmlFor="stripe-payout-note">{t('pharmacyAdmin.payouts.payoutNote')} <span className="text-muted">{t('pharmacyAdmin.payouts.optional')}</span></label>
                <input
                  id="stripe-payout-note"
                  className="form-control"
                  placeholder={t('pharmacyAdmin.payouts.reference')}
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                />
              </div>
              <div className="col-12">
                <button type="submit" className="btn btn-primary" disabled={requestWithdrawal.isPending}>
                  {requestWithdrawal.isPending ? t('pharmacyAdmin.payouts.submitting') : t('pharmacyAdmin.payouts.submit')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h5 className="mb-3">{t('pharmacyAdmin.payouts.requests')}</h5>

          {requestsQuery.isLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">{t('pharmacyAdmin.payouts.loading')}</span>
              </div>
            </div>
          ) : requestsQuery.isError ? (
            <div className="alert alert-danger">{requestsQuery.error?.message || t('pharmacyAdmin.payouts.failedRequests')}</div>
          ) : requests.length === 0 ? (
            <div className="alert alert-info mb-0">{t('pharmacyAdmin.payouts.empty')}</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>{t('pharmacyAdmin.payouts.amount')}</th>
                    <th>{t('pharmacyAdmin.payouts.status')}</th>
                    <th>{t('pharmacyAdmin.payouts.method')}</th>
                    <th>{t('pharmacyAdmin.payouts.netPayout')}</th>
                    <th>{t('pharmacyAdmin.payouts.stripeTransfer')}</th>
                    <th>{t('pharmacyAdmin.payouts.requested')}</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => {
                    const id = r?._id || r?.id
                    const amt = r?.amount
                    const status = r?.status
                    const method = r?.paymentMethod === 'STRIPE' ? 'Stripe' : r?.paymentMethod
                    const createdAt = r?.createdAt ? new Date(r.createdAt).toLocaleString(language === 'it' ? 'it-IT' : 'en-GB') : '—'
                    return (
                      <tr key={id}>
                        <td>{typeof amt === 'number' ? amt.toFixed(2) : amt}</td>
                        <td>{status}</td>
                        <td>{method}</td>
                        <td>{typeof r?.netAmount === 'number' ? r.netAmount.toFixed(2) : '—'}</td>
                        <td>{r?.stripeTransferId || r?.stripePayoutFailure || '—'}</td>
                        <td>{createdAt}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PharmacyAdminPayouts
