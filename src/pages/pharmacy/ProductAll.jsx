import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Breadcrumb from '../../components/common/Breadcrumb'
import { toast } from 'react-toastify'
import { useCart } from '../../contexts/CartContext'
import { useProducts } from '../../queries/productQueries'
import { getImageUrl } from '../../utils/apiConfig'

const extractProducts = (payload, fallbackLimit = 12) => {
  const outer = payload?.data ?? payload
  const data = outer?.data ?? outer
  const products = data?.products ?? data?.items
  const pagination = data?.pagination
  return {
    products: Array.isArray(products) ? products : [],
    pagination: pagination || { page: 1, limit: fallbackLimit, total: 0, pages: 1 },
  }
}

const ProductAll = () => {
  const { addToCart } = useCart()
  const [searchParams, setSearchParams] = useSearchParams()

  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const sellerId = searchParams.get('sellerId') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 12

  const [searchTerm, setSearchTerm] = useState(search)
  const [selectedCategory, setSelectedCategory] = useState(category)

  const productsQuery = useProducts({ search, category, sellerId, page, limit })
  const { products, pagination } = useMemo(
    () => extractProducts(productsQuery.data, limit),
    [productsQuery.data]
  )

  const categories = useMemo(() => {
    const set = new Set()
    products.forEach((p) => {
      if (p?.category) set.add(p.category)
    })
    return Array.from(set).sort()
  }, [products])

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)
    if (searchTerm) params.set('search', searchTerm)
    else params.delete('search')
    params.set('page', '1')
    setSearchParams(params)
  }

  const handleCategoryChange = (cat) => {
    const params = new URLSearchParams(searchParams)
    if (cat && cat !== selectedCategory) {
      params.set('category', cat)
      setSelectedCategory(cat)
    } else {
      params.delete('category')
      setSelectedCategory('')
    }
    params.set('page', '1')
    setSearchParams(params)
  }

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(newPage))
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAddToCart = (e, product) => {
    e.preventDefault()
    e.stopPropagation()
    if (product?.stock === 0) {
      toast.error('Product is out of stock')
      return
    }

    addToCart(product, 1)
    toast.success(`${product?.name || 'Product'} added to cart!`)
  }

  return (
    <>
      <Breadcrumb title="Pharmacy" li1="Products" li2="All Products" />
      <div className="content">
        <div className="container">
          <div className="row">
            <div className="col-md-5 col-lg-3 col-xl-3 theiaStickySidebar">
              <div className="card search-filter">
                <div className="card-header">
                  <h4 className="card-title mb-0">Filter</h4>
                </div>
                <div className="card-body">
                  <div className="filter-widget mb-4">
                    <h4>Search</h4>
                    <form onSubmit={handleSearch}>
                      <div className="input-group mb-3">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search products..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary">
                          <i className="fas fa-search"></i>
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="filter-widget">
                    <h4>Categories</h4>
                    <div>
                      <label className="custom_check">
                        <input type="checkbox" checked={!selectedCategory} onChange={() => handleCategoryChange('')} />
                        <span className="checkmark"></span> All Categories
                      </label>
                    </div>
                    {categories.map((cat, idx) => (
                      <div key={idx}>
                        <label className="custom_check">
                          <input type="checkbox" checked={selectedCategory === cat} onChange={() => handleCategoryChange(cat)} />
                          <span className="checkmark"></span> {cat}
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="btn-search mt-3">
                    <button
                      type="button"
                      className="btn w-100"
                      onClick={() => {
                        setSearchTerm('')
                        setSelectedCategory('')
                        const params = new URLSearchParams()
                        if (sellerId) params.set('sellerId', sellerId)
                        setSearchParams(params)
                      }}
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-7 col-lg-9 col-xl-9">
              <div className="row align-items-center pb-3">
                <div className="col-md-12">
                  <h3 className="title pharmacy-title">{sellerId ? 'Pharmacy Products' : 'All Products'}</h3>
                  <span className="sort-title">
                    Showing {products.length} of {pagination.total} products
                    {sellerId ? ' from this pharmacy' : ''}
                  </span>
                </div>
              </div>

              {productsQuery.isLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : productsQuery.isError ? (
                <div className="alert alert-danger">{productsQuery.error?.message || 'Failed to load products'}</div>
              ) : products.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted">No products found. Try adjusting your filters.</p>
                </div>
              ) : (
                <>
                  <div className="row">
                    {products.map((product) => {
                      const productId = product?._id || product?.id
                      const productPrice = typeof product?.discountPrice === 'number' && product.discountPrice > 0 ? product.discountPrice : product?.price
                      const originalPrice = typeof product?.discountPrice === 'number' && product.discountPrice > 0 ? product?.price : null
                      const productImage = getImageUrl(product?.images?.[0]) || '/assets/img/products/product.jpg'

                      return (
                        <div key={productId} className="col-md-12 col-lg-4 col-xl-4 product-custom mb-4">
                          <div className="profile-widget" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <div className="doc-img" style={{ height: '250px', overflow: 'hidden', position: 'relative' }}>
                              <Link to={`/product-description?id=${productId}`} tabIndex="-1" style={{ display: 'block', height: '100%' }}>
                                <img
                                  className="img-fluid"
                                  alt={product?.name}
                                  src={productImage}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                                  onError={(e) => {
                                    e.currentTarget.onerror = null
                                    e.currentTarget.src = '/assets/img/products/product.jpg'
                                  }}
                                />
                              </Link>
                              <a href="javascript:void(0)" className="fav-btn" tabIndex="-1">
                                <i className="far fa-bookmark"></i>
                              </a>
                            </div>
                            <div className="pro-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                              <h3 className="title pb-4" style={{ flex: 1 }}>
                                <Link to={`/product-description?id=${productId}`} tabIndex="-1">{product?.name}</Link>
                              </h3>
                              <div className="row align-items-center">
                                <div className="col-lg-6">
                                  <span className="price">€{Number(productPrice || 0).toFixed(2)}</span>
                                  {originalPrice !== null && <span className="price-strike">€{Number(originalPrice || 0).toFixed(2)}</span>}
                                </div>
                                <div className="col-lg-6 text-end">
                                  <a
                                    href="#"
                                    className="cart-icon"
                                    onClick={(e) => handleAddToCart(e, product)}
                                    title="Add to Cart"
                                  >
                                    <i className="fas fa-shopping-cart"></i>
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {pagination.pages > 1 && (
                    <div className="row mt-4">
                      <div className="col-md-12">
                        <nav>
                          <ul className="pagination justify-content-center">
                            <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                              <button className="page-link" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
                                Previous
                              </button>
                            </li>
                            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((n) => (
                              <li key={n} className={`page-item ${page === n ? 'active' : ''}`}>
                                <button className="page-link" onClick={() => handlePageChange(n)}>
                                  {n}
                                </button>
                              </li>
                            ))}
                            <li className={`page-item ${page === pagination.pages ? 'disabled' : ''}`}>
                              <button className="page-link" onClick={() => handlePageChange(page + 1)} disabled={page === pagination.pages}>
                                Next
                              </button>
                            </li>
                          </ul>
                        </nav>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ProductAll

