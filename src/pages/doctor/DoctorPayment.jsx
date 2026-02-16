import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { useBalance, useWithdrawalRequests } from '../../queries/balanceQueries'
import { useRequestWithdrawal } from '../../mutations/balanceMutations'

const DoctorPayment = () => {
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('STRIPE')
  const [paymentDetails, setPaymentDetails] = useState('')
  const [page, setPage] = useState(1)

  const limit = 10
  const balanceQuery = useBalance()
  const requestsQuery = useWithdrawalRequests({ page, limit })
  const requestWithdrawal = useRequestWithdrawal()

  const balance = useMemo(() => {
    const outer = balanceQuery.data?.data ?? balanceQuery.data
    return outer?.balance ?? outer?.data?.balance ?? 0
  }, [balanceQuery.data])

  const { requests, pagination } = useMemo(() => {
    const outer = requestsQuery.data?.data ?? requestsQuery.data
    const payload = outer?.data ?? outer
    const list = payload?.requests ?? payload?.items ?? []
    const pag = payload?.pagination || { page: 1, limit, total: 0, pages: 1 }
    return {
      requests: Array.isArray(list) ? list : [],
      pagination: pag,
    }
  }, [requestsQuery.data])

  const statusBadge = (status) => {
    const s = String(status || '').toUpperCase()
    if (s === 'APPROVED' || s === 'COMPLETED') return <span className="badge badge-success">Approved</span>
    if (s === 'PENDING') return <span className="badge badge-warning">Pending</span>
    if (s === 'REJECTED') return <span className="badge badge-danger">Rejected</span>
    return <span className="badge badge-secondary">{s || '—'}</span>
  }

  const submitWithdrawal = async () => {
    const n = Number(amount)
    if (!Number.isFinite(n) || n <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    if (n > Number(balance || 0)) {
      toast.error('Insufficient balance')
      return
    }
    if (!paymentDetails.trim()) {
      toast.error('Please enter payout details')
      return
    }

    try {
      await requestWithdrawal.mutateAsync({
        amount: n,
        paymentMethod,
        paymentDetails: paymentDetails.trim(),
      })
      toast.success('Withdrawal request submitted successfully')
      setWithdrawModalOpen(false)
      setAmount('')
      setPaymentDetails('')
    } catch (error) {
      toast.error(error?.message || 'Failed to submit withdrawal request')
    }
  }

  return (
    <div className="content doctor-content">
      <div className="container">
        <div className="row">
          <div className="col-lg-4 col-xl-3 theiaStickySidebar"></div>

          <div className="col-lg-12 col-xl-12">
            <div className="dashboard-header">
              <h3>Payout Settings</h3>
            </div>

            <div className="payout-wrap">
              <div className="payout-title">
                <h4>Preferred payout method</h4>
                <p>Your earnings will be paid out using the method you provide when requesting a withdrawal.</p>
              </div>

              <div className="stripe-wrapper">
                <div className="stripe-box active">
                  <div className="stripe-img">
                    <img src="/assets/img/icons/stripe.svg" alt="img" />
                  </div>
                  <button className="btn" onClick={() => setWithdrawModalOpen(true)}>
                    <i className="fa-solid fa-gear"></i>Configure
                  </button>
                </div>
              </div>

              <div className="mt-3">
                <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                  <div>
                    <p className="mb-1 text-muted">Available Balance</p>
                    {balanceQuery.isLoading ? <h4 className="mb-0">—</h4> : <h4 className="mb-0">€{Number(balance || 0).toFixed(2)}</h4>}
                  </div>
                  <button className="btn btn-primary" onClick={() => setWithdrawModalOpen(true)} disabled={balanceQuery.isLoading || Number(balance || 0) <= 0}>
                    Request Withdrawal
                  </button>
                </div>
              </div>
            </div>

            <div className="dashboard-header">
              <h3>Withdrawal Requests</h3>
            </div>

            {requestsQuery.isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : requestsQuery.isError ? (
              <div className="alert alert-danger">{requestsQuery.error?.message || 'Failed to load withdrawal requests'}</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted">No withdrawal requests found</p>
              </div>
            ) : (
              <div className="custom-table">
                <div className="table-responsive">
                  <table className="table table-center mb-0">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Payment Method</th>
                        <th>Amount</th>
                        <th>Fee</th>
                        <th>Total Deducted</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((r) => {
                        const id = r?._id || r?.id
                        const createdAt = r?.requestedAt || r?.createdAt
                        return (
                          <tr key={id}>
                            <td>{createdAt ? new Date(createdAt).toLocaleDateString('en-GB') : '—'}</td>
                            <td>{r?.paymentMethod || '—'}</td>
                            <td>
                              <strong>€{Number(r?.amount || 0).toFixed(2)}</strong>
                              {r?.netAmount !== null && r?.netAmount !== undefined && r?.netAmount !== r?.amount && (
                                <small className="d-block text-muted">You receive: €{Number(r.netAmount).toFixed(2)}</small>
                              )}
                            </td>
                            <td>
                              {r?.withdrawalFeePercent !== null && r?.withdrawalFeePercent !== undefined ? (
                                <>
                                  <span className="text-muted">{Number(r.withdrawalFeePercent).toFixed(0)}%</span>
                                  {r?.withdrawalFeeAmount !== null && r?.withdrawalFeeAmount !== undefined && (
                                    <small className="d-block text-muted">€{Number(r.withdrawalFeeAmount).toFixed(2)}</small>
                                  )}
                                </>
                              ) : (
                                <span className="text-muted">No fee</span>
                              )}
                            </td>
                            <td>
                              {r?.totalDeducted !== null && r?.totalDeducted !== undefined ? (
                                <strong className="text-danger">€{Number(r.totalDeducted).toFixed(2)}</strong>
                              ) : (
                                <span>€{Number(r?.amount || 0).toFixed(2)}</span>
                              )}
                            </td>
                            <td>{statusBadge(r?.status)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!requestsQuery.isLoading && (pagination?.pages || 1) > 1 && (
              <div className="pagination dashboard-pagination">
                <ul>
                  <li>
                    <button className="page-link" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                      <i className="fa-solid fa-chevron-left"></i>
                    </button>
                  </li>
                  {Array.from({ length: pagination.pages }, (_, idx) => idx + 1).map((p) => (
                    <li key={p}>
                      <button className={`page-link ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>
                        {p}
                      </button>
                    </li>
                  ))}
                  <li>
                    <button className="page-link" onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages}>
                      <i className="fa-solid fa-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {withdrawModalOpen && (
        <>
          <div className="modal fade show" style={{ display: 'block' }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Request Withdrawal</h5>
                  <button type="button" className="btn-close" onClick={() => setWithdrawModalOpen(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="form-group mb-3">
                    <label>Available Balance</label>
                    <input type="text" className="form-control" value={`€${Number(balance || 0).toFixed(2)}`} disabled />
                  </div>
                  <div className="form-group mb-3">
                    <label>
                      Amount to Withdraw <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      min="0"
                      max={Number(balance || 0)}
                      step="0.01"
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label>
                      Payment Method <span className="text-danger">*</span>
                    </label>
                    <select className="form-control" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      <option value="STRIPE">Stripe</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="PAYPAL">PayPal</option>
                    </select>
                  </div>
                  <div className="form-group mb-3">
                    <label>
                      Payout Details <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={paymentDetails}
                      onChange={(e) => setPaymentDetails(e.target.value)}
                      placeholder="IBAN / account no / PayPal email / Stripe email"
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setWithdrawModalOpen(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={submitWithdrawal}
                    disabled={requestWithdrawal.isPending || !amount || !paymentDetails.trim()}
                  >
                    {requestWithdrawal.isPending ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  )
}

export default DoctorPayment
