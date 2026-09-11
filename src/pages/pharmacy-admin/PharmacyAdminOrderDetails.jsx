import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useLanguage } from '../../contexts/LanguageContext'

import { useOrder } from '../../queries/orderQueries'
import { useUpdateOrderStatus, useUpdateShippingFee } from '../../mutations/orderMutations'
import { getImageUrl } from '../../utils/apiConfig'
import {
  DELIVERY_DAY_OPTIONS,
  calculateExpectedDeliveryPreview,
  deliveryStatusBadgeClass,
  formatDeliveryStatus,
} from '../../utils/deliveryMonitoring'

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']

const PharmacyAdminOrderDetails = () => {
  const { t, language } = useLanguage()
  const { orderId } = useParams()

  const orderQuery = useOrder(orderId)
  const updateStatusMutation = useUpdateOrderStatus()
  const updateShippingFeeMutation = useUpdateShippingFee()

  const [showShippingModal, setShowShippingModal] = useState(false)
  const [shippingFee, setShippingFee] = useState('')
  const [deliveryDays, setDeliveryDays] = useState('')

  const payload = orderQuery.data?.data ?? orderQuery.data
  const order = payload?.data ?? payload

  const isPaid = String(order?.paymentStatus || '').toUpperCase() === 'PAID'

  const orderNo = order?.orderNumber || order?._id

  const customer = useMemo(() => {
    const p = order?.petOwnerId
    return {
      name: p?.name || '—',
      email: p?.email || '—',
      phone: p?.phone || '—',
    }
  }, [order])

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleDateString(language === 'it' ? 'it-IT' : 'en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

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

  const openShippingModal = () => {
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
    const fee = Number(shippingFee)
    if (!Number.isFinite(fee) || fee < 0) {
      toast.error(t('pharmacyAdmin.orderDetails.validShippingFee'))
      return
    }
    const selectedDeliveryDays = Number(deliveryDays)
    if (!DELIVERY_DAY_OPTIONS.includes(selectedDeliveryDays)) {
      toast.error(t('pharmacyAdmin.orderDetails.validDeliveryTime'))
      return
    }

    try {
      await updateShippingFeeMutation.mutateAsync({ orderId, shippingFee: fee, deliveryDays: selectedDeliveryDays })
      toast.success(t('pharmacyAdmin.orderDetails.shippingSent'))
      setShowShippingModal(false)
      setShippingFee('')
      setDeliveryDays('')
      orderQuery.refetch()
    } catch (error) {
      toast.error(error?.message || t('pharmacyAdmin.orderDetails.shippingFailed'))
    }
  }

  const setOrderStatus = async (status) => {
    try {
      await updateStatusMutation.mutateAsync({ orderId, data: { status } })
      toast.success(t('pharmacyAdmin.orderDetails.orderUpdated'))
      orderQuery.refetch()
    } catch (error) {
      toast.error(error?.message || t('pharmacyAdmin.orderDetails.updateFailed'))
    }
  }

  if (orderQuery.isLoading) {
    return (
      <div className="content">
        <div className="container">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">{t('pharmacyAdmin.orderDetails.loading')}</span>
            </div>
            <p className="mt-3">{t('pharmacyAdmin.orderDetails.loadingText')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (orderQuery.isError || !order) {
    return (
      <div className="content">
        <div className="container">
          <div className="text-center py-5">
            <i className="fe fe-alert-circle" style={{ fontSize: '64px', color: '#dc3545' }}></i>
            <h5 className="mt-3">{t('pharmacyAdmin.orderDetails.errorTitle')}</h5>
            <p className="text-muted">{orderQuery.error?.message || t('pharmacyAdmin.orderDetails.failed')}</p>
            <button className="btn btn-primary mt-3" onClick={() => orderQuery.refetch()}>
              {t('pharmacyAdmin.orderDetails.retry')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const finalShipping = order?.finalShipping
  const shippingSet = finalShipping !== null && finalShipping !== undefined

  const total = Number(order?.total ?? order?.finalTotal ?? order?.initialTotal ?? 0)
  const expectedDeliveryDate = order?.expectedDeliveryDate
    ? new Date(order.expectedDeliveryDate).toLocaleDateString(language === 'it' ? 'it-IT' : 'en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—'

  return (
    <div className="content">
      <div className="container">
        <div className="dashboard-header d-flex justify-content-between align-items-center">
          <h3>{t('pharmacyAdmin.orderDetails.title')}</h3>
          <Link to="/pharmacy-admin/orders" className="btn btn-outline-primary btn-sm">
            <i className="fe fe-arrow-left me-2"></i>
            {t('pharmacyAdmin.orderDetails.back')}
          </Link>
        </div>

        <div className="card mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted mb-1">{t('pharmacyAdmin.orderDetails.orderNumber')}</p>
                <h4 className="mb-0">#{orderNo}</h4>
                <p className="text-muted small mb-0 mt-2">{t('pharmacyAdmin.orderDetails.orderDate')}: {formatDate(order?.createdAt)}</p>
              </div>
              <div className="text-end">
                {getStatusBadge(order?.status)}
                <p className="text-muted small mb-0 mt-2">Payment: {order?.paymentStatus || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h4 className="card-title mb-0">{t('pharmacyAdmin.orderDetails.deliveryCommitment')}</h4>
            {order?.expectedDeliveryDate ? (
              <span className={`badge ${deliveryStatusBadgeClass(order?.deliveryStatus)}`}>
                {formatDeliveryStatus(order?.deliveryStatus, order?.daysLate)}
              </span>
            ) : (
              <span className="badge badge-secondary">{t('pharmacyAdmin.orderDetails.awaitingDelivery')}</span>
            )}
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4"><strong>{t('pharmacyAdmin.orderDetails.estimatedDelivery')}</strong><div className="text-muted">{t('pharmacyAdmin.orderDetails.daysRange')}</div></div>
              <div className="col-md-4"><strong>{t('pharmacyAdmin.orderDetails.pharmacyPromise')}</strong><div className="text-muted">{order?.promisedDeliveryDays ? t('pharmacyAdmin.orderDetails.days', { count: order.promisedDeliveryDays }) : t('pharmacyAdmin.orderDetails.notSet')}</div></div>
              <div className="col-md-4"><strong>{t('pharmacyAdmin.orderDetails.expectedDeliveryDate')}</strong><div className="text-muted">{expectedDeliveryDate}</div></div>
              <div className="col-md-4"><strong>{t('pharmacyAdmin.orderDetails.orderRequested')}</strong><div className="text-muted">{formatDate(order?.requestedAt || order?.createdAt)}</div></div>
              <div className="col-md-4"><strong>{t('pharmacyAdmin.orderDetails.paymentRequestSent')}</strong><div className="text-muted">{formatDate(order?.shippingFeeAddedAt || order?.shippingUpdatedAt)}</div></div>
              <div className="col-md-4"><strong>{t('pharmacyAdmin.orderDetails.customerPaid')}</strong><div className="text-muted">{formatDate(order?.customerPaidAt)}</div></div>
              {order?.actualDeliveredAt && (
                <>
                  <div className="col-md-4"><strong>{t('pharmacyAdmin.orderDetails.delivered')}</strong><div className="text-muted">{formatDate(order.actualDeliveredAt)}</div></div>
                  <div className="col-md-4"><strong>{t('pharmacyAdmin.orderDetails.actualDeliveryTime')}</strong><div className="text-muted">{order.totalActualDeliveryDays ? t('pharmacyAdmin.orderDetails.days', { count: order.totalActualDeliveryDays }) : '—'}</div></div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-header">
            <h4 className="card-title mb-0">{t('pharmacyAdmin.orderDetails.customerInformation')}</h4>
          </div>
          <div className="card-body">
            <div className="row mb-2">
              <div className="col-sm-4"><strong>{t('pharmacyAdmin.orderDetails.name')}</strong></div>
              <div className="col-sm-8">{customer.name}</div>
            </div>
            <div className="row mb-2">
              <div className="col-sm-4"><strong>{t('pharmacyAdmin.orderDetails.email')}</strong></div>
              <div className="col-sm-8">{customer.email}</div>
            </div>
            <div className="row">
              <div className="col-sm-4"><strong>{t('pharmacyAdmin.orderDetails.phone')}</strong></div>
              <div className="col-sm-8">{customer.phone}</div>
            </div>
          </div>
        </div>

        {order?.shippingAddress && (order.shippingAddress.line1 || order.shippingAddress.city) && (
          <div className="card mb-4">
            <div className="card-header">
              <h4 className="card-title mb-0">{t('pharmacyAdmin.orderDetails.shippingAddress')}</h4>
            </div>
            <div className="card-body">
              <p className="mb-1">{order.shippingAddress?.line1}</p>
              {order.shippingAddress?.line2 && <p className="mb-1">{order.shippingAddress.line2}</p>}
              <p className="mb-1">
                {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zip}
              </p>
              <p className="mb-0">{order.shippingAddress?.country}</p>
            </div>
          </div>
        )}

        <div className="card mb-4">
          <div className="card-header">
            <h4 className="card-title mb-0">{t('pharmacyAdmin.orderDetails.orderItems')}</h4>
          </div>
          <div className="card-body">
            {(order?.items || []).map((item, index) => {
              const p = item?.productId
              const img = getImageUrl(p?.images?.[0]) || '/assets/img/products/product.jpg'
              const itemPrice = item?.discountPrice || item?.price
              return (
                <div key={item?._id || index} className="d-flex align-items-center mb-3 pb-3 border-bottom">
                  <img
                    src={img}
                    alt={p?.name || 'product'}
                    className="img-fluid"
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', marginRight: '15px' }}
                    onError={(e) => {
                      e.currentTarget.src = '/assets/img/products/product.jpg'
                    }}
                  />
                  <div className="flex-grow-1">
                    <h5 className="mb-1">{p?.name || 'Product'}</h5>
                    <p className="text-muted mb-1">Quantity: {item?.quantity || 0}</p>
                    <p className="text-muted mb-0">€{Number(itemPrice || 0).toFixed(2)} each</p>
                  </div>
                  <div>
                    <h5 className="mb-0">€{Number(item?.total || 0).toFixed(2)}</h5>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-header">
            <h4 className="card-title mb-0">{t('pharmacyAdmin.orderDetails.orderSummary')}</h4>
          </div>
          <div className="card-body">
            <div className="d-flex justify-content-between mb-2">
              <span>{t('pharmacyAdmin.orderDetails.subtotal')}</span>
              <span>€{Number(order?.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <div>
                <span>{t('pharmacyAdmin.orderDetails.shipping')}</span>
                {shippingSet && order?.initialShipping !== undefined && order?.initialShipping !== order?.shipping && (
                  <small className="text-muted d-block">
                    Updated from €{Number(order?.initialShipping || 0).toFixed(2)}
                  </small>
                )}
                {order?.shippingUpdatedAt && (
                  <small className="text-muted d-block">
                    Updated on {formatDate(order.shippingUpdatedAt)}
                  </small>
                )}
              </div>
              <span>€{Number(order?.shipping || 0).toFixed(2)}</span>
            </div>
            <hr />
            <div className="d-flex justify-content-between">
              <strong>{t('pharmacyAdmin.orderDetails.total')}</strong>
              <strong>€{total.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-body">
            <div className="d-flex gap-2 align-items-center flex-wrap">
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={openShippingModal}
                disabled={updateShippingFeeMutation.isPending || isPaid}
              >
                {shippingSet ? t('pharmacyAdmin.orderDetails.updateShippingFee') : t('pharmacyAdmin.orderDetails.setShippingFee')}
              </button>

              <select
                className="form-select"
                style={{ width: 220 }}
                value={order?.status || ''}
                onChange={(e) => setOrderStatus(e.target.value)}
                disabled={updateStatusMutation.isPending}
                title={!isPaid ? t('pharmacyAdmin.orderDetails.onlyCancelled') : undefined}
              >
                {STATUS_OPTIONS.map((s) => {
                  const optionDisabled = !isPaid && s !== 'CANCELLED' && s !== String(order?.status || '').toUpperCase()
                  return (
                    <option key={s} value={s} disabled={optionDisabled}>
                      {t(`pharmacyAdmin.dashboard.${s.toLowerCase()}`) || s}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>
        </div>
      </div>

      {showShippingModal && (
        <>
          <div className="modal fade show" style={{ display: 'block' }} role="dialog" aria-modal="true">
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{t('pharmacyAdmin.orderDetails.setShippingFee')}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowShippingModal(false)
                      setShippingFee('')
                      setDeliveryDays('')
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">{t('pharmacyAdmin.orderDetails.shippingFee')}</label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      step="0.01"
                      value={shippingFee}
                      onChange={(e) => setShippingFee(e.target.value)}
                    />
                    {shippingFee && Number.isFinite(Number(shippingFee)) && (
                      <small className="text-muted d-block mt-2">
                        New Total: €{(Number(order?.subtotal || 0) + Number(shippingFee)).toFixed(2)}
                      </small>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">{t('pharmacyAdmin.orderDetails.expectedDeliveryTime')} <span className="text-danger">*</span></label>
                    <select className="form-select" value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value)} required>
                      <option value="">{t('pharmacyAdmin.orderDetails.selectDeliveryTime')}</option>
                      {DELIVERY_DAY_OPTIONS.map((days) => <option key={days} value={days}>{t('pharmacyAdmin.orderDetails.days', { count: days })}</option>)}
                    </select>
                    {calculateExpectedDeliveryPreview(deliveryDays) && (
                      <small className="text-muted d-block mt-2">
                        Expected delivery date: {calculateExpectedDeliveryPreview(deliveryDays).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </small>
                    )}
                    <small className="text-muted d-block mt-1">{t('pharmacyAdmin.orderDetails.promiseHint')}</small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowShippingModal(false)
                      setShippingFee('')
                      setDeliveryDays('')
                    }}
                  >
                    {t('pharmacyAdmin.orderDetails.cancel')}
                  </button>
                  <button type="button" className="btn btn-primary" onClick={submitShippingFee} disabled={updateShippingFeeMutation.isPending}>
                    {updateShippingFeeMutation.isPending ? t('pharmacyAdmin.orderDetails.saving') : t('pharmacyAdmin.orderDetails.save')}
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

export default PharmacyAdminOrderDetails
