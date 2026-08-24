import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

import { useAuth } from '../../contexts/AuthContext'
import { useMarkNotificationRead } from '../../mutations/notificationMutations'
import { useNotifications } from '../../queries/notificationQueries'

const unwrap = (response) => response?.data ?? response

const PrescriptionApprovalNotifier = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [approval, setApproval] = useState(null)
  const handledNotificationIds = useRef(new Set())
  const role = String(user?.role || '').toUpperCase()
  const isPetOwner = role === 'PET_OWNER'
  const notificationsQuery = useNotifications(
    { page: 1, limit: 30, unreadOnly: true },
    { enabled: isPetOwner, staleTime: 0, refetchInterval: 5000, refetchOnWindowFocus: true }
  )
  const markRead = useMarkNotificationRead()
  const payload = useMemo(() => unwrap(notificationsQuery.data), [notificationsQuery.data])
  const notifications = useMemo(() => payload?.notifications || [], [payload])

  useEffect(() => {
    if (!isPetOwner || approval) return
    const next = notifications.find((notification) => (
      String(notification?.type || '').toUpperCase() === 'PRESCRIPTION_APPROVED'
      && !notification?.isRead
      && notification?._id
      && !handledNotificationIds.current.has(String(notification._id))
    ))
    if (!next) return

    const notificationId = String(next._id)
    handledNotificationIds.current.add(notificationId)
    setApproval(next)

    const productId = next?.data?.productId
    if (productId) {
      queryClient.invalidateQueries({ queryKey: ['product-prescription-eligibility', String(productId)] })
    }
    queryClient.invalidateQueries({ queryKey: ['product-prescription-requests', 'mine'] })
    // Reading is persisted immediately so a poll, route change, or reload
    // cannot show the same approval modal again.
    markRead.mutate(notificationId)
  }, [approval, isPetOwner, markRead, notifications, queryClient])

  useEffect(() => {
    if (!approval) return undefined
    const timer = window.setTimeout(() => setApproval(null), 12000)
    return () => window.clearTimeout(timer)
  }, [approval])

  if (!approval) return null
  const productId = approval?.data?.productId
  const variantId = approval?.data?.variantId

  const viewMedicine = () => {
    if (!productId) {
      setApproval(null)
      return
    }
    queryClient.invalidateQueries({ queryKey: ['product-prescription-eligibility', String(productId)] })
    const variantQuery = variantId ? `&variantId=${encodeURIComponent(variantId)}` : ''
    setApproval(null)
    navigate(`/product-description?id=${encodeURIComponent(productId)}${variantQuery}`)
  }

  return (
    <div className="prescription-approval-notifier" role="dialog" aria-modal="true" aria-labelledby="prescription-approved-title">
      <div className="prescription-approval-notifier__card">
        <button type="button" className="prescription-approval-notifier__close" onClick={() => setApproval(null)} aria-label="Close notification">
          <i className="fa-solid fa-xmark" />
        </button>
        <div className="prescription-approval-notifier__icon"><i className="fa-solid fa-circle-check" /></div>
        <span className="prescription-approval-notifier__eyebrow">PRESCRIPTION APPROVED</span>
        <h3 id="prescription-approved-title">You can now purchase this medicine</h3>
        <p>{approval.body || 'Your prescription has been approved. You can now purchase this medicine.'}</p>
        <button type="button" className="btn prescription-approval-notifier__button" onClick={viewMedicine} disabled={!productId}>
          <i className="fa-solid fa-bag-shopping me-2" />View medicine
        </button>
      </div>
    </div>
  )
}

export default PrescriptionApprovalNotifier
