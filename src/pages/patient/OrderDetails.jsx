import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { useOrder } from '../../queries/orderQueries'
import { useCancelOrder, usePayForOrder } from '../../mutations/orderMutations'
import { getImageUrl } from '../../utils/apiConfig'

const OrderDetails = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()

  const orderQuery = useOrder(orderId)
  const payMutation = usePayForOrder()
  const cancelMutation = useCancelOrder()

  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const payload = orderQuery.data?.data ?? orderQuery.data
  const order = payload?.data ?? payload

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
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

  const onPay = async () => {
    if (!order) return
    try {
      await payMutation.mutateAsync({ orderId: order._id, data: { paymentMethod: 'STRIPE' } })
      toast.success('Payment successful')
      orderQuery.refetch()
    } catch (error) {
      toast.error(error?.message || 'Payment failed')
    }
  }

  const onCancel = async () => {
    if (!order) return
    try {
      await cancelMutation.mutateAsync(order._id)
      toast.success('Order cancelled')
      setShowCancelConfirm(false)
      navigate('/order-history')
    } catch (error) {
      toast.error(error?.message || 'Cancel failed')
    }
  }

  if (orderQuery.isLoading) {
    return (
      <div className="content">
        <div className="container">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading order details...</p>
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
            <h5 className="mt-3">Error Loading Order</h5>
            <p className="text-muted">{orderQuery.error?.message || 'Failed to load order details'}</p>
            <button className="btn btn-primary mt-3" onClick={() => orderQuery.refetch()}>
              Retry
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
          <h3>Order Details</h3>
          <Link to="/order-history" className="btn btn-outline-primary btn-sm">
            <i className="fe fe-arrow-left me-2"></i>
            Back to Orders
          </Link>
        </div>

        <div className="card mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted mb-1">Order Number</p>
                <h4 className="mb-0">#{orderNo}</h4>
                <p className="text-muted small mb-0 mt-2">Order Date: {formatDate(order?.createdAt)}</p>
              </div>
              <div className="text-end">
                {getStatusBadge(status)}
                <p className="text-muted small mb-0 mt-2">Payment: {paymentStatus || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {paymentStatus === 'UNPAID' && !shippingSet && (
          <div className="alert alert-info mb-4">
            <i className="fe fe-info me-2"></i>
            Waiting for pharmacy owner to set shipping fee. You will be able to pay once the shipping fee is set.
          </div>
        )}

        {paymentStatus === 'UNPAID' && shippingSet && (
          <div className="alert alert-warning mb-4">
            <i className="fe fe-alert-circle me-2"></i>
            Shipping fee has been set. Please complete payment to confirm your order.
          </div>
        )}

        {paymentStatus === 'PAID' && (
          <div className="alert alert-success mb-4">
            <i className="fe fe-check-circle me-2"></i>
            Payment completed. Your order is being processed.
          </div>
        )}

        <div className="card mb-4">
          <div className="card-header">
            <h4 className="card-title mb-0">Order Items</h4>
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

        {order?.shippingAddress && (order.shippingAddress.line1 || order.shippingAddress.city) && (
          <div className="card mb-4">
            <div className="card-header">
              <h4 className="card-title mb-0">Shipping Address</h4>
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
            <h4 className="card-title mb-0">Order Summary</h4>
          </div>
          <div className="card-body">
            <div className="d-flex justify-content-between mb-2">
              <span>Subtotal</span>
              <span>€{Number(order?.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span>Shipping</span>
              <span>€{Number(order?.shipping || 0).toFixed(2)}</span>
            </div>
            <hr />
            <div className="d-flex justify-content-between">
              <strong>Total</strong>
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
                    {payMutation.isPending ? 'Processing...' : `Pay €${Number(order?.total || 0).toFixed(2)}`}
                  </button>
                )}
                {canCancel && (
                  <button className="btn btn-danger" onClick={() => setShowCancelConfirm(true)} disabled={cancelMutation.isPending}>
                    Cancel Order
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
                <h5 className="modal-title">Cancel Order</h5>
                <button type="button" className="btn-close" onClick={() => setShowCancelConfirm(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to cancel order #{orderNo}?</p>
                <p className="text-muted">This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCancelConfirm(false)}>
                  No, Keep Order
                </button>
                <button type="button" className="btn btn-danger" onClick={onCancel} disabled={cancelMutation.isPending}>
                  {cancelMutation.isPending ? 'Cancelling...' : 'Yes, Cancel Order'}
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
