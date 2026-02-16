import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useOrders } from '../../queries/orderQueries'
import { useUpdateOrderStatus } from '../../mutations/orderMutations'
import { useMyPetStoreSubscription } from '../../queries/petStoreQueries'
import { toast } from 'react-toastify'

const STATUS_PIPELINE = [
  { key: 'PENDING', label: 'Pending', color: 'warning', icon: 'fa-hourglass-half' },
  { key: 'CONFIRMED', label: 'Confirmed', color: 'info', icon: 'fa-circle-check' },
  { key: 'PROCESSING', label: 'Processing', color: 'primary', icon: 'fa-cog' },
  { key: 'SHIPPED', label: 'Shipped', color: 'secondary', icon: 'fa-truck' },
  { key: 'DELIVERED', label: 'Delivered', color: 'success', icon: 'fa-box-open' },
  { key: 'CANCELLED', label: 'Cancelled', color: 'danger', icon: 'fa-ban' },
]

const extractOrdersPayload = (payload) => {
  const outer = payload?.data ?? payload
  return outer?.data ?? outer
}

const getOrders = (payload) => {
  const p = extractOrdersPayload(payload)
  const list = p?.orders ?? p?.items
  return Array.isArray(list) ? list : []
}

const getTotal = (payload) => {
  const p = extractOrdersPayload(payload)
  return p?.pagination?.total ?? p?.total ?? p?.count ?? 0
}

