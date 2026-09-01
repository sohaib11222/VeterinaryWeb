export const SUPPORT_CATEGORIES = [
  ['APPOINTMENT', 'Appointment issue'],
  ['RESCHEDULE', 'Reschedule issue'],
  ['VIDEO_CALL', 'Video call issue'],
  ['PAYMENT', 'Payment issue'],
  ['PHARMACY_ORDER', 'Pharmacy order issue'],
  ['PARAPHARMACY_ORDER', 'Parapharmacy order issue'],
  ['DELIVERY', 'Delivery issue'],
  ['REFUND', 'Refund issue'],
  ['PRESCRIPTION', 'Prescription issue'],
  ['ACCOUNT_REGISTRATION', 'Account / registration issue'],
  ['PET_PROFILE', 'Pet profile issue'],
  ['VETERINARIAN', 'Doctor / veterinarian issue'],
  ['TECHNICAL', 'Technical issue'],
  ['OTHER', 'Other'],
]

export const SUPPORT_STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_PATIENT', 'RESOLVED', 'CLOSED']
export const SUPPORT_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

export const supportLabel = (value) => String(value || '—').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

export const supportBadgeClass = (status) => ({
  OPEN: 'bg-primary', IN_PROGRESS: 'bg-info', WAITING_FOR_PATIENT: 'bg-warning text-dark', RESOLVED: 'bg-success', CLOSED: 'bg-secondary',
}[String(status || '').toUpperCase()] || 'bg-secondary')

export const priorityBadgeClass = (priority) => ({
  LOW: 'bg-secondary', MEDIUM: 'bg-primary', HIGH: 'bg-warning text-dark', URGENT: 'bg-danger',
}[String(priority || '').toUpperCase()] || 'bg-secondary')

export const unwrapApiData = (response) => {
  const outer = response?.data ?? response
  return outer?.data ?? outer ?? null
}
