import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { useRescheduleRequests } from '../../queries'
import { useApproveRescheduleRequest, useRejectRescheduleRequest } from '../../mutations/scheduleMutations'

const DoctorRescheduleRequests = () => {
  const requestsQuery = useRescheduleRequests({ status: 'PENDING' })
  const approve = useApproveRescheduleRequest()
  const reject = useRejectRescheduleRequest()

  const requests = useMemo(() => {
    const outer = requestsQuery.data?.data ?? requestsQuery.data
    const payload = outer?.data ?? outer
    return Array.isArray(payload) ? payload : Array.isArray(payload?.requests) ? payload.requests : []
  }, [requestsQuery.data])

  const [selected, setSelected] = useState(null)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)

  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [feePercentage, setFeePercentage] = useState(50)
  const [feeFixed, setFeeFixed] = useState('')
  const [notes, setNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')

  const openApprove = (r) => {
    setSelected(r)
    const pd = r?.preferredDate ? new Date(r.preferredDate) : null
    setNewDate(pd ? pd.toISOString().slice(0, 10) : '')
    setNewTime(r?.preferredTime || '')
    setFeePercentage(Number.isFinite(Number(r?.rescheduleFeePercentage)) ? Number(r.rescheduleFeePercentage) : 50)
    setFeeFixed('')
    setNotes('')
    setShowApproveModal(true)
  }

  const doApprove = async () => {
    if (!selected?._id) return
    if (!newDate || !newTime) {
      toast.error('Please select new date and time')
      return
    }

    const payload = {
      requestedDate: newDate,
      requestedTime: newTime,
      rescheduleFeePercentage: Number(feePercentage) || 0,
      ...(feeFixed ? { rescheduleFee: Number(feeFixed) } : {}),
      ...(notes.trim() ? { veterinarianNotes: notes.trim() } : {}),
    }

    try {
      await approve.mutateAsync({ id: selected._id, data: payload })
      toast.success('Reschedule request approved')
      setShowApproveModal(false)
      setSelected(null)
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to approve request')
    }
  }

  const doReject = async () => {
    if (!selected?._id) return
    if (String(rejectionReason || '').trim().length < 10) {
      toast.error('Rejection reason must be at least 10 characters')
      return
    }

    try {
      await reject.mutateAsync({ id: selected._id, reason: String(rejectionReason).trim() })
      toast.success('Reschedule request rejected')
      setShowRejectModal(false)
      setSelected(null)
      setRejectionReason('')
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to reject request')
    }
  }

  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), [])

  return (
    <div>
      <div className="page-header">
        <h3 className="page-title">Reschedule Requests</h3>
      </div>

      {requestsQuery.isLoading ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      ) : requestsQuery.isError ? (
        <div className="card">
          <div className="card-body">
            <div className="alert alert-danger mb-0">{requestsQuery.error?.message || 'Failed to load requests'}</div>
          </div>
        </div>
      ) : requests.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="alert alert-info mb-0">No pending reschedule requests.</div>
          </div>
        </div>
      ) : (
        <div className="row">
          {requests.map((r) => {
            const id = r?._id
            const ownerName = r?.petOwnerId?.name || r?.petOwnerId?.fullName || r?.petOwnerId?.email || 'Pet Owner'
            const original = r?.appointmentId
            const originalLabel = original
              ? `${new Date(original.appointmentDate).toLocaleDateString()} ${original.appointmentTime || ''}`
              : '—'

            return (
              <div key={id} className="col-md-6 mb-4">
                <div className="card">
                  <div className="card-body">
                    <h5 className="mb-2">Request from {ownerName}</h5>
                    <div className="text-muted mb-2">Original: {originalLabel}</div>
                    <div className="mb-3">{r?.reason}</div>

                    {r?.preferredDate && (
                      <div className="text-muted">
                        Preferred date: {new Date(r.preferredDate).toLocaleDateString()}
                      </div>
                    )}
                    {r?.preferredTime && <div className="text-muted mb-3">Preferred time: {r.preferredTime}</div>}

                    <div className="d-flex gap-2">
                      <button className="btn btn-success" onClick={() => openApprove(r)}>
                        Approve
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => {
                          setSelected(r)
                          setRejectionReason('')
                          setShowRejectModal(true)
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showApproveModal && selected && (
        <>
          <div className="modal fade show" style={{ display: 'block' }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Approve Reschedule Request</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowApproveModal(false)
                      setSelected(null)
                    }}
                    disabled={approve.isPending}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">New Date *</label>
                      <input type="date" className="form-control" value={newDate} onChange={(e) => setNewDate(e.target.value)} min={minDate} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">New Time *</label>
                      <input type="time" className="form-control" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Fee Percentage</label>
                      <div className="input-group">
                        <input
                          type="number"
                          className="form-control"
                          value={feePercentage}
                          onChange={(e) => {
                            const v = Math.min(100, Math.max(0, parseInt(e.target.value || '0', 10)))
                            setFeePercentage(v)
                            setFeeFixed('')
                          }}
                          min={0}
                          max={100}
                        />
                        <span className="input-group-text">%</span>
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Or Fixed Fee (optional)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={feeFixed}
                        onChange={(e) => setFeeFixed(e.target.value)}
                        min={0}
                      />
                    </div>
                    <div className="col-12 mb-3">
                      <label className="form-label">Notes (optional)</label>
                      <textarea className="form-control" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowApproveModal(false)
                      setSelected(null)
                    }}
                    disabled={approve.isPending}
                  >
                    Cancel
                  </button>
                  <button type="button" className="btn btn-success" onClick={doApprove} disabled={approve.isPending}>
                    {approve.isPending ? 'Approving...' : 'Approve'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {showRejectModal && selected && (
        <>
          <div className="modal fade show" style={{ display: 'block' }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Reject Reschedule Request</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowRejectModal(false)
                      setSelected(null)
                    }}
                    disabled={reject.isPending}
                  ></button>
                </div>
                <div className="modal-body">
                  <label className="form-label">Reason *</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter rejection reason (min 10 characters)"
                  />
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowRejectModal(false)
                      setSelected(null)
                    }}
                    disabled={reject.isPending}
                  >
                    Cancel
                  </button>
                  <button type="button" className="btn btn-danger" onClick={doReject} disabled={reject.isPending}>
                    {reject.isPending ? 'Rejecting...' : 'Reject'}
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

export default DoctorRescheduleRequests
