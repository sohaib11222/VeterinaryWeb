import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import { useOrders } from '../../queries/orderQueries'
import { useCancelOrder, usePayForOrder } from '../../mutations/orderMutations'
import { getImageUrl } from '../../utils/apiConfig'

const OrderHistory = () => {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')

  const statusParam = filter === 'all' ? '' : filter.toUpperCase()
  const ordersQuery = useOrders(statusParam ? { status: statusParam } : {})
  const payMutation = usePayForOrder()
  const cancelMutation = useCancelOrder()

  const { orders } = useMemo(() => {
    const outer = ordersQuery.data?.data ?? ordersQuery.data
    const data = outer?.data ?? outer
    return {
      orders: Array.isArray(data?.orders) ? data.orders : [],
    }
  }, [ordersQuery.data])

  const getStatusBadge = (status) => {
    const s = String(status || '').toUpperCase()
    const badges = {
      DELIVERED: 'badge-success',
      SHIPPED: 'badge-info',
      PROCESSING: 'badge-warning',
      CONFIRMED: 'badge-primary',
      CANCELLED: 'badge-danger',
      REFUNDED: 'badge-secondary',
      PENDING: 'badge-secondary',
    }
    return <span className={`badge ${badges[s] || 'badge-secondary'}`}>{s || '—'}</span>
  }

  const onPay = async (orderId) => {
    try {
      await payMutation.mutateAsync({ orderId, data: { paymentMethod: 'STRIPE' } })
      toast.success('Payment successful')
    } catch (error) {
      toast.error(error?.message || 'Payment failed')
    }
  }

  const onCancel = async (orderId) => {
    const ok = window.confirm('Cancel this order?')
    if (!ok) return
    try {
      await cancelMutation.mutateAsync(orderId)
      toast.success('Order cancelled')
    } catch (error) {
      toast.error(error?.message || 'Cancel failed')
    }
  }

  return (
    <div className="content">
      <div className="container">
        <div className="row">
          <div className="col-lg-4 col-xl-3 theiaStickySidebar">
            {/* PatientSidebar will be rendered by DashboardLayout */}
          </div>
          <div className="col-lg-12 col-xl-12">
            <div className="dashboard-header">
              <div className="d-flex align-items-center mb-3">
                <button className="btn btn-outline-secondary me-3" onClick={() => navigate(-1)}>
                  <i className="fa-solid fa-chevron-left me-1"></i> Back
                </button>
                <h3 className="mb-0">Order History</h3>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="card mb-4">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between flex-wrap">
                  <div className="order-filter-tabs">
                    <button
                      className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setFilter('all')}
                    >
                      All Orders
                    </button>
                    <button
                      className={`btn btn-sm ${filter === 'delivered' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setFilter('delivered')}
                    >
                      Delivered
                    </button>
                    <button
                      className={`btn btn-sm ${filter === 'shipped' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setFilter('shipped')}
                    >
                      Shipped
                    </button>
                    <button
                      className={`btn btn-sm ${filter === 'cancelled' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setFilter('cancelled')}
                    >
                      Cancelled
                    </button>
                  </div>
                  <Link to="/pharmacy-index" className="btn btn-primary btn-sm">
                    <i className="fe fe-shopping-cart me-2"></i>
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>

            {/* Orders List */}
            <div className="card">
              <div className="card-body">
                {ordersQuery.isLoading ? (
                  <div className="text-center py-5 text-muted">Loading orders...</div>
                ) : ordersQuery.isError ? (
                  <div className="alert alert-danger">{ordersQuery.error?.message || 'Failed to load orders'}</div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="fe fe-package" style={{ fontSize: '64px', color: '#dee2e6' }}></i>
                    <h5 className="mt-3">No orders found</h5>
                    <p className="text-muted">You haven't placed any orders yet.</p>
                    <Link to="/pharmacy-index" className="btn btn-primary mt-3">
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="order-list">
                    {orders.map((order) => {
                      const id = order?._id || order?.id
                      const orderNo = order?.orderNumber || id
                      const createdAt = order?.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
                      const status = String(order?.status || '').toUpperCase()
                      const paymentStatus = String(order?.paymentStatus || '').toUpperCase()
                      const finalShipping = order?.finalShipping
                      const shippingSet = finalShipping !== null && finalShipping !== undefined
                      const canPay = paymentStatus === 'UNPAID' && shippingSet && (status === 'PENDING' || status === 'CONFIRMED')
                      const canCancel = paymentStatus !== 'PAID' && (status === 'PENDING' || status === 'CONFIRMED')

                      return (
                      <div key={id} className="order-item mb-4 pb-4 border-bottom">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <h5 className="mb-1">Order #{orderNo}</h5>
                            <p className="text-muted small mb-0">
                              <i className="fe fe-calendar me-1"></i>
                              Ordered on {createdAt}
                            </p>
                            {paymentStatus === 'UNPAID' && !shippingSet && (
                              <div className="text-muted small mt-1">
                                Waiting for pharmacy to set shipping fee
                              </div>
                            )}
                          </div>
                          <div className="text-end">
                            {getStatusBadge(status)}
                            <div className="text-muted small">Payment: {paymentStatus || '—'}</div>
                            <h5 className="mt-2 mb-0">Total: €{Number(order?.total || 0).toFixed(2)}</h5>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="order-items mb-3">
                          <h6 className="mb-2">Items:</h6>
                          <ul className="list-unstyled">
                            {(order?.items || []).map((item) => {
                              const p = item?.productId
                              const img = getImageUrl(p?.images?.[0]) || '/assets/img/products/product.jpg'
                              return (
                                <li key={item?._id} className="d-flex justify-content-between align-items-center mb-2">
                                  <div className="d-flex align-items-center" style={{ gap: 10 }}>
                                    <img
                                      src={img}
                                      alt={p?.name || 'product'}
                                      style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover' }}
                                      onError={(e) => {
                                        e.currentTarget.src = '/assets/img/products/product.jpg'
                                      }}
                                    />
                                    <span>
                                      {p?.name || 'Product'} <span className="text-muted">x{item?.quantity || 0}</span>
                                    </span>
                                  </div>
                                  <span className="fw-bold">€{Number(item?.total || 0).toFixed(2)}</span>
                                </li>
                              )
                            })}
                          </ul>
                        </div>

                        {/* Order Actions */}
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                          <div>
                          </div>
                          <div className="order-actions">
                            <Link className="btn btn-sm btn-outline-primary me-2" to={`/order-details/${id}`}>
                              View Details
                            </Link>
                            {canPay && (
                              <button className="btn btn-sm btn-primary me-2" onClick={() => onPay(id)} disabled={payMutation.isPending}>
                                Pay Now
                              </button>
                            )}
                            {canCancel && (
                              <button className="btn btn-sm btn-outline-danger" onClick={() => onCancel(id)} disabled={cancelMutation.isPending}>
                                Cancel Order
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderHistory

