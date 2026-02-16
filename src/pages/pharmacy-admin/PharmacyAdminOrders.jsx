import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useOrders } from '../../queries/orderQueries'
import { useUpdateOrderStatus, useUpdateShippingFee } from '../../mutations/orderMutations'
import { toast } from 'react-toastify'

const normalizeListPayload = (payload) => {
  const outer = payload?.data ?? payload
  const list = outer?.items ?? outer?.orders ?? outer?.data?.items ?? outer?.data?.orders
  const total = outer?.total ?? outer?.count ?? outer?.data?.total ?? outer?.data?.count
  if (Array.isArray(list)) {
    return { items: list, total: typeof total === 'number' ? total : list.length }
  }
  if (Array.isArray(outer)) {
    return { items: outer, total: outer.length }
  }
  return { items: [], total: 0 }
}

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']

const PharmacyAdminOrders = () => {
  const location = useLocation()
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])

  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || '')
  const [paymentFilter, setPaymentFilter] = useState(() => searchParams.get('paymentStatus') || '')

  useEffect(() => {
    setStatusFilter(searchParams.get('status') || '')
    setPaymentFilter(searchParams.get('paymentStatus') || '')
  }, [searchParams])

  const params = useMemo(() => {
    const p = {}
    if (statusFilter) p.status = statusFilter
    if (paymentFilter) p.paymentStatus = paymentFilter
    return p
  }, [statusFilter, paymentFilter])

  const ordersQuery = useOrders(params)
  const updateStatus = useUpdateOrderStatus()
  const updateShippingFee = useUpdateShippingFee()

  const [showShippingModal, setShowShippingModal] = useState(false)
  const [shippingFee, setShippingFee] = useState('')
  const [selectedOrderForShipping, setSelectedOrderForShipping] = useState(null)

  const { items: orders } = useMemo(() => normalizeListPayload(ordersQuery.data), [ordersQuery.data])

  const setOrderStatus = async (orderId, status) => {
    try {
      await updateStatus.mutateAsync({ orderId, data: { status } })
      toast.success('Order updated')
    } catch (error) {
      toast.error(error?.message || 'Failed to update order')
    }
  }

  const openShippingModal = (order) => {
    setSelectedOrderForShipping(order)
    const current =
      order?.finalShipping ??
      order?.shipping ??
      order?.initialShipping ??
      0
    setShippingFee(String(current))
    setShowShippingModal(true)
  }

  const submitShippingFee = async () => {
    if (!selectedOrderForShipping) return

    const fee = Number(shippingFee)
    if (!Number.isFinite(fee) || fee < 0) {
      toast.error('Please enter a valid shipping fee (non-negative number)')
      return
    }

    const id = selectedOrderForShipping?._id || selectedOrderForShipping?.id
    try {
      await updateShippingFee.mutateAsync({ orderId: id, shippingFee: fee })
      toast.success('Shipping fee updated')
      setShowShippingModal(false)
      setSelectedOrderForShipping(null)
      setShippingFee('')
    } catch (error) {
      toast.error(error?.message || 'Failed to update shipping fee')
    }
  }

  return (
    <div>
      <div className="page-header">
        <h3 className="page-title">Orders</h3>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label">Status</label>
              <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Payment</label>
              <select className="form-select" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
                <option value="">All</option>
                <option value="PAID">Paid</option>
                <option value="UNPAID">Unpaid</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>
          </div>

          {ordersQuery.isLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : ordersQuery.isError ? (
            <div className="alert alert-danger">{ordersQuery.error?.message || 'Failed to load orders'}</div>
          ) : orders.length === 0 ? (
            <div className="alert alert-info mb-0">No orders found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Shipping</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th style={{ width: 300 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => {
                    const id = o?._id || o?.id
                    const orderNo = o?.orderNumber || id
                    const customer = o?.petOwnerId?.name || o?.petOwner?.name || '—'
                    const total = o?.total ?? o?.finalTotal ?? o?.initialTotal
                    const finalShipping = o?.finalShipping
                    const shippingDisplay = finalShipping === null || finalShipping === undefined
                      ? 'Waiting'
                      : (typeof finalShipping === 'number' ? finalShipping.toFixed(2) : finalShipping)
                    const paymentStatus = o?.paymentStatus || '—'
                    const status = o?.status || '—'

                    const isPaid = String(paymentStatus).toUpperCase() === 'PAID'
                    const normalizedStatus = String(status).toUpperCase()

                    return (
                      <tr key={id}>
                        <td>{orderNo}</td>
                        <td>{customer}</td>
                        <td>{typeof total === 'number' ? total.toFixed(2) : total}</td>
                        <td>{shippingDisplay}</td>
                        <td>{paymentStatus}</td>
                        <td>{status}</td>
                        <td>
                          <div className="d-flex gap-2 align-items-center">
                            <Link to={`/pharmacy-admin/orders/${id}`} className="btn btn-sm btn-outline-secondary">
                              View
                            </Link>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => openShippingModal(o)}
                              disabled={updateShippingFee.isPending || isPaid}
                            >
                              Set Shipping
                            </button>
                            <select
                              className="form-select form-select-sm"
                              value={status}
                              onChange={(e) => setOrderStatus(id, e.target.value)}
                              disabled={updateStatus.isPending}
                              title={!isPaid ? 'Only CANCELLED is allowed before payment' : undefined}
                            >
                              {STATUS_OPTIONS.map((s) => {
                                const optionDisabled = !isPaid && s !== 'CANCELLED' && s !== normalizedStatus
                                return (
                                  <option key={s} value={s} disabled={optionDisabled}>
                                    {s}
                                  </option>
                                )
                              })}
                            </select>
                          </div>
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

      {showShippingModal && (
        <>
          <div className="modal fade show" style={{ display: 'block' }} role="dialog" aria-modal="true">
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Set Shipping Fee</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowShippingModal(false)
                      setSelectedOrderForShipping(null)
                      setShippingFee('')
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Shipping Fee (EUR)</label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      step="0.01"
                      value={shippingFee}
                      onChange={(e) => setShippingFee(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowShippingModal(false)
                      setSelectedOrderForShipping(null)
                      setShippingFee('')
                    }}
                  >
                    Cancel
                  </button>
                  <button type="button" className="btn btn-primary" onClick={submitShippingFee} disabled={updateShippingFee.isPending}>
                    {updateShippingFee.isPending ? 'Saving...' : 'Save'}
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

export default PharmacyAdminOrders
