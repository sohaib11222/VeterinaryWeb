export const DELIVERY_DAY_OPTIONS = [2, 3, 4, 5]

export const calculateExpectedDeliveryPreview = (deliveryDays, baseDate = new Date()) => {
  const days = Number(deliveryDays)
  if (!DELIVERY_DAY_OPTIONS.includes(days)) return null

  const date = new Date(baseDate)
  date.setDate(date.getDate() + days)
  return date
}

export const formatDeliveryStatus = (status, daysLate = 0) => {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'LATE') {
    const lateDays = Number(daysLate || 0)
    return lateDays ? `Late · ${lateDays} Day${lateDays === 1 ? '' : 's'} Late` : 'Late'
  }
  if (normalized === 'DELIVERED') return 'Delivered'
  if (normalized === 'ON_TIME') return 'On Time'
  return 'Awaiting Delivery'
}

export const deliveryStatusBadgeClass = (status) => {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'LATE') return 'badge-danger'
  if (normalized === 'DELIVERED') return 'badge-success'
  if (normalized === 'ON_TIME') return 'badge-info'
  return 'badge-secondary'
}
