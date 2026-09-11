import { Link } from 'react-router-dom'
import Breadcrumb from '../../components/common/Breadcrumb'
import { toast } from 'react-toastify'
import { useCart } from '../../contexts/CartContext'
import { getImageUrl } from '../../utils/apiConfig'
import { useLanguage } from '../../contexts/LanguageContext'

const Cart = () => {
  const { t } = useLanguage()
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart()

  const handleQuantityChange = (cartItemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(cartItemId)
      toast.info(t('shop.itemRemoved', { name: t('shop.product') }))
    } else {
      updateQuantity(cartItemId, newQuantity)
    }
  }

  const handleRemoveItem = (cartItemId, productName) => {
    removeFromCart(cartItemId)
    toast.info(t('shop.itemRemoved', { name: productName }))
  }

  const subtotal = getCartTotal()
  const total = subtotal

  return (
    <>
      <Breadcrumb title={t('shop.pharmacy')} li1={t('shop.cart')} li2={t('shop.cart')} />
      <div className="content">
        <div className="container">
          {cartItems.length === 0 ? (
            <div className="text-center py-5">
              <h4>{t('shop.cartEmpty')}</h4>
              <p className="text-muted mb-4">{t('shop.cartEmptyHint')}</p>
              <Link to="/product-all" className="btn btn-primary">
                {t('shop.browseProducts')}
              </Link>
            </div>
          ) : (
            <>
              <div className="card card-table">
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover table-center mb-0">
                      <thead>
                        <tr>
                          <th>{t('shop.product')}</th>
                          <th>SKU</th>
                          <th>{t('shop.price')}</th>
                          <th className="text-center">{t('shop.quantity')}</th>
                          <th>{t('shop.total')}</th>
                          <th>{t('shop.action')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cartItems.map((item) => {
                          const cartItemId = item.cartItemId || item._id
                          return (
                          <tr key={cartItemId}>
                            <td>
                              <h2 className="table-avatar">
                                <Link to={`/product-description?id=${item._id}`} className="avatar avatar-sm me-2">
                                  <img
                                    className="avatar-img"
                                    src={getImageUrl(item.image) || '/assets/img/products/product.jpg'}
                                    alt={item.name}
                                    onError={(e) => {
                                      e.currentTarget.src = '/assets/img/products/product.jpg'
                                    }}
                                  />
                                </Link>
                              </h2>
                              <Link to={`/product-description?id=${item._id}`}>{item.name}</Link>
                              {item.variantName && <div className="text-muted small">{item.variantName}</div>}
                            </td>
                            <td>{item.sku || '—'}</td>
                            <td>€{Number(item.price || 0).toFixed(2)}</td>
                            <td className="text-center">
                              <div className="input-group1 cart-qty-stepper">
                                <span className="input-group-btn">
                                  <button
                                    type="button"
                                    className="quantity-left-minus btn btn-danger btn-number"
                                    onClick={() => handleQuantityChange(cartItemId, (item.quantity || 1) - 1)}
                                  >
                                    <span><i className="fas fa-minus"></i></span>
                                  </button>
                                </span>
                                <input
                                  type="text"
                                  className="input-number cart-qty-value"
                                  value={item.quantity || 1}
                                  readOnly
                                />
                                <span className="input-group-btn">
                                  <button
                                    type="button"
                                    className="quantity-right-plus btn btn-success btn-number"
                                    onClick={() => handleQuantityChange(cartItemId, (item.quantity || 1) + 1)}
                                    disabled={Number(item.stock ?? 0) <= (item.quantity || 1)}
                                  >
                                    <span><i className="fas fa-plus"></i></span>
                                  </button>
                                </span>
                              </div>
                            </td>
                            <td>€{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</td>
                            <td>
                              <div className="table-action">
                                <a
                                  href="#"
                                  className="btn btn-sm bg-danger-light"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    handleRemoveItem(cartItemId, item.name)
                                  }}
                                >
                                  <i className="fas fa-times"></i>
                                </a>
                              </div>
                            </td>
                          </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="row mt-4">
                <div className="col-md-7 col-lg-6">
                  <div className="mt-3">
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={() => {
                        if (window.confirm(t('shop.clearCartConfirm'))) {
                          clearCart()
                          toast.info(t('shop.cartCleared'))
                        }
                      }}
                    >
                      {t('shop.clearCart')}
                    </button>
                  </div>
                </div>
                <div className="col-md-5 col-lg-6">
                  <div className="booking-total">
                    <ul className="booking-total-list">
                      <li>
                        <span>{t('shop.subtotal')}</span>
                        <span className="total-cost">€{subtotal.toFixed(2)}</span>
                      </li>
                      <li>
                        <span>{t('shop.total')}</span>
                        <span className="total-cost">€{total.toFixed(2)}</span>
                      </li>
                    </ul>
                  </div>
                  <div className="submit-section">
                    <Link to="/product-checkout" className="btn btn-primary submit-btn w-100">
                      {t('shop.proceedCheckout')}
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default Cart

