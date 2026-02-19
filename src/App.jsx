import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'
import DashboardLayout from './layouts/DashboardLayout'
import ProtectedRoute from './components/common/ProtectedRoute'
import GoogleTranslate from './components/common/GoogleTranslate'

// Public Pages - Home
import Index from './pages/Index'

// Public Pages - General
import AboutUs from './pages/AboutUs'
import ContactUs from './pages/ContactUs'
import Pricing from './pages/Pricing'
import FAQ from './pages/FAQ'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsCondition from './pages/TermsCondition'
import BlogList from './pages/blog/BlogList'
import BlogDetails from './pages/blog/BlogDetails'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import DoctorSignup from './pages/auth/DoctorSignup'
import DoctorRegister from './pages/auth/DoctorRegister'
import DoctorRegisterStep1 from './pages/auth/DoctorRegisterStep1'
import DoctorRegisterStep2 from './pages/auth/DoctorRegisterStep2'
import DoctorRegisterStep3 from './pages/auth/DoctorRegisterStep3'
import DoctorVerificationUpload from './pages/auth/DoctorVerificationUpload'
import PendingApprovalStatus from './pages/auth/PendingApprovalStatus'
import PharmacyRegister from './pages/auth/PharmacyRegister'
import PharmacyRegisterStep1 from './pages/auth/PharmacyRegisterStep1'
import PharmacyRegisterStep2 from './pages/auth/PharmacyRegisterStep2'
import PharmacyRegisterStep3 from './pages/auth/PharmacyRegisterStep3'
import PharmacyPhoneVerification from './pages/auth/PharmacyPhoneVerification'
import PetStoreVerificationUpload from './pages/auth/PetStoreVerificationUpload'

// Doctor Pages
import DoctorDashboard from './pages/doctor/DoctorDashboard'
import DoctorProfile from './pages/doctor/DoctorProfile'
import DoctorAppointments from './pages/doctor/DoctorAppointments'
import DoctorAppointmentsGrid from './pages/doctor/DoctorAppointmentsGrid'
import DoctorUpcomingAppointment from './pages/doctor/DoctorUpcomingAppointment'
import DoctorCompletedAppointment from './pages/doctor/DoctorCompletedAppointment'
import DoctorCancelledAppointment from './pages/doctor/DoctorCancelledAppointment'
import DoctorAppointmentDetails from './pages/doctor/DoctorAppointmentDetails'
import DoctorAppointmentStart from './pages/doctor/DoctorAppointmentStart'
import AvailableTimings from './pages/doctor/AvailableTimings'
import MyPatients from './pages/doctor/MyPatients'
import Reviews from './pages/doctor/Reviews'
import Invoices from './pages/doctor/Invoices'
import DoctorSpecialities from './pages/doctor/DoctorSpecialities'
import DoctorRequest from './pages/doctor/DoctorRequest'
import DoctorProfileSettings from './pages/doctor/DoctorProfileSettings'
import DoctorPayment from './pages/doctor/DoctorPayment'
import InvoiceView from './pages/doctor/InvoiceView'
import DoctorChangePassword from './pages/doctor/DoctorChangePassword'
import DoctorExperienceSettings from './pages/doctor/DoctorExperienceSettings'
import DoctorEducationSettings from './pages/doctor/DoctorEducationSettings'
import DoctorAwardsSettings from './pages/doctor/DoctorAwardsSettings'
import DoctorInsuranceSettings from './pages/doctor/DoctorInsuranceSettings'
import DoctorClinicsSettings from './pages/doctor/DoctorClinicsSettings'
import DoctorBusinessSettings from './pages/doctor/DoctorBusinessSettings'
import SocialMedia from './pages/doctor/SocialMedia'
import SubscriptionPlans from './pages/doctor/SubscriptionPlans'
import DoctorAnnouncements from './pages/doctor/DoctorAnnouncements'
import DoctorNotifications from './pages/doctor/DoctorNotifications'
import DoctorBlogList from './pages/doctor/DoctorBlogList'
import DoctorBlogCreateEdit from './pages/doctor/DoctorBlogCreateEdit'
import DoctorBlogDetails from './pages/doctor/DoctorBlogDetails'
import AdminDoctorChat from './pages/doctor/AdminDoctorChat'
import DoctorChat from './pages/doctor/DoctorChat'
import DoctorVideoCallRoom from './pages/doctor/DoctorVideoCallRoom'
import DoctorVaccinations from './pages/doctor/DoctorVaccinations'
import DoctorRescheduleRequests from './pages/doctor/RescheduleRequests'

