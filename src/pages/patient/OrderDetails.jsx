import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { useOrder } from '../../queries/orderQueries'
import { useCancelOrder, usePayForOrder } from '../../mutations/orderMutations'
import { getImageUrl } from '../../utils/apiConfig'
import { deliveryStatusBadgeClass, formatDeliveryStatus } from '../../utils/deliveryMonitoring'
import { useLanguage } from '../../contexts/LanguageContext'

const OrderDetails = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const { language, t } = useLanguage()

  const orderQuery = useOrder(orderId)
  const payMutation = usePayForOrder()
  const cancelMutation = useCancelOrder()

  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const payload = orderQuery.data?.data ?? orderQuery.data
  const order = payload?.data ?? payload

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
    const label = {
      DELIVERED: t('patient.delivered'), SHIPPED: t('patient.shipped'), PROCESSING: t('patient.processing', 'Processing'), CONFIRMED: t('patient.appointment.confirmed'),
      CANCELLED: t('patient.cancelled'), REFUNDED: t('patient.refunded'), PENDING: t('patient.pending'),
    }[s] || s || '—'
    return <span className={`badge ${badges[s] || 'badge-secondary'}`}>{label}</span>
  }

  const onPay = async () => {
    if (!order) return
    try {
      await payMutation.mutateAsync({ orderId: order._id, data: { paymentMethod: 'STRIPE' } })
      toast.success(t('patient.paymentSuccessful'))
      orderQuery.refetch()
    } catch (error) {
      toast.error(error?.message || t('patient.paymentFailed'))
    }
  }

  const onCancel = async () => {
    if (!order) return
    try {
      await cancelMutation.mutateAsync(order._id)
      toast.success(t('patient.orderCancelled'))
      setShowCancelConfirm(false)
      navigate('/order-history')
    } catch (error) {
      toast.error(error?.message || t('patient.cancelFailed'))
    }
  }

  if (orderQuery.isLoading) {
    return (
      <div className="content">
        <div className="container">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">{t('patient.order.loadingDetails')}</span>
            </div>
            <p className="mt-3">{t('patient.order.loadingDetails')}</p>
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
            <h5 className="mt-3">{t('patient.order.loadError')}</h5>
            <p className="text-muted">{orderQuery.error?.message || t('patient.order.failedLoad')}</p>
            <button className="btn btn-primary mt-3" onClick={() => orderQuery.refetch()}>
              {t('patient.order.retry')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const status = String(order?.status || '').toUpperCase()
  const paymentStatus = String(order?.paymentStatus || '').toUpperCase()
  const finalShipping = order?.finalShipping
  const shippingSet = finalShipping !== null && finalShipping !== undefined

  const canPay = paymentStatus === 'UNPAID' && shippingSet && (status === 'PENDING' || status === 'CONFIRMED')
  const canCancel = paymentStatus !== 'PAID' && (status === 'PENDING' || status === 'CONFIRMED')

  const orderNo = order?.orderNumber || order?._id

  return (
    <div className="content">
      <div className="container">
        <div className="dashboard-header d-flex justify-content-between align-items-center">
          <h3>{t('patient.order.details')}</h3>
          <Link to="/order-history" className="btn btn-outline-primary btn-sm">
            <i className="fe fe-arrow-left me-2"></i>
            {t('patient.order.backToOrders')}
          </Link>
        </div>

        <div className="card mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted mb-1">{t('patient.order.orderNumber')}</p>
                <h4 className="mb-0">#{orderNo}</h4>
                <p className="text-muted small mb-0 mt-2">{t('patient.order.orderDate')}: {formatDate(order?.createdAt)}</p>
              </div>
              <div className="text-end">
                {getStatusBadge(status)}
                <p className="text-muted small mb-0 mt-2">{t('patient.order.payment')}: {getStatusBadge(paymentStatus)}</p>
              </div>
            </div>
          </div>
        </div>

        {paymentStatus === 'UNPAID' && !shippingSet && (
          <div className="alert alert-info mb-4">
            <i className="fe fe-info me-2"></i>
            {t('patient.order.waitingForShippingFee')}
          </div>
        )}

        {paymentStatus === 'UNPAID' && shippingSet && (
          <div className="alert alert-warning mb-4">
            <i className="fe fe-alert-circle me-2"></i>
            {t('patient.order.shippingFeeSet')}
          </div>
        )}

        {paymentStatus === 'PAID' && (
          <div className="alert alert-success mb-4">
            <i className="fe fe-check-circle me-2"></i>
            {t('patient.order.paymentCompleted')}
          </div>
        )}

        {order?.expectedDeliveryDate && (
          <div className="card mb-4 border-primary">
            <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h4 className="card-title mb-0">{t('patient.order.deliveryCommitment')}</h4>
              <span className={`badge ${deliveryStatusBadgeClass(order?.deliveryStatus)}`}>
                {formatDeliveryStatus(order?.deliveryStatus, order?.daysLate)}
              </span>
            </div>
            <div className="card-body">
              <p className="mb-2"><strong>{t('patient.order.estimatedDelivery')}</strong></p>
              <p className="mb-2">{t('patient.order.pharmacyCommitment')}: <strong>{order?.promisedDeliveryDays} {language === 'it' ? 'giorni' : 'days'}</strong></p>
              <p className="mb-0">{t('patient.order.expectedDeliveryDate')}: <strong>{new Date(order.expectedDeliveryDate).toLocaleDateString(language === 'it' ? 'it-IT' : 'en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></p>
              {order?.deliveryStatus === 'LATE' && order?.daysLate ? (
                <p className="text-danger small mb-0 mt-2">{t('patient.order.currentlyLate', { days: order.daysLate, suffix: Number(order.daysLate) === 1 ? (language === 'it' ? 'o' : '') : (language === 'it' ? 'i' : 's') })}</p>
              ) : null}
            </div>
          </div>
        )}

        <div className="card mb-4">
          <div className="card-header">
            <h4 className="card-title mb-0">{t('patient.order.orderItems')}</h4>
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
                    alt={p?.name || t('patient.order.product')}
                    className="img-fluid"
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', marginRight: '15px' }}
                    onError={(e) => {
                      e.currentTarget.src = '/assets/img/products/product.jpg'
                    }}
                  />
                  <div className="flex-grow-1">
                    <h5 className="mb-1">{p?.name || t('patient.order.product')}</h5>
                    <p className="text-muted mb-1">{t('patient.order.quantity')}: {item?.quantity || 0}</p>
                    <p className="text-muted mb-0">€{Number(itemPrice || 0).toFixed(2)} {t('patient.order.each')}</p>
                  </div>
                  <div>
                    <h5 className="mb-0">€{Number(item?.total || 0).toFixed(2)}</h5>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {order?.shippingAddress && (order.shippingAddress.line1 || order.shippingAddress.city) && (
          <div className="card mb-4">
            <div className="card-header">
              <h4 className="card-title mb-0">{t('patient.order.shippingAddress')}</h4>
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
            <h4 className="card-title mb-0">{t('patient.order.orderSummary')}</h4>
          </div>
          <div className="card-body">
            <div className="d-flex justify-content-between mb-2">
              <span>{t('patient.order.subtotal')}</span>
              <span>€{Number(order?.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span>{t('patient.order.shipping')}</span>
              <span>€{Number(order?.shipping || 0).toFixed(2)}</span>
            </div>
            <hr />
            <div className="d-flex justify-content-between">
              <strong>{t('patient.total')}</strong>
              <strong>€{Number(order?.total || 0).toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {(canPay || canCancel) && (
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex gap-2 flex-wrap">
                {canPay && (
                  <button className="btn btn-primary" onClick={onPay} disabled={payMutation.isPending}>
                    {payMutation.isPending ? t('patient.order.processing') : t('patient.order.payAmount', { amount: `€${Number(order?.total || 0).toFixed(2)}` })}
                  </button>
                )}
                {canCancel && (
                  <button className="btn btn-danger" onClick={() => setShowCancelConfirm(true)} disabled={cancelMutation.isPending}>
                    {t('patient.cancelOrder')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showCancelConfirm && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t('patient.cancelOrder')}</h5>
                <button type="button" className="btn-close" onClick={() => setShowCancelConfirm(false)}></button>
              </div>
              <div className="modal-body">
                <p>{t('patient.cancelThisOrder')} #{orderNo}?</p>
                <p className="text-muted">{t('patient.order.cannotUndo')}</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCancelConfirm(false)}>
                  {t('patient.order.keepOrder')}
                </button>
                <button type="button" className="btn btn-danger" onClick={onCancel} disabled={cancelMutation.isPending}>
                  {cancelMutation.isPending ? t('patient.appointment.cancelling') : t('patient.order.confirmCancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderDetails
