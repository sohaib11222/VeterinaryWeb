import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useOrders } from '../../queries/orderQueries'
import { useUpdateOrderStatus } from '../../mutations/orderMutations'
import { deliveryStatusBadgeClass, formatDeliveryStatus } from '../../utils/deliveryMonitoring'
import { useMyPetStoreSubscription, usePetStoreSetupStatus } from '../../queries/petStoreQueries'
import { usePharmacyPendingPrescriptionCount } from '../../queries/productPrescriptionRequestQueries'
import PharmacySetupModal from '../../components/common/PharmacySetupModal'
import { toast } from 'react-toastify'
import { useLanguage } from '../../contexts/LanguageContext'

const STATUS_PIPELINE = [
  { key: 'PENDING', label: 'pending', color: 'warning', icon: 'fa-hourglass-half' },
  { key: 'CONFIRMED', label: 'confirmed', color: 'info', icon: 'fa-circle-check' },
  { key: 'PROCESSING', label: 'processing', color: 'primary', icon: 'fa-cog' },
  { key: 'SHIPPED', label: 'shipped', color: 'secondary', icon: 'fa-truck' },
  { key: 'DELIVERED', label: 'delivered', color: 'success', icon: 'fa-box-open' },
  { key: 'CANCELLED', label: 'cancelled', color: 'danger', icon: 'fa-ban' },
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
  const { t, language } = useLanguage()
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
  const setupQuery = usePetStoreSetupStatus({ enabled: role === 'PET_STORE' || role === 'PARAPHARMACY' })
  const pendingPrescriptionQuery = usePharmacyPendingPrescriptionCount({ enabled: role === 'PET_STORE' })
  const mySub = useMemo(() => {
    const payload = mySubQuery.data?.data ?? mySubQuery.data
    return payload?.data ?? payload
  }, [mySubQuery.data])

  const hasActiveSubscription = role !== 'PET_STORE' ? true : !!mySub?.hasActiveSubscription
  const setupPayload = setupQuery.data?.data ?? setupQuery.data
  const setup = setupPayload?.data ?? setupPayload
  const pendingPrescriptionPayload = pendingPrescriptionQuery.data?.data ?? pendingPrescriptionQuery.data
  const pendingPrescriptionCount = pendingPrescriptionPayload?.data?.pendingCount ?? pendingPrescriptionPayload?.pendingCount ?? 0

  const setOrderStatus = async (orderId, status) => {
    try {
      await updateStatus.mutateAsync({ orderId, data: { status } })
      toast.success(t('pharmacyAdmin.dashboard.orderUpdated'))
    } catch (error) {
      toast.error(error?.message || t('pharmacyAdmin.dashboard.updateFailed'))
    }
  }

  return (
    <div className="content veterinary-dashboard pharmacy-admin-dashboard-mobile">
      <div className="container-fluid">
        <div className="row">
          <div className="col-lg-12 col-xl-12">
            <div className="row mb-4 pharmacy-dashboard-status-grid">
              <div className="col-12">
                <div className="veterinary-dashboard-header">
                  <h2 className="dashboard-title">
                    <i className="fa-solid fa-paw me-3"></i>
                    {role === 'PARAPHARMACY' ? t('pharmacyAdmin.dashboard.parapharmacyTitle') : t('pharmacyAdmin.dashboard.pharmacyTitle')}
                  </h2>
                  <p className="dashboard-subtitle">{t('pharmacyAdmin.dashboard.subtitle')}</p>
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
                          <div className="fw-bold">{t('pharmacyAdmin.dashboard.subscription')}</div>
                          {mySubQuery.isLoading ? (
                            <div className="text-muted small">{t('pharmacyAdmin.dashboard.loadingSubscription')}</div>
                          ) : mySubQuery.isError ? (
                            <div className="text-muted small">{mySubQuery.error?.message || 'Failed to load subscription'}</div>
                          ) : hasActiveSubscription ? (
                            <div className="text-muted small">{t('pharmacyAdmin.dashboard.activeSubscription')}</div>
                          ) : (
                            <div className="text-muted small">{t('pharmacyAdmin.dashboard.inactiveSubscription')}</div>
                          )}
                        </div>
                        <div className="d-flex align-items-center" style={{ gap: 8 }}>
                          <span className={`badge ${hasActiveSubscription ? 'bg-success' : 'bg-danger'}`}>
                            {hasActiveSubscription ? t('pharmacyAdmin.dashboard.active') : t('pharmacyAdmin.dashboard.inactive')}
                          </span>
                          <Link to="/pharmacy-admin/subscription" className="btn veterinary-btn-primary btn-sm rounded-pill">
                            {t('pharmacyAdmin.dashboard.manage')}
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
                          <h6>{t(`pharmacyAdmin.dashboard.${s.label}`)}</h6>
                          <h4>{q?.isLoading ? '—' : count}</h4>
                          <span className={`text-${s.color}`}>{t('pharmacyAdmin.dashboard.viewOrders')}</span>
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
                        {t('pharmacyAdmin.dashboard.recentOrders')}
                      </h5>
                    </div>
                    <div className="card-view-link">
                      <Link to="/pharmacy-admin/orders">{t('pharmacyAdmin.dashboard.viewAll')}</Link>
                    </div>
                  </div>
                  <div className="dashboard-card-body">
                    {recentOrdersQuery.isLoading ? (
                      <div className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">{t('pharmacyAdmin.dashboard.loading')}</span>
                        </div>
                      </div>
                    ) : recentOrdersQuery.isError ? (
                      <div className="alert alert-danger">{recentOrdersQuery.error?.message || t('pharmacyAdmin.dashboard.loadFailed')}</div>
                    ) : orders.length === 0 ? (
                      <div className="alert alert-info mb-0">{t('pharmacyAdmin.dashboard.noOrders')}</div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table dashboard-table appoint-table veterinary-table mb-0 pharmacy-dashboard-orders-table">
                          <thead>
                            <tr>
                              <th>{t('pharmacyAdmin.dashboard.order')}</th>
                              <th>{t('pharmacyAdmin.dashboard.customer')}</th>
                              <th>{t('pharmacyAdmin.dashboard.total')}</th>
                              <th>{t('pharmacyAdmin.dashboard.payment')}</th>
                              <th>{t('pharmacyAdmin.dashboard.status')}</th>
                              <th>{t('pharmacyAdmin.dashboard.expectedDelivery')}</th>
                              <th>{t('pharmacyAdmin.dashboard.deliveryMonitoring')}</th>
                              <th style={{ width: 220 }}>{t('pharmacyAdmin.dashboard.update')}</th>
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
                              const isPaid = String(paymentStatus).toUpperCase() === 'PAID'
                              const normalizedStatus = String(status).toUpperCase()
                              const expectedDelivery = o?.expectedDeliveryDate
                                ? new Date(o.expectedDeliveryDate).toLocaleDateString(language === 'it' ? 'it-IT' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                : '—'

                              return (
                                <tr key={id}>
                                  <td data-label={t('pharmacyAdmin.dashboard.order')}>{orderNo}</td>
                                  <td data-label={t('pharmacyAdmin.dashboard.customer')}>{customer}</td>
                                  <td data-label={t('pharmacyAdmin.dashboard.total')}>{typeof total === 'number' ? total.toFixed(2) : total}</td>
                                  <td data-label={t('pharmacyAdmin.dashboard.payment')}>{paymentStatus}</td>
                                  <td data-label={t('pharmacyAdmin.dashboard.status')}>{status}</td>
                                  <td data-label={t('pharmacyAdmin.dashboard.expectedDelivery')}>{expectedDelivery}</td>
                                  <td data-label={t('pharmacyAdmin.dashboard.deliveryMonitoring')}>
                                    {o?.expectedDeliveryDate ? (
                                      <span className={`badge ${deliveryStatusBadgeClass(o?.deliveryStatus)}`}>
                                        {formatDeliveryStatus(o?.deliveryStatus, o?.daysLate)}
                                      </span>
                                ) : <span className="badge badge-secondary">{t('pharmacyAdmin.dashboard.awaitingDelivery')}</span>}
                                  </td>
                                  <td data-label={t('pharmacyAdmin.dashboard.update')}>
                                    <select
                                      className="form-select form-select-sm"
                                      value={status}
                                      onChange={(e) => setOrderStatus(id, e.target.value)}
                                      disabled={updateStatus.isPending}
                                      title={!isPaid ? t('pharmacyAdmin.dashboard.onlyCancelled') : undefined}
                                    >
                                      {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'].map((s) => (
                                        <option key={s} value={s} disabled={!isPaid && s !== 'CANCELLED' && s !== normalizedStatus}>
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
                        {t('pharmacyAdmin.dashboard.quickActions')}
                      </h5>
                    </div>
                  </div>
                  <div className="dashboard-card-body">
                    <div className="d-grid gap-2">
                      <Link to="/pharmacy-admin/orders" className="btn veterinary-btn-primary btn-md rounded-pill">
                        <i className="fa-solid fa-receipt me-2"></i>
                        {t('pharmacyAdmin.dashboard.manageOrders')}
                      </Link>
                      <Link
                        to="/pharmacy-admin/products"
                        className="btn veterinary-btn-secondary btn-md rounded-pill"
                      >
                        <i className="fa-solid fa-box me-2"></i>
                        {t('pharmacyAdmin.dashboard.manageProducts')}
                      </Link>
                      {role === 'PET_STORE' && <Link to="/pharmacy-admin/prescription-requests" className="btn btn-outline-primary btn-md rounded-pill">
                        <i className="fa-solid fa-file-prescription me-2"></i>
                        {t('pharmacyAdmin.dashboard.prescriptionRequests')} {pendingPrescriptionCount > 0 ? `(${pendingPrescriptionCount})` : ''}
                      </Link>}
                      <Link to="/pharmacy-admin/payouts" className="btn btn-outline-primary btn-md rounded-pill">
                        <i className="fa-solid fa-money-bill-1 me-2"></i>
                        {t('pharmacyAdmin.dashboard.payouts')}
                      </Link>
                      <Link to="/pharmacy-admin/profile" className="btn btn-outline-secondary btn-md rounded-pill">
                        <i className="fa-solid fa-user-pen me-2"></i>
                        {t('pharmacyAdmin.dashboard.profile')}
                      </Link>
                    </div>

                    <div className="mt-3">
                      <div className="alert alert-info mb-0">
                        <div className="fw-bold mb-1">{t('pharmacyAdmin.dashboard.attention')}</div>
                        <div className="text-muted small">{t('pharmacyAdmin.dashboard.unpaidRecent', { count: unpaidCount })}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <PharmacySetupModal setup={setup} role={role} />
    </div>
  )
}

export default PharmacyAdminDashboard