import Prescription from './pages/prescription/Prescription'

// Patient Pages
import PatientDashboard from './pages/patient/PatientDashboard'
import PatientProfile from './pages/patient/PatientProfile'
import PatientAppointments from './pages/patient/PatientAppointments'
import PatientAppointmentsGrid from './pages/patient/PatientAppointmentsGrid'
import PatientUpcomingAppointment from './pages/patient/PatientUpcomingAppointment'
import PatientCompletedAppointment from './pages/patient/PatientCompletedAppointment'
import PatientCancelledAppointment from './pages/patient/PatientCancelledAppointment'
import PatientAppointmentDetails from './pages/patient/PatientAppointmentDetails'
import RequestReschedule from './pages/patient/RequestReschedule'
import RescheduleRequests from './pages/patient/RescheduleRequests'
import PatientAccounts from './pages/patient/PatientAccounts'
import ProfileSettings from './pages/patient/ProfileSettings'
import ChangePassword from './pages/patient/ChangePassword'
import Favourites from './pages/patient/Favourites'
import Chat from './pages/patient/Chat'
import Dependent from './pages/patient/Dependent'
import AddDependent from './pages/patient/AddDependent'
import EditDependent from './pages/patient/EditDependent'
import MedicalRecords from './pages/patient/MedicalRecords'
import MedicalDetails from './pages/patient/MedicalDetails'
import WeightRecords from './pages/patient/WeightRecords'
import PatientDetails from './pages/patient/PatientDetails'
import PatientOtherDetails from './pages/patient/PatientOtherDetails'
import PatientPersonalize from './pages/patient/PatientPersonalize'
import PatientFamilyDetails from './pages/patient/PatientFamilyDetails'
import PatientDependantDetails from './pages/patient/PatientDependantDetails'
import PatientEmail from './pages/patient/PatientEmail'
import PatientRegisterStep1 from './pages/patient/PatientRegisterStep1'
import PatientRegisterStep2 from './pages/patient/PatientRegisterStep2'
import PatientRegisterStep3 from './pages/patient/PatientRegisterStep3'
import PatientRegisterStep4 from './pages/patient/PatientRegisterStep4'
import PatientRegisterStep5 from './pages/patient/PatientRegisterStep5'
import PaitentDetails from './pages/patient/PaitentDetails'
import PatientRegister from './pages/patient/PatientRegister'
import PatientBilling from './pages/patient/PatientBilling'
import PatientNotifications from './pages/patient/PatientNotifications'
import PatientReports from './pages/patient/PatientReports'
import TwoFactorAuthentication from './pages/patient/TwoFactorAuthentication'
import PatientInvoices from './pages/patient/PatientInvoices'
import PatientInvoiceView from './pages/patient/PatientInvoiceView'
import VideoCallRoom from './pages/patient/VideoCallRoom'
import ClinicNavigation from './pages/patient/ClinicNavigation'
import ClinicMapView from './pages/patient/ClinicMapView'
import OrderHistory from './pages/patient/OrderHistory'
import OrderDetails from './pages/patient/OrderDetails'
import DocumentsDownload from './pages/patient/DocumentsDownload'

// Admin Pages
import VaccineCatalog from './pages/admin/VaccineCatalog'
import SubscriptionPlanPrices from './pages/admin/SubscriptionPlanPrices'

