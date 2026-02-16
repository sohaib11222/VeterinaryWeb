import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Breadcrumb from '../../components/common/Breadcrumb'
import { toast } from 'react-toastify'
import { useCart } from '../../contexts/CartContext'
import { useProduct } from '../../queries/productQueries'
import { getImageUrl } from '../../utils/apiConfig'

const ProductDescription = () => {
  const { addToCart } = useCart()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const productId = searchParams.get('id')

  const [quantity, setQuantity] = useState(1)

  const productQuery = useProduct(productId)
  const payload = productQuery.data?.data ?? productQuery.data
  const product = payload?.data ?? payload

  useEffect(() => {
    if (product?.stock && quantity > product.stock) {
      setQuantity(product.stock)
    }
  }, [product, quantity])

  const handleQuantityChange = (delta) => {
    const next = quantity + delta
    if (next < 1) return
    if (product?.stock && next > product.stock) {
      toast.warning(`Only ${product.stock} items available in stock`)
      return
    }
    setQuantity(next)
  }

  const ensureAdd = (goCheckout) => {
    if (!product) return
    if (!isInStock) {
      toast.error('Product is out of stock')
      return
    }

    addToCart(product, quantity)

    if (goCheckout) {
      navigate('/product-checkout')
      return
    }

    toast.success(`${quantity} x ${product.name} added to cart!`)
  }

  if (productQuery.isLoading) {
    return (
      <>
        <Breadcrumb title="Pharmacy" li1="Product Description" li2="Loading..." />
        <div className="content">
          <div className="container">
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (productQuery.isError || !product) {
    return (
      <>
        <Breadcrumb title="Pharmacy" li1="Product Description" li2="Not Found" />
        <div className="content">
          <div className="container">
            <div className="alert alert-danger">
              <h5>Product Not Found</h5>
              <p>The product you're looking for doesn't exist.</p>
              <Link to="/product-all" className="btn btn-primary">Browse Products</Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  const productPrice = typeof product?.discountPrice === 'number' && product.discountPrice > 0 ? product.discountPrice : product.price
  const originalPrice = typeof product?.discountPrice === 'number' && product.discountPrice > 0 ? product.price : null
  const discountPercent = originalPrice ? Math.round(((originalPrice - productPrice) / originalPrice) * 100) : 0
  const productImage = getImageUrl(product?.images?.[0]) || '/assets/img/products/product.jpg'
  const isInStock = (product?.stock ?? 0) > 0

  return (
    <>
      <Breadcrumb title="Pharmacy" li1="Product Description" li2={product?.name || 'Product'} />
      <div className="content">
        <div className="container">
          <div className="row">
            <div className="col-md-7 col-lg-9 col-xl-9">
              <div className="card">
                <div className="card-body product-description">
                  <div className="doctor-widget">
                    <div className="doc-info-left">
                      <div className="doctor-img1">
                        <img
                          src={productImage}
                          className="img-fluid"
                          alt={product?.name}
                          onError={(e) => {
                            e.currentTarget.src = '/assets/img/products/product.jpg'
                          }}
                        />
                      </div>
                      <div className="doc-info-cont product-cont">
                        <h4 className="doc-name mb-2">{product?.name}</h4>
                        {product?.petStoreId?.name && (
                          <p className="mb-2">
                            <span className="text-muted">Sold by </span>
                            {product.petStoreId.name}
                          </p>
                        )}
                        <p>{product?.description || 'No description provided.'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-body pt-0">
                  <h3 className="pt-4">Product Details</h3>
                  <hr />
                  <div className="tab-content pt-3">
                    <div role="tabpanel" id="doc_overview" className="tab-pane fade show active">
                      <div className="row">
                        <div className="col-md-9">
                          <div className="widget about-widget">
                            <h4 className="widget-title">Description</h4>
                            <p>{product?.description || 'No description provided.'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-5 col-lg-3 col-xl-3 theiaStickySidebar">
              <div className="card search-filter">
                <div className="card-body">
                  <div className="clini-infos mt-0">
                    <h2>
                      €{Number(productPrice || 0).toFixed(2)}
                      {originalPrice !== null && (
                        <>
                          {' '}
                          <b className="text-lg strike">€{Number(originalPrice || 0).toFixed(2)}</b>{' '}
                          <span className="text-lg text-success">
                            <b>{discountPercent}% off</b>
                          </span>
                        </>
                      )}
                    </h2>
                  </div>
                  <span className={`badge ${isInStock ? 'badge-primary' : 'badge-danger'}`}>{isInStock ? 'In stock' : 'Out of stock'}</span>

                  <div className="custom-increment pt-4">
                    <div className="input-group1">
                      <span className="input-group-btn float-start">
                        <button type="button" className="quantity-left-minus btn btn-danger btn-number" onClick={() => handleQuantityChange(-1)}>
                          <span><i className="fas fa-minus"></i></span>
                        </button>
                      </span>
                      <input type="text" className="input-number" value={quantity} readOnly />
                      <span className="input-group-btn float-end">
                        <button
                          type="button"
                          className="quantity-right-plus btn btn-success btn-number"
                          onClick={() => handleQuantityChange(1)}
                          disabled={product?.stock ? quantity >= product.stock : false}
                        >
                          <span><i className="fas fa-plus"></i></span>
                        </button>
                      </span>
                    </div>
                  </div>

                  <div className="clinic-details mt-4">
                    <div className="clinic-booking d-grid" style={{ gap: 10 }}>
                      <button type="button" className="apt-btn" onClick={() => ensureAdd(false)} disabled={!isInStock}>
                        Add To Cart
                      </button>
                      <button type="button" className="btn btn-outline-primary" onClick={() => ensureAdd(true)} disabled={!isInStock}>
                        Buy Now
                      </button>
                    </div>
                  </div>

                  <div className="card flex-fill mt-4 mb-0">
                    <ul className="list-group list-group-flush">
                      <li className="list-group-item">
                        SKU <span className="float-end">{product?.sku || '—'}</span>
                      </li>
                      <li className="list-group-item">
                        Stock <span className="float-end">{product?.stock ?? 0}</span>
                      </li>
                      {product?.category && (
                        <li className="list-group-item">
                          Category <span className="float-end">{product.category}</span>
                        </li>
                      )}
                    </ul>
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

export default ProductDescription

