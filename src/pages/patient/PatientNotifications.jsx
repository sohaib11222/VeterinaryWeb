import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { useNotifications } from '../../queries/notificationQueries'
import { useMarkAllNotificationsRead, useMarkNotificationRead } from '../../mutations/notificationMutations'
import { useLanguage } from '../../contexts/LanguageContext'

const PatientNotifications = () => {
  const { t } = useLanguage()
  const [filter, setFilter] = useState('all')

  const params = useMemo(() => {
    const p = { page: 1, limit: 50 }
    if (filter === 'unread') p.unreadOnly = true
    return p
  }, [filter])

  const { data: notificationsRes, isLoading } = useNotifications(params)

  const markReadMutation = useMarkNotificationRead()
  const markAllReadMutation = useMarkAllNotificationsRead()

  const payload = useMemo(() => notificationsRes?.data ?? notificationsRes, [notificationsRes])
  const notificationsRaw = useMemo(() => payload?.notifications ?? [], [payload])

  const notifications = useMemo(() => {
    if (!Array.isArray(notificationsRaw)) return []
    if (filter === 'read') return notificationsRaw.filter((n) => n?.isRead)
    return notificationsRaw
  }, [filter, notificationsRaw])

  const unreadCount = useMemo(
    () => (Array.isArray(notificationsRaw) ? notificationsRaw.filter((n) => !n?.isRead).length : 0),
    [notificationsRaw]
  )

  const formatTimeAgo = (dateString) => {
    if (!dateString) return t('patient.notificationText.justNow')
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return t('patient.notificationText.justNow')
    if (diffInSeconds < 3600) return t('patient.notificationText.minutesAgo', { count: Math.floor(diffInSeconds / 60) })
    if (diffInSeconds < 86400) return t('patient.notificationText.hoursAgo', { count: Math.floor(diffInSeconds / 3600) })
    if (diffInSeconds < 604800) return t('patient.notificationText.daysAgo', { count: Math.floor(diffInSeconds / 86400) })

    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const localizeNotificationText = (value) => {
    const normalized = String(value || '').trim().toLowerCase()
    if (normalized === 'appointment ready') return t('patient.notificationText.appointmentReady')
    if (normalized === 'review call') return t('patient.notificationText.reviewCall')
    if (normalized === 'prescription approved') return t('patient.notificationText.prescriptionApproved')
    if (normalized === 'prescription rejected') return t('patient.notificationText.prescriptionRejected')
    if (normalized === 'order update') return t('patient.notificationText.orderUpdate')
    const starts = normalized.match(/^appointment starts in (\d+) minutes?$/)
    return starts ? t('patient.notificationText.appointmentStarts', { minutes: starts[1] }) : value
  }

  const getNotificationIcon = (type) => {
    const t = String(type || 'SYSTEM').toUpperCase()
    switch (t) {
      case 'APPOINTMENT':
        return 'isax isax-calendar-tick5'
      case 'CHAT':
        return 'isax isax-messages-1'
      case 'PAYMENT':
        return 'isax isax-wallet-2'
      case 'VACCINATION':
        return 'isax isax-document-text'
      case 'PRESCRIPTION_APPROVED':
        return 'isax isax-tick-circle'
      case 'PRESCRIPTION_REJECTED':
      case 'PRESCRIPTION_REQUEST':
      case 'PRESCRIPTION':
        return 'isax isax-document-text'
      default:
        return 'isax isax-notification'
    }
  }

  const getNotificationIconColor = (type) => {
    const t = String(type || 'SYSTEM').toUpperCase()
    switch (t) {
      case 'APPOINTMENT':
        return 'color-blue'
      case 'CHAT':
        return 'color-violet'
      case 'PAYMENT':
        return 'color-yellow'
      case 'VACCINATION':
        return 'color-green'
      case 'PRESCRIPTION_APPROVED':
        return 'color-green'
      case 'PRESCRIPTION_REJECTED':
        return 'color-red'
      case 'PRESCRIPTION_REQUEST':
      case 'PRESCRIPTION':
        return 'color-violet'
      default:
        return 'color-blue'
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    if (!notificationId) return
    try {
      await markReadMutation.mutateAsync(notificationId)
      toast.success(t('patient.notificationMarked'))
    } catch (err) {
      toast.error(err?.message || t('common.unableUpdate', 'Failed to mark notification as read'))
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllReadMutation.mutateAsync()
      toast.success(t('patient.allNotificationsMarked'))
    } catch (err) {
      toast.error(err?.message || t('common.unableUpdate', 'Failed to mark all notifications as read'))
    }
  }

  return (
    <>
      <div className="dashboard-header">
        <h3>{t('patient.notificationsTitle')}</h3>
        {unreadCount > 0 && (
          <button
            className="btn btn-sm btn-primary"
            onClick={handleMarkAllAsRead}
            disabled={markAllReadMutation.isPending}
          >
            {markAllReadMutation.isPending ? t('patient.marking') : t('patient.markAllAsRead')}
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-body">
          <div className="mb-3">
            <ul className="nav nav-tabs">
              <li className="nav-item">
                <button
                  className={`nav-link ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  {t('patient.all')}
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${filter === 'unread' ? 'active' : ''}`}
                  onClick={() => setFilter('unread')}
                >
                  {t('patient.unread')} {unreadCount > 0 && <span className="badge bg-danger">{unreadCount}</span>}
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${filter === 'read' ? 'active' : ''}`}
                  onClick={() => setFilter('read')}
                >
                  {t('patient.read')}
                </button>
              </li>
            </ul>
          </div>

          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">{t('patient.loadingNotifications')}</span>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">{t('patient.noNotifications')}</p>
            </div>
          ) : (
            <div className="notification-list">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                >
                  <div className={`notification-icon ${getNotificationIconColor(notification.type)}`}>
                    <i className={getNotificationIcon(notification.type)}></i>
                  </div>
                  <div className="notification-content">
                    <h5>{localizeNotificationText(notification.title)}</h5>
                    <p>{localizeNotificationText(notification.body)}</p>
                    <span className="notification-time">{formatTimeAgo(notification.createdAt)}</span>
                  </div>
                  <div className="notification-action">
                    {!notification.isRead && (
                      <button
                        className="btn btn-sm btn-link text-primary"
                        onClick={() => handleMarkAsRead(notification._id)}
                        disabled={markReadMutation.isPending}
                        title={t('patient.markAsRead')}
                      >
                        <i className="isax isax-tick-circle"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default PatientNotifications