// Pharmacy Admin Pages
import PharmacyAdminDashboard from './pages/pharmacy-admin/PharmacyAdminDashboard'
import PharmacyAdminProducts from './pages/pharmacy-admin/PharmacyAdminProducts'
import PharmacyAdminOrders from './pages/pharmacy-admin/PharmacyAdminOrders'
import PharmacyAdminOrderDetails from './pages/pharmacy-admin/PharmacyAdminOrderDetails'
import PharmacyAdminPayouts from './pages/pharmacy-admin/PharmacyAdminPayouts'
import PharmacyAdminProfile from './pages/pharmacy-admin/PharmacyAdminProfile'
import PharmacyAdminSubscription from './pages/pharmacy-admin/PharmacyAdminSubscription'

// Search & Booking Pages
import Search from './pages/search/Search'
import Search2 from './pages/search/Search2'
import DoctorGrid from './pages/search/DoctorGrid'
import DoctorSearchGrid from './pages/search/DoctorSearchGrid'
import MapGrid from './pages/search/MapGrid'
import MapList from './pages/search/MapList'
import MapListAvailability from './pages/search/MapListAvailability'
import Booking from './pages/booking/Booking'
import BookingSuccess from './pages/booking/BookingSuccess'
import Checkout from './pages/booking/Checkout'
import Consultation from './pages/booking/Consultation'

// Pharmacy Pages
import PharmacyIndex from './pages/pharmacy/PharmacyIndex'
import PharmacyDetails from './pages/pharmacy/PharmacyDetails'
import PharmacySearch from './pages/pharmacy/PharmacySearch'
import ProductAll from './pages/pharmacy/ProductAll'
import ProductDescription from './pages/pharmacy/ProductDescription'
import Cart from './pages/pharmacy/Cart'
import ProductCheckout from './pages/pharmacy/ProductCheckout'
import PaymentSuccess from './pages/pharmacy/PaymentSuccess'

