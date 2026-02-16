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
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER')
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
    if (!paymentDetails.trim()) {
      toast.error('Payment details are required')
      return
    }

    try {
      await requestWithdrawal.mutateAsync({
        amount: n,
        paymentMethod,
        paymentDetails: paymentDetails.trim(),
      })
      toast.success('Withdrawal request submitted')
      setAmount('')
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
          <form onSubmit={submit}>
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Payment Method</label>
                <select
                  className="form-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="PAYPAL">PayPal</option>
                  <option value="STRIPE">Stripe</option>
                </select>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Payment Details</label>
                <input
                  className="form-control"
                  placeholder="IBAN / account no / PayPal email"
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
                    <th>Requested</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => {
                    const id = r?._id || r?.id
                    const amt = r?.amount
                    const status = r?.status
                    const method = r?.paymentMethod
                    const createdAt = r?.createdAt ? new Date(r.createdAt).toLocaleString() : '—'
                    return (
                      <tr key={id}>
                        <td>{typeof amt === 'number' ? amt.toFixed(2) : amt}</td>
                        <td>{status}</td>
                        <td>{method}</td>
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
