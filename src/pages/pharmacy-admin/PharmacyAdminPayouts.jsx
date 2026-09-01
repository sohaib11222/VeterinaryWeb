import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { useBalance, useWithdrawalRequests } from '../../queries/balanceQueries'
import { useRequestWithdrawal } from '../../mutations/balanceMutations'

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
      toast.error('Enter a valid amount')
      return
    }
    const normalizedStripeAccountId = stripeAccountId.trim()
    if (!/^acct_[A-Za-z0-9]+$/.test(normalizedStripeAccountId)) {
      toast.error('Enter a valid Stripe Connected Account ID (acct_...)')
      return
    }

    try {
      await requestWithdrawal.mutateAsync({
        amount: n,
        paymentMethod,
        stripeAccountId: normalizedStripeAccountId,
        paymentDetails: paymentDetails.trim(),
      })
      toast.success('Withdrawal request submitted')
      setAmount('')
      setStripeAccountId('')
      setPaymentDetails('')
    } catch (error) {
      toast.error(error?.message || 'Failed to request withdrawal')
    }
  }

  return (
    <div>
      <div className="page-header">
        <h3 className="page-title">Payouts</h3>
      </div>

      <div className="card">
        <div className="card-body">
          {balanceQuery.isLoading ? (
            <div className="text-center py-2">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : balanceQuery.isError ? (
            <div className="alert alert-danger">{balanceQuery.error?.message || 'Failed to load balance'}</div>
          ) : (
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div>
                <div className="text-muted">Available Balance</div>
                <h4 className="mb-0">{typeof balance === 'number' ? balance.toFixed(2) : balance}</h4>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h5 className="mb-3">Request Withdrawal</h5>
          <p className="text-muted mb-3">
            Payouts are sent to your Stripe Connect account. Your Stripe secret key is never requested or stored here.
          </p>
          <form onSubmit={submit}>
            <div className="row">
              <div className="col-lg-3 mb-3">
                <label className="form-label">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="col-lg-3 mb-3">
                <label className="form-label">Payment Method</label>
                <div className="form-control bg-light" aria-label="Payment method">Stripe</div>
              </div>
              <div className="col-lg-3 mb-3">
                <label className="form-label" htmlFor="stripe-account-id">Stripe Connected Account ID</label>
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
                <label className="form-label" htmlFor="stripe-payout-note">Payout note <span className="text-muted">(optional)</span></label>
                <input
                  id="stripe-payout-note"
                  className="form-control"
                  placeholder="Reference for the admin"
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                />
              </div>
              <div className="col-12">
                <button type="submit" className="btn btn-primary" disabled={requestWithdrawal.isPending}>
                  {requestWithdrawal.isPending ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h5 className="mb-3">Withdrawal Requests</h5>

          {requestsQuery.isLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : requestsQuery.isError ? (
            <div className="alert alert-danger">{requestsQuery.error?.message || 'Failed to load requests'}</div>
          ) : requests.length === 0 ? (
            <div className="alert alert-info mb-0">No withdrawal requests yet.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Method</th>
                    <th>Net Payout</th>
                    <th>Stripe Transfer</th>
                    <th>Requested</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => {
                    const id = r?._id || r?.id
                    const amt = r?.amount
                    const status = r?.status
                    const method = r?.paymentMethod === 'STRIPE' ? 'Stripe' : r?.paymentMethod
                    const createdAt = r?.createdAt ? new Date(r.createdAt).toLocaleString() : '—'
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
