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
  const searchParams = new URLSearchParams(location.search)
  const isEmergencySearch = location.pathname === '/search' && searchParams.get('isAvailableOnline') === 'true'
  const isServicesSearch = location.pathname === '/search' && searchParams.get('service') === '1'
  const isVeterinarian = role === ROLES.VETERINARIAN
  const myPetDestination = {
    [ROLES.VETERINARIAN]: '/doctor/dashboard',
    [ROLES.PET_STORE]: '/pharmacy-admin/dashboard',
    [ROLES.PARAPHARMACY]: '/pharmacy-admin/dashboard',
    [ROLES.PET_SITTER]: '/pet-sitter/dashboard',
    [ROLES.ADMIN]: '/admin/index_admin',
  }[role] || '/patient/dashboard'
  const hasOwnPanelNavigation = [
    ROLES.VETERINARIAN,
    ROLES.PET_STORE,
    ROLES.PARAPHARMACY,
    ROLES.PET_SITTER,
  ].includes(role)
  const veterinarianDestination = hasOwnPanelNavigation ? myPetDestination : '/search'
  const isMyPetActive = (!user || role === ROLES.PET_OWNER) && isActive('/patient')

  const publicNavItems = [
    { id: 'home', to: '/', label: t('common.home'), active: location.pathname === '/' || location.pathname === '/index' },
    ...(!isVeterinarian ? [{ id: 'emergency', to: '/search?isAvailableOnline=true', label: t('nav.emergencyRoom'), active: isEmergencySearch }] : []),
    { id: 'veterinarians', to: veterinarianDestination, label: hasOwnPanelNavigation ? t('nav.myPanel') : t('nav.veterinarians'), active: !isEmergencySearch && !isServicesSearch && isActive(veterinarianDestination) },
    { id: 'pharmacy', to: '/pharmacy-search', label: t('nav.pharmacy'), active: isActive('/pharmacy-search') },
    { id: 'services', to: '/search?service=1', label: t('nav.services'), active: isServicesSearch },
    { id: 'pet-shop', to: '/product-all', label: t('nav.petShop'), active: isActive('/product-all') },
    ...(!hasOwnPanelNavigation ? [{ id: 'my-pet', to: myPetDestination, label: t('nav.myPet'), active: isMyPetActive }] : []),
    { id: 'contacts', to: '/contact-us', label: t('nav.contacts'), active: isActive('/contact-us') },
    ...(!user ? [{ id: 'pet-sitter', to: '/pet-sitter/register', label: t('nav.becomePetSitter'), active: isActive('/pet-sitter/register') }] : []),
  ]

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
  }, [location.pathname])

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
                {publicNavItems.map((item) => (
                  <li key={item.id} className={[item.active ? 'active' : '', item.id === 'emergency' ? 'nav-emergency' : ''].filter(Boolean).join(' ')}>
                    <Link to={item.to} onClick={() => setIsMenuOpen(false)}>{item.label}</Link>
                  </li>
                ))}
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

