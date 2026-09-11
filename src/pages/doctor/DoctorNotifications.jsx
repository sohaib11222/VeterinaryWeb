import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { useLanguage } from '../../contexts/LanguageContext'

import { useNotifications } from '../../queries/notificationQueries'
import { useMarkAllNotificationsRead, useMarkNotificationRead } from '../../mutations/notificationMutations'

const DoctorNotifications = () => {
  const { language, t } = useLanguage()
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
    if (!dateString) return t('doctorRemaining.notifications.justNow')
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return t('doctorRemaining.notifications.justNow')
    if (diffInSeconds < 3600) return t('doctorRemaining.notifications.minutesAgo', { count: Math.floor(diffInSeconds / 60) })
    if (diffInSeconds < 86400) return t('doctorRemaining.notifications.hoursAgo', { count: Math.floor(diffInSeconds / 3600) })
    if (diffInSeconds < 604800) return t('doctorRemaining.notifications.daysAgo', { count: Math.floor(diffInSeconds / 86400) })

    return date.toLocaleDateString(language === 'it' ? 'it-IT' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const getNotificationIcon = (type) => {
    const typeKey = String(type || 'SYSTEM').toUpperCase()
    switch (typeKey) {
      case 'APPOINTMENT':
        return 'isax isax-calendar-tick5'
      case 'CHAT':
        return 'isax isax-messages-1'
      case 'PAYMENT':
        return 'isax isax-wallet-2'
      case 'VACCINATION':
        return 'isax isax-document-text'
      default:
        return 'isax isax-notification'
    }
  }

  const getNotificationIconColor = (type) => {
    const typeKey = String(type || 'SYSTEM').toUpperCase()
    switch (typeKey) {
      case 'APPOINTMENT':
        return 'color-blue'
      case 'CHAT':
        return 'color-violet'
      case 'PAYMENT':
        return 'color-yellow'
      case 'VACCINATION':
        return 'color-green'
      default:
        return 'color-blue'
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    if (!notificationId) return
    try {
      await markReadMutation.mutateAsync(notificationId)
      toast.success(t('doctorRemaining.notifications.markedRead'))
    } catch (err) {
      toast.error(err?.message || t('doctorRemaining.notifications.markReadFailed'))
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllReadMutation.mutateAsync()
      toast.success(t('doctorRemaining.notifications.allMarkedRead'))
    } catch (err) {
      toast.error(err?.message || t('doctorRemaining.notifications.allMarkFailed'))
    }
  }

  return (
    <>
      <div className="dashboard-header">
        <h3>{t('doctorRemaining.notifications.title')}</h3>
        {unreadCount > 0 && (
          <button
            className="btn btn-sm btn-primary"
            onClick={handleMarkAllAsRead}
            disabled={markAllReadMutation.isPending}
          >
            {markAllReadMutation.isPending ? t('doctorRemaining.notifications.marking') : t('doctorRemaining.notifications.markAll')}
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
                  {t('doctorRemaining.notifications.all')}
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${filter === 'unread' ? 'active' : ''}`}
                  onClick={() => setFilter('unread')}
                >
                  {t('doctorRemaining.notifications.unread')} {unreadCount > 0 && <span className="badge bg-danger">{unreadCount}</span>}
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${filter === 'read' ? 'active' : ''}`}
                  onClick={() => setFilter('read')}
                >
                  {t('doctorRemaining.notifications.read')}
                </button>
              </li>
            </ul>
          </div>

          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">{t('doctorRemaining.notifications.loading')}</span>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">{t('doctorRemaining.notifications.empty')}</p>
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
                    <h5>{notification.title}</h5>
                    <p>{notification.body}</p>
                    <span className="notification-time">{formatTimeAgo(notification.createdAt)}</span>
                  </div>
                  <div className="notification-action">
                    {!notification.isRead && (
                      <button
                        className="btn btn-sm btn-link text-primary"
                        onClick={() => handleMarkAsRead(notification._id)}
                        disabled={markReadMutation.isPending}
                        title={t('doctorRemaining.notifications.markRead')}
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

export default DoctorNotifications