const PharmacyAdminDashboard = () => {
  const { user } = useAuth()
  const role = String(user?.role || '').toUpperCase()

  const recentOrdersQuery = useOrders({ page: 1, limit: 8 })
  const updateStatus = useUpdateOrderStatus()

  const statusQueries = {
    PENDING: useOrders({ status: 'PENDING', page: 1, limit: 1 }),
    CONFIRMED: useOrders({ status: 'CONFIRMED', page: 1, limit: 1 }),
    PROCESSING: useOrders({ status: 'PROCESSING', page: 1, limit: 1 }),
    SHIPPED: useOrders({ status: 'SHIPPED', page: 1, limit: 1 }),
    DELIVERED: useOrders({ status: 'DELIVERED', page: 1, limit: 1 }),
    CANCELLED: useOrders({ status: 'CANCELLED', page: 1, limit: 1 }),
  }

  const orders = useMemo(() => getOrders(recentOrdersQuery.data), [recentOrdersQuery.data])
  const unpaidCount = useMemo(
    () => orders.filter((o) => String(o?.paymentStatus || '').toUpperCase() !== 'PAID').length,
    [orders]
  )

  const mySubQuery = useMyPetStoreSubscription({ enabled: role === 'PET_STORE' })
  const mySub = useMemo(() => {
    const payload = mySubQuery.data?.data ?? mySubQuery.data
    return payload?.data ?? payload
  }, [mySubQuery.data])

  const hasActiveSubscription = role !== 'PET_STORE' ? true : !!mySub?.hasActiveSubscription

  const setOrderStatus = async (orderId, status) => {
    try {
      await updateStatus.mutateAsync({ orderId, data: { status } })
      toast.success('Order updated')
    } catch (error) {
      toast.error(error?.message || 'Failed to update order')
    }
  }

  return (
    <div className="content veterinary-dashboard">
      <div className="container-fluid">
        <div className="row">
          <div className="col-lg-12 col-xl-12">
            <div className="row mb-4">
              <div className="col-12">
                <div className="veterinary-dashboard-header">
                  <h2 className="dashboard-title">
                    <i className="fa-solid fa-paw me-3"></i>
                    {role === 'PARAPHARMACY' ? 'Parapharmacy Dashboard' : 'Pharmacy Dashboard'}
                  </h2>
                  <p className="dashboard-subtitle">Track orders, manage products and payouts</p>
                </div>
              </div>
            </div>

            {role === 'PET_STORE' && (
              <div className="row mb-4">
                <div className="col-12">
                  <div className="dashboard-card veterinary-card">
                    <div className="dashboard-card-body">
                      <div className="d-flex align-items-center justify-content-between flex-wrap" style={{ gap: 12 }}>
                        <div>
                          <div className="fw-bold">Subscription</div>
                          {mySubQuery.isLoading ? (
                            <div className="text-muted small">Loading subscription status…</div>
                          ) : mySubQuery.isError ? (
                            <div className="text-muted small">{mySubQuery.error?.message || 'Failed to load subscription'}</div>
                          ) : hasActiveSubscription ? (
                            <div className="text-muted small">Your subscription is active.</div>
                          ) : (
                            <div className="text-muted small">Your subscription is inactive. Subscribe to manage products.</div>
                          )}
                        </div>
                        <div className="d-flex align-items-center" style={{ gap: 8 }}>
                          <span className={`badge ${hasActiveSubscription ? 'bg-success' : 'bg-danger'}`}>
                            {hasActiveSubscription ? 'Active' : 'Inactive'}
                          </span>
                          <Link to="/pharmacy-admin/subscription" className="btn veterinary-btn-primary btn-sm rounded-pill">
                            Manage
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="row mb-4">
              {STATUS_PIPELINE.map((s) => {
                const q = statusQueries[s.key]
                const count = getTotal(q?.data)
                return (
                  <div key={s.key} className="col-xl-2 col-lg-4 col-md-6 mb-3">
                    <Link
                      to={`/pharmacy-admin/orders?status=${encodeURIComponent(s.key)}`}
                      className="text-decoration-none"
                    >
                      <div className="dashboard-widget-box veterinary-widget">
                        <div className="dashboard-content-info">
                          <h6>{s.label}</h6>
                          <h4>{q?.isLoading ? '—' : count}</h4>
                          <span className={`text-${s.color}`}>View Orders</span>
                        </div>
                        <div className="dashboard-widget-icon">
                          <span className="dash-icon-box">
                            <i className={`fa-solid ${s.icon}`} style={{ fontSize: 18 }}></i>
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                )
              })}
            </div>

            <div className="row mb-4">
              <div className="col-xl-8 mb-4">
                <div className="dashboard-card veterinary-card">
                  <div className="dashboard-card-head">
                    <div className="header-title">
                      <h5>
                        <i className="fa-solid fa-shopping-bag me-2"></i>
                        Recent Orders
                      </h5>
                    </div>
                    <div className="card-view-link">
                      <Link to="/pharmacy-admin/orders">View All</Link>
                    </div>
                  </div>
                  <div className="dashboard-card-body">
                    {recentOrdersQuery.isLoading ? (
                      <div className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    ) : recentOrdersQuery.isError ? (
                      <div className="alert alert-danger">{recentOrdersQuery.error?.message || 'Failed to load orders'}</div>
                    ) : orders.length === 0 ? (
                      <div className="alert alert-info mb-0">No orders yet.</div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table dashboard-table appoint-table veterinary-table mb-0">
                          <thead>
                            <tr>
                              <th>Order</th>
                              <th>Customer</th>
                              <th>Total</th>
                              <th>Payment</th>
                              <th>Status</th>
                              <th style={{ width: 220 }}>Update</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.map((o) => {
                              const id = o?._id || o?.id
                              const orderNo = o?.orderNumber || id
                              const customer = o?.petOwnerId?.name || o?.petOwner?.name || '—'
                              const total = o?.total ?? o?.finalTotal ?? o?.initialTotal
                              const paymentStatus = o?.paymentStatus || '—'
                              const status = o?.status || '—'

                              return (
                                <tr key={id}>
                                  <td>{orderNo}</td>
                                  <td>{customer}</td>
                                  <td>{typeof total === 'number' ? total.toFixed(2) : total}</td>
                                  <td>{paymentStatus}</td>
                                  <td>{status}</td>
                                  <td>
                                    <select
                                      className="form-select form-select-sm"
                                      value={status}
                                      onChange={(e) => setOrderStatus(id, e.target.value)}
                                      disabled={updateStatus.isPending}
                                    >
                                      {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'].map((s) => (
                                        <option key={s} value={s}>
                                          {s}
                                        </option>
                                      ))}
                                    </select>
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
              </div>

              <div className="col-xl-4 mb-4">
                <div className="dashboard-card veterinary-card">
                  <div className="dashboard-card-head">
                    <div className="header-title">
                      <h5>
                        <i className="fa-solid fa-bolt me-2"></i>
                        Quick Actions
                      </h5>
                    </div>
                  </div>
                  <div className="dashboard-card-body">
                    <div className="d-grid gap-2">
                      <Link to="/pharmacy-admin/orders" className="btn veterinary-btn-primary btn-md rounded-pill">
                        <i className="fa-solid fa-receipt me-2"></i>
                        Manage Orders
                      </Link>
                      <Link
                        to="/pharmacy-admin/products"
                        className="btn veterinary-btn-secondary btn-md rounded-pill"
                      >
                        <i className="fa-solid fa-box me-2"></i>
                        Manage Products
                      </Link>
                      <Link to="/pharmacy-admin/payouts" className="btn btn-outline-primary btn-md rounded-pill">
                        <i className="fa-solid fa-money-bill-1 me-2"></i>
                        Payouts
                      </Link>
                      <Link to="/pharmacy-admin/profile" className="btn btn-outline-secondary btn-md rounded-pill">
                        <i className="fa-solid fa-user-pen me-2"></i>
                        Profile
                      </Link>
                    </div>

                    <div className="mt-3">
                      <div className="alert alert-info mb-0">
                        <div className="fw-bold mb-1">Attention Needed</div>
                        <div className="text-muted small">Unpaid orders in recent list: {unpaidCount}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PharmacyAdminDashboard

