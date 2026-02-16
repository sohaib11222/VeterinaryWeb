import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { useQueryClient } from '@tanstack/react-query'

import { useAuth } from '../../contexts/AuthContext'
import { useConversations, useMessages, useUnreadChatCount } from '../../queries'
import { useGetOrCreateConversation, useMarkConversationRead, useSendMessage, useUploadChatFile } from '../../mutations'
import { getImageUrl } from '../../utils/apiConfig'

const AdminDoctorChat = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const currentUserId = user?.id || user?._id
  const currentUserImage = getImageUrl(user?.profileImage) || '/assets/img/doctors-dashboard/doctor-profile-img.jpg'

  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const fileInputRef = useRef(null)
  const lastMarkedReadConversationRef = useRef(null)

  const [selectedConversationId, setSelectedConversationId] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [uploadingFiles, setUploadingFiles] = useState(false)

  const getOrCreateConversation = useGetOrCreateConversation()
  const sendMessage = useSendMessage()
  const markRead = useMarkConversationRead()
  const uploadChatFile = useUploadChatFile()

  const {
    data: conversationsResponse,
    isLoading: conversationsLoading,
    error: conversationsError,
  } = useConversations(
    { limit: 50 },
    {
      refetchInterval: false,
      refetchIntervalInBackground: false,
    }
  )

  useUnreadChatCount({
    refetchInterval: false,
    refetchIntervalInBackground: false,
  })

  const conversations = useMemo(() => {
    const payload = conversationsResponse?.data ?? conversationsResponse
    const list = payload?.conversations ?? payload?.data?.conversations
    return Array.isArray(list) ? list : []
  }, [conversationsResponse])

  const adminConversations = useMemo(
    () => conversations.filter((c) => c?.conversationType === 'ADMIN_VETERINARIAN'),
    [conversations]
  )

  const selectedConversation = useMemo(
    () => adminConversations.find((c) => String(c?._id) === String(selectedConversationId)) || null,
    [adminConversations, selectedConversationId]
  )

  const {
    data: messagesResponse,
    isLoading: messagesLoading,
    error: messagesError,
  } = useMessages(
    selectedConversationId,
    { limit: 100 },
    {
      refetchInterval: selectedConversationId ? 2000 : false,
      refetchIntervalInBackground: false,
    }
  )

  const messages = useMemo(() => {
    const payload = messagesResponse?.data ?? messagesResponse
    const list = payload?.messages ?? payload?.data?.messages
    return Array.isArray(list) ? list : []
  }, [messagesResponse])

  useEffect(() => {
    if (conversationsError?.message) toast.error(conversationsError.message)
  }, [conversationsError])

  useEffect(() => {
    if (messagesError?.message) toast.error(messagesError.message)
  }, [messagesError])

  useEffect(() => {
    if (!selectedConversationId && adminConversations.length > 0) {
      setSelectedConversationId(adminConversations[0]._id)
    }
  }, [adminConversations, selectedConversationId])

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

  useEffect(() => {
    if (!selectedConversationId) return
    if ((selectedConversation?.unreadCount || 0) <= 0) return
    if (String(lastMarkedReadConversationRef.current) === String(selectedConversationId)) return

    lastMarkedReadConversationRef.current = selectedConversationId
    markRead.mutate(selectedConversationId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] })
        queryClient.invalidateQueries({ queryKey: ['chat', 'unread-count'] })
      },
      onError: (err) => {
        lastMarkedReadConversationRef.current = null
        toast.error(err?.message || 'Failed to mark messages as read')
      },
    })
  }, [markRead, queryClient, selectedConversation, selectedConversationId])

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

  const handleStartConversation = async () => {
    if (!currentUserId) {
      toast.error('User not found')
      return
    }
    try {
      const res = await getOrCreateConversation.mutateAsync({ veterinarianId: currentUserId })
      const payload = res?.data ?? res
      const conv = payload?.data ?? payload
      const convId = conv?._id
      if (convId) setSelectedConversationId(convId)
    } catch (err) {
      toast.error(err?.message || 'Unable to start admin chat')
    }
  }

  const handleSend = async () => {
    const text = newMessage.trim()
    if (!text) {
      toast.error('Please enter a message or select a file')
      return
    }
    if (!currentUserId) {
      toast.error('User not found')
      return
    }

    try {
      await sendMessage.mutateAsync({
        conversationId: selectedConversationId || undefined,
        veterinarianId: currentUserId,
        message: text,
        type: 'TEXT',
      })
      setNewMessage('')
      scrollToBottom()
    } catch (err) {
      toast.error(err?.message || 'Failed to send message')
    }
  }

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const maxSize = 50 * 1024 * 1024
    const oversizedFiles = files.filter((f) => f.size > maxSize)
    if (oversizedFiles.length > 0) {
      toast.error('Some files are too large. Maximum size is 50MB.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    if (!currentUserId) {
      toast.error('User not found')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setUploadingFiles(true)
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        const res = await uploadChatFile.mutateAsync(formData)
        const url = res?.data?.url || res?.url
        if (!url) return null

        const isImage = file.type?.startsWith('image/')
        return {
          type: isImage ? 'image' : 'file',
          url,
          name: file.name,
          size: file.size,
          mimeType: file.type || null,
        }
      })

      const uploaded = (await Promise.all(uploadPromises)).filter(Boolean)
      if (uploaded.length === 0) {
        toast.error('No files were uploaded successfully')
        return
      }

      const messageText = newMessage.trim()
      await sendMessage.mutateAsync({
        conversationId: selectedConversationId || undefined,
        veterinarianId: currentUserId,
        type: 'FILE',
        attachments: uploaded,
        ...(messageText ? { message: messageText } : {}),
      })

      setNewMessage('')
      scrollToBottom()
    } catch (err) {
      toast.error(err?.message || 'Failed to upload/send files')
    } finally {
      setUploadingFiles(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const formatConversationTime = (c) => {
    const dt = c?.lastMessageAt || c?.updatedAt || c?.createdAt
    if (!dt) return ''
    const d = new Date(dt)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleString(undefined, { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      <style>{`
        .admin-doctor-chat-wrapper {
          padding-top: 68px;
          min-height: 100vh;
          background: #f5f5f5;
        }
        .admin-doctor-chat-wrapper .container {
          max-width: 100%;
          padding: 24px;
        }
        .admin-doctor-chat-container {
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
          flex-shrink: 0;
        }
        .chat-list-header h4 {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 0;
          color: #0A0A0A;
        }
        .chat-list-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 0 12px;
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
        .chat-item.active {
          background: #e3f2fd;
        }
        .chat-item-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          margin-right: 12px;
          flex-shrink: 0;
        }
        .chat-item-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
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
          font-size: 12px;
          color: #999;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .chat-item-message {
          font-size: 14px;
          color: #666;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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
        }
        .chat-details-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }
        .chat-details-user-info h5 {
          font-size: 18px;
          font-weight: 600;
          color: #0A0A0A;
          margin: 0;
        }
        .chat-messages-area {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 24px;
          padding-bottom: 40px;
          min-height: 0;
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
        .chat-input-area {
          padding: 15px;
          border-top: 1px solid #e5e5e5;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
          background: #fff;
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
      `}</style>

      <div className="page-wrapper chat-page-wrapper admin-doctor-chat-wrapper">
        <div className="container">
          <div className="content doctor-content">
            <div className="admin-doctor-chat-container">
              <div className="chat-list-sidebar">
                <div className="chat-list-header">
                  <h4>Admin Chats</h4>
                </div>
                <div className="chat-list-content">
                  {conversationsLoading ? (
                    <div className="text-center py-3 text-muted">Loading...</div>
                  ) : adminConversations.length === 0 ? (
                    <div className="text-center py-3">
                      <p className="text-muted mb-3">No admin conversations yet</p>
                      <button className="btn btn-primary" type="button" onClick={handleStartConversation}>
                        Start Chat
                      </button>
                    </div>
                  ) : (
                    adminConversations.map((c) => {
                      const adminUser = c?.adminId
                      const name = adminUser?.name || adminUser?.fullName || adminUser?.email || 'Admin'
                      const avatar = getImageUrl(adminUser?.profileImage) || '/assets/img/doctors-dashboard/profile-06.jpg'
                      const preview = c?.lastMessage?.message || '—'
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
                            setSelectedConversationId(c._id)
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
                                {unread > 0 ? (
                                  <span className="badge bg-primary">{unread}</span>
                                ) : null}
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

              <div className="chat-details-area">
                {selectedConversation ? (
                  <>
                    <div className="chat-details-header">
                      <div className="chat-details-user">
                        <div className="chat-details-avatar">
                          <img
                            src={getImageUrl(selectedConversation?.adminId?.profileImage) || '/assets/img/doctors-dashboard/profile-06.jpg'}
                            alt="User"
                          />
                        </div>
                        <div className="chat-details-user-info">
                          <h5>
                            {selectedConversation?.adminId?.name ||
                              selectedConversation?.adminId?.fullName ||
                              selectedConversation?.adminId?.email ||
                              'Admin'}
                          </h5>
                        </div>
                      </div>
                    </div>

                    <div className="chat-messages-area" ref={messagesContainerRef}>
                      {messagesLoading ? (
                        <div className="text-center py-3 text-muted">Loading...</div>
                      ) : messages.length === 0 ? (
                        <div className="text-center py-3 text-muted">No messages yet</div>
                      ) : (
                        messages.map((m) => {
                          const sender = m?.senderId
                          const senderId = sender?._id
                          const isOutgoing = currentUserId && senderId && String(senderId) === String(currentUserId)
                          const senderName = sender?.name || sender?.fullName || sender?.email || 'User'
                          const senderAvatar =
                            getImageUrl(sender?.profileImage) || (isOutgoing ? currentUserImage : '/assets/img/doctors-dashboard/profile-06.jpg')
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
                                <div className="chat-message-header" style={isOutgoing ? { justifyContent: 'flex-end' } : undefined}>
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

                    <div className="chat-input-area">
                      <div className="chat-input-actions">
                        <button
                          type="button"
                          title="Attach"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingFiles || sendMessage.isPending}
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
                        placeholder="Type your message here..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleSend()
                          }
                        }}
                        disabled={uploadingFiles}
                      />
                      <button
                        type="button"
                        className="chat-send-button"
                        title="Send"
                        onClick={handleSend}
                        disabled={!newMessage.trim() || sendMessage.isPending || uploadingFiles}
                      >
                        <i className="fa-solid fa-paper-plane"></i>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted">Select a conversation</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AdminDoctorChat