// Error Pages
import Error404 from './pages/Error404'
import Error500 from './pages/Error500'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Home Pages */}
              <Route path="/" element={<Index />} />
              <Route path="/index" element={<Index />} />

              {/* Public General Pages */}
              <Route path="/about-us" element={<MainLayout><AboutUs /></MainLayout>} />
              <Route path="/contact-us" element={<MainLayout><ContactUs /></MainLayout>} />
              <Route path="/pricing" element={<MainLayout><Pricing /></MainLayout>} />
              <Route path="/faq" element={<MainLayout><FAQ /></MainLayout>} />
              <Route path="/blog" element={<MainLayout><BlogList /></MainLayout>} />
              <Route path="/blog/:id" element={<MainLayout><BlogDetails /></MainLayout>} />
              <Route path="/privacy-policy" element={<MainLayout><PrivacyPolicy /></MainLayout>} />
              <Route path="/terms-condition" element={<MainLayout><TermsCondition /></MainLayout>} />
              <Route path="/doctor-profile" element={<MainLayout><DoctorProfile /></MainLayout>} />
              <Route path="/doctor-profile/:userId" element={<MainLayout><DoctorProfile /></MainLayout>} />

                {/* Auth Pages */}
                <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
                <Route path="/register" element={<AuthLayout><Register /></AuthLayout>} />
                <Route path="/forgot-password" element={<AuthLayout><ForgotPassword /></AuthLayout>} />
                <Route path="/doctor-signup" element={<AuthLayout><DoctorSignup /></AuthLayout>} />
                <Route path="/doctor-register" element={<AuthLayout><DoctorRegister /></AuthLayout>} />
                <Route path="/doctor-register-step1" element={<AuthLayout><DoctorRegisterStep1 /></AuthLayout>} />
                <Route path="/doctor-register-step2" element={<AuthLayout><DoctorRegisterStep2 /></AuthLayout>} />
                <Route path="/doctor-register-step3" element={<AuthLayout><DoctorRegisterStep3 /></AuthLayout>} />
                <Route
                  path="/doctor-verification-upload"
                  element={
                    <ProtectedRoute role="VETERINARIAN" allowPending={true}>
                      <AuthLayout><DoctorVerificationUpload /></AuthLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pending-approval"
                  element={
                    <ProtectedRoute role={['VETERINARIAN', 'PET_STORE', 'PARAPHARMACY']} allowPending={true}>
                      <AuthLayout><PendingApprovalStatus /></AuthLayout>
                    </ProtectedRoute>
                  }
                />
                <Route path="/pharmacy-register" element={<AuthLayout><PharmacyRegister /></AuthLayout>} />
                <Route
                  path="/pharmacy-phone-verification"
                  element={
                    <ProtectedRoute role={['PET_STORE', 'PARAPHARMACY']} allowPending={true}>
                      <AuthLayout><PharmacyPhoneVerification /></AuthLayout>
                    </ProtectedRoute>
                  }
                />
                <Route path="/pharmacy-register-step1" element={<AuthLayout><PharmacyRegisterStep1 /></AuthLayout>} />
                <Route path="/pharmacy-register-step2" element={<AuthLayout><PharmacyRegisterStep2 /></AuthLayout>} />
                <Route path="/pharmacy-register-step3" element={<AuthLayout><PharmacyRegisterStep3 /></AuthLayout>} />
                <Route
                  path="/pet-store-verification-upload"
                  element={
                    <ProtectedRoute role={['PET_STORE', 'PARAPHARMACY']} allowPending={true}>
                      <AuthLayout><PetStoreVerificationUpload /></AuthLayout>
                    </ProtectedRoute>
                  }
                />

            {/* Doctor Routes - Protected (VETERINARIAN + APPROVED) */}
            <Route
              path="/doctor/dashboard"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Dashboard", li2: "Dashboard" }}><DoctorDashboard /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor-request"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Requests", li2: "Requests" }}><DoctorRequest /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointments"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Appointments", li2: "Appointments" }}><DoctorAppointments /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/reschedule-requests"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Reschedule Requests", li2: "Reschedule Requests" }}><DoctorRescheduleRequests /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor-appointments-grid"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Appointments", li2: "Appointments" }}><DoctorAppointmentsGrid /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor-upcoming-appointment"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Appointment Details", li2: "Appointment Details" }}><DoctorUpcomingAppointment /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor-completed-appointment"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Appointment Details", li2: "Appointment Details" }}><DoctorCompletedAppointment /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor-cancelled-appointment"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Appointment Details", li2: "Appointment Details" }}><DoctorCancelledAppointment /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor-appointment-details"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Appointment Details", li2: "Appointment Details" }}><DoctorAppointmentDetails /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor-appointment-start"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Appointment Details", li2: "Appointment Details" }}><DoctorAppointmentStart /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/available-timings"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Available Timings", li2: "Available Timings" }}><AvailableTimings /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-patients"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "My Patients", li2: "My Patients" }}><MyPatients /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor-specialities"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Speciality & Services", li2: "Speciality & Services" }}><DoctorSpecialities /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reviews"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Reviews", li2: "Reviews" }}><Reviews /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Invoices", li2: "Invoices" }}><Invoices /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor-profile-settings"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Doctor Profile", li2: "Doctor Profile" }}><DoctorProfileSettings /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor-payment"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Payout Settings", li2: "Payout Settings" }}><DoctorPayment /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoice-view/:transactionId?"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Invoice View", li2: "Invoice View" }}><InvoiceView /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor-change-password"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Change Password", li2: "Change Password" }}><DoctorChangePassword /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor-experience-settings"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Doctor Profile", li2: "Doctor Profile" }}><DoctorExperienceSettings /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor-education-settings"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Doctor Profile", li2: "Doctor Profile" }}><DoctorEducationSettings /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor-awards-settings"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Doctor Profile", li2: "Doctor Profile" }}><DoctorAwardsSettings /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor-insurance-settings"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Doctor Profile", li2: "Doctor Profile" }}><DoctorInsuranceSettings /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor-clinics-settings"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Doctor Profile", li2: "Doctor Profile" }}><DoctorClinicsSettings /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor-business-settings"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Doctor Profile", li2: "Doctor Profile" }}><DoctorBusinessSettings /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/social-media"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Doctor Profile", li2: "Doctor Profile" }}><SocialMedia /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/subscription-plans"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Subscription Plans", li2: "Subscription Plans" }}><SubscriptionPlans /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/announcements"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Announcements", li2: "Announcements" }}><DoctorAnnouncements /></DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/doctor/notifications"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Notifications", li2: "Notifications" }}><DoctorNotifications /></DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/doctor/blog"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Blog Posts", li2: "Blog Posts" }}><DoctorBlogList /></DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/doctor/blog/create"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Blog Posts", li2: "Create Blog Post" }}><DoctorBlogCreateEdit /></DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/doctor/blog/edit/:id"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Blog Posts", li2: "Edit Blog Post" }}><DoctorBlogCreateEdit /></DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/doctor/blog/:id"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Blog Posts", li2: "Blog Details" }}><DoctorBlogDetails /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat-doctor"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Message", li2: "Message" }}><DoctorChat /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/admin-chat"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Admin Messages", li2: "Admin Messages" }}><AdminDoctorChat /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/video-call"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DoctorVideoCallRoom />
                </ProtectedRoute>
              }
            />

            <Route
              path="/doctor/vaccinations"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Vaccinations", li2: "Vaccinations" }}><DoctorVaccinations /></DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/doctor/prescription"
              element={
                <ProtectedRoute role="VETERINARIAN" requireApproved={true}>
                  <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Prescription", li2: "Prescription" }}><Prescription /></DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/vaccines"
              element={
                <ProtectedRoute role="ADMIN">
                  <DashboardLayout breadcrumb={{ title: "Admin", li1: "Vaccines", li2: "Vaccine Catalog" }}><VaccineCatalog /></DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/subscription-plans"
              element={
                <ProtectedRoute role="ADMIN">
                  <DashboardLayout breadcrumb={{ title: "Admin", li1: "Subscriptions", li2: "Plan Prices" }}>
                    <SubscriptionPlanPrices />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

                {/* Patient Routes - Protected (PET_OWNER) */}
                <Route
                  path="/patient/dashboard"
                  element={
                    <ProtectedRoute role="PET_OWNER">
                      <DashboardLayout breadcrumb={{ title: "Patient", li1: "Patient Dashboard", li2: "Patient Dashboard" }}><PatientDashboard /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patient-profile"
                  element={
                    <ProtectedRoute role="PET_OWNER">
                      <DashboardLayout breadcrumb={{ title: "Doctor", li1: "Patients Profile", li2: "Patients Profile" }}><PatientProfile /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patient-appointments"
                  element={
                    <ProtectedRoute role="PET_OWNER">
                      <DashboardLayout breadcrumb={{ title: "Patient", li1: "Patient Appointments", li2: "Patient Appointments" }}><PatientAppointments /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/patient/request-reschedule"
                  element={
                    <ProtectedRoute role="PET_OWNER">
                      <DashboardLayout breadcrumb={{ title: "Patient", li1: "Request Reschedule", li2: "Request Reschedule" }}><RequestReschedule /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/patient/reschedule-requests"
                  element={
                    <ProtectedRoute role="PET_OWNER">
                      <DashboardLayout breadcrumb={{ title: "Patient", li1: "Reschedule Requests", li2: "Reschedule Requests" }}><RescheduleRequests /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patient-appointments-grid"
                  element={
                    <ProtectedRoute role="PET_OWNER">
                      <DashboardLayout breadcrumb={{ title: "Patient", li1: "Appointments", li2: "Appointments" }}><PatientAppointmentsGrid /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patient-upcoming-appointment"
                  element={
                    <ProtectedRoute role="PET_OWNER">
                      <DashboardLayout breadcrumb={{ title: "Patient", li1: "Appointments", li2: "Appointments" }}><PatientUpcomingAppointment /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patient-completed-appointment"
                  element={
                    <ProtectedRoute role="PET_OWNER">
                      <DashboardLayout breadcrumb={{ title: "Patient", li1: "Appointments", li2: "Appointments" }}><PatientCompletedAppointment /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patient-cancelled-appointment"
                  element={
                    <ProtectedRoute role="PET_OWNER">
                      <DashboardLayout breadcrumb={{ title: "Patient", li1: "Appointments", li2: "Appointments" }}><PatientCancelledAppointment /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patient-appointment-details"
                  element={
                    <ProtectedRoute role="PET_OWNER">
                      <DashboardLayout breadcrumb={{ title: "Patient", li1: "Patient Appointments", li2: "Patient Appointments" }}><PatientAppointmentDetails /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/patient/prescription"
                  element={
                    <ProtectedRoute role="PET_OWNER">
                      <DashboardLayout breadcrumb={{ title: "Patient", li1: "Prescription", li2: "Prescription" }}><Prescription /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patient-accounts"
                  element={
                    <ProtectedRoute role="PET_OWNER">
                      <DashboardLayout breadcrumb={{ title: "Patient", li1: "Wallet", li2: "Wallet" }}><PatientAccounts /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile-settings"
                  element={
                    <ProtectedRoute role="PET_OWNER">
                      <DashboardLayout breadcrumb={{ title: "Patient", li1: "Settings", li2: "Settings" }}><ProfileSettings /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/change-password"
                  element={
                    <ProtectedRoute role="PET_OWNER">
                      <DashboardLayout breadcrumb={{ title: "Patient", li1: "Settings", li2: "Settings" }}><ChangePassword /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/favourites"
                  element={
                    <ProtectedRoute role="PET_OWNER">
                      <DashboardLayout breadcrumb={{ title: "Patient", li1: "Favourites", li2: "Favourites" }}><Favourites /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute role="PET_OWNER">
                      <DashboardLayout breadcrumb={{ title: "Patient", li1: "Message", li2: "Message" }}><Chat /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dependent"
                  element={
                    <ProtectedRoute role="PET_OWNER">
                      <DashboardLayout breadcrumb={{ title: "Dependants", li1: "Patient", li2: "Dependants" }}><Dependent /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/medical-records"
                  element={
                    <ProtectedRoute role="PET_OWNER">
                      <DashboardLayout breadcrumb={{ title: "Patient", li1: "Medical Records", li2: "Medical Records" }}><MedicalRecords /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/medical-details"
                  element={
                    <ProtectedRoute role="PET_OWNER">
                      <DashboardLayout breadcrumb={{ title: "Patient", li1: "Vitals", li2: "Vitals" }}><MedicalDetails /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/weight-records"
                  element={
                    <ProtectedRoute role="PET_OWNER">
                      <DashboardLayout breadcrumb={{ title: "Patient", li1: "Weight", li2: "Weight Records" }}><WeightRecords /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patient-invoices"
                  element={
                    <ProtectedRoute role="PET_OWNER">
                      <DashboardLayout breadcrumb={{ title: "Patient", li1: "Invoices", li2: "Invoices" }}><PatientInvoices /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patient-invoices/:transactionId"
                  element={
                    <ProtectedRoute role="PET_OWNER">
                      <DashboardLayout breadcrumb={{ title: "Patient", li1: "Invoice View", li2: "Invoice View" }}><PatientInvoiceView /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/video-call"
                  element={
                    <ProtectedRoute role="PET_OWNER">
                      <VideoCallRoom />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/voice-call"
                  element={
                    <ProtectedRoute role="PET_OWNER">
                      <VideoCallRoom />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/clinic-navigation"
                  element={
                    <ProtectedRoute role="PET_OWNER">
                      <DashboardLayout breadcrumb={{ title: "Patient", li1: "Clinic Navigation", li2: "Clinic Navigation" }}><ClinicNavigation /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/clinic-map"
                  element={
                    <ProtectedRoute role="PET_OWNER">
                      <DashboardLayout breadcrumb={{ title: "Patient", li1: "Clinics", li2: "Nearby Clinics" }}><ClinicMapView /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/order-history"
                  element={
                    <ProtectedRoute role="PET_OWNER">
                      <DashboardLayout breadcrumb={{ title: "Patient", li1: "Order History", li2: "Order History" }}><OrderHistory /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/order-details/:orderId"
                  element={
                    <ProtectedRoute role="PET_OWNER">
                      <DashboardLayout breadcrumb={{ title: "Patient", li1: "Orders", li2: "Order Details" }}><OrderDetails /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/documents-download"
                  element={
                    <ProtectedRoute role="PET_OWNER">
                      <DashboardLayout breadcrumb={{ title: "Patient", li1: "Documents", li2: "Documents & Receipts" }}><DocumentsDownload /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Patient Onboarding Pages (Special Layout - No DashboardLayout) */}
                <Route path="/patient-email" element={<PatientEmail />} />
                <Route path="/patient-Personalize" element={<PatientPersonalize />} />
                <Route path="/patient-details" element={<PatientDetails />} />
                <Route path="/patient-family-details" element={<PatientFamilyDetails />} />
                <Route path="/patient-dependant-details" element={<PatientDependantDetails />} />
                <Route path="/patient-other-details" element={<PatientOtherDetails />} />

                {/* Patient Registration Pages (Auth Layout) */}
                <Route path="/patient-register-step1" element={<AuthLayout><PatientRegisterStep1 /></AuthLayout>} />
                <Route path="/patient-register-step2" element={<AuthLayout><PatientRegisterStep2 /></AuthLayout>} />
                <Route path="/patient-register-step3" element={<AuthLayout><PatientRegisterStep3 /></AuthLayout>} />
                <Route path="/patient-register-step4" element={<AuthLayout><PatientRegisterStep4 /></AuthLayout>} />
                <Route path="/patient-register-step5" element={<AuthLayout><PatientRegisterStep5 /></AuthLayout>} />
                <Route path="/patient-register" element={<AuthLayout><PatientRegister /></AuthLayout>} />
                <Route path="/paitent-details" element={<MainLayout><PaitentDetails /></MainLayout>} />
                <Route
                  path="/add-dependent"
                  element={
                    <ProtectedRoute role="PET_OWNER">
                      <DashboardLayout breadcrumb={{ title: "Patient", li1: "My Pets", li2: "Add Pet" }}><AddDependent /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/edit-dependent/:petId"
                  element={
                    <ProtectedRoute role="PET_OWNER">
                      <DashboardLayout breadcrumb={{ title: "Patient", li1: "My Pets", li2: "Edit Pet" }}><EditDependent /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route path="/patient-billing" element={<DashboardLayout breadcrumb={{ title: "Patient", li1: "Billing", li2: "Billing Information" }}><PatientBilling /></DashboardLayout>} />
                <Route
                  path="/patient-notifications"
                  element={
                    <ProtectedRoute role="PET_OWNER">
                      <DashboardLayout breadcrumb={{ title: "Patient", li1: "Notifications", li2: "Notifications" }}><PatientNotifications /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route path="/patient-reports" element={<DashboardLayout breadcrumb={{ title: "Patient", li1: "Reports", li2: "Medical Reports" }}><PatientReports /></DashboardLayout>} />
                <Route path="/two-factor-authentication" element={<DashboardLayout breadcrumb={{ title: "Patient", li1: "Settings", li2: "2 Factor Authentication" }}><TwoFactorAuthentication /></DashboardLayout>} />

            {/* Pharmacy Admin Routes - Protected (PET_STORE or ADMIN) */}
            <Route
              path="/pharmacy-admin/dashboard"
              element={
                <ProtectedRoute role={['PET_STORE', 'PARAPHARMACY', 'ADMIN']}>
                  <DashboardLayout><PharmacyAdminDashboard /></DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/pharmacy-admin/products"
              element={
                <ProtectedRoute role={['PET_STORE', 'PARAPHARMACY', 'ADMIN']}>
                  <DashboardLayout><PharmacyAdminProducts /></DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/pharmacy-admin/profile"
              element={
                <ProtectedRoute role={['PET_STORE', 'PARAPHARMACY', 'ADMIN']}>
                  <DashboardLayout><PharmacyAdminProfile /></DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/pharmacy-admin/orders"
              element={
                <ProtectedRoute role={['PET_STORE', 'PARAPHARMACY', 'ADMIN']}>
                  <DashboardLayout><PharmacyAdminOrders /></DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/pharmacy-admin/orders/:orderId"
              element={
                <ProtectedRoute role={['PET_STORE', 'PARAPHARMACY', 'ADMIN']}>
                  <DashboardLayout><PharmacyAdminOrderDetails /></DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/pharmacy-admin/payouts"
              element={
                <ProtectedRoute role={['PET_STORE', 'PARAPHARMACY', 'ADMIN']}>
                  <DashboardLayout><PharmacyAdminPayouts /></DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/pharmacy-admin/subscription"
              element={
                <ProtectedRoute role={['PET_STORE', 'PARAPHARMACY', 'ADMIN']}>
                  <DashboardLayout><PharmacyAdminSubscription /></DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Search & Booking Routes - Public */}
            <Route path="/search" element={<MainLayout><Search /></MainLayout>} />
            <Route path="/search-2" element={<MainLayout><Search2 /></MainLayout>} />
            <Route path="/doctor-grid" element={<MainLayout><DoctorGrid /></MainLayout>} />
            <Route path="/doctor-search-grid" element={<MainLayout><DoctorSearchGrid /></MainLayout>} />
            <Route path="/map-grid" element={<MainLayout><MapGrid /></MainLayout>} />
            <Route path="/map-list" element={<MainLayout><MapList /></MainLayout>} />
            <Route path="/map-list-availability" element={<MainLayout><MapListAvailability /></MainLayout>} />
            <Route path="/booking" element={<MainLayout><Booking /></MainLayout>} />
            <Route path="/booking-success" element={<MainLayout><BookingSuccess /></MainLayout>} />
            <Route path="/checkout" element={<MainLayout><Checkout /></MainLayout>} />
            <Route path="/consultation" element={<MainLayout><Consultation /></MainLayout>} />

            {/* Pharmacy Routes - Public */}
            <Route path="/pharmacy-index" element={<MainLayout><PharmacyIndex /></MainLayout>} />
            <Route path="/pharmacy-details" element={<MainLayout><PharmacyDetails /></MainLayout>} />
            <Route path="/pharmacy-search" element={<MainLayout><PharmacySearch /></MainLayout>} />
            <Route path="/product-all" element={<MainLayout><ProductAll /></MainLayout>} />
            <Route path="/product-description" element={<MainLayout><ProductDescription /></MainLayout>} />
            <Route
              path="/cart"
              element={
                <ProtectedRoute role="PET_OWNER">
                  <MainLayout><Cart /></MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/product-checkout"
              element={
                <ProtectedRoute role="PET_OWNER">
                  <MainLayout><ProductCheckout /></MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-success"
              element={
                <ProtectedRoute role="PET_OWNER">
                  <MainLayout><PaymentSuccess /></MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Error Pages */}
            <Route path="/error-404" element={<Error404 />} />
            <Route path="/error-500" element={<Error500 />} />
            <Route path="*" element={<Error404 />} />
            </Routes>
            <GoogleTranslate />
            <ToastContainer position="top-right" autoClose={3000} />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
