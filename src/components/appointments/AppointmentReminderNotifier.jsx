import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../contexts/AuthContext'
import { useMarkNotificationRead } from '../../mutations/notificationMutations'
import { useNotifications } from '../../queries/notificationQueries'

const unwrap = (response) => response?.data ?? response

const AppointmentReminderNotifier = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [reminder, setReminder] = useState(null)
  const handledIds = useRef(new Set())
  const role = String(user?.role || '').toUpperCase()
  const isEligibleRole = role === 'VETERINARIAN' || role === 'PET_OWNER'
  const notificationsQuery = useNotifications(
    { page: 1, limit: 30, unreadOnly: true },
    { enabled: isEligibleRole, staleTime: 0, refetchInterval: 5000, refetchOnWindowFocus: true },
  )
  const markRead = useMarkNotificationRead()
  const payload = useMemo(() => unwrap(notificationsQuery.data), [notificationsQuery.data])
  const notifications = payload?.notifications || []

  useEffect(() => {
    if (!isEligibleRole || reminder) return
    const next = notifications.find((notification) => (
      String(notification?.type || '').toUpperCase() === 'APPOINTMENT'
      && notification?.data?.action === 'APPOINTMENT_REMINDER_10_MIN'
      && !notification?.isRead
      && notification?._id
      && !handledIds.current.has(String(notification._id))
    ))
    if (!next) return
    const id = String(next._id)
    handledIds.current.add(id)
    setReminder(next)
    // Persist dismissal immediately so polling, navigation, and reloads do not
    // show the same ten-minute reminder again.
    markRead.mutate(id)
  }, [isEligibleRole, markRead, notifications, reminder])

  useEffect(() => {
    if (!reminder) return undefined
    const timer = window.setTimeout(() => setReminder(null), 12000)
    return () => window.clearTimeout(timer)
  }, [reminder])

  if (!reminder) return null
  const appointmentId = reminder?.data?.appointmentId
  const viewAppointment = () => {
    setReminder(null)
    if (!appointmentId) return
    const route = role === 'VETERINARIAN' ? '/doctor-appointment-details' : '/patient-appointment-details'
    navigate(`${route}?id=${encodeURIComponent(String(appointmentId))}`)
  }

  return (
    <div className="prescription-approval-notifier" role="dialog" aria-modal="true" aria-labelledby="appointment-reminder-title">
      <div className="prescription-approval-notifier__card">
        <button type="button" className="prescription-approval-notifier__close" aria-label="Close reminder" onClick={() => setReminder(null)}><i className="fa-solid fa-xmark" /></button>
        <div className="prescription-approval-notifier__icon"><i className="fa-solid fa-bell" /></div>
        <span className="prescription-approval-notifier__eyebrow">APPOINTMENT REMINDER</span>
        <h3 id="appointment-reminder-title">Your appointment starts in 10 minutes</h3>
        <p>{reminder.body || 'Your upcoming appointment is almost ready.'}</p>
        <button type="button" className="btn prescription-approval-notifier__button" onClick={viewAppointment} disabled={!appointmentId}><i className="fa-solid fa-calendar-check me-2" />View appointment</button>
      </div>
    </div>
  )
}

export default AppointmentReminderNotifier
