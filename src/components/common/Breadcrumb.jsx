import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { useAuth } from '../../contexts/AuthContext'

const LABEL_KEYS = {
  'About Us': 'aboutUs',
  'Contact Us': 'contactUs',
  'Home': 'home',
  'Dashboard': 'dashboard',
  'Patient Dashboard': 'patientDashboard',
  'Doctor Dashboard': 'doctorDashboard',
  'Appointments': 'appointments',
  'Appointment Details': 'appointmentDetails',
  'Requests': 'requests',
  'Request Reschedule': 'requestReschedule',
  'Reschedule Requests': 'rescheduleRequests',
  'Available Timings': 'clinicHours',
  'Clinic Hours': 'clinicHours',
  'My Pets': 'myPets',
  'My Patients': 'myPets',
  'Speciality & Services': 'specialities',
  'Specialities & Services': 'specialities',
  'Reviews': 'reviews',
  'Invoices': 'invoices',
  'Invoice View': 'invoiceView',
  'Doctor Profile': 'profileSettings',
  'Patients Profile': 'profile',
  'Payout Settings': 'paymentSettings',
  'Payment Settings': 'paymentSettings',
  'Subscription Plans': 'subscriptionPlans',
  'Notifications': 'notifications',
  'Message': 'messages',
  'Messages': 'messages',
  'Admin Messages': 'adminMessages',
  'Vaccinations': 'vaccinations',
  'Prescription': 'prescription',
  'Support': 'support',
  'Support Tickets': 'supportTickets',
  'Create Ticket': 'createTicket',
  'Ticket Details': 'ticketDetails',
  'Medical Records': 'medicalRecords',
  'Weight Records': 'weightRecords',
  'Favourites': 'favourites',
  'Favourite Veterinarians': 'favourites',
  'Nearby Clinics': 'nearbyClinics',
  'Order History': 'orderHistory',
  'Order Details': 'orderDetails',
  'Products': 'products',
  'Product Description': 'productDetails',
  'Orders': 'orders',
  'Payouts': 'payouts',
  'Settings': 'settings',
  'Change Password': 'changePassword',
  'Pet Sitters': 'petSitters',
  'Pet Sitter': 'petSitters',
  'Find Veterinarians': 'findVeterinarians',
  'Pharmacy': 'pharmacy',
  'Cart': 'cart',
  'Shopping Cart': 'cart',
  'Checkout': 'checkout',
  'Payment': 'payment',
  'Documents': 'documents',
  'Documents & Receipts': 'documents',
  'Reports': 'reports',
  'Blog Posts': 'blogPosts',
  'Create Blog Post': 'blogPosts',
  'Edit Blog Post': 'blogPosts',
  'Blog Details': 'blogPosts',
  'Announcements': 'announcements',
}

const ROUTE_DEFAULTS = [
  { test: (path) => path === '/doctor/dashboard', title: 'doctorDashboard' },
  { test: (path) => path === '/patient/dashboard', title: 'patientDashboard' },
  { test: (path) => path === '/pharmacy-admin/dashboard', title: 'pharmacyDashboard' },
  { test: (path) => path === '/pet-sitter/dashboard', title: 'petSitterDashboard' },
  { test: (path) => path === '/pharmacy-admin/products', title: 'products' },
  { test: (path) => path === '/pharmacy-admin/orders', title: 'orders' },
  { test: (path) => path === '/pharmacy-admin/payouts', title: 'payouts' },
  { test: (path) => path === '/pharmacy-admin/profile', title: 'profileSettings' },
  { test: (path) => path === '/pharmacy-admin/change-password', title: 'changePassword' },
  { test: (path) => path === '/pharmacy-admin/subscription', title: 'subscriptionPlans' },
  { test: (path) => path.startsWith('/pharmacy-admin/orders/'), title: 'orderDetails' },
  { test: (path) => path === '/pharmacy-admin/prescription-requests', title: 'prescription' },
]

const formatPetTerminology = (value) => {
  if (typeof value !== 'string') return value
  return value
    .replace(/\bMy Patients\b/g, 'My Pets')
    .replace(/\bPatients\b/g, 'My Pets')
    .replace(/\bPatient\b/g, 'My Pet')
    .replace(/\bpatients\b/g, 'pets')
    .replace(/\bpatient\b/g, 'pet')
}

const Breadcrumb = ({ title, li1, li2 }) => {
  const { t } = useLanguage()
  const { user } = useAuth()
  const { pathname } = useLocation()
  const routeDefault = ROUTE_DEFAULTS.find((item) => item.test(pathname))
  const translateLabel = (value) => {
    if (!value) return value
    const key = LABEL_KEYS[value]
    return formatPetTerminology(key ? t(`common.breadcrumb.${key}`, value) : value)
  }
  const displayTitle = translateLabel(title)
  const displayLi1 = translateLabel(li1)
  const routeTitle = routeDefault?.title === 'pharmacyDashboard' && user?.role === 'PARAPHARMACY'
    ? 'parapharmacyDashboard'
    : routeDefault?.title
  const useRouteTitle = Boolean(routeTitle) && (!li2 || li2 === 'Dashboard' || li2 === 'Overview')
  const displayLi2 = useRouteTitle
    ? t(`common.breadcrumb.${routeTitle}`)
    : translateLabel(li2) || (routeTitle ? t(`common.breadcrumb.${routeTitle}`) : null)
  const currentLabel = displayLi2 || displayLi1 || displayTitle

  return (
    <section className="breadcrumb-bar breadcrumb-bar-clean" aria-label={t('common.pageHeading')}>
      <div className="container">
        <div className="row align-items-center inner-banner">
          <div className="col-md-12 col-12 text-center">
            {displayLi2 && <h2 className="breadcrumb-title">{displayLi2}</h2>}
            <nav aria-label="breadcrumb" className="page-breadcrumb">
              <ol className="breadcrumb justify-content-center">
                <li className="breadcrumb-item">
                  <Link to="/">{t('common.home')}</Link>
                </li>
                {currentLabel && (
                  <li className="breadcrumb-item active" aria-current="page">
                    {currentLabel}
                  </li>
                )}
              </ol>
            </nav>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Breadcrumb

