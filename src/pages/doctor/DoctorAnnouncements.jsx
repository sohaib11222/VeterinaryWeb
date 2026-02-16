import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { useAuth } from '../../contexts/AuthContext'
import { useVeterinarianAnnouncements, useUnreadAnnouncementCount } from '../../queries/announcementQueries'
import { useMarkAnnouncementAsRead } from '../../mutations/announcementMutations'
import { getImageUrl } from '../../utils/apiConfig'

const DoctorAnnouncements = () => {
  const { user } = useAuth()
  const [filter, setFilter] = useState('all') // all, unread, pinned
  const [page, setPage] = useState(1)
  const limit = 20

  const params = useMemo(() => {
    const p = { page, limit }
    if (filter === 'unread') p.isRead = false
    return p
  }, [filter, page])

  const { data: announcementsRes, isLoading } = useVeterinarianAnnouncements(params, {
    enabled: Boolean(user),
  })
  const { data: unreadRes } = useUnreadAnnouncementCount({
    enabled: Boolean(user),
  })

  const markReadMutation = useMarkAnnouncementAsRead()

  const announcementsPayload = useMemo(
    () => announcementsRes?.data ?? announcementsRes,
    [announcementsRes]
  )

  const announcements = useMemo(
    () => announcementsPayload?.announcements ?? [],
    [announcementsPayload]
  )

  const pagination = useMemo(
    () => announcementsPayload?.pagination ?? null,
    [announcementsPayload]
  )

  const unreadCount = useMemo(() => unreadRes?.data?.unreadCount ?? 0, [unreadRes])

  const pinnedCount = useMemo(
    () => announcements.filter((a) => a.isPinned).length,
    [announcements]
  )

  const filteredAnnouncements = useMemo(() => {
    let filtered = [...announcements]

    if (filter === 'unread') {
      filtered = filtered.filter((a) => !a.isRead)
    } else if (filter === 'pinned') {
      filtered = filtered.filter((a) => a.isPinned)
    }

    const priorityOrder = { URGENT: 3, IMPORTANT: 2, NORMAL: 1 }

    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1

      const ap = priorityOrder[a.priority] || 1
      const bp = priorityOrder[b.priority] || 1
      if (ap !== bp) return bp - ap

      return new Date(b.createdAt) - new Date(a.createdAt)
    })
  }, [announcements, filter])

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const getPriorityBadge = (priority) => {
    const badges = {
      URGENT: 'badge-danger',
      IMPORTANT: 'badge-warning',
      NORMAL: 'badge-info',
    }
    return badges[priority] || 'badge-secondary'
  }

  const getPriorityIcon = (priority) => {
    const icons = {
      URGENT: 'fe-alert-circle text-danger',
      IMPORTANT: 'fe-info text-warning',
      NORMAL: 'fe-check-circle text-success',
    }
    return icons[priority] || 'fe-info'
  }

  const getTypeBadge = (announcementType) => {
    const badges = {
      BROADCAST: 'badge-primary',
      TARGETED: 'badge-secondary',
    }
    return badges[announcementType] || 'badge-secondary'
  }

  const handleMarkAsRead = async (announcementId) => {
    try {
      await markReadMutation.mutateAsync(announcementId)
      toast.success('Announcement marked as read')
    } catch (err) {
      toast.error(err?.message || 'Failed to mark as read')
    }
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="content doctor-content">
      <div className="container">
        <div className="row">
          <div className="col-lg-4 col-xl-3 theiaStickySidebar">
            {/* DoctorSidebar will be rendered by DashboardLayout */}
          </div>
          <div className="col-lg-12 col-xl-12">
            <div className="dashboard-header">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3>Announcements</h3>
                  <p className="text-muted mb-0">Stay updated with platform news and updates</p>
                </div>
                <div className="announcement-stats">
                  <span className="badge bg-danger me-2">{unreadCount} Unread</span>
                  <span className="badge bg-primary">{pinnedCount} Pinned</span>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="card mb-4">
              <div className="card-body">
                <div className="announcement-filter-tabs d-flex flex-wrap gap-2">
                  <button
                    className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => {
                      setFilter('all')
                      setPage(1)
                    }}
                  >
                    All Announcements ({announcements.length})
                  </button>
                  <button
                    className={`btn btn-sm ${filter === 'unread' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => {
                      setFilter('unread')
                      setPage(1)
                    }}
                  >
                    Unread ({unreadCount})
                  </button>
                  <button
                    className={`btn btn-sm ${filter === 'pinned' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => {
                      setFilter('pinned')
                      setPage(1)
                    }}
                  >
                    Pinned ({pinnedCount})
                  </button>
                </div>
              </div>
            </div>

            {/* Announcements List */}
            <div className="announcements-list">
              {isLoading ? (
                <div className="card">
                  <div className="card-body text-center py-5">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                </div>
              ) : filteredAnnouncements.length === 0 ? (
                <div className="card">
                  <div className="card-body text-center py-5">
                    <i className="fe fe-bell-off" style={{ fontSize: '64px', color: '#dee2e6' }}></i>
                    <h5 className="mt-3">No announcements found</h5>
                    <p className="text-muted">You're all caught up!</p>
                  </div>
                </div>
              ) : (
                filteredAnnouncements.map((announcement) => (
                  <div
                    key={announcement._id}
                    className={`card mb-3 announcement-card ${announcement.isPinned ? 'pinned' : ''} ${!announcement.isRead ? 'unread' : ''} ${announcement.priority === 'URGENT' ? 'urgent' : ''}`}
                  >
                    <div className="card-body">
                      <div className="d-flex align-items-start">
                        <div className="announcement-icon me-3">
                          <i className={`fe ${getPriorityIcon(announcement.priority)}`}></i>
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <h5 className="mb-1">
                                {announcement.isPinned && (
                                  <i className="fe fe-pin text-primary me-2" title="Pinned"></i>
                                )}
                                {announcement.priority === 'URGENT' && (
                                  <i className="fe fe-alert-circle text-danger me-2" title="Urgent"></i>
                                )}
                                {announcement.title}
                                {!announcement.isRead && (
                                  <span className="badge bg-danger ms-2">New</span>
                                )}
                              </h5>
                              <div className="d-flex align-items-center gap-2 mb-2">
                                <span className={`badge ${getPriorityBadge(announcement.priority)}`}>
                                  {announcement.priority}
                                </span>
                                <span className={`badge ${getTypeBadge(announcement.announcementType)}`}>
                                  {announcement.announcementType}
                                </span>
                                <span className="text-muted small">
                                  <i className="fe fe-calendar me-1"></i>
                                  {formatDate(announcement.createdAt)} at {formatTime(announcement.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="mb-2">{announcement.message}</p>

                          {announcement.image && (
                            <div className="mb-2">
                              <img
                                src={getImageUrl(announcement.image)}
                                alt={announcement.title}
                                className="img-fluid rounded"
                                style={{ maxHeight: '200px' }}
                              />
                            </div>
                          )}

                          {announcement.file && (
                            <div className="mb-2">
                              <a
                                href={getImageUrl(announcement.file)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-outline-secondary"
                              >
                                <i className="fe fe-paperclip me-1"></i>
                                View Attachment
                              </a>
                            </div>
                          )}

                          {announcement.link && (
                            <div className="mb-2">
                              <a
                                href={announcement.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-outline-primary"
                              >
                                <i className="fe fe-external-link me-1"></i>
                                View Link
                              </a>
                            </div>
                          )}

                          {!announcement.isRead && (
                            <button
                              className="btn btn-sm btn-primary mt-3"
                              onClick={() => handleMarkAsRead(announcement._id)}
                              disabled={markReadMutation.isPending}
                            >
                              Mark as Read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {pagination && pagination.pages > 1 && (
              <div className="d-flex justify-content-center mt-4">
                <nav>
                  <ul className="pagination">
                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                      >
                        Previous
                      </button>
                    </li>
                    <li className="page-item disabled">
                      <span className="page-link">
                        Page {page} of {pagination.pages}
                      </span>
                    </li>
                    <li className={`page-item ${page === pagination.pages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === pagination.pages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}

            {/* Info Alert */}
            <div className="alert alert-info mt-4">
              <div className="d-flex">
                <div className="flex-shrink-0">
                  <i className="fe fe-info"></i>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="alert-heading">About Announcements</h6>
                  <p className="mb-0 small">
                    Important announcements from the platform will appear here. Pinned announcements stay at the top, 
                    and urgent announcements are highlighted. Make sure to read all announcements to stay updated.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorAnnouncements

