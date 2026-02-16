import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useState, useEffect, useMemo } from 'react'
import { useCart } from '../../contexts/CartContext'
import { getImageUrl } from '../../utils/apiConfig'
import { useUserById } from '../../queries/userQueries'
import { useVeterinarianProfile } from '../../queries/veterinarianQueries'
import { useMyPetStore } from '../../queries/petStoreQueries'

const ROLES = { PET_OWNER: 'PET_OWNER', VETERINARIAN: 'VETERINARIAN', ADMIN: 'ADMIN', PET_STORE: 'PET_STORE', PARAPHARMACY: 'PARAPHARMACY' }

const Header = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { getCartItemCount } = useCart()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [hasGoogleTranslateBanner, setHasGoogleTranslateBanner] = useState(false)
  const role = user?.role
  const userId = user?.id || user?._id

  const { data: userRes } = useUserById(userId, { enabled: Boolean(userId) })
  const backendUser = useMemo(() => userRes?.data || null, [userRes])

  const { data: vetProfileRes } = useVeterinarianProfile({ enabled: role === ROLES.VETERINARIAN && Boolean(user) })
  const vetProfile = useMemo(
    () => vetProfileRes?.data?.data || vetProfileRes?.data || vetProfileRes || null,
    [vetProfileRes]
  )

  const { data: myPetStoreRes } = useMyPetStore({ enabled: (role === ROLES.PET_STORE || role === ROLES.PARAPHARMACY) && Boolean(user) })
  const myPetStore = useMemo(() => {
    const payload = myPetStoreRes?.data ?? myPetStoreRes
    return payload?.data ?? payload
  }, [myPetStoreRes])

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')
  const isIndexPage = location.pathname === '/' || location.pathname === '/index'
  const isPharmacyIndex = location.pathname === '/pharmacy-index'

  // Role-based visibility: show nav sections only if user has access (or not logged in = public)
  const showDoctorsNav = !user || role === ROLES.VETERINARIAN
  const showPatientsNav = !user || role === ROLES.PET_OWNER
  const showPharmacyNav = !user || role === ROLES.PET_OWNER || role === ROLES.PET_STORE || role === ROLES.PARAPHARMACY || role === ROLES.ADMIN

  const cartCount = role === ROLES.PET_OWNER ? getCartItemCount() : 0

  const userImage = useMemo(() => {
    const fallback = '/assets/img/doctors-dashboard/doctor-profile-img.jpg'

    if (!user) return fallback

    if (role === ROLES.PET_STORE || role === ROLES.PARAPHARMACY) {
      const storeLogo = getImageUrl(myPetStore?.logo)
      if (storeLogo) return storeLogo
    }

    if (role === ROLES.VETERINARIAN) {
      const vetUser = vetProfile?.userId || null
      const vetUserImage = getImageUrl(vetUser?.profileImage)
      if (vetUserImage) return vetUserImage
    }

    return (
      getImageUrl(backendUser?.profileImage) ||
      getImageUrl(user?.profileImage) ||
      fallback
    )
  }, [user, role, backendUser, vetProfile, myPetStore])

  const displayName = backendUser?.fullName || backendUser?.name || user?.fullName || user?.name || 'User'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  useEffect(() => {
    const checkGoogleTranslateBanner = () => {
      const bannerFrame = document.querySelector('.goog-te-banner-frame')
      const skiptranslate = document.querySelector('.skiptranslate')
      const bodyTop = document.body.classList.contains('top')

      const bodyStyle = window.getComputedStyle(document.body)
      const bodyTopValue = bodyStyle.top
      const bodyPaddingTop = bodyStyle.paddingTop

      const bannerVisible =
        bannerFrame &&
        window.getComputedStyle(bannerFrame).display !== 'none' &&
        bannerFrame.offsetHeight > 0

      const hasBanner = !!(
        (bannerFrame && bannerVisible) ||
        (skiptranslate && window.getComputedStyle(skiptranslate).display !== 'none') ||
        bodyTop ||
        (bodyTopValue && bodyTopValue !== '0px' && bodyTopValue !== 'auto') ||
        (bodyPaddingTop && parseFloat(bodyPaddingTop) > 0)
      )

      setHasGoogleTranslateBanner(hasBanner)
    }

    const initialTimeout = setTimeout(checkGoogleTranslateBanner, 100)

    const observer = new MutationObserver(() => {
      checkGoogleTranslateBanner()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    })

    const interval = setInterval(checkGoogleTranslateBanner, 300)

    window.addEventListener('scroll', checkGoogleTranslateBanner, { passive: true })
    window.addEventListener('resize', checkGoogleTranslateBanner)

    return () => {
      clearTimeout(initialTimeout)
      observer.disconnect()
      clearInterval(interval)
      window.removeEventListener('scroll', checkGoogleTranslateBanner)
      window.removeEventListener('resize', checkGoogleTranslateBanner)
    }
  }, [])

  // Determine header class based on route
  const getHeaderClass = () => {
    const path = location.pathname
    if (path === '/index-2') return 'header header-trans header-two'
    if (path === '/index-3') return 'header header-trans header-three header-eight'
    if (path === '/index-5') return 'header header-custom header-fixed header-ten'
    if (path === '/index-4') return 'header header-custom header-fixed header-one home-head-one'
    if (path === '/index-6') return 'header header-trans header-eleven'
    if (path === '/index-7') return 'header header-fixed header-fourteen header-twelve veterinary-header'
    if (path === '/index-8') return 'header header-fixed header-fourteen header-twelve header-thirteen'
    if (path === '/index-9') return 'header header-fixed header-fourteen'
    if (path === '/index-10') return 'header header-fixed header-fourteen header-fifteen ent-header'
    if (path === '/index-11') return 'header header-fixed header-fourteen header-sixteen'
    if (path === '/index-12') return 'header header-fixed header-fourteen header-twelve header-thirteen'
    if (path === '/pharmacy-index') return 'header'
    if (path === '/index-13') return 'header header-custom header-fixed header-ten home-care-header'
    if (path === '/index-14') return 'header header-custom header-fixed header-ten home-care-header dentist-header'
    return 'header header-custom header-fixed inner-header relative'
  }

  return (
    <>
      {/* Top Bar for Index Page */}
      {isIndexPage && (
        <div className="header-topbar">
          <div className="container">
            <div className="topbar-info">
              <div className="d-flex align-items-center gap-3 header-info">
                <p><i className="isax isax-message-text5 me-1"></i>info@example.com</p>
                <p><i className="isax isax-call5 me-1"></i>+1 66589 14556</p>
              </div>
              <ul>
                <li className="header-theme">
                  <a href="javascript:void(0);" id="dark-mode-toggle" className="theme-toggle">
                    <i className="isax isax-sun-1"></i>
                  </a>
                  <a href="javascript:void(0);" id="light-mode-toggle" className="theme-toggle activate">
                    <i className="isax isax-moon"></i>
                  </a>
                </li>
                <li className="d-inline-flex align-items-center drop-header">
                  <div className="dropdown dropdown-country me-3">
                    <a href="javascript:void(0);" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
                      <img src="/assets/img/flags/us-flag.svg" className="me-2" alt="flag" />
                    </a>
                    <ul className="dropdown-menu p-2 mt-2">
                      <li><a className="dropdown-item rounded d-flex align-items-center" href="javascript:void(0);">
                        <img src="/assets/img/flags/us-flag.svg" className="me-2" alt="flag" />ENG
                      </a></li>
                      <li><a className="dropdown-item rounded d-flex align-items-center" href="javascript:void(0);">
                        <img src="/assets/img/flags/arab-flag.svg" className="me-2" alt="flag" />ARA
                      </a></li>
                      <li><a className="dropdown-item rounded d-flex align-items-center" href="javascript:void(0);">
                        <img src="/assets/img/flags/france-flag.svg" className="me-2" alt="flag" />FRA
                      </a></li>
                    </ul>
                  </div>
                  <div className="dropdown dropdown-amt">
                    <a href="javascript:void(0);" className="dropdown-toggle" data-bs-toggle="dropdown">USD</a>
                    <ul className="dropdown-menu p-2 mt-2">
                      <li><a className="dropdown-item rounded" href="javascript:void(0);">USD</a></li>
                      <li><a className="dropdown-item rounded" href="javascript:void(0);">YEN</a></li>
                      <li><a className="dropdown-item rounded" href="javascript:void(0);">EURO</a></li>
                    </ul>
                  </div>
                </li>
                <li className="social-header">
                  <div className="social-icon">
                    <a href="javascript:void(0);"><i className="fa-brands fa-facebook"></i></a>
                    <a href="javascript:void(0);"><i className="fa-brands fa-x-twitter"></i></a>
                    <a href="javascript:void(0);"><i className="fa-brands fa-instagram"></i></a>
                    <a href="javascript:void(0);"><i className="fa-brands fa-linkedin"></i></a>
                    <a href="javascript:void(0);"><i className="fa-brands fa-pinterest"></i></a>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Pharmacy Top Header */}
      {isPharmacyIndex && (
        <>
          <div
            className="top-header"
            style={{
              marginTop: hasGoogleTranslateBanner ? '42px' : '0',
              transition: 'margin-top 0.3s ease',
            }}
          >
            <div className="container">
              <div className="row align-items-center">
                <div className="col-md-6">
                  <div className="special-offer-content">
                    <p>Special offer! Get -20% off for first order with minimum <span>$200.00</span> in cart.</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="top-header-right">
                    <ul className="nav">
                      <li className="header-theme me-0 pe-0">
                        <a href="javascript:void(0);" id="dark-mode-toggle" className="theme-toggle">
                          <i className="isax isax-sun-1"></i>
                        </a>
                        <a href="javascript:void(0);" id="light-mode-toggle" className="theme-toggle activate">
                          <i className="isax isax-moon"></i>
                        </a>
                      </li>
                      <li>
                        <div className="btn log-register">
                          <Link to="/login" className="me-1">
                            <span><i className="feather-user"></i></span> Sign In
                          </Link> / 
                          <Link to="/register" className="ms-1">Sign Up</Link>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="cart-section">
            <div className="container">
              <div className="row align-items-center">
                <div className="col-md-3">
                  <div className="cart-logo">
                    <Link to="/">
                      <img src="/assets/img/logo.svg" className="img-fluid" alt="Logo" />
                    </Link>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="cart-search">
                    <form action="/pharmacy-search">
                      <div className="enter-pincode">
                        <i className="feather-map-pin"></i>
                        <div className="enter-pincode-input">
                          <input type="text" className="form-control" placeholder="Enter Pincode" />
                        </div>
                      </div>
                      <div className="cart-search-input">
                        <input type="text" className="form-control" placeholder="Search for medicines, health products and more" />
                      </div>
                      <div className="cart-search-btn">
                        <button type="submit" className="btn">
                          <i className="feather-search"></i>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="shopping-cart-list">
                    <ul className="nav">
                      <li>
                        <a href="javascript:void(0);">
                          <img src="/assets/img/icons/cart-favourite.svg" alt="Img" />
                        </a>
                      </li>
                      <li>
                        <div className="shopping-cart-amount">
                          <div className="shopping-cart-icon">
                            <img src="/assets/img/icons/bag-2.svg" alt="Img" />
                            <span>2</span>
                          </div>
                          <div className="shopping-cart-content">
                            <p>Shopping cart</p>
                            <h6>$57.00</h6>
                          </div>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Header */}
      <header
        className={getHeaderClass()}
        style={{
          marginTop: hasGoogleTranslateBanner ? '42px' : '0',
          transition: 'margin-top 0.3s ease',
        }}
      >
        <div className="container">
          <nav className="navbar navbar-expand-lg header-nav">
            <div className="navbar-header">
              <a id="mobile_btn" href="javascript:void(0);" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <span className="bar-icon">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </a>
              <Link to="/" className="navbar-brand logo">
                {location.pathname === '/index-2' || location.pathname === '/index-11' ? (
                  <img src="/assets/img/logo.png" className="img-fluid" alt="Logo" />
                ) : location.pathname === '/index-6' ? (
                  <img src="/assets/img/footer-logo.png" className="img-fluid" alt="Logo" />
                ) : location.pathname === '/index-7' ? (
                  <img src="/assets/img/veterinary-home-logo.svg" className="img-fluid" alt="Logo" />
                ) : (
                  <img src="/assets/img/logo.svg" className="img-fluid" alt="Logo" />
                )}
              </Link>
            </div>

            {isPharmacyIndex && (
              <div className="browse-categorie">
                <div className="dropdown categorie-dropdown">
                  <a href="javascript:void(0);" className="dropdown-toggle" data-bs-toggle="dropdown">
                    <img src="/assets/img/icons/browse-categorie.svg" alt="Img" /> Browse Categories
                  </a>
                  <div className="dropdown-menu">
                    <a className="dropdown-item" href="javascript:void(0);">Ayush</a>
                    <a className="dropdown-item" href="javascript:void(0);">Covid Essentials</a>
                    <a className="dropdown-item" href="javascript:void(0);">Devices</a>
                    <a className="dropdown-item" href="javascript:void(0);">Glucometers</a>
                  </div>
                </div>
              </div>
            )}

            <div className={`main-menu-wrapper ${isMenuOpen ? 'menu-opened' : ''}`}>
              <div className="menu-header">
                <Link to="/" className="menu-logo">
                  <img src="/assets/img/logo.svg" className="img-fluid" alt="Logo" />
                </Link>
                <a id="menu_close" className="menu-close" href="javascript:void(0);" onClick={() => setIsMenuOpen(false)}>
                  <i className="fas fa-times"></i>
                </a>
              </div>
              <ul className="main-nav">
                {/* Home Menu */}
                <li className={isActive('/') || location.pathname === '/index' ? 'active' : ''}>
                  <Link to="/"><span className="notranslate" translate="no">Home</span></Link>
                </li>

                {/* Doctors Menu - only for veterinarians (or public when not logged in) */}
                {showDoctorsNav && (
                <li className={`has-submenu ${isActive('/doctor') || isActive('/appointments') ? 'active' : ''}`}>
                  <a href="javascript:void(0);">Doctors <i className="fas fa-chevron-down"></i></a>
                  <ul className="submenu">
                    {role === ROLES.VETERINARIAN && (
                      <>
                        <li><Link to="/doctor/dashboard">Doctor Dashboard</Link></li>
                        <li><Link to="/appointments">Appointments</Link></li>
                        <li><Link to="/available-timings">Available Timing</Link></li>
                        <li><Link to="/my-patients">Patients List</Link></li>
                        <li><Link to="/patient-profile">Patients Profile</Link></li>
                        <li><Link to="/chat-doctor">Chat</Link></li>
                        <li><Link to="/invoices">Invoices</Link></li>
                        <li><Link to="/doctor-profile-settings">Profile Settings</Link></li>
                        <li><Link to="/reviews">Reviews</Link></li>
                      </>
                    )}
                    {!user && (
                      <>
                        <li><Link to="/doctor/dashboard">Doctor Dashboard</Link></li>
                        <li><Link to="/appointments">Appointments</Link></li>
                        <li><Link to="/available-timings">Available Timing</Link></li>
                        <li><Link to="/my-patients">Patients List</Link></li>
                        <li><Link to="/patient-profile">Patients Profile</Link></li>
                        <li><Link to="/chat-doctor">Chat</Link></li>
                        <li><Link to="/invoices">Invoices</Link></li>
                        <li><Link to="/doctor-profile-settings">Profile Settings</Link></li>
                        <li><Link to="/reviews">Reviews</Link></li>
                        <li><Link to="/doctor-register">Doctor Register</Link></li>
                      </>
                    )}
                  </ul>
                </li>
                )}

                {/* Patients Menu - only for pet owners (or public when not logged in) */}
                {showPatientsNav && (
                <li className={`has-submenu ${isActive('/patient') || isActive('/search') || isActive('/booking') ? 'active' : ''}`}>
                  <a href="javascript:void(0);">Patients <i className="fas fa-chevron-down"></i></a>
                  <ul className="submenu">
                    <li><Link to="/patient/dashboard">Patient Dashboard</Link></li>
                    <li className="has-submenu">
                      <a href="javascript:void(0);">Doctors</a>
                      <ul className="submenu inner-submenu">
                        <li><Link to="/map-grid">Map Grid</Link></li>
                        <li><Link to="/map-list">Map List</Link></li>
                        <li><Link to="/map-list-availability">Map with Availability</Link></li>
                      </ul>
                    </li>
                    <li className="has-submenu">
                      <a href="javascript:void(0);">Search Doctor</a>
                      <ul className="submenu inner-submenu">
                        <li><Link to="/search">Search Doctor 1</Link></li>
                        <li><Link to="/search-2">Search Doctor 2</Link></li>
                      </ul>
                    </li>
                    <li className="has-submenu">
                      <a href="javascript:void(0);">Doctor Profile</a>
                      <ul className="submenu inner-submenu">
                        <li><Link to="/doctor-profile">Doctor Profile 1</Link></li>
                        <li><Link to="/doctor-profile-2">Doctor Profile 2</Link></li>
                      </ul>
                    </li>
                    <li className="has-submenu">
                      <a href="javascript:void(0);">Booking</a>
                      <ul className="submenu inner-submenu">
                        <li><Link to="/booking">Booking</Link></li>
                        <li><Link to="/booking-1">Booking 1</Link></li>
                        <li><Link to="/booking-2">Booking 2</Link></li>
                        <li><Link to="/booking-popup">Booking Popup</Link></li>
                      </ul>
                    </li>
                    <li><Link to="/checkout">Checkout</Link></li>
                    <li><Link to="/booking-success">Booking Success</Link></li>
                    <li><Link to="/favourites">Favourites</Link></li>
                    <li><Link to="/chat">Chat</Link></li>
                    <li><Link to="/profile-settings">Profile Settings</Link></li>
                    <li><Link to="/change-password">Change Password</Link></li>
                  </ul>
                </li>
                )}

                {/* Pharmacy Menu - pet owners, pet store, admin (or public when not logged in) */}
                {showPharmacyNav && (
                <li className={`has-submenu ${isActive('/pharmacy') || isActive('/product') || isActive('/cart') ? 'active' : ''}`}>
                  <a href="javascript:void(0);">Pharmacy <i className="fas fa-chevron-down"></i></a>
                  <ul className="submenu">
                    <li><Link to="/pharmacy-index">Pharmacy</Link></li>
                    <li><Link to="/pharmacy-details">Pharmacy Details</Link></li>
                    <li><Link to="/pharmacy-search">Pharmacy Search</Link></li>
                    <li><Link to="/product-all">Product</Link></li>
                    <li><Link to="/product-description">Product Description</Link></li>
                    <li><Link to="/cart">Cart</Link></li>
                    <li><Link to="/product-checkout">Product Checkout</Link></li>
                    <li><Link to="/payment-success">Payment Success</Link></li>
                    <li><Link to="/pharmacy-register">Pharmacy Register</Link></li>
                  </ul>
                </li>
                )}

                {/* About Us */}
                <li className={isActive('/about-us') ? 'active' : ''}>
                  <Link to="/about-us">About Us</Link>
                </li>

                {/* Contact Us */}
                <li className={isActive('/contact-us') ? 'active' : ''}>
                  <Link to="/contact-us">Contact Us</Link>
                </li>
              </ul>
            </div>

            {/* Right Side Navigation */}
            {!user ? (
              <ul className="nav header-navbar-rht">
                <li className="searchbar">
                  <a href="javascript:void(0);"><i className="feather-search"></i></a>
                  <div className="togglesearch">
                    <form action="/search">
                      <div className="input-group">
                        <input type="text" className="form-control" />
                        <button type="submit" className="btn">Search</button>
                      </div>
                    </form>
                  </div>
                </li>
                <li>
                  <Link to="/login" className="btn btn-md btn-primary-gradient d-inline-flex align-items-center rounded-pill">
                    <i className="isax isax-lock-1 me-1"></i>Sign Up
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="btn btn-md btn-dark d-inline-flex align-items-center rounded-pill">
                    <i className="isax isax-user-tick me-1"></i>Register
                  </Link>
                </li>
              </ul>
            ) : (
              <ul className="nav header-navbar-rht">
                <li className="searchbar">
                  <a href="javascript:void(0);"><i className="feather-search"></i></a>
                </li>
                {role === ROLES.PET_OWNER && (
                  <li className="nav-item">
                    <Link to="/cart" className="nav-link position-relative" title="Cart">
                      <i className="feather-shopping-cart"></i>
                      {cartCount > 0 && (
                        <span
                          className="badge bg-danger"
                          style={{
                            position: 'absolute',
                            top: -2,
                            right: -6,
                            fontSize: 10,
                            padding: '3px 6px',
                            borderRadius: 999,
                          }}
                        >
                          {cartCount > 99 ? '99+' : cartCount}
                        </span>
                      )}
                    </Link>
                  </li>
                )}
                <li className="header-theme noti-nav">
                  <a href="javascript:void(0);" id="dark-mode-toggle" className="theme-toggle">
                    <i className="isax isax-sun-1"></i>
                  </a>
                  <a href="javascript:void(0);" id="light-mode-toggle" className="theme-toggle activate">
                    <i className="isax isax-moon"></i>
                  </a>
                </li>
                <li className="nav-item dropdown has-arrow logged-item">
                  <a href="javascript:void(0);" className="nav-link ps-0" data-bs-toggle="dropdown">
                    <span className="user-img">
                      <img
                        className="rounded-circle"
                        src={userImage}
                        width="31"
                        alt="User"
                        onError={(e) => {
                          e.currentTarget.onerror = null
                          e.currentTarget.src = '/assets/img/doctors-dashboard/doctor-profile-img.jpg'
                        }}
                      />
                    </span>
                  </a>
                  <div className="dropdown-menu dropdown-menu-end">
                    <div className="user-header">
                      <div className="avatar avatar-sm">
                        <img
                          src={userImage}
                          alt="User"
                          className="avatar-img rounded-circle"
                          onError={(e) => {
                            e.currentTarget.onerror = null
                            e.currentTarget.src = '/assets/img/doctors-dashboard/doctor-profile-img.jpg'
                          }}
                        />
                      </div>
                      <div className="user-text">
                        <h6>{displayName}</h6>
                        <p className="text-muted mb-0">{user.role || 'User'}</p>
                      </div>
                    </div>
                    {role === ROLES.VETERINARIAN && <Link className="dropdown-item" to="/doctor/dashboard">Dashboard</Link>}
                    {role === ROLES.PET_OWNER && <Link className="dropdown-item" to="/patient/dashboard">Dashboard</Link>}
                    {role === ROLES.ADMIN && <Link className="dropdown-item" to="/admin/index_admin">Dashboard</Link>}
                    {(role === ROLES.PET_STORE || role === ROLES.PARAPHARMACY) && <Link className="dropdown-item" to="/pharmacy-admin/dashboard">Pharmacy Dashboard</Link>}
                    {role === ROLES.VETERINARIAN && <Link className="dropdown-item" to="/doctor-profile-settings">Profile Settings</Link>}
                    {(role === ROLES.PET_OWNER || role === ROLES.ADMIN || role === ROLES.PET_STORE || role === ROLES.PARAPHARMACY) && <Link className="dropdown-item" to="/profile-settings">Profile Settings</Link>}
                    <a className="dropdown-item" href="javascript:void(0);" onClick={handleLogout}>Logout</a>
                  </div>
                </li>
              </ul>
            )}
          </nav>
        </div>
      </header>
    </>
  )
}

export default Header

