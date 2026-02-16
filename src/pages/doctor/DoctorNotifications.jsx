import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { useNotifications } from '../../queries/notificationQueries'
import { useMarkAllNotificationsRead, useMarkNotificationRead } from '../../mutations/notificationMutations'

const DoctorNotifications = () => {
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
    if (!dateString) return 'Just now'
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`

    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
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
      default:
        return 'color-blue'
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    if (!notificationId) return
    try {
      await markReadMutation.mutateAsync(notificationId)
      toast.success('Notification marked as read')
    } catch (err) {
      toast.error(err?.message || 'Failed to mark notification as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllReadMutation.mutateAsync()
      toast.success('All notifications marked as read')
    } catch (err) {
      toast.error(err?.message || 'Failed to mark all notifications as read')
    }
  }

  return (
    <>
      <div className="dashboard-header">
        <h3>Notifications</h3>
        {unreadCount > 0 && (
          <button
            className="btn btn-sm btn-primary"
            onClick={handleMarkAllAsRead}
            disabled={markAllReadMutation.isPending}
          >
            {markAllReadMutation.isPending ? 'Marking...' : 'Mark All as Read'}
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
                  All
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${filter === 'unread' ? 'active' : ''}`}
                  onClick={() => setFilter('unread')}
                >
                  Unread {unreadCount > 0 && <span className="badge bg-danger">{unreadCount}</span>}
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${filter === 'read' ? 'active' : ''}`}
                  onClick={() => setFilter('read')}
                >
                  Read
                </button>
              </li>
            </ul>
          </div>

          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No notifications found</p>
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
                        title="Mark as read"
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
