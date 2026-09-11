import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useOrders } from '../../queries/orderQueries'
import { useUpdateOrderStatus, useUpdateShippingFee } from '../../mutations/orderMutations'
import {
  DELIVERY_DAY_OPTIONS,
  calculateExpectedDeliveryPreview,
  deliveryStatusBadgeClass,
  formatDeliveryStatus,
} from '../../utils/deliveryMonitoring'
import { toast } from 'react-toastify'
import { useLanguage } from '../../contexts/LanguageContext'

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
  const { t, language } = useLanguage()
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
  const [deliveryDays, setDeliveryDays] = useState('')
  const [selectedOrderForShipping, setSelectedOrderForShipping] = useState(null)

  const { items: orders } = useMemo(() => normalizeListPayload(ordersQuery.data), [ordersQuery.data])

  const setOrderStatus = async (orderId, status) => {
    try {
      await updateStatus.mutateAsync({ orderId, data: { status } })
      toast.success(t('pharmacyAdmin.orders.orderUpdated'))
    } catch (error) {
      toast.error(error?.message || t('pharmacyAdmin.orders.updateFailed'))
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
    setDeliveryDays(order?.promisedDeliveryDays ? String(order.promisedDeliveryDays) : '')
    setShowShippingModal(true)
  }

  const submitShippingFee = async () => {
    if (!selectedOrderForShipping) return

    const fee = Number(shippingFee)
    if (!Number.isFinite(fee) || fee < 0) {
      toast.error(t('pharmacyAdmin.orders.validShippingFee'))
      return
    }
    const selectedDeliveryDays = Number(deliveryDays)
    if (!DELIVERY_DAY_OPTIONS.includes(selectedDeliveryDays)) {
      toast.error(t('pharmacyAdmin.orders.validDeliveryTime'))
      return
    }

    const id = selectedOrderForShipping?._id || selectedOrderForShipping?.id
    try {
      await updateShippingFee.mutateAsync({ orderId: id, shippingFee: fee, deliveryDays: selectedDeliveryDays })
      toast.success(t('pharmacyAdmin.orders.shippingSent'))
      setShowShippingModal(false)
      setSelectedOrderForShipping(null)
      setShippingFee('')
      setDeliveryDays('')
    } catch (error) {
      toast.error(error?.message || t('pharmacyAdmin.orders.shippingFailed'))
    }
  }

  return (
    <div className="pharmacy-admin-orders-mobile">
      <div className="page-header">
        <h3 className="page-title">{t('pharmacyAdmin.orders.title')}</h3>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="row pharmacy-order-filters">
            <div className="col-md-4 mb-3">
              <label className="form-label">{t('pharmacyAdmin.orders.status')}</label>
              <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">{t('pharmacyAdmin.orders.all')}</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {t(`pharmacyAdmin.dashboard.${s.toLowerCase()}`) || s}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">{t('pharmacyAdmin.orders.payment')}</label>
              <select className="form-select" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
                <option value="">{t('pharmacyAdmin.orders.all')}</option>
                <option value="PAID">{t('pharmacyAdmin.orders.paid')}</option>
                <option value="UNPAID">{t('pharmacyAdmin.orders.unpaid')}</option>
                <option value="REFUNDED">{t('pharmacyAdmin.orders.refunded')}</option>
              </select>
            </div>
          </div>

          {ordersQuery.isLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">{t('pharmacyAdmin.orders.loading')}</span>
              </div>
            </div>
          ) : ordersQuery.isError ? (
            <div className="alert alert-danger">{ordersQuery.error?.message || 'Failed to load orders'}</div>
          ) : orders.length === 0 ? (
            <div className="alert alert-info mb-0">{t('pharmacyAdmin.orders.empty')}</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0 pharmacy-admin-orders-table">
                <thead>
                  <tr>
                    <th>{t('pharmacyAdmin.orders.order')}</th>
                    <th>{t('pharmacyAdmin.orders.customer')}</th>
                    <th>{t('pharmacyAdmin.orders.total')}</th>
                    <th>{t('pharmacyAdmin.orders.shipping')}</th>
                    <th>{t('pharmacyAdmin.orders.payment')}</th>
                    <th>{t('pharmacyAdmin.orders.status')}</th>
                    <th>{t('pharmacyAdmin.orders.expectedDelivery')}</th>
                    <th>{t('pharmacyAdmin.orders.deliveryMonitoring')}</th>
                    <th style={{ width: 300 }}>{t('pharmacyAdmin.orders.actions')}</th>
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
                      ? t('pharmacyAdmin.orders.awaitingDelivery')
                      : (typeof finalShipping === 'number' ? finalShipping.toFixed(2) : finalShipping)
                    const paymentStatus = o?.paymentStatus || '—'
                    const status = o?.status || '—'
                    const expectedDelivery = o?.expectedDeliveryDate
                      ? new Date(o.expectedDeliveryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'
                    const deliveryStatus = formatDeliveryStatus(o?.deliveryStatus, o?.daysLate)

                    const isPaid = String(paymentStatus).toUpperCase() === 'PAID'
                    const normalizedStatus = String(status).toUpperCase()

                    return (
                      <tr key={id}>
                        <td data-label={t('pharmacyAdmin.orders.order')}>{orderNo}</td>
                        <td data-label={t('pharmacyAdmin.orders.customer')}>{customer}</td>
                        <td data-label={t('pharmacyAdmin.orders.total')}>{typeof total === 'number' ? total.toFixed(2) : total}</td>
                        <td data-label={t('pharmacyAdmin.orders.shipping')}>{shippingDisplay}</td>
                        <td data-label={t('pharmacyAdmin.orders.payment')}>{paymentStatus === 'PAID' ? t('pharmacyAdmin.orders.paid') : paymentStatus === 'UNPAID' ? t('pharmacyAdmin.orders.unpaid') : paymentStatus === 'REFUNDED' ? t('pharmacyAdmin.orders.refunded') : paymentStatus}</td>
                        <td data-label={t('pharmacyAdmin.orders.status')}>{t(`pharmacyAdmin.dashboard.${String(status).toLowerCase()}`) || status}</td>
                        <td data-label={t('pharmacyAdmin.orders.expectedDelivery')}>{expectedDelivery}</td>
                        <td data-label={t('pharmacyAdmin.orders.deliveryMonitoring')}>
                          {o?.expectedDeliveryDate ? (
                            <span className={`badge ${deliveryStatusBadgeClass(o?.deliveryStatus)}`}>{deliveryStatus}</span>
                          ) : <span className="badge badge-secondary">{t('pharmacyAdmin.orders.awaitingDelivery')}</span>}
                        </td>
                        <td data-label={t('pharmacyAdmin.orders.actions')}>
                          <div className="d-flex gap-2 align-items-center pharmacy-order-actions">
                            <Link to={`/pharmacy-admin/orders/${id}`} className="btn btn-sm btn-outline-secondary">
                              {t('pharmacyAdmin.products.view')}
                            </Link>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => openShippingModal(o)}
                              disabled={updateShippingFee.isPending || isPaid}
                            >
                              {t('pharmacyAdmin.orders.setShippingFee')}
                            </button>
                            <select
                              className="form-select form-select-sm"
                              value={status}
                              onChange={(e) => setOrderStatus(id, e.target.value)}
                              disabled={updateStatus.isPending}
                              title={!isPaid ? t('pharmacyAdmin.orders.onlyCancelled') : undefined}
                            >
                              {STATUS_OPTIONS.map((s) => {
                                const optionDisabled = !isPaid && s !== 'CANCELLED' && s !== normalizedStatus
                                return (
                                  <option key={s} value={s} disabled={optionDisabled}>
                                    {t(`pharmacyAdmin.dashboard.${s.toLowerCase()}`) || s}
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
          <div className="modal fade show pharmacy-order-modal" style={{ display: 'block' }} role="dialog" aria-modal="true">
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{t('pharmacyAdmin.orders.setShippingFee')}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowShippingModal(false)
                      setSelectedOrderForShipping(null)
                      setShippingFee('')
                      setDeliveryDays('')
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">{t('pharmacyAdmin.orders.shippingFee')}</label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      step="0.01"
                      value={shippingFee}
                      onChange={(e) => setShippingFee(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">{t('pharmacyAdmin.orders.expectedDeliveryTime')} <span className="text-danger">*</span></label>
                    <select
                      className="form-select"
                      value={deliveryDays}
                      onChange={(e) => setDeliveryDays(e.target.value)}
                      required
                    >
                      <option value="">{t('pharmacyAdmin.orders.selectDeliveryTime')}</option>
                      {DELIVERY_DAY_OPTIONS.map((days) => (
                        <option key={days} value={days}>{t('pharmacyAdmin.orders.days', { count: days })}</option>
                      ))}
                    </select>
                    {calculateExpectedDeliveryPreview(deliveryDays) && (
                      <small className="text-muted d-block mt-2">
                        Expected delivery date: {calculateExpectedDeliveryPreview(deliveryDays).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </small>
                    )}
                    <small className="text-muted d-block mt-1">{t('pharmacyAdmin.orders.automaticDate')}</small>
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
                      setDeliveryDays('')
                    }}
                  >
                    {t('pharmacyAdmin.orders.cancel')}
                  </button>
                  <button type="button" className="btn btn-primary" onClick={submitShippingFee} disabled={updateShippingFee.isPending}>
                    {updateShippingFee.isPending ? t('pharmacyAdmin.orders.saving') : t('pharmacyAdmin.orders.save')}
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
