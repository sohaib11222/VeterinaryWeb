import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useState, useEffect, useMemo } from 'react'
import { useCart } from '../../contexts/CartContext'
import { useLanguage } from '../../contexts/LanguageContext'
import LanguageToggle from './LanguageToggle'
import { getImageUrl } from '../../utils/apiConfig'
import { useUserById } from '../../queries/userQueries'
import { useVeterinarianProfile } from '../../queries/veterinarianQueries'
import { useMyPetStore } from '../../queries/petStoreQueries'

const ROLES = { PET_OWNER: 'PET_OWNER', VETERINARIAN: 'VETERINARIAN', ADMIN: 'ADMIN', PET_STORE: 'PET_STORE', PARAPHARMACY: 'PARAPHARMACY', PET_SITTER: 'PET_SITTER' }

const Header = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { getCartItemCount } = useCart()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [openMobileSubmenu, setOpenMobileSubmenu] = useState(null)
  const { t } = useLanguage()
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
    if (typeof document === 'undefined') return
    document.documentElement.classList.toggle('menu-opened', Boolean(isMenuOpen))

    return () => {
      document.documentElement.classList.remove('menu-opened')
    }
  }, [isMenuOpen])

  useEffect(() => {
    setIsMenuOpen(false)
    setOpenMobileSubmenu(null)
  }, [location.pathname])

  const toggleMobileSubmenu = (key) => (e) => {
    if (typeof window === 'undefined') return
    if (window.innerWidth > 991) return
    e.preventDefault()
    e.stopPropagation()
    setOpenMobileSubmenu((prev) => (prev === key ? null : key))
  }

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
      {/* {isIndexPage && (
        // <div className="header-topbar">
        //   <div className="container">
        //     <div className="topbar-info">
        //       <div className="d-flex align-items-center gap-3 header-info">
        //         <p><i className="isax isax-message-text5 me-1"></i>info@example.com</p>
        //         <p><i className="isax isax-call5 me-1"></i>+1 66589 14556</p>
        //       </div>
        //       <ul>
        //         <li className="header-theme">
        //           <a href="javascript:void(0);" id="dark-mode-toggle" className="theme-toggle">
        //             <i className="isax isax-sun-1"></i>
        //           </a>
        //           <a href="javascript:void(0);" id="light-mode-toggle" className="theme-toggle activate">
        //             <i className="isax isax-moon"></i>
        //           </a>
        //         </li>
        //         <li className="d-inline-flex align-items-center drop-header">
        //           <div className="dropdown dropdown-country me-3">
        //             <a href="javascript:void(0);" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
        //               <img src="/assets/img/flags/us-flag.svg" className="me-2" alt="flag" />
        //             </a>
        //             <ul className="dropdown-menu p-2 mt-2">
        //               <li><a className="dropdown-item rounded d-flex align-items-center" href="javascript:void(0);">
        //                 <img src="/assets/img/flags/us-flag.svg" className="me-2" alt="flag" />ENG
        //               </a></li>
        //               <li><a className="dropdown-item rounded d-flex align-items-center" href="javascript:void(0);">
        //                 <img src="/assets/img/flags/arab-flag.svg" className="me-2" alt="flag" />ARA
        //               </a></li>
        //               <li><a className="dropdown-item rounded d-flex align-items-center" href="javascript:void(0);">
        //                 <img src="/assets/img/flags/france-flag.svg" className="me-2" alt="flag" />FRA
        //               </a></li>
        //             </ul>
        //           </div>
        //           <div className="dropdown dropdown-amt">
        //             <a href="javascript:void(0);" className="dropdown-toggle" data-bs-toggle="dropdown">USD</a>
        //             <ul className="dropdown-menu p-2 mt-2">
        //               <li><a className="dropdown-item rounded" href="javascript:void(0);">USD</a></li>
        //               <li><a className="dropdown-item rounded" href="javascript:void(0);">YEN</a></li>
        //               <li><a className="dropdown-item rounded" href="javascript:void(0);">EURO</a></li>
        //             </ul>
        //           </div>
        //         </li>
        //         <li className="social-header">
        //           <div className="social-icon">
        //             <a href="javascript:void(0);"><i className="fa-brands fa-facebook"></i></a>
        //             <a href="javascript:void(0);"><i className="fa-brands fa-x-twitter"></i></a>
        //             <a href="javascript:void(0);"><i className="fa-brands fa-instagram"></i></a>
        //             <a href="javascript:void(0);"><i className="fa-brands fa-linkedin"></i></a>
        //             <a href="javascript:void(0);"><i className="fa-brands fa-pinterest"></i></a>
        //           </div>
        //         </li>
        //       </ul>
        //     </div>
        //   </div>
        // </div>
      )} */}

      {/* Pharmacy Top Header */}
      {isPharmacyIndex && (
        <>
          <div
            className="top-header"
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
                            <span><i className="feather-user"></i></span> {t('common.signIn')}
                          </Link> /
                          <Link to="/register" className="ms-1">{t('common.signUp')}</Link>
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
                      <img src="/assets/img/pet-logo.jpg" className="img-fluid" alt="Logo" />
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

      <div
        className={`sidebar-overlay ${isMenuOpen ? 'opened' : ''}`}
        onClick={() => setIsMenuOpen(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setIsMenuOpen(false)
        }}
      />

      {/* Main Header */}
      <header
        className={`${getHeaderClass()} ${isMenuOpen ? 'menu-opened' : ''}`}
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
                  <img src="/assets/img/pet-logo.jpg" className="img-fluid" alt="Logo" />
                ) : location.pathname === '/index-6' ? (
                  <img src="/assets/img/pet-logo.jpg" className="img-fluid" alt="Logo" />
                ) : location.pathname === '/index-7' ? (
                  <img src="/assets/img/pet-logo.jpg" className="img-fluid" alt="Logo" />
                ) : (
                  <img src="/assets/img/pet-logo.jpg" className="img-fluid" alt="Logo" />
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
                  <img src="/assets/img/pet-logo.jpg" className="img-fluid" alt="Logo" />
                </Link>
                <a id="menu_close" className="menu-close" href="javascript:void(0);" onClick={() => setIsMenuOpen(false)}>
                  <i className="fas fa-times"></i>
                </a>
              </div>
              <ul className="main-nav">
                {/* Home Menu */}
                <li className={isActive('/') || location.pathname === '/index' ? 'active' : ''}>
                  <Link to="/"><span>{t('common.home')}</span></Link>
                </li>

                {/* Doctors Menu - only for veterinarians (or public when not logged in) */}
                {showDoctorsNav && (
                  <li className={`has-submenu ${isActive('/doctor') || isActive('/appointments') ? 'active' : ''}`}>
                    <a
                      href="javascript:void(0);"
                      onClick={toggleMobileSubmenu('doctors')}
                      aria-expanded={openMobileSubmenu === 'doctors'}
                    >
                      {t('nav.doctors')} <i className="fas fa-chevron-down"></i>
                    </a>
                    <ul
                      className="submenu"
                      style={{ display: openMobileSubmenu === 'doctors' ? 'block' : undefined }}
                    >
                      {role === ROLES.VETERINARIAN && (
                        <>
                          <li><Link to="/doctor/dashboard">{t('nav.doctorDashboard')}</Link></li>
                          <li><Link to="/appointments">{t('nav.appointments')}</Link></li>
                          <li><Link to="/available-timings">{t('nav.availableTiming')}</Link></li>
                          <li><Link to="/my-patients">{t('nav.myPets')}</Link></li>
                          <li><Link to="/chat-doctor">{t('nav.chat')}</Link></li>
                          <li><Link to="/invoices">{t('nav.invoices')}</Link></li>
                          <li><Link to="/doctor-profile-settings">{t('nav.profileSettings')}</Link></li>
                          <li><Link to="/reviews">{t('nav.reviews')}</Link></li>
                        </>
                      )}
                      {!user && (
                        <>
                          <li><Link to="/doctor/dashboard">{t('nav.doctorDashboard')}</Link></li>
                          <li><Link to="/appointments">{t('nav.appointments')}</Link></li>
                          <li><Link to="/available-timings">{t('nav.availableTiming')}</Link></li>
                          <li><Link to="/my-patients">{t('nav.myPets')}</Link></li>
                          <li><Link to="/chat-doctor">{t('nav.chat')}</Link></li>
                          <li><Link to="/doctor-profile-settings">{t('nav.profileSettings')}</Link></li>
                          <li><Link to="/reviews">{t('nav.reviews')}</Link></li>
                          <li><Link to="/doctor-register">{t('nav.doctorRegister')}</Link></li>
                        </>
                      )}
                    </ul>
                  </li>
                )}

                {/* Patients Menu - only for pet owners (or public when not logged in) */}
                {showPatientsNav && (
                  <li className={`has-submenu ${isActive('/patient') || isActive('/search') || isActive('/booking') ? 'active' : ''}`}>
                    <a
                      href="javascript:void(0);"
                      onClick={toggleMobileSubmenu('patients')}
                      aria-expanded={openMobileSubmenu === 'patients'}
                    >
                      {t('nav.patients')} <i className="fas fa-chevron-down"></i>
                    </a>
                    <ul
                      className="submenu"
                      style={{ display: openMobileSubmenu === 'patients' ? 'block' : undefined }}
                    >
                      <li><Link to="/patient/dashboard">{t('nav.myPetDashboard')}</Link></li>

                      <li>
                        <Link to="/search">{t('nav.searchDoctor')}</Link>
                        {/* <ul className="submenu inner-submenu">
                        <li><Link to="/search">Search Doctor 1</Link></li>
                        <li><Link to="/search-2">Search Doctor 2</Link></li>
                      </ul> */}
                      </li>
                      <li><Link to="/pet-sitters">{t('nav.findPetSitters')}</Link></li>


                      {/* <li><Link to="/checkout">Checkout</Link></li>
                    <li><Link to="/booking-success">Booking Success</Link></li> */}
                      <li><Link to="/favourites">{t('nav.favourites')}</Link></li>
                      <li><Link to="/chat">{t('nav.chat')}</Link></li>
                      <li><Link to="/profile-settings">{t('common.profileSettings')}</Link></li>
                      <li><Link to="/change-password">{t('common.changePassword')}</Link></li>
                    </ul>
                  </li>
                )}

                {/* Pharmacy Menu - pet owners, pet store, admin (or public when not logged in) */}
                {showPharmacyNav && (
                  <li className={`has-submenu ${isActive('/pharmacy') || isActive('/product') || isActive('/cart') ? 'active' : ''}`}>
                    <a
                      href="javascript:void(0);"
                      onClick={toggleMobileSubmenu('pharmacy')}
                      aria-expanded={openMobileSubmenu === 'pharmacy'}
                    >
                      {t('nav.pharmacy')} <i className="fas fa-chevron-down"></i>
                    </a>
                    <ul
                      className="submenu"
                      style={{ display: openMobileSubmenu === 'pharmacy' ? 'block' : undefined }}
                    >

                      <li><Link to="/pharmacy-search">{t('nav.pharmacies')}</Link></li>
                      <li><Link to="/product-all">{t('nav.products')}</Link></li>
                      <li><Link to="/cart">{t('nav.cart')}</Link></li>
                      {(role === ROLES.PET_STORE || role === ROLES.PARAPHARMACY) && (
                        <li>
                          <Link to="/pharmacy-admin/dashboard">
                            {role === ROLES.PARAPHARMACY ? t('nav.parapharmacyDashboard') : t('nav.pharmacyDashboard')}
                          </Link>
                        </li>
                      )}

                    </ul>
                  </li>
                )}

                {/* About Us */}
                <li className={isActive('/about-us') ? 'active' : ''}>
                  <Link to="/about-us">{t('nav.aboutUs')}</Link>
                </li>

                {/* Contact Us */}
                <li className={isActive('/contact-us') ? 'active' : ''}>
                  <Link to="/contact-us">{t('nav.contactUs')}</Link>
                </li>
                {user && (
                  <li className="mobile-menu-signout">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false)
                        handleLogout()
                      }}
                    >
                      <i className="isax isax-logout" aria-hidden="true"></i>
                      {t('common.signOut')}
                    </button>
                  </li>
                )}
                {!user && <li><Link to="/pet-sitter/register">{t('nav.becomePetSitter')}</Link></li>}
                <li className="mobile-language-toggle">
                  <LanguageToggle />
                </li>
              </ul>
            </div>

            {/* Right Side Navigation */}
            {!user ? (
              <ul className="nav header-navbar-rht">
                <li className="nav-item">
                  <LanguageToggle />
                </li>
                <li>
                  <Link to="/register" className="btn btn-md btn-primary-gradient d-inline-flex align-items-center rounded-pill">
                    <i className="isax isax-lock-1 me-1"></i>{t('common.signUp')}
                  </Link>
                </li>
              </ul>
            ) : (
              <ul className="nav header-navbar-rht">
                <li className="nav-item">
                  <LanguageToggle />
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

                <li>
                  <a
                    className="btn btn-md btn-dark d-inline-flex align-items-center rounded-pill"
                    href="javascript:void(0);"
                    onClick={handleLogout}
                  >
                    <i className="isax isax-logout me-1"></i>{t('common.signOut')}
                  </a>
                </li>
                {/* <li className="header-theme noti-nav">
                  <a href="javascript:void(0);" id="dark-mode-toggle" className="theme-toggle">
                    <i className="isax isax-sun-1"></i>
                  </a>
                  <a href="javascript:void(0);" id="light-mode-toggle" className="theme-toggle activate">
                    <i className="isax isax-moon"></i>
                  </a>
                </li> */}
                <li className="nav-item dropdown has-arrow logged-item">
                  <a href="javascript:void(0);" className="nav-link ps-0" data-bs-toggle="dropdown">
                    <span className="user-img" style={{ display: 'inline-block', width: '31px', height: '31px', overflow: 'hidden', borderRadius: '50%' }}>
                      <img
                        className="avatar-img rounded-circle"
                        src={userImage}
                        width="31"
                        height="31"
                        alt="User"
                        style={{
                          width: '31px',
                          height: '31px',
                          objectFit: 'cover',
                          borderRadius: '50%',
                          display: 'block',
                        }}
                        onError={(e) => {
                          e.currentTarget.onerror = null
                          e.currentTarget.src = '/assets/img/doctors-dashboard/doctor-profile-img.jpg'
                        }}
                      />
                    </span>
                  </a>
                  <div className="dropdown-menu dropdown-menu-end">
                    <div className="user-header">
                      <div className="avatar avatar-sm" style={{ width: '40px', height: '40px', overflow: 'hidden', borderRadius: '50%' }}>
                        <img
                          src={userImage}
                          alt="User"
                          className="avatar-img rounded-circle"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '50%',
                            display: 'block',
                          }}
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
                    {role === ROLES.VETERINARIAN && <Link className="dropdown-item" to="/doctor/dashboard">{t('nav.doctorDashboard')}</Link>}
                    {role === ROLES.PET_OWNER && <Link className="dropdown-item" to="/patient/dashboard">{t('nav.myPetDashboard')}</Link>}
                    {role === ROLES.ADMIN && <Link className="dropdown-item" to="/admin/index_admin">{t('common.home')}</Link>}
                    {role === ROLES.PET_SITTER && <Link className="dropdown-item" to="/pet-sitter/dashboard">{t('nav.becomePetSitter')}</Link>}
                    {role === ROLES.PET_SITTER && <Link className="dropdown-item" to="/pet-sitter/profile">{t('nav.myPets')}</Link>}
                    {(role === ROLES.PET_STORE || role === ROLES.PARAPHARMACY) && <Link className="dropdown-item" to="/pharmacy-admin/dashboard">{role === ROLES.PARAPHARMACY ? t('nav.parapharmacyDashboard') : t('nav.pharmacyDashboard')}</Link>}
                    {role === ROLES.VETERINARIAN && <Link className="dropdown-item" to="/doctor-profile-settings">{t('common.profileSettings')}</Link>}
                    {(role === ROLES.PET_OWNER || role === ROLES.ADMIN || role === ROLES.PET_STORE || role === ROLES.PARAPHARMACY) && <Link className="dropdown-item" to="/profile-settings">{t('common.profileSettings')}</Link>}
                    <a className="dropdown-item" href="javascript:void(0);" onClick={handleLogout}>{t('common.logout')}</a>
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

