/**
 * Veterinary API Configuration
 * Central place for base URL and all endpoint paths.
 */

// Match VeterinaryBackend base URL (can be overridden via env)
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL || // fallback for older env naming
  'http://localhost:5000/api'

// Backend origin for static assets (e.g. /uploads/*). Strip /api so images resolve correctly.
export const getApiOrigin = () => {
  const base = API_BASE_URL || ''
  // Support common patterns:
  // - http://host:port/api
  // - http://host:port/api/
  // - http://host:port/api/v1
  // - http://host:port/api/v1/
  const origin = base.replace(/\/api(\/.*)?$/, '')
  return origin || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000')
}

/** Build full URL for backend image paths (e.g. /uploads/profiles/...). Returns null if no path. */
export const getImageUrl = (path) => {
  if (!path || typeof path !== 'string') return null
  const t = path.trim()
  if (!t) return null
  if (t.startsWith('http://') || t.startsWith('https://')) return t
  const origin = getApiOrigin()
  return `${origin}${t.startsWith('/') ? t : `/${t}`}`
}

// All backend routes grouped by domain
export const API_ROUTES = {
  // ==================== System ====================
  HEALTH: '/health',

  // ==================== Auth ====================
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    CHANGE_PASSWORD: '/auth/change-password',
    REFRESH_TOKEN: '/auth/refresh-token',
    FORGOT_PASSWORD: '/auth/forgot-password',
    VERIFY_RESET_CODE: '/auth/verify-reset-code',
    RESET_PASSWORD: '/auth/reset-password',
    APPROVE_VETERINARIAN: '/auth/approve-veterinarian',
    REJECT_VETERINARIAN: '/auth/reject-veterinarian',
  },

  // ==================== Pets & Owners ====================
  PETS: {
    BASE: '/pets',
    LIST: '/pets',
    CREATE: '/pets',
    GET: (id) => `/pets/${id}`,
    UPDATE: (id) => `/pets/${id}`,
    DELETE: (id) => `/pets/${id}`,
  },

  PET_OWNER: {
    DASHBOARD: '/pet-owners/dashboard',
    APPOINTMENTS: '/pet-owners/appointments',
    PAYMENTS: '/pet-owners/payments',
  },

  // ==================== Veterinarians ====================
  VETERINARIANS: {
    LIST: '/veterinarians',
    DASHBOARD: '/veterinarians/dashboard',
    PROFILE: '/veterinarians/profile',
    UPDATE_PROFILE: '/veterinarians/profile',
    INVOICES: '/veterinarians/invoices',
    INVOICE: (transactionId) => `/veterinarians/invoices/${transactionId}`,
    PUBLIC_PROFILE: (id) => `/veterinarians/${id}`,
  },

  // ==================== Appointments ====================
  APPOINTMENTS: {
    BASE: '/appointments',
    LIST: '/appointments',
    CREATE: '/appointments',
    GET: (id) => `/appointments/${id}`,
    ACCEPT: (id) => `/appointments/${id}/accept`,
    REJECT: (id) => `/appointments/${id}/reject`,
    CANCEL: (id) => `/appointments/${id}/cancel`,
    COMPLETE: (id) => `/appointments/${id}/complete`,
    UPDATE_STATUS: (id) => `/appointments/${id}/status`,
  },

  // ==================== Medical Records & Health ====================
  MEDICAL_RECORDS: {
    BASE: '/medical-records',
    LIST: '/medical-records',
    CREATE: '/medical-records',
    GET: (id) => `/medical-records/${id}`,
    DELETE: (id) => `/medical-records/${id}`,
  },

  VACCINATIONS: {
    BASE: '/vaccinations',
    LIST: '/vaccinations',
    CREATE: '/vaccinations',
    UPDATE: (id) => `/vaccinations/${id}`,
    DELETE: (id) => `/vaccinations/${id}`,
    UPCOMING: '/vaccinations/upcoming',
  },

  VACCINES: {
    BASE: '/vaccines',
    LIST: '/vaccines',
    CREATE: '/vaccines',
    UPDATE: (id) => `/vaccines/${id}`,
    DELETE: (id) => `/vaccines/${id}`,
  },

  WEIGHT_RECORDS: {
    BASE: '/weight-records',
    LIST: '/weight-records',
    CREATE: '/weight-records',
    GET: (id) => `/weight-records/${id}`,
    UPDATE: (id) => `/weight-records/${id}`,
    DELETE: (id) => `/weight-records/${id}`,
  },

  // ==================== Products & Orders ====================
  PRODUCTS: {
    BASE: '/products',
    LIST: '/products',
    MINE: '/products/mine',
    GET: (id) => `/products/${id}`,
    CREATE: '/products',
    UPDATE: (id) => `/products/${id}`,
    DELETE: (id) => `/products/${id}`,
  },

  ORDERS: {
    BASE: '/orders',
    LIST: '/orders',
    CREATE: '/orders',
    GET: (id) => `/orders/${id}`,
    UPDATE_STATUS: (id) => `/orders/${id}/status`,
    UPDATE_SHIPPING: (id) => `/orders/${id}/shipping`,
    PAY: (id) => `/orders/${id}/pay`,
    CANCEL: (id) => `/orders/${id}/cancel`,
  },

  PET_STORES: {
    BASE: '/pet-stores',
    LIST: '/pet-stores',
    GET: (id) => `/pet-stores/${id}`,
    ME: '/pet-stores/me',
    MY_SUBSCRIPTION: '/pet-stores/my-subscription',
    BUY_SUBSCRIPTION: '/pet-stores/buy-subscription',
    CREATE: '/pet-stores',
    UPDATE: (id) => `/pet-stores/${id}`,
    DELETE: (id) => `/pet-stores/${id}`,
  },

  // ==================== Engagement & Communication ====================
  REVIEWS: {
    BASE: '/reviews',
    LIST: '/reviews',
    PUBLIC_LIST: '/reviews/public',
    CREATE: '/reviews',
    BY_VETERINARIAN: (veterinarianId) => `/reviews/veterinarian/${veterinarianId}`,
    MY_APPOINTMENT_REVIEW: (appointmentId) => `/reviews/appointment/${appointmentId}/mine`,
  },

  PRESCRIPTIONS: {
    BASE: '/prescriptions',
    LIST_MINE: '/prescriptions',
    UPSERT_FOR_APPOINTMENT: (appointmentId) => `/prescriptions/appointment/${appointmentId}`,
    BY_APPOINTMENT: (appointmentId) => `/prescriptions/appointment/${appointmentId}`,
    GET: (id) => `/prescriptions/${id}`,
    PDF: (id) => `/prescriptions/${id}/pdf`,
  },

  CHAT: {
    CONVERSATIONS: '/chat/conversations',
    CONVERSATION: '/chat/conversation',
    MESSAGES: (conversationId) => `/chat/messages/${conversationId}`,
    SEND: '/chat/send',
    MARK_READ: (conversationId) => `/chat/conversations/${conversationId}/read`,
    UNREAD_COUNT: '/chat/unread-count',
  },


  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id) => `/notifications/${id}/read`,
    READ_ALL: '/notifications/read-all',
    UNREAD_COUNT: '/notifications/unread-count',
  },

  ANNOUNCEMENTS: {
    BASE: '/announcements',
    LIST: '/announcements',
    VETERINARIAN_LIST: '/announcements/veterinarian',
    UNREAD_COUNT: '/announcements/unread-count',
    GET: (id) => `/announcements/${id}`,
    MARK_READ: (id) => `/announcements/${id}/read`,
    READ_STATUS: (id) => `/announcements/${id}/read-status`,
  },

  // ==================== Scheduling & Availability ====================
  AVAILABILITY: {
    BASE: '/availability',
    LIST: '/availability',
  },

  WEEKLY_SCHEDULE: {
    BASE: '/weekly-schedule',
    LIST: '/weekly-schedule',
  },

  RESCHEDULE_REQUEST: {
    BASE: '/reschedule-request',
    LIST: '/reschedule-request',
    CREATE: '/reschedule-request',
    GET: (id) => `/reschedule-request/${id}`,
    APPROVE: (id) => `/reschedule-request/${id}/approve`,
    REJECT: (id) => `/reschedule-request/${id}/reject`,
    PAY: (id) => `/reschedule-request/${id}/pay`,
    ELIGIBLE_APPOINTMENTS: '/reschedule-request/eligible-appointments',
  },

  // ==================== Subscriptions & Billing ====================
  SUBSCRIPTIONS: {
    LIST_PLANS: '/subscription-plans',
    PURCHASE: '/subscriptions/purchase',
    MY_SUBSCRIPTION: '/subscriptions/my-subscription',
  },

  BALANCE: {
    BASE: '/balance',
    WITHDRAW_REQUEST: '/balance/withdraw/request',
    WITHDRAW_REQUESTS: '/balance/withdraw/requests',
  },

  PAYMENT: {
    BASE: '/payment',
    TRANSACTIONS: '/payment/transactions',
    TRANSACTION: (id) => `/payment/transaction/${id}`,
  },

  TRANSACTION: {
    BASE: '/transaction',
  },

  // ==================== Misc ====================
  INSURANCE: {
    LIST: '/insurance',
  },

  BLOG: {
    LIST: '/blog',
    CREATE: '/blog',
    GET: (id) => `/blog/${id}`,
    UPDATE: (id) => `/blog/${id}`,
    DELETE: (id) => `/blog/${id}`,
  },

  USERS: {
    LIST: '/users',
    GET: (id) => `/users/${id}`,
    ME: '/users/me',
    UPDATE_PROFILE: '/users/profile',
  },

  MAPPING: {
    BASE: '/mapping',
    ROUTE: '/mapping/route',
    NEARBY: '/mapping/nearby',
    CLINICS: '/mapping/clinics',
    CLINIC: (id) => `/mapping/clinic/${id}`,
  },

  VIDEO: {
    CREATE: '/video/create',
    END: '/video/end',
    BY_APPOINTMENT: (appointmentId) => `/video/appointment/${appointmentId}`,
  },

  CRM: {
    BASE: '/crm',
  },

  SUBSCRIPTION_PLANS: {
    LIST: '/subscription-plans',
    UPDATE: (id) => `/subscription-plans/${id}`,
  },

  SPECIALIZATIONS: {
    LIST: '/specializations',
  },

  FAVORITE: {
    BASE: '/favorite',
    LIST: (petOwnerId) => `/favorite/${petOwnerId}`,
    ADD: '/favorite',
    REMOVE: (id) => `/favorite/${id}`,
  },

  UPLOAD: {
    VETERINARIAN_DOCS: '/upload/veterinarian-docs',
    PET_STORE_DOCS: '/upload/pet-store-docs',
    PROFILE: '/upload/profile',
    CLINIC: '/upload/clinic',
    PET: '/upload/pet',
    BLOG: '/upload/blog',
    PRODUCT: '/upload/product',
    PET_STORE: '/upload/pet-store',
    MEDICAL_RECORDS: '/upload/medical-records',
    CHAT: '/upload/chat',
    CHAT_MULTIPLE: '/upload/chat/multiple',
  },
}

export default API_BASE_URL

