import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { useAppointment, useConversations, useMessages, useUnreadChatCount } from '../../queries'
import { useGetOrCreateConversation, useMarkConversationRead, useSendMessage, useUploadChatFiles, useMarkConversationComplete } from '../../mutations'
import { getImageUrl } from '../../utils/apiConfig'

const DoctorChat = () => {
  const { user } = useAuth()
  const { t: translate, language } = useLanguage()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const conversationIdFromUrl = searchParams.get('conversationId')
  const appointmentIdFromUrl = searchParams.get('appointmentId')

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedConversationId, setSelectedConversationId] = useState(conversationIdFromUrl || '')
  const [isMobileConversationOpen, setIsMobileConversationOpen] = useState(false)
  const [newMessage, setNewMessage] = useState('')

  const currentUserId = user?.id || user?._id
  const currentUserImage = getImageUrl(user?.profileImage) || '/assets/img/doctors-dashboard/doctor-profile-img.jpg'

  const didAutoOpenRef = useRef(false)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const lastMarkedReadConversationRef = useRef(null)
  const trackedConversationRef = useRef(null)
  const knownMessageIdsRef = useRef(new Set())
  const isNearMessageBottomRef = useRef(true)
  const [newIncomingMessageCount, setNewIncomingMessageCount] = useState(0)

  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef(null)

  const { data: appointmentResponse } = useAppointment(appointmentIdFromUrl)
  const appointment = useMemo(() => appointmentResponse?.data ?? appointmentResponse, [appointmentResponse])

  const getOrCreateConversation = useGetOrCreateConversation()
  const markRead = useMarkConversationRead()
  const sendMessage = useSendMessage()
  const uploadChatFiles = useUploadChatFiles()
  const markConversationComplete = useMarkConversationComplete()

  const {
    data: conversationsResponse,
    isLoading: conversationsLoading,
    error: conversationsError,
  } = useConversations(
    { limit: 50 },
    {
      refetchInterval: 5_000,
      refetchIntervalInBackground: true,
    }
  )

  const conversations = useMemo(() => {
    const payload = conversationsResponse?.data ?? conversationsResponse
    const list = payload?.conversations ?? payload?.data?.conversations
    return Array.isArray(list) ? list : []
  }, [conversationsResponse])

  const filteredConversations = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter((c) => {
      const name =
        c?.conversationType === 'ADMIN_VETERINARIAN'
          ? (c?.adminId?.name || c?.adminId?.fullName || c?.adminId?.email || '')
          : (c?.petOwnerId?.name || c?.petOwnerId?.fullName || c?.petOwnerId?.email || '')
      return String(name).toLowerCase().includes(q)
    })
  }, [conversations, searchTerm])

  const pinnedConversations = useMemo(() => filteredConversations.slice(0, 3), [filteredConversations])
  const recentConversations = useMemo(() => filteredConversations.slice(3), [filteredConversations])

  const selectedConversation = useMemo(() => {
    const existing = conversations.find((c) => String(c?._id) === String(selectedConversationId))
    if (existing || !selectedConversationId) return existing || null

    // The appointment page prepares the conversation before navigation. Keep
    // the chat usable while the conversations list catches up in the background.
    return {
      _id: selectedConversationId,
      conversationType: 'VETERINARIAN_PET_OWNER',
      veterinarianId: currentUserId,
      petOwnerId: appointment?.petOwnerId || null,
      appointmentId: appointmentIdFromUrl,
      status: 'ACTIVE',
    }
  }, [appointment, appointmentIdFromUrl, conversations, currentUserId, selectedConversationId])
  const isConversationCompleted = String(selectedConversation?.status || '').toUpperCase() === 'COMPLETED'

  const {
    data: messagesResponse,
    isLoading: messagesLoading,
    error: messagesError,
  } = useMessages(
    selectedConversationId,
    { limit: 100 },
    {
      refetchInterval: selectedConversationId ? 2000 : false,
      refetchIntervalInBackground: true,
    }
  )

  useUnreadChatCount({
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
  })

  const messages = useMemo(() => {
    const payload = messagesResponse?.data ?? messagesResponse
    const list = payload?.messages ?? payload?.data?.messages
    return Array.isArray(list) ? list : []
  }, [messagesResponse])

  useEffect(() => {
    // The appointment opener already has the conversation ID. The sidebar is
    // secondary, so a temporary list refresh failure must not interrupt chat
    // initialization with a misleading network error toast.
    if (conversationsError?.message && !appointmentIdFromUrl) toast.error(conversationsError.message)
  }, [appointmentIdFromUrl, conversationsError])

  useEffect(() => {
    if (messagesError?.message) toast.error(messagesError.message)
  }, [messagesError])

  useEffect(() => {
    if (conversationIdFromUrl && String(conversationIdFromUrl) !== String(selectedConversationId)) {
      setSelectedConversationId(conversationIdFromUrl)
    }
  }, [conversationIdFromUrl, selectedConversationId])

  const scrollToBottom = (behavior = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior,
      })
      return
    }
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'nearest' })
  }

  useEffect(() => {
    const conversationKey = String(selectedConversationId || '')
    if (!conversationKey) return

    const messageIds = new Set(messages.map((message) => String(message?._id || '')).filter(Boolean))
    if (trackedConversationRef.current !== conversationKey) {
      trackedConversationRef.current = conversationKey
      knownMessageIdsRef.current = messageIds
      setNewIncomingMessageCount(0)
      scrollToBottom('auto')
      return
    }

    const addedMessages = messages.filter((message) => {
      const id = String(message?._id || '')
      return id && !knownMessageIdsRef.current.has(id)
    })
    knownMessageIdsRef.current = messageIds
    if (addedMessages.length === 0) return

    const hasIncomingMessage = addedMessages.some((message) => {
      const senderId = message?.senderId?._id || message?.senderId
      return String(senderId || '') !== String(currentUserId || '')
    })

    if (!hasIncomingMessage || isNearMessageBottomRef.current) {
      scrollToBottom()
      return
    }

    setNewIncomingMessageCount((count) => count + addedMessages.length)
    toast.info(translate('doctorChat.newMessageReceived'), { toastId: `chat-message-${conversationKey}` })
  }, [messages, selectedConversationId, currentUserId, translate])

  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current
    if (!container) return
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    isNearMessageBottomRef.current = distanceFromBottom < 72
    if (isNearMessageBottomRef.current) setNewIncomingMessageCount(0)
  }

  const jumpToLatestMessages = () => {
    isNearMessageBottomRef.current = true
    setNewIncomingMessageCount(0)
    scrollToBottom()
  }

  const formatFileSize = (bytes) => {
    const n = Number(bytes)
    if (!Number.isFinite(n) || n <= 0) return ''
    const mb = n / (1024 * 1024)
    if (mb >= 1) return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`
    const kb = n / 1024
    return `${kb.toFixed(kb >= 10 ? 0 : 1)} KB`
  }

  const getMessageAttachments = (m) => {
    if (Array.isArray(m?.attachments) && m.attachments.length > 0) return m.attachments
    if (m?.fileUrl) {
      return [
        {
          type: 'file',
          url: m.fileUrl,
          name: m.fileName || translate('doctorCommon.file'),
          size: null,
        },
      ]
    }
    return []
  }

  const isImageAttachment = (att) => {
    const t = String(att?.type || '').toLowerCase()
    if (t === 'image') return true
    const mime = String(att?.mimeType || '').toLowerCase()
    if (mime.startsWith('image/')) return true
    const url = String(att?.url || '')
    const ext = url.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase()
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)
  }

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    if (files.length > 10) {
      toast.error(translate('doctorChat.fileLimit'))
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const maxSize = 50 * 1024 * 1024
    const oversizedFiles = files.filter((f) => f.size > maxSize)
    if (oversizedFiles.length > 0) {
      toast.error(translate('doctorChat.fileSize'))
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    if (!selectedConversationId || !selectedConversation || !currentUserId) {
      toast.error(translate('doctorChat.selectChat'))
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    if (isConversationCompleted) {
      toast.info(translate('doctorChat.completedInfo'))
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setUploadingFiles(true)
    setUploadProgress(0)
    try {
      const formData = new FormData()
      files.forEach((file) => formData.append('files', file))
      const res = await uploadChatFiles.mutateAsync({
        formData,
        onUploadProgress: (event) => {
          if (event.total) setUploadProgress(Math.round((event.loaded * 100) / event.total))
        },
      })
      const urls = res?.data?.urls || res?.urls || []
      if (!Array.isArray(urls) || urls.length !== files.length) {
        throw new Error(translate('doctorChat.uploadFailed'))
      }
      const uploaded = files.map((file, index) => ({
        type: file.type?.startsWith('image/') ? 'image' : 'file',
        url: urls[index],
        name: file.name,
        size: file.size,
        mimeType: file.type || null,
      }))

      const messageText = newMessage.trim()
      if (selectedConversation.conversationType === 'ADMIN_VETERINARIAN') {
        const adminId =
          selectedConversation?.adminId &&
          (typeof selectedConversation.adminId === 'object' ? selectedConversation.adminId._id : selectedConversation.adminId)

        await sendMessage.mutateAsync({
          conversationId: selectedConversationId,
          veterinarianId: currentUserId,
          adminId,
          type: 'FILE',
          attachments: uploaded,
          ...(messageText ? { message: messageText } : {}),
        })
      } else {
        const ownerId =
          selectedConversation?.petOwnerId &&
          (typeof selectedConversation.petOwnerId === 'object' ? selectedConversation.petOwnerId._id : selectedConversation.petOwnerId)
        const aptId =
          selectedConversation?.appointmentId &&
          (typeof selectedConversation.appointmentId === 'object' ? selectedConversation.appointmentId._id : selectedConversation.appointmentId)

        await sendMessage.mutateAsync({
          conversationId: selectedConversationId,
          veterinarianId: currentUserId,
          petOwnerId: ownerId,
          appointmentId: aptId,
          type: 'FILE',
          attachments: uploaded,
          ...(messageText ? { message: messageText } : {}),
        })
      }

      setNewMessage('')
      scrollToBottom()
    } catch (err) {
      toast.error(err?.message || translate('doctorChat.uploadFailed'))
    } finally {
      setUploadingFiles(false)
      setUploadProgress(0)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  useEffect(() => {
    if (!appointmentIdFromUrl) return
    if (didAutoOpenRef.current) return
    if (!appointment || !currentUserId) return

    // A URL that already identifies a conversation must not try to create it
    // again. This is especially important for read-only completed chats.
    if (conversationIdFromUrl) {
      didAutoOpenRef.current = true
      return
    }

    const existingConversation = conversations.find((conversation) => {
      const currentAppointmentId =
        typeof conversation?.appointmentId === 'object'
          ? conversation.appointmentId?._id
          : conversation?.appointmentId
      return String(currentAppointmentId || '') === String(appointmentIdFromUrl)
    })
    if (existingConversation?._id) {
      didAutoOpenRef.current = true
      setSelectedConversationId(existingConversation._id)
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('conversationId', String(existingConversation._id))
        next.set('appointmentId', String(appointmentIdFromUrl))
        return next
      })
      return
    }

    const ownerId = appointment?.petOwnerId && (typeof appointment.petOwnerId === 'object' ? appointment.petOwnerId._id : appointment.petOwnerId)
    const aptId = appointment?._id
    if (!ownerId || !aptId) return

    let stopped = false
    let lastError = ''
    let opening = false

    const tryOpen = async () => {
      if (stopped || didAutoOpenRef.current || opening) return
      opening = true
      try {
        const res = await getOrCreateConversation.mutateAsync({ veterinarianId: currentUserId, petOwnerId: ownerId, appointmentId: aptId })
        const payload = res?.data ?? res
        const conv = payload?.data ?? payload
        const convId = conv?._id
        if (!convId) return

        didAutoOpenRef.current = true
        setSelectedConversationId(convId)
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev)
          next.set('conversationId', String(convId))
          next.set('appointmentId', String(aptId))
          return next
        })
      } catch (err) {
        const msg = err?.message || translate('doctorChat.opening')
        const isTimeWindow =
          msg.includes('Communication will be available') ||
          msg.includes('appointment time') ||
          msg.includes('window')
        if (!isTimeWindow && msg !== lastError) {
          lastError = msg
          toast.error(msg)
        }
      } finally {
        opening = false
      }
    }

    tryOpen()
    const interval = window.setInterval(tryOpen, 15_000)

    return () => {
      stopped = true
      window.clearInterval(interval)
    }
  }, [
    appointmentIdFromUrl,
    appointment,
    conversationIdFromUrl,
    conversations,
    conversationsLoading,
    currentUserId,
    getOrCreateConversation,
    setSearchParams,
  ])

  useEffect(() => {
    if (!selectedConversationId) return
    if (lastMarkedReadConversationRef.current === String(selectedConversationId)) return

    const unread = selectedConversation?.unreadCount || 0
    if (unread <= 0) {
      lastMarkedReadConversationRef.current = String(selectedConversationId)
      return
    }

    lastMarkedReadConversationRef.current = String(selectedConversationId)
    markRead.mutate(selectedConversationId)
  }, [selectedConversationId])

  const formatConversationTime = (c) => {
    const dt = c?.lastMessageAt || c?.updatedAt || c?.createdAt
    if (!dt) return ''
    const d = new Date(dt)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleString(language === 'it' ? 'it-IT' : 'en-GB', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  const getConversationPeer = (c) => {
    if (!c) return null
    return c.conversationType === 'ADMIN_VETERINARIAN' ? c.adminId : c.petOwnerId
  }

  const handleSelectConversation = (c) => {
    const id = c?._id
    if (!id) return
    setSelectedConversationId(id)
    setIsMobileConversationOpen(true)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('conversationId', String(id))
      const aptId = c?.appointmentId && (typeof c.appointmentId === 'object' ? c.appointmentId._id : c.appointmentId)
      if (aptId) next.set('appointmentId', String(aptId))
      return next
    })
  }

  const handleSend = async () => {
    if (sendMessage.isPending || uploadingFiles) return

    const text = newMessage.trim()
    if (!text) {
      toast.error(translate('doctorChat.enterMessage'))
      return
    }
    if (!selectedConversationId || !selectedConversation || !currentUserId) {
      toast.error(translate('doctorChat.selectChat'))
      return
    }
    if (isConversationCompleted) {
      toast.info(translate('doctorChat.completedInfo'))
      return
    }

    try {
      if (selectedConversation.conversationType === 'ADMIN_VETERINARIAN') {
        const adminId = selectedConversation?.adminId && (typeof selectedConversation.adminId === 'object' ? selectedConversation.adminId._id : selectedConversation.adminId)
        await sendMessage.mutateAsync({
          conversationId: selectedConversationId,
          veterinarianId: currentUserId,
          adminId,
          message: text,
          type: 'TEXT',
        })
      } else {
        const ownerId = selectedConversation?.petOwnerId && (typeof selectedConversation.petOwnerId === 'object' ? selectedConversation.petOwnerId._id : selectedConversation.petOwnerId)
        const aptId = selectedConversation?.appointmentId && (typeof selectedConversation.appointmentId === 'object' ? selectedConversation.appointmentId._id : selectedConversation.appointmentId)
        await sendMessage.mutateAsync({
          conversationId: selectedConversationId,
          veterinarianId: currentUserId,
          petOwnerId: ownerId,
          appointmentId: aptId,
          message: text,
          type: 'TEXT',
        })
      }
      setNewMessage('')
      scrollToBottom()
    } catch (err) {
      toast.error(err?.message || translate('doctorChat.sendFailed'))
    }
  }

  const handleMarkComplete = async () => {
    if (!selectedConversationId) return
    if (!window.confirm(translate('doctorChat.completeConfirm'))) return
    try {
      await markConversationComplete.mutateAsync(selectedConversationId)
      toast.success(translate('doctorChat.completedSuccess'))
    } catch (err) {
      toast.error(err?.message || translate('doctorChat.completeFailed'))
    }
  }

  const handleMessageKeyDown = (event) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    handleSend()
  }

  return (
    <>
      <style>{`
        .doctor-chat-wrapper {
          padding-top: 68px;
          min-height: 100vh;
          background: #f5f5f5;
        }
        .doctor-chat-wrapper .container {
          max-width: 100%;
          padding: 24px;
        }
        .doctor-chat-container {
          display: flex;
          gap: 24px;
          height: calc(100vh - 192px);
          max-height: calc(100vh - 192px);
        }
        .chat-list-sidebar {
          width: 400px;
          flex-shrink: 0;
          background: #fff;
          border: 1px solid #e5e5e5;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .chat-list-header {
          padding: 12px;
          border-bottom: 1px solid #e5e5e5;
        }
        .chat-list-header h4 {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 11px;
          color: #0A0A0A;
        }
        .chat-search-box {
          position: relative;
        }
        .chat-search-box .form-control-feedback {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #999;
        }
        .chat-search-box input {
          width: 100%;
          padding: 8px 12px 8px 35px;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          font-size: 14px;
        }
        .chat-list-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 0 12px;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .section-header h6 {
          font-size: 14px;
          font-weight: 600;
          color: #0A0A0A;
          margin: 0;
        }
        .section-header a {
          font-size: 12px;
          color: #0A0A0A;
          text-decoration: none;
        }
        .pinned-chat-section, .recent-chat-section {
          padding: 16px 0;
        }
        .chat-item {
          display: flex;
          align-items: flex-start;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 4px;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
        }
        .chat-item:hover {
          background: #f5f5f5;
        }
        .chat-item-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          margin-right: 12px;
          flex-shrink: 0;
          position: relative;
        }
        .chat-item-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }
        .chat-item-avatar .online-dot {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 12px;
          height: 12px;
          background: #4CAF50;
          border: 2px solid #fff;
          border-radius: 50%;
        }
        .chat-item-content {
          flex: 1;
          min-width: 0;
        }
        .chat-item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 4px;
        }
        .chat-item-name {
          font-size: 15px;
          font-weight: 600;
          color: #0A0A0A;
          margin: 0;
        }
        .chat-item-time {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #999;
        }
        .chat-item-message {
          font-size: 14px;
          color: #666;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .chat-item-icons {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .chat-item-icons i {
          font-size: 12px;
          color: #999;
        }
        .chat-item-icons .green-check {
          color: #4CAF50;
        }
        .chat-details-area {
          flex: 1;
          background: #fff;
          border: 1px solid #e5e5e5;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
        }
        .chat-details-header {
          padding: 15px;
          border-bottom: 1px solid #e5e5e5;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }
        .chat-details-user {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .chat-details-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          position: relative;
        }
        .chat-details-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }
        .chat-details-avatar .online-dot {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 10px;
          height: 10px;
          background: #4CAF50;
          border: 2px solid #fff;
          border-radius: 50%;
        }
        .chat-details-user-info h5 {
          font-size: 18px;
          font-weight: 600;
          color: #0A0A0A;
          margin: 0 0 2px 0;
        }
        .chat-details-user-info small {
          font-size: 12px;
          color: #4CAF50;
        }
        .chat-details-actions {
          display: flex;
          gap: 8px;
        }
        .chat-details-actions button {
          width: 30px;
          height: 30px;
          border: none;
          background: transparent;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .chat-details-actions button:hover {
          background: #f5f5f5;
        }
        .chat-details-actions .mark-complete-btn {
          width: auto;
          padding: 0 10px;
          gap: 5px;
          color: #198754;
          border: 1px solid #198754;
          font-size: 12px;
          font-weight: 600;
        }
        .chat-details-actions .mark-complete-btn:hover {
          background: #eaf7ef;
        }
        .chat-details-actions .mark-complete-btn:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }
        .chat-messages-area {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 24px;
          padding-bottom: 40px;
          min-height: 0;
        }
        .chat-date-separator {
          text-align: center;
          margin: 20px 0;
          position: relative;
        }
        .chat-date-separator::before {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          height: 1px;
          background: #e5e5e5;
        }
        .chat-date-separator span {
          background: #fff;
          padding: 0 12px;
          position: relative;
          color: #999;
          font-size: 12px;
        }
        .chat-message {
          display: flex;
          margin-bottom: 24px;
          max-width: 75%;
        }
        .chat-message.incoming {
          align-self: flex-start;
        }
        .chat-message.outgoing {
          align-self: flex-end;
          flex-direction: row-reverse;
          margin-left: auto;
        }
        .chat-message-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          flex-shrink: 0;
          margin: 0 8px;
        }
        .chat-message-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }
        .chat-message-content {
          flex: 1;
        }
        .chat-message-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        .chat-message-header h6 {
          font-size: 14px;
          font-weight: 600;
          color: #0A0A0A;
          margin: 0;
        }
        .chat-message-header span {
          font-size: 12px;
          color: #999;
        }
        .chat-message-bubble {
          background: #f5f5f5;
          border-radius: 0 15px 15px 15px;
          padding: 14px 20px;
          font-size: 14px;
          color: #0A0A0A;
        }
        .chat-message.outgoing .chat-message-bubble {
          border-radius: 15px 0 15px 15px;
          background: #e3f2fd;
        }
        .chat-message-bubble a {
          color: #666;
          word-wrap: break-word;
        }
        .chat-message-bubble img {
          max-width: 100%;
          border-radius: 10px;
          margin-top: 8px;
        }
        .chat-attachments {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 10px;
        }
        .chat-file-attachment {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 12px;
          border: 1px solid #e5e5e5;
          border-radius: 10px;
          text-decoration: none;
          background: #fff;
          color: #0A0A0A;
        }
        .chat-file-attachment .meta {
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        .chat-file-attachment .name {
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 260px;
        }
        .chat-file-attachment .size {
          font-size: 12px;
          color: #666;
        }
        .audio-message {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .audio-message button {
          width: 32px;
          height: 32px;
          border: none;
          background: #2196F3;
          border-radius: 50%;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .audio-waveform {
          flex: 1;
          height: 20px;
          background: #e0e0e0;
          border-radius: 10px;
        }
        .chat-input-area {
          padding: 15px;
          border-top: 1px solid #e5e5e5;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
          background: #fff;
        }
        .new-chat-messages-button {
          align-self: center;
          border: 0;
          border-radius: 999px;
          background: #2196F3;
          color: #fff;
          font-size: 12px;
          font-weight: 600;
          padding: 7px 14px;
          margin: 8px auto -2px;
          box-shadow: 0 3px 10px rgba(33, 150, 243, 0.3);
        }
        .chat-upload-status {
          color: #6c757d;
          font-size: 12px;
          margin-left: 8px;
          white-space: nowrap;
        }
        .chat-input-actions {
          display: flex;
          gap: 8px;
        }
        .chat-input-actions button {
          width: 36px;
          height: 36px;
          border: none;
          background: transparent;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
        }
        .chat-input-actions button:hover {
          background: #f5f5f5;
        }
        .chat-input-field {
          flex: 1;
          padding: 10px 16px;
          border: 1px solid #e5e5e5;
          border-radius: 24px;
          font-size: 14px;
        }
        .chat-send-button {
          width: 40px;
          height: 40px;
          border: none;
          background: #2196F3;
          border-radius: 50%;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .chat-send-button:hover {
          background: #1976D2;
        }
        @media (max-width: 991px) {
          .doctor-chat-container {
            flex-direction: column;
            height: auto;
          }
          .chat-list-sidebar {
            width: 100%;
            max-height: 400px;
          }
          .chat-details-area {
            display: none;
          }
          .chat-details-area.show {
            display: flex;
          }
        }
      `}</style>
      <div className="page-wrapper chat-page-wrapper doctor-chat-wrapper">
        <div className="container">
          <div className="content doctor-content">
            <div className={`doctor-chat-container${isMobileConversationOpen ? ' mobile-chat-detail-open' : ''}`}>
              {/* Left Sidebar - Chat List */}
              <div className="chat-list-sidebar">
                <div className="chat-list-header">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/appointments')}>
                      <i className="fa-solid fa-chevron-left me-1"></i> {translate('doctorChat.back')}
                    </button>
                    <h4 className="mb-0">{translate('doctorChat.allChats')}</h4>
                  </div>
                  <div className="chat-search-box">
                    <span className="form-control-feedback">
                      <i className="fa-solid fa-magnifying-glass"></i>
                    </span>
                    <input
                      type="text"
                      placeholder={translate('doctorChat.search')}
                      className="form-control"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="chat-list-content">
                  {/* Pinned Chat Section */}
                  <div className="pinned-chat-section">
                    <div className="section-header">
                      <h6>{translate('doctorChat.pinned')}</h6>
                    </div>
                    {conversationsLoading ? (
                      <div className="text-center py-3 text-muted">{translate('doctorChat.loading')}</div>
                    ) : pinnedConversations.length === 0 ? (
                      <div className="text-center py-3 text-muted">{translate('doctorChat.noChats')}</div>
                    ) : (
                      pinnedConversations.map((c) => {
                        const peer = getConversationPeer(c)
                        const name = peer?.name || peer?.fullName || peer?.email || translate('doctorChat.user')
                        const avatar = getImageUrl(peer?.profileImage) || '/assets/img/doctors-dashboard/profile-06.jpg'
                        const preview = c?.lastMessage?.message || c?.lastMessage?.fileName || '—'
                        const time = formatConversationTime(c)
                        const unread = c?.unreadCount || 0
                        const isActive = String(c?._id) === String(selectedConversationId)

                        return (
                          <a
                            key={c._id}
                            href="javascript:void(0);"
                            className={`chat-item${isActive ? ' active' : ''}`}
                            onClick={(e) => {
                              e.preventDefault()
                              handleSelectConversation(c)
                            }}
                          >
                            <div className="chat-item-avatar">
                                <img src={avatar} alt={translate('doctorChat.avatar')} />
                            </div>
                            <div className="chat-item-content">
                              <div className="chat-item-header">
                                <h5 className="chat-item-name">{name}</h5>
                                <div className="chat-item-time">
                                  <small>{time}</small>
                                  {unread > 0 && (
                                    <div
                                      className="chat-item-icons"
                                      style={{
                                        background: '#2196F3',
                                        color: '#fff',
                                        borderRadius: '50%',
                                        width: '20px',
                                        height: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '10px',
                                      }}
                                    >
                                      {unread}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <p className="chat-item-message">{preview}</p>
                            </div>
                          </a>
                        )
                      })
                    )}
                  </div>

                  {/* Recent Chat Section */}
                  <div className="recent-chat-section">
                    <div className="section-header">
                      <h6>{translate('doctorChat.recent')}</h6>
                    </div>
                    {conversationsLoading ? (
                      <div className="text-center py-3 text-muted">{translate('doctorChat.loading')}</div>
                    ) : recentConversations.length === 0 ? (
                      <div className="text-center py-3 text-muted">{translate('doctorChat.noMoreChats')}</div>
                    ) : (
                      recentConversations.map((c) => {
                        const peer = getConversationPeer(c)
                        const name = peer?.name || peer?.fullName || peer?.email || translate('doctorChat.user')
                        const avatar = getImageUrl(peer?.profileImage) || '/assets/img/doctors-dashboard/profile-06.jpg'
                        const preview = c?.lastMessage?.message || c?.lastMessage?.fileName || '—'
                        const time = formatConversationTime(c)
                        const unread = c?.unreadCount || 0
                        const isActive = String(c?._id) === String(selectedConversationId)

                        return (
                          <a
                            key={c._id}
                            href="javascript:void(0);"
                            className={`chat-item${isActive ? ' active' : ''}`}
                            onClick={(e) => {
                              e.preventDefault()
                              handleSelectConversation(c)
                            }}
                          >
                            <div className="chat-item-avatar">
                                <img src={avatar} alt={translate('doctorChat.avatar')} />
                            </div>
                            <div className="chat-item-content">
                              <div className="chat-item-header">
                                <h5 className="chat-item-name">{name}</h5>
                                <div className="chat-item-time">
                                  <small>{time}</small>
                                  {unread > 0 && (
                                    <div
                                      className="chat-item-icons"
                                      style={{
                                        background: '#2196F3',
                                        color: '#fff',
                                        borderRadius: '50%',
                                        width: '20px',
                                        height: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '10px',
                                      }}
                                    >
                                      {unread}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <p className="chat-item-message">{preview}</p>
                            </div>
                          </a>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Right Area - Chat Details */}
              <div className="chat-details-area">
                {selectedConversation ? (
                  <>
                    <div className="chat-details-header">
                      <button
                        type="button"
                        className="chat-mobile-back-button"
                        onClick={() => setIsMobileConversationOpen(false)}
                        aria-label={translate('doctorChat.backToChats')}
                      >
                        <i className="fa-solid fa-arrow-left"></i>
                      </button>
                      <div className="chat-details-user">
                        <div className="chat-details-avatar">
                          <img
                            src={
                              getImageUrl(getConversationPeer(selectedConversation)?.profileImage) ||
                              '/assets/img/doctors-dashboard/profile-06.jpg'
                            }
                            alt={translate('doctorChat.user')}
                          />
                        </div>
                        <div className="chat-details-user-info">
                          <h5>
                            {getConversationPeer(selectedConversation)?.name ||
                              getConversationPeer(selectedConversation)?.fullName ||
                              getConversationPeer(selectedConversation)?.email ||
                              translate('doctorChat.user')}
                          </h5>
                        </div>
                      </div>
                      <div className="chat-details-actions">
                        <button type="button" title={translate('doctorChat.searchAction')} aria-label={translate('doctorChat.searchAction')}>
                          <i className="fa-solid fa-magnifying-glass"></i>
                        </button>
                        <button type="button" title={translate('doctorChat.moreOptions')} aria-label={translate('doctorChat.moreOptions')}>
                          <i className="fa-solid fa-ellipsis-vertical"></i>
                        </button>
                        {selectedConversation?.conversationType === 'VETERINARIAN_PET_OWNER' &&
                          selectedConversation?.status !== 'COMPLETED' && (
                            <button
                              type="button"
                              title={translate('doctorChat.markCompleted')}
                              aria-label={translate('doctorChat.markCompleted')}
                              className="mark-complete-btn"
                              onClick={handleMarkComplete}
                              disabled={markConversationComplete.isPending}
                            >
                              <i className="fa-solid fa-check-circle"></i>
                              <span>{translate('doctorChat.markComplete')}</span>
                            </button>
                          )}
                      </div>
                    </div>

                    {isConversationCompleted && (
                      <div className="alert alert-secondary rounded-0 mb-0 py-2 px-3" role="status">
                        {translate('doctorChat.completedNotice')}
                      </div>
                    )}

                    <div className="chat-messages-area" ref={messagesContainerRef} onScroll={handleMessagesScroll}>
                      {messagesLoading ? (
                        <div className="text-center py-3 text-muted">{translate('doctorChat.loading')}</div>
                      ) : messages.length === 0 ? (
                        <div className="text-center py-3 text-muted">{translate('doctorChat.noMessages')}</div>
                      ) : (
                        messages.map((m) => {
                          const sender = m?.senderId
                          const senderId = sender?._id
                          const isOutgoing = currentUserId && senderId && String(senderId) === String(currentUserId)
                          const senderName = sender?.name || sender?.fullName || sender?.email || translate('doctorChat.user')
                          const senderAvatar = getImageUrl(sender?.profileImage) || (isOutgoing ? currentUserImage : '/assets/img/doctors-dashboard/profile-06.jpg')
                          const t = m?.createdAt ? new Date(m.createdAt) : null
                          const time = t && !Number.isNaN(t.getTime()) ? t.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : ''
                          const body = m?.message || ''
                          const attachments = getMessageAttachments(m)

                          return (
                            <div key={m._id} className={`chat-message ${isOutgoing ? 'outgoing' : 'incoming'}`}>
                              <div className="chat-message-avatar">
                                <img src={senderAvatar} alt={translate('doctorChat.avatar')} />
                              </div>
                              <div className="chat-message-content">
                                <div
                                  className="chat-message-header"
                                  style={isOutgoing ? { justifyContent: 'flex-end' } : undefined}
                                >
                                  <h6>{senderName}</h6>
                                  <span>{time}</span>
                                </div>
                                <div className="chat-message-bubble">
                                  {body}
                                  {attachments.length > 0 && (
                                    <div className="chat-attachments">
                                      {attachments.map((att, idx) => {
                                        const url = getImageUrl(att?.url)
                                        const name = att?.name || att?.fileName || translate('doctorCommon.file')
                                        const size = formatFileSize(att?.size)
                                        const isImg = isImageAttachment(att)

                                        if (isImg) {
                                          return (
                                            <a key={`${m._id}-att-${idx}`} href={url} target="_blank" rel="noreferrer">
                                              <img src={url} alt={name} />
                                            </a>
                                          )
                                        }

                                        return (
                                          <a
                                            key={`${m._id}-att-${idx}`}
                                            href={url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="chat-file-attachment"
                                          >
                                            <div className="meta">
                                              <span className="name">{name}</span>
                                              {size ? <span className="size">{size}</span> : null}
                                            </div>
                                            <i className="fa-solid fa-download"></i>
                                          </a>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {newIncomingMessageCount > 0 && (
                      <button type="button" className="new-chat-messages-button" onClick={jumpToLatestMessages}>
                        <i className="fa-solid fa-arrow-down"></i>
                        {translate('doctorChat.newMessage', { count: newIncomingMessageCount, label: translate(newIncomingMessageCount === 1 ? 'doctorChat.message' : 'doctorChat.messages') })}
                      </button>
                    )}

                    {/* Chat Input Area */}
                    <div className="chat-input-area">
                      <div className="chat-input-actions">
                        <button
                          type="button"
                          title={translate('doctorChat.attach')}
                          aria-label={translate('doctorChat.attach')}
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingFiles || sendMessage.isPending || isConversationCompleted}
                        >
                          <i className="fa-solid fa-paperclip"></i>
                        </button>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="*/*"
                        multiple
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                      />
                      <input
                        type="text"
                        className="chat-input-field"
                        placeholder={isConversationCompleted ? translate('doctorChat.completedPlaceholder') : translate('doctorChat.messagePlaceholder')}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleMessageKeyDown}
                        disabled={uploadingFiles || isConversationCompleted}
                      />
                      <button
                        type="button"
                        className="chat-send-button"
                        title={translate('doctorChat.send')}
                        aria-label={translate('doctorChat.send')}
                        onClick={handleSend}
                        disabled={!newMessage.trim() || sendMessage.isPending || uploadingFiles || isConversationCompleted}
                      >
                        <i className="fa-solid fa-paper-plane"></i>
                      </button>
                      {uploadingFiles && <span className="chat-upload-status">{translate('doctorChat.upload', { progress: uploadProgress })}</span>}
                    </div>
                  </>
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted flex-column gap-2">
                    {appointmentIdFromUrl && !conversationIdFromUrl ? <><i className="fa-solid fa-spinner fa-spin" />{translate('doctorChat.opening')}</> : translate('doctorChat.selectConversation')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default DoctorChat
