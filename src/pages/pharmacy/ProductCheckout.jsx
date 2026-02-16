import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Breadcrumb from '../../components/common/Breadcrumb'
import { toast } from 'react-toastify'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import { useCreateOrder } from '../../mutations/orderMutations'

const ProductCheckout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

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
    if (cartItems.length === 0) {
      toast.warning('Your cart is empty')
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
      toast.error('Please accept the Terms & Conditions to continue')
      return
    }

    if (!user) {
      toast.error('Please login to complete checkout')
      navigate('/login')
      return
    }

    const orderItems = cartItems.map((item) => ({
      productId: item._id,
      quantity: item.quantity,
    }))

    let shippingAddress = undefined
    if (formData.shipToDifferentAddress) {
      const hasRequired =
        formData.shippingLine1?.trim() &&
        formData.shippingCity?.trim() &&
        formData.shippingState?.trim() &&
        formData.shippingZip?.trim()

      if (!hasRequired) {
        toast.error('Please fill shipping address fields')
        return
      }

      shippingAddress = {
        line1: formData.shippingLine1.trim(),
        line2: formData.shippingLine2?.trim() || undefined,
        city: formData.shippingCity.trim(),
        state: formData.shippingState.trim(),
        country: formData.shippingCountry?.trim() || 'Italy',
        zip: formData.shippingZip.trim(),
      }
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
          ? `Orders created successfully! (${createdOrders.length}) The pharmacy owner will set shipping, then you can pay.`
          : 'Order created successfully! The pharmacy owner will set shipping, then you can pay.'
      )
      navigate('/order-history')
    } catch (error) {
      toast.error(error?.message || 'Failed to create order')
    }
  }

  if (cartItems.length === 0) {
    return null
  }

  return (
    <>
      <Breadcrumb title="Pharmacy" li1="Checkout" li2="Checkout" />
      <div className="content">
        <div className="container">
          <div className="row">
            <div className="col-md-6 col-lg-7">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Billing details</h3>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    <div className="info-widget">
                      <h4 className="card-title">Personal Information</h4>
                      <div className="row">
                        <div className="col-md-6 col-sm-12">
                          <div className="mb-3 card-label">
                            <label className="mb-2">First Name</label>
                            <input className="form-control" type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
                          </div>
                        </div>
                        <div className="col-md-6 col-sm-12">
                          <div className="mb-3 card-label">
                            <label className="mb-2">Last Name</label>
                            <input className="form-control" type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
                          </div>
                        </div>
                        <div className="col-md-6 col-sm-12">
                          <div className="mb-3 card-label">
                            <label className="mb-2">Email</label>
                            <input className="form-control" type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                          </div>
                        </div>
                        <div className="col-md-6 col-sm-12">
                          <div className="mb-3 card-label">
                            <label className="mb-2">Phone</label>
                            <input className="form-control" type="text" name="phone" value={formData.phone} onChange={handleInputChange} required />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="info-widget">
                      <h4 className="card-title">Shipping Details</h4>
                      <div className="terms-accept">
                        <div className="custom-checkbox">
                          <input type="checkbox" id="ship_different" name="shipToDifferentAddress" checked={formData.shipToDifferentAddress} onChange={handleInputChange} />
                          <label htmlFor="ship_different">Ship to a different address?</label>
                        </div>
                      </div>

                      {formData.shipToDifferentAddress && (
                        <div className="row mt-3">
                          <div className="col-md-12 mb-3 card-label">
                            <label className="ps-0 ms-0 mb-2">Address Line 1</label>
                            <input className="form-control" type="text" name="shippingLine1" value={formData.shippingLine1} onChange={handleInputChange} />
                          </div>
                          <div className="col-md-12 mb-3 card-label">
                            <label className="ps-0 ms-0 mb-2">Address Line 2 (Optional)</label>
                            <input className="form-control" type="text" name="shippingLine2" value={formData.shippingLine2} onChange={handleInputChange} />
                          </div>
                          <div className="col-md-6 mb-3 card-label">
                            <label className="ps-0 ms-0 mb-2">City</label>
                            <input className="form-control" type="text" name="shippingCity" value={formData.shippingCity} onChange={handleInputChange} />
                          </div>
                          <div className="col-md-6 mb-3 card-label">
                            <label className="ps-0 ms-0 mb-2">State</label>
                            <input className="form-control" type="text" name="shippingState" value={formData.shippingState} onChange={handleInputChange} />
                          </div>
                          <div className="col-md-6 mb-3 card-label">
                            <label className="ps-0 ms-0 mb-2">ZIP Code</label>
                            <input className="form-control" type="text" name="shippingZip" value={formData.shippingZip} onChange={handleInputChange} />
                          </div>
                          <div className="col-md-6 mb-3 card-label">
                            <label className="ps-0 ms-0 mb-2">Country</label>
                            <input className="form-control" type="text" name="shippingCountry" value={formData.shippingCountry} onChange={handleInputChange} />
                          </div>
                        </div>
                      )}

                      <div className="mb-3 card-label">
                        <label className="ps-0 ms-0 mb-2">Order notes (Optional)</label>
                        <textarea rows="5" className="form-control" name="orderNotes" value={formData.orderNotes} onChange={handleInputChange}></textarea>
                      </div>
                    </div>

                    <div className="payment-widget">
                      <h4 className="card-title">Payment Method</h4>

                      <div className="payment-list">
                        <label className="payment-radio credit-card-option">
                          <input type="radio" name="paymentMethod" value="DUMMY" checked readOnly />
                          <span className="checkmark"></span>
                          Dummy Payment
                        </label>
                      </div>

                      <div className="terms-accept">
                        <div className="custom-checkbox">
                          <input type="checkbox" id="terms_accept1" name="termsAccepted" checked={formData.termsAccepted} onChange={handleInputChange} />
                          <label htmlFor="terms_accept1">
                            I have read and accept <Link to="/terms-condition">Terms & Conditions</Link>
                          </label>
                        </div>
                      </div>

                      <div className="submit-section mt-4">
                        <button type="submit" className="btn btn-primary submit-btn" disabled={createOrderMutation.isPending}>
                          {createOrderMutation.isPending ? 'Creating Order...' : 'Place Order'}
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
                  <h3 className="card-title">Your Order</h3>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-center mb-0">
                      <tbody>
                        <tr>
                          <th>Product</th>
                          <th className="text-end">Total</th>
                        </tr>
                      </tbody>
                      <tbody>
                        {cartItems.map((item) => (
                          <tr key={item._id}>
                            <td>
                              {item.name} <span className="text-muted">x{item.quantity}</span>
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
                          Subtotal <span>€{subtotal.toFixed(2)}</span>
                        </li>
                        <li>
                          Shipping <span>€{shipping.toFixed(2)}</span>
                        </li>
                      </ul>
                      <div className="booking-total">
                        <ul className="booking-total-list">
                          <li>
                            <span>Total</span>
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

