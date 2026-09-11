import { useMemo, useRef, useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { useAuth } from '../../contexts/AuthContext'
import { useAppointment, useConversations, useMessages, useUnreadChatCount } from '../../queries'
import { useGetOrCreateConversation, useMarkConversationRead, useSendMessage, useUploadChatFiles } from '../../mutations'
import { getImageUrl } from '../../utils/apiConfig'
import { useLanguage } from '../../contexts/LanguageContext'

const isPetSitterConversation = (conversation) => conversation?.conversationType === 'PET_SITTER_PET_OWNER'

const getConversationParticipant = (conversation) => {
  if (isPetSitterConversation(conversation)) return conversation?.petSitterId
  const veterinarian = conversation?.veterinarianId
  return veterinarian?.userId || veterinarian
}

const Chat = () => {
  const { user } = useAuth()
  const { t: translate } = useLanguage()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const conversationIdFromUrl = searchParams.get('conversationId')
  const appointmentIdFromUrl = searchParams.get('appointmentId')
  const petSitterIdFromUrl = searchParams.get('petSitterId')

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedConversationId, setSelectedConversationId] = useState(conversationIdFromUrl || '')
  const [isMobileConversationOpen, setIsMobileConversationOpen] = useState(false)
  const [newMessage, setNewMessage] = useState('')

  const currentUserId = user?.id || user?._id
  const currentUserImage = getImageUrl(user?.profileImage) || '/assets/img/doctors-dashboard/profile-06.jpg'

  const didAutoOpenRef = useRef(false)
  const didAutoOpenPetSitterRef = useRef(false)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [pendingFiles, setPendingFiles] = useState([])
  const [pendingFilePreviews, setPendingFilePreviews] = useState([])
  const fileInputRef = useRef(null)

  const { data: appointmentResponse } = useAppointment(appointmentIdFromUrl)
  const appointment = useMemo(() => appointmentResponse?.data ?? appointmentResponse, [appointmentResponse])

  const getOrCreateConversation = useGetOrCreateConversation()
  const markRead = useMarkConversationRead()
  const sendMessage = useSendMessage()
  const uploadChatFiles = useUploadChatFiles()

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
      const participant = getConversationParticipant(c)
      const name = (participant?.name || participant?.fullName || participant?.email || '').toLowerCase()
      return name.includes(q)
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
      conversationType: petSitterIdFromUrl && !appointmentIdFromUrl ? 'PET_SITTER_PET_OWNER' : 'VETERINARIAN_PET_OWNER',
      veterinarianId: petSitterIdFromUrl && !appointmentIdFromUrl ? null : appointment?.veterinarianId || null,
      petSitterId: petSitterIdFromUrl && !appointmentIdFromUrl ? petSitterIdFromUrl : null,
      petOwnerId: currentUserId,
      appointmentId: petSitterIdFromUrl && !appointmentIdFromUrl ? null : appointmentIdFromUrl,
      status: 'ACTIVE',
    }
  }, [appointment, appointmentIdFromUrl, conversations, currentUserId, petSitterIdFromUrl, selectedConversationId])
  const isConversationCompleted = String(selectedConversation?.status || '').toUpperCase() === 'COMPLETED'

  useEffect(() => {
    const previews = pendingFiles.map((file) => ({
      file,
      url: file.type?.startsWith('image/') ? URL.createObjectURL(file) : null,
    }))
    setPendingFilePreviews(previews)

    return () => {
      previews.forEach((preview) => {
        if (preview.url) URL.revokeObjectURL(preview.url)
      })
    }
  }, [pendingFiles])

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
    refetchInterval: 10_000,
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
    if (conversationsError?.message && !appointmentIdFromUrl) {
      toast.error(conversationsError.message)
    }
  }, [appointmentIdFromUrl, conversationsError])

  useEffect(() => {
    if (messagesError?.message) {
      toast.error(messagesError.message)
    }
  }, [messagesError])

  const formatConversationTime = (c) => {
    const dt = c?.lastMessageAt || c?.updatedAt || c?.createdAt
    if (!dt) return ''
    const d = new Date(dt)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleString(undefined, {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleSelectConversation = (c) => {
    const id = c?._id
    if (!id) return
    setPendingFiles([])
    setSelectedConversationId(id)
    setIsMobileConversationOpen(true)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('conversationId', String(id))
      const aptId = c?.appointmentId && (typeof c.appointmentId === 'object' ? c.appointmentId._id : c.appointmentId)
      if (aptId) next.set('appointmentId', String(aptId))
      else next.delete('appointmentId')
      if (isPetSitterConversation(c)) next.set('petSitterId', String(c?.petSitterId?._id || c?.petSitterId || ''))
      else next.delete('petSitterId')
      return next
    })
  }

  const handleSend = async () => {
    if (sendMessage.isPending || uploadingFiles) return

    if (isConversationCompleted) {
      toast.info(translate('patient.chat.completed'))
      return
    }

    const text = newMessage.trim()
    if (!text && !pendingFiles.length) {
      toast.error(translate('patient.chat.enterMessage'))
      return
    }
    if (!selectedConversationId || !selectedConversation) {
      toast.error(translate('patient.chat.chooseChat'))
      return
    }

    const petSitterChat = isPetSitterConversation(selectedConversation)
    const vetId = selectedConversation?.veterinarianId && (typeof selectedConversation.veterinarianId === 'object' ? selectedConversation.veterinarianId._id : selectedConversation.veterinarianId)
    const petSitterId = selectedConversation?.petSitterId && (typeof selectedConversation.petSitterId === 'object' ? selectedConversation.petSitterId._id : selectedConversation.petSitterId)
    const ownerId = selectedConversation?.petOwnerId && (typeof selectedConversation.petOwnerId === 'object' ? selectedConversation.petOwnerId._id : selectedConversation.petOwnerId)
    const aptId = selectedConversation?.appointmentId && (typeof selectedConversation.appointmentId === 'object' ? selectedConversation.appointmentId._id : selectedConversation.appointmentId)

    if (petSitterChat && (!petSitterId || !ownerId)) {
      toast.error(translate('patient.chat.invalidPetSitter', 'Invalid Pet Sitter conversation details'))
      return
    }
    if (!petSitterChat && (!vetId || !ownerId || !aptId)) {
      toast.error(translate('patient.chat.invalidConversation', 'Invalid conversation details'))
      return
    }

    try {
      let attachments = []
      if (pendingFiles.length) {
        setUploadingFiles(true)
        setUploadProgress(0)
        const formData = new FormData()
        pendingFiles.forEach((file) => formData.append('files', file))
        const response = await uploadChatFiles.mutateAsync({
          formData,
          onUploadProgress: (event) => {
            if (event.total) setUploadProgress(Math.round((event.loaded * 100) / event.total))
          },
        })
        const uploadPayload = response?.data?.data ?? response?.data ?? response
        const urls = uploadPayload?.urls || response?.urls || []
        if (!Array.isArray(urls) || urls.length !== pendingFiles.length) {
          throw new Error('One or more files could not be uploaded')
        }
        attachments = pendingFiles.map((file, index) => ({
          type: file.type?.startsWith('image/') ? 'image' : 'file',
          url: urls[index],
          name: file.name,
          size: file.size,
          mimeType: file.type || null,
        }))
      }

      const payload = petSitterChat
        ? { conversationId: selectedConversationId, petSitterId, petOwnerId: ownerId, message: text || undefined, type: attachments.length ? 'FILE' : 'TEXT', attachments }
        : { conversationId: selectedConversationId, veterinarianId: vetId, petOwnerId: ownerId, appointmentId: aptId, message: text || undefined, type: attachments.length ? 'FILE' : 'TEXT', attachments }
      await sendMessage.mutateAsync(payload)
      setNewMessage('')
      setPendingFiles([])
      setUploadProgress(0)
      scrollToBottom()
    } catch (err) {
      toast.error(err?.message || translate('patient.chat.sendFailed'))
    } finally {
      setUploadingFiles(false)
      setUploadProgress(0)
    }
  }

  useEffect(() => {
    if (conversationIdFromUrl && String(conversationIdFromUrl) !== String(selectedConversationId)) {
      setSelectedConversationId(conversationIdFromUrl)
    }
  }, [conversationIdFromUrl, selectedConversationId])

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
      return
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
          name: m.fileName || 'File',
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

  const handleFileSelect = (e) => {
    if (isConversationCompleted) {
      toast.info(translate('patient.chat.completed'))
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    if (pendingFiles.length + files.length > 10) {
      toast.error(translate('patient.chat.fileLimit'))
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const maxSize = 50 * 1024 * 1024
    const oversizedFiles = files.filter((f) => f.size > maxSize)
    if (oversizedFiles.length > 0) {
      toast.error(translate('patient.chat.fileSize'))
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    if (!selectedConversationId || !selectedConversation) {
      toast.error(translate('patient.chat.chooseChat'))
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setPendingFiles((current) => [...current, ...files])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removePendingFile = (index) => {
    setPendingFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))
  }

  useEffect(() => {
    if (!petSitterIdFromUrl || appointmentIdFromUrl || !currentUserId || conversationsLoading || didAutoOpenPetSitterRef.current) return

    const existingConversation = conversations.find((conversation) => {
      if (!isPetSitterConversation(conversation)) return false
      const sitterId = typeof conversation.petSitterId === 'object' ? conversation.petSitterId?._id : conversation.petSitterId
      const ownerId = typeof conversation.petOwnerId === 'object' ? conversation.petOwnerId?._id : conversation.petOwnerId
      return String(sitterId || '') === String(petSitterIdFromUrl) && String(ownerId || currentUserId) === String(currentUserId)
    })

    const openConversation = async () => {
      try {
        const response = existingConversation
          ? existingConversation
          : await getOrCreateConversation.mutateAsync({ petSitterId: petSitterIdFromUrl, petOwnerId: currentUserId })
        const payload = response?.data ?? response
        const conversation = payload?.data ?? payload
        if (!conversation?._id) throw new Error(translate('patient.chat.openPetSitterFailed'))
        didAutoOpenPetSitterRef.current = true
        setSelectedConversationId(conversation._id)
        setIsMobileConversationOpen(true)
        setSearchParams((previous) => {
          const next = new URLSearchParams(previous)
          next.set('conversationId', String(conversation._id))
          next.set('petSitterId', String(petSitterIdFromUrl))
          return next
        })
      } catch (error) {
        toast.error(error?.message || translate('patient.chat.openPetSitterFailed', 'Unable to open Pet Sitter chat'))
      }
    }

    openConversation()
  }, [appointmentIdFromUrl, conversations, conversationsLoading, currentUserId, getOrCreateConversation, petSitterIdFromUrl, setSearchParams])

  useEffect(() => {
    if (!appointmentIdFromUrl) return
    if (didAutoOpenRef.current) return
    if (!appointment) return

    // Appointment buttons prepare the conversation before navigation. Do not
    // issue a second create request when the URL already contains its ID.
    if (conversationIdFromUrl) {
      didAutoOpenRef.current = true
      return
    }

    const vetId = appointment?.veterinarianId && (typeof appointment.veterinarianId === 'object' ? appointment.veterinarianId._id : appointment.veterinarianId)
    const ownerId = appointment?.petOwnerId && (typeof appointment.petOwnerId === 'object' ? appointment.petOwnerId._id : appointment.petOwnerId)
    const aptId = appointment?._id
    if (!vetId || !ownerId || !aptId) return

    let stopped = false
    let lastError = ''
    let opening = false

    const tryOpen = async () => {
      if (stopped || didAutoOpenRef.current || opening) return
      opening = true
      try {
        const res = await getOrCreateConversation.mutateAsync({ veterinarianId: vetId, petOwnerId: ownerId, appointmentId: aptId })
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
        const msg = err?.message || 'Unable to open chat for this appointment'
        // If it's a time-window error, keep retrying silently.
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

    // Try immediately, then retry until the window opens.
    tryOpen()
    const interval = window.setInterval(tryOpen, 15_000)

    return () => {
      stopped = true
      window.clearInterval(interval)
    }
  }, [appointmentIdFromUrl, appointment, getOrCreateConversation, setSearchParams])

  useEffect(() => {
    if (!selectedConversationId) return
    const unread = selectedConversation?.unreadCount || 0
    if (unread <= 0) return
    markRead.mutate(selectedConversationId)
  }, [markRead, selectedConversation?.unreadCount, selectedConversationId])

  const handleMessageKeyDown = (event) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    handleSend()
  }

  return (
    <>
      <style>{`
        .patient-chat-wrapper {
          padding-top: 68px;
          min-height: 100vh;
          background: #f5f5f5;
        }
        .patient-chat-wrapper .container {
          max-width: 100%;
          padding: 24px;
        }
        .patient-chat-container {
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
          .patient-chat-container {
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
      <div className="page-wrapper chat-page-wrapper patient-chat-wrapper">
        <div className="container">
          <div className="content doctor-content">
            <div className={`patient-chat-container${isMobileConversationOpen ? ' mobile-chat-detail-open' : ''}`}>
              {/* Left Sidebar - Chat List */}
              <div className="chat-list-sidebar">
                <div className="chat-list-header">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/patient-appointments')}>
                      <i className="fa-solid fa-chevron-left me-1"></i> {translate('patient.back')}
                    </button>
                    <h4 className="mb-0">{translate('patient.chat.allChats')}</h4>
                  </div>
                  <div className="chat-search-box">
                    <span className="form-control-feedback">
                      <i className="fa-solid fa-magnifying-glass"></i>
                    </span>
                    <input
                      type="text"
                      placeholder={translate('patient.chat.search')}
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
                      <h6>{translate('patient.chat.pinned')}</h6>
                    </div>
                    {conversationsLoading ? (
                      <div className="text-center py-3 text-muted">{translate('common.loading')}</div>
                    ) : pinnedConversations.length === 0 ? (
                      <div className="text-center py-3 text-muted">{translate('patient.chat.noChats')}</div>
                    ) : (
                      pinnedConversations.map((c) => {
                        const participant = getConversationParticipant(c)
                        const name = participant?.name || participant?.fullName || participant?.email || (isPetSitterConversation(c) ? translate('patient.chat.petSitter') : translate('patient.appointment.veterinarian'))
                        const avatar = getImageUrl(participant?.profileImage) || '/assets/img/doctors-dashboard/doctor-profile-img.jpg'
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
                              <img src={avatar} alt="Avatar" />
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
                              <p className="chat-item-message">{isPetSitterConversation(c) ? translate('patient.chat.petSitterPrefix') : ''}{preview}</p>
                            </div>
                          </a>
                        )
                      })
                    )}
                  </div>

                  {/* Recent Chat Section */}
                  <div className="recent-chat-section">
                    <div className="section-header">
                      <h6>{translate('patient.chat.recent')}</h6>
                    </div>
                    {conversationsLoading ? (
                      <div className="text-center py-3 text-muted">{translate('common.loading')}</div>
                    ) : recentConversations.length === 0 ? (
                      <div className="text-center py-3 text-muted">{translate('patient.chat.noMoreChats')}</div>
                    ) : (
                      recentConversations.map((c) => {
                        const participant = getConversationParticipant(c)
                        const name = participant?.name || participant?.fullName || participant?.email || (isPetSitterConversation(c) ? translate('patient.chat.petSitter') : translate('patient.appointment.veterinarian'))
                        const avatar = getImageUrl(participant?.profileImage) || '/assets/img/doctors-dashboard/doctor-profile-img.jpg'
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
                              <img src={avatar} alt="Avatar" />
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
                              <p className="chat-item-message">{isPetSitterConversation(c) ? translate('patient.chat.petSitterPrefix') : ''}{preview}</p>
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
                        aria-label={translate('patient.chat.allChats')}
                      >
                        <i className="fa-solid fa-arrow-left"></i>
                      </button>
                      <div className="chat-details-user">
                        <div className="chat-details-avatar">
                          <img
                            src={
                              getImageUrl(getConversationParticipant(selectedConversation)?.profileImage) ||
                              '/assets/img/doctors-dashboard/doctor-profile-img.jpg'
                            }
                            alt={translate('common.profileSettings')}
                          />
                        </div>
                        <div className="chat-details-user-info">
                          <h5>
                            {getConversationParticipant(selectedConversation)?.name ||
                              getConversationParticipant(selectedConversation)?.fullName ||
                              getConversationParticipant(selectedConversation)?.email ||
                              (isPetSitterConversation(selectedConversation) ? translate('patient.chat.petSitter') : translate('patient.appointment.veterinarian'))}
                          </h5>
                          {isPetSitterConversation(selectedConversation) && <span className="badge bg-primary-subtle text-primary">{translate('patient.chat.petSitter')} · {translate('patient.chat.directChat')}</span>}
                        </div>
                      </div>
                      <div className="chat-details-actions">
                        <button type="button" title={translate('patient.chat.searchMessages')}>
                          <i className="fa-solid fa-magnifying-glass"></i>
                        </button>
                        <button type="button" title={translate('patient.chat.moreOptions')}>
                          <i className="fa-solid fa-ellipsis-vertical"></i>
                        </button>
                      </div>
                    </div>

                    {isConversationCompleted && (
                      <div className="alert alert-secondary rounded-0 mb-0 py-2 px-3" role="status">
                        {translate('patient.chat.completedReadonly')}
                      </div>
                    )}

                    <div className="chat-messages-area" ref={messagesContainerRef}>
                      {messagesLoading ? (
                        <div className="text-center py-3 text-muted">{translate('common.loading')}</div>
                      ) : messages.length === 0 ? (
                        <div className="text-center py-3 text-muted">{translate('patient.chat.noMessages')}</div>
                      ) : (
                        messages.map((m) => {
                          const sender = m?.senderId
                          const senderId = sender?._id
                          const isOutgoing = currentUserId && senderId && String(senderId) === String(currentUserId)
                          const senderName = sender?.name || sender?.fullName || sender?.email || translate('patient.petOwner')
                          const senderAvatar = getImageUrl(sender?.profileImage) || (isOutgoing ? currentUserImage : '/assets/img/doctors-dashboard/doctor-profile-img.jpg')
                          const t = m?.createdAt ? new Date(m.createdAt) : null
                          const time = t && !Number.isNaN(t.getTime()) ? t.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : ''
                          const body = m?.message || ''
                          const attachments = getMessageAttachments(m)

                          return (
                            <div key={m._id} className={`chat-message ${isOutgoing ? 'outgoing' : 'incoming'}`}>
                              <div className="chat-message-avatar">
                                <img src={senderAvatar} alt="Avatar" />
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
                                        const name = att?.name || att?.fileName || 'File'
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

                    {pendingFiles.length > 0 && (
                      <div className="d-flex flex-wrap gap-2 px-3 pt-3" aria-label="Selected attachments">
                        {pendingFilePreviews.map(({ file, url }, index) => (
                          <div className="border rounded p-2 d-flex align-items-center gap-2" style={{ maxWidth: 260 }} key={`${file.name}-${file.lastModified}-${index}`}>
                            {url ? <img src={url} alt={file.name} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 6 }} /> : <i className="fa-solid fa-file-lines fa-2x text-secondary" />}
                            <div className="small text-truncate" style={{ maxWidth: 150 }} title={file.name}>
                              <div className="text-truncate">{file.name}</div>
                              <span className="text-muted">{formatFileSize(file.size)}</span>
                            </div>
                            <button type="button" className="btn btn-sm btn-light" onClick={() => removePendingFile(index)} aria-label={`${translate('patient.chat.removeFile')} ${file.name}`} title={translate('patient.chat.removeFile')}><i className="fa-solid fa-xmark" /></button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Chat Input Area */}
                    <div className="chat-input-area">
                      <div className="chat-input-actions">
                        <button
                          type="button"
                          title={translate('patient.chat.attach')}
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
                        placeholder={isConversationCompleted ? translate('patient.chat.completed') : translate('patient.chat.enterMessage')}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleMessageKeyDown}
                        disabled={uploadingFiles || isConversationCompleted}
                      />
                      <button
                        type="button"
                        className="chat-send-button"
                        title={translate('patient.chat.send')}
                        onClick={handleSend}
                        disabled={(!newMessage.trim() && !pendingFiles.length) || sendMessage.isPending || uploadingFiles || isConversationCompleted}
                      >
                        <i className="fa-solid fa-paper-plane"></i>
                      </button>
                      {uploadingFiles && <span className="chat-upload-status">{translate('common.uploading', 'Uploading')} {uploadProgress}%</span>}
                    </div>
                  </>
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted flex-column gap-2">
                    {appointmentIdFromUrl && !conversationIdFromUrl ? <><i className="fa-solid fa-spinner fa-spin" />{translate('patient.chat.opening')}</> : translate('patient.chat.selectConversation')}
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

export default Chat
