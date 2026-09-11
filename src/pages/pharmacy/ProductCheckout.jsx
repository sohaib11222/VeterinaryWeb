import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Breadcrumb from '../../components/common/Breadcrumb'
import { toast } from 'react-toastify'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import { useCreateOrder } from '../../mutations/orderMutations'
import { useUserById } from '../../queries/userQueries'
import { useLanguage } from '../../contexts/LanguageContext'

const normalizeShippingAddress = (address = {}) => ({
  line1: String(address?.line1 || '').trim(),
  line2: String(address?.line2 || '').trim(),
  city: String(address?.city || '').trim(),
  state: String(address?.state || '').trim(),
  country: String(address?.country || 'Italy').trim() || 'Italy',
  zip: String(address?.zip || '').trim(),
})

const hasRequiredShippingAddress = (address) => Boolean(
  address?.line1 && address?.city && address?.state && address?.zip && address?.country
)

const ProductCheckout = () => {
  const { t } = useLanguage()
  const { cartItems, getCartTotal, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const userId = user?.id || user?._id
  const { data: userResponse } = useUserById(userId, { enabled: Boolean(userId) })
  const profileUser = useMemo(() => {
    const outer = userResponse?.data ?? userResponse
    return outer?.data ?? outer ?? user
  }, [userResponse, user])
  const defaultShippingAddress = useMemo(
    () => normalizeShippingAddress(profileUser?.address || user?.address),
    [
      profileUser?.address?.line1,
      profileUser?.address?.line2,
      profileUser?.address?.city,
      profileUser?.address?.state,
      profileUser?.address?.country,
      profileUser?.address?.zip,
      user?.address,
    ]
  )
  const hasDefaultShippingAddress = hasRequiredShippingAddress(defaultShippingAddress)

  const [formData, setFormData] = useState({
    firstName: user?.fullName?.split(' ')[0] || '',
    lastName: user?.fullName?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: user?.phone || '',
    shipToDifferentAddress: false,
    shippingLine1: '',
    shippingLine2: '',
    shippingCity: '',
    shippingState: '',
    shippingZip: '',
    shippingCountry: 'Italy',
    orderNotes: '',
    termsAccepted: false,
  })

  const subtotal = getCartTotal()
  const shipping = 0
  const total = subtotal

  const createOrderMutation = useCreateOrder()

  useEffect(() => {
    const fullName = profileUser?.fullName || profileUser?.name || user?.fullName || user?.name || ''
    const [firstName = '', ...remainingName] = fullName.trim().split(/\s+/).filter(Boolean)

    setFormData((prev) => ({
      ...prev,
      firstName: prev.firstName || firstName,
      lastName: prev.lastName || remainingName.join(' '),
      email: prev.email || profileUser?.email || user?.email || '',
      phone: prev.phone || profileUser?.phone || user?.phone || '',
      shippingLine1: prev.shippingLine1 || defaultShippingAddress.line1,
      shippingLine2: prev.shippingLine2 || defaultShippingAddress.line2,
      shippingCity: prev.shippingCity || defaultShippingAddress.city,
      shippingState: prev.shippingState || defaultShippingAddress.state,
      shippingZip: prev.shippingZip || defaultShippingAddress.zip,
      shippingCountry: prev.shippingCountry || defaultShippingAddress.country,
    }))
  }, [defaultShippingAddress, profileUser?.email, profileUser?.fullName, profileUser?.name, profileUser?.phone, user?.email, user?.fullName, user?.name, user?.phone])

  useEffect(() => {
    if (cartItems.length === 0) {
      toast.warning(t('shop.cartEmpty'))
      navigate('/product-all')
    }
  }, [cartItems, navigate])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.termsAccepted) {
      toast.error(t('shop.acceptTerms'))
      return
    }

    if (!user) {
      toast.error(t('shop.loginCheckout'))
      navigate('/login')
      return
    }

    const orderItems = cartItems.map((item) => ({
      productId: item._id,
      ...(item.variantId ? { variantId: item.variantId } : {}),
      quantity: item.quantity,
    }))

    let shippingAddress
    if (formData.shipToDifferentAddress) {
      shippingAddress = normalizeShippingAddress({
        line1: formData.shippingLine1,
        line2: formData.shippingLine2,
        city: formData.shippingCity,
        state: formData.shippingState,
        country: formData.shippingCountry,
        zip: formData.shippingZip,
      })

      if (!hasRequiredShippingAddress(shippingAddress)) {
        toast.error(t('shop.shippingRequired'))
        return
      }
    } else {
      if (!hasDefaultShippingAddress) {
        toast.error(t('shop.profileAddressRequired'))
        return
      }
      shippingAddress = defaultShippingAddress
    }

    try {
      const res = await createOrderMutation.mutateAsync({
        items: orderItems,
        shippingAddress,
      })

      clearCart()
      const payload = res?.data ?? res
      const createdOrders = Array.isArray(payload?.orders)
        ? payload.orders
        : (payload ? [payload] : [])

      toast.success(
        createdOrders.length > 1
          ? t('shop.ordersCreated', { count: createdOrders.length })
          : t('shop.orderCreated')
      )
      navigate('/order-history')
    } catch (error) {
      toast.error(error?.message || t('shop.orderFailed'))
    }
  }

  if (cartItems.length === 0) {
    return null
  }

  return (
    <>
      <Breadcrumb title={t('shop.pharmacy')} li1={t('shop.checkout')} li2={t('shop.checkout')} />
      <div className="content">
        <div className="container">
          <div className="row">
            <div className="col-md-6 col-lg-7">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">{t('shop.billingDetails')}</h3>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    <div className="info-widget">
                      <h4 className="card-title">{t('shop.personalInformation')}</h4>
                      <div className="row">
                        <div className="col-md-6 col-sm-12">
                          <div className="mb-3 card-label">
                            <label className="mb-2">{t('shop.firstName')}</label>
                            <input className="form-control" type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
                          </div>
                        </div>
                        <div className="col-md-6 col-sm-12">
                          <div className="mb-3 card-label">
                            <label className="mb-2">{t('shop.lastName')}</label>
                            <input className="form-control" type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
                          </div>
                        </div>
                        <div className="col-md-6 col-sm-12">
                          <div className="mb-3 card-label">
                            <label className="mb-2">{t('shop.email')}</label>
                            <input className="form-control" type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                          </div>
                        </div>
                        <div className="col-md-6 col-sm-12">
                          <div className="mb-3 card-label">
                            <label className="mb-2">{t('shop.phone')}</label>
                            <input className="form-control" type="text" name="phone" value={formData.phone} onChange={handleInputChange} required />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="info-widget">
                      <h4 className="card-title">{t('shop.shippingDetails')}</h4>
                      <div className="terms-accept">
                        <div className="custom-checkbox">
                          <input type="checkbox" id="ship_different" name="shipToDifferentAddress" checked={formData.shipToDifferentAddress} onChange={handleInputChange} />
                          <label htmlFor="ship_different">{t('shop.shipDifferent')}</label>
                        </div>
                      </div>

                      {!formData.shipToDifferentAddress && (
                        <div className={`alert ${hasDefaultShippingAddress ? 'alert-light border' : 'alert-warning'} mt-3 mb-0`}>
                          {hasDefaultShippingAddress ? (
                            <>
                              <strong>{t('shop.savedAddress')}</strong>
                              <div className="mt-1">{defaultShippingAddress.line1}</div>
                              {defaultShippingAddress.line2 && <div>{defaultShippingAddress.line2}</div>}
                              <div>{defaultShippingAddress.city}, {defaultShippingAddress.state} {defaultShippingAddress.zip}</div>
                              <div>{defaultShippingAddress.country}</div>
                            </>
                          ) : (
                            <>
                              <strong>{t('shop.noSavedAddress')}</strong>{' '}
                              <Link to="/profile-settings">{t('shop.addAddress')}</Link>
                            </>
                          )}
                        </div>
                      )}

                      {formData.shipToDifferentAddress && (
                        <div className="row mt-3">
                          <div className="col-md-12 mb-3 card-label">
                            <label className="ps-0 ms-0 mb-2">{t('shop.addressLine1')}</label>
                            <input className="form-control" type="text" name="shippingLine1" value={formData.shippingLine1} onChange={handleInputChange} />
                          </div>
                          <div className="col-md-12 mb-3 card-label">
                            <label className="ps-0 ms-0 mb-2">{t('shop.addressLine2')}</label>
                            <input className="form-control" type="text" name="shippingLine2" value={formData.shippingLine2} onChange={handleInputChange} />
                          </div>
                          <div className="col-md-6 mb-3 card-label">
                            <label className="ps-0 ms-0 mb-2">{t('shop.city')}</label>
                            <input className="form-control" type="text" name="shippingCity" value={formData.shippingCity} onChange={handleInputChange} />
                          </div>
                          <div className="col-md-6 mb-3 card-label">
                            <label className="ps-0 ms-0 mb-2">{t('shop.state')}</label>
                            <input className="form-control" type="text" name="shippingState" value={formData.shippingState} onChange={handleInputChange} />
                          </div>
                          <div className="col-md-6 mb-3 card-label">
                            <label className="ps-0 ms-0 mb-2">{t('shop.zip')}</label>
                            <input className="form-control" type="text" name="shippingZip" value={formData.shippingZip} onChange={handleInputChange} />
                          </div>
                          <div className="col-md-6 mb-3 card-label">
                            <label className="ps-0 ms-0 mb-2">{t('shop.country')}</label>
                            <input className="form-control" type="text" name="shippingCountry" value={formData.shippingCountry} onChange={handleInputChange} />
                          </div>
                        </div>
                      )}

                      <div className="mb-3 card-label">
                        <label className="ps-0 ms-0 mb-2">{t('shop.orderNotes')}</label>
                        <textarea rows="5" className="form-control" name="orderNotes" value={formData.orderNotes} onChange={handleInputChange}></textarea>
                      </div>
                    </div>

                    <div className="payment-widget">
                      <h4 className="card-title">{t('shop.paymentMethod')}</h4>

                      <div className="payment-list">
                        <label className="payment-radio credit-card-option">
                          <input type="radio" name="paymentMethod" value="STRIPE" checked readOnly />
                          <span className="checkmark"></span>
                          {t('booking.stripe')}
                        </label>
                      </div>

                      <div className="terms-accept">
                        <div className="custom-checkbox">
                          <input type="checkbox" id="terms_accept1" name="termsAccepted" checked={formData.termsAccepted} onChange={handleInputChange} />
                          <label htmlFor="terms_accept1">
                            {t('shop.termsAccept')} <Link to="/terms-condition">Terms &amp; Conditions</Link>
                          </label>
                        </div>
                      </div>

                      <div className="submit-section mt-4">
                        <button type="submit" className="btn btn-primary submit-btn" disabled={createOrderMutation.isPending}>
                          {createOrderMutation.isPending ? t('shop.creatingOrder') : t('shop.placeOrder')}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-5 theiaStickySidebar">
              <div className="card booking-card">
                <div className="card-header">
                  <h3 className="card-title">{t('shop.order')}</h3>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-center mb-0">
                      <tbody>
                        <tr>
                          <th>{t('shop.product')}</th>
                          <th className="text-end">{t('shop.total')}</th>
                        </tr>
                      </tbody>
                      <tbody>
                        {cartItems.map((item) => (
                          <tr key={item.cartItemId || item._id}>
                            <td>
                              {item.name} <span className="text-muted">x{item.quantity}</span>
                              {item.variantName && <div className="text-muted small">{item.variantName}</div>}
                            </td>
                            <td className="text-end">€{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="booking-summary pt-5">
                    <div className="booking-item-wrap">
                      <ul className="booking-date d-block pb-0">
                        <li>
                          {t('shop.subtotal')} <span>€{subtotal.toFixed(2)}</span>
                        </li>
                        <li>
                          {t('shop.shippingDetails')} <span>€{shipping.toFixed(2)}</span>
                        </li>
                      </ul>
                      <div className="booking-total">
                        <ul className="booking-total-list">
                          <li>
                            <span>{t('shop.total')}</span>
                            <span className="total-cost">€{total.toFixed(2)}</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ProductCheckout

