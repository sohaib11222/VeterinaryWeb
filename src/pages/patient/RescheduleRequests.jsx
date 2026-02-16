import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'

import { useRescheduleRequests } from '../../queries'
import { usePayRescheduleFee } from '../../mutations/scheduleMutations'

const RescheduleRequests = () => {
  const requestsQuery = useRescheduleRequests()
  const payFee = usePayRescheduleFee()

  const [selected, setSelected] = useState(null)
  const [showPayModal, setShowPayModal] = useState(false)

  const requests = useMemo(() => {
    const outer = requestsQuery.data?.data ?? requestsQuery.data
    const payload = outer?.data ?? outer
    return Array.isArray(payload) ? payload : Array.isArray(payload?.requests) ? payload.requests : []
  }, [requestsQuery.data])

  const statusBadge = (status) => {
    const s = String(status || '').toUpperCase()
    if (s === 'APPROVED') return <span className="badge bg-success">Approved</span>
    if (s === 'PENDING') return <span className="badge bg-warning text-dark">Pending</span>
    if (s === 'REJECTED') return <span className="badge bg-danger">Rejected</span>
    if (s === 'CANCELLED') return <span className="badge bg-secondary">Cancelled</span>
    return <span className="badge bg-secondary">{s || '—'}</span>
  }

  const openPay = (req) => {
    setSelected(req)
    setShowPayModal(true)
  }

  const confirmPay = async () => {
    if (!selected?._id) return
    try {
      await payFee.mutateAsync({ id: selected._id, paymentMethod: 'DUMMY' })
      toast.success('Reschedule fee paid successfully. Appointment confirmed.')
      setShowPayModal(false)
      setSelected(null)
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Payment failed')
    }
  }

  return (
    <div className="content">
      <div className="container">
        <div className="dashboard-header">
          <div className="header-back">
            <Link to="/patient/dashboard" className="back-arrow">
              <i className="fa-solid fa-arrow-left"></i>
            </Link>
            <h3>Reschedule Requests</h3>
          </div>
          <div>
            <Link to="/patient/request-reschedule" className="btn btn-outline-primary btn-sm">
              Request Reschedule
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            {requestsQuery.isLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : requestsQuery.isError ? (
              <div className="alert alert-danger">{requestsQuery.error?.message || 'Failed to load requests'}</div>
            ) : requests.length === 0 ? (
              <div className="alert alert-info mb-0">No reschedule requests found.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Original</th>
                      <th>Status</th>
                      <th>Fee</th>
                      <th>New Appointment</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => {
                      const id = r?._id
                      const original = r?.appointmentId
                      const newApt = r?.newAppointmentId
                      const originalLabel = original
                        ? `${new Date(original.appointmentDate).toLocaleDateString()} ${original.appointmentTime || ''}`
                        : '—'
                      const newLabel = newApt
                        ? `${new Date(newApt.appointmentDate).toLocaleDateString()} ${newApt.appointmentTime || ''}`
                        : '—'

                      const canPay =
                        String(r?.status || '').toUpperCase() === 'APPROVED' &&
                        newApt &&
                        String(newApt?.paymentStatus || '').toUpperCase() !== 'PAID'

                      return (
                        <tr key={id}>
                          <td>
                            <div>{originalLabel}</div>
                            {original?.appointmentNumber && <small className="text-muted">{original.appointmentNumber}</small>}
                          </td>
                          <td>{statusBadge(r?.status)}</td>
                          <td>{r?.rescheduleFee !== null && r?.rescheduleFee !== undefined ? `€${Number(r.rescheduleFee).toFixed(2)}` : '—'}</td>
                          <td>
                            {newApt ? (
                              <Link to={`/patient-appointment-details?id=${newApt?._id || newApt}`} className="btn btn-sm btn-outline-primary">
                                View
                              </Link>
                            ) : (
                              <span className="text-muted">{newLabel}</span>
                            )}
                          </td>
                          <td className="text-end">
                            {canPay && (
                              <button className="btn btn-sm btn-primary" onClick={() => openPay(r)}>
                                Pay Fee
                              </button>
                            )}
                            {String(r?.status || '').toUpperCase() === 'REJECTED' && r?.rejectionReason && (
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => toast.info(r.rejectionReason, { autoClose: 6000 })}
                              >
                                View Reason
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {showPayModal && selected && (
          <>
            <div className="modal fade show" style={{ display: 'block' }} role="dialog" aria-modal="true">
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Pay Reschedule Fee</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => {
                        setShowPayModal(false)
                        setSelected(null)
                      }}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <p className="mb-1">
                      <strong>Fee:</strong>{' '}
                      {selected?.rescheduleFee !== null && selected?.rescheduleFee !== undefined
                        ? `€${Number(selected.rescheduleFee).toFixed(2)}`
                        : '—'}
                    </p>
                    <p className="text-muted mb-0">Click confirm to proceed.</p>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowPayModal(false)
                        setSelected(null)
                      }}
                      disabled={payFee.isPending}
                    >
                      Cancel
                    </button>
                    <button type="button" className="btn btn-primary" onClick={confirmPay} disabled={payFee.isPending}>
                      {payFee.isPending ? 'Processing...' : 'Confirm Payment'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-backdrop fade show"></div>
          </>
        )}
      </div>
    </div>
  )
}

export default RescheduleRequests
