import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { useAuth } from '../../contexts/AuthContext'
import { useConversations, useMessages } from '../../queries/chatQueries'
import { useGetOrCreateConversation, useMarkConversationRead, useSendMessage } from '../../mutations/chatMutations'
import { useUploadChatFiles } from '../../mutations/uploadMutations'
import { getImageUrl } from '../../utils/apiConfig'

const unwrap = (response) => {
  const first = response?.data ?? response ?? {}
  return first?.data ?? first
}

const getId = (value) => (value && typeof value === 'object' ? value._id : value)

const getParticipant = (conversation, role) => (
  role === 'PET_SITTER' ? conversation?.petOwnerId : conversation?.petSitterId
)

const formatFileSize = (bytes) => {
  const value = Number(bytes)
  if (!Number.isFinite(value) || value <= 0) return ''
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(value >= 10 * 1024 * 1024 ? 0 : 1)} MB`
  return `${Math.max(1, Math.round(value / 1024))} KB`
}

const isImageAttachment = (attachment) => {
  const type = String(attachment?.type || '').toLowerCase()
  const mime = String(attachment?.mimeType || '').toLowerCase()
  const url = String(attachment?.url || attachment?.fileUrl || '')
  const extension = url.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase()
  return type === 'image' || mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension)
}

const getMessageAttachments = (message) => {
  if (Array.isArray(message?.attachments) && message.attachments.length) return message.attachments
  if (message?.fileUrl) return [{ type: 'file', url: message.fileUrl, name: message.fileName || 'Attachment' }]
  return []
}

const PetSitterChat = () => {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const requestedSitterId = params.get('petSitterId')
  const isOwner = user?.role === 'PET_OWNER'
  const fileInputRef = useRef(null)

  const [selectedId, setSelectedId] = useState(null)
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState([])
  const [previewItems, setPreviewItems] = useState([])
  const [uploadProgress, setUploadProgress] = useState(0)

  const conversationsQuery = useConversations(
    { page: 1, limit: 50, conversationType: 'PET_SITTER' },
    { refetchInterval: 5000, refetchIntervalInBackground: true }
  )
  const getOrCreate = useGetOrCreateConversation()
  const sendMessage = useSendMessage()
  const uploadChatFiles = useUploadChatFiles()
  const markRead = useMarkConversationRead()

  const conversations = useMemo(() => {
    const payload = unwrap(conversationsQuery.data)
    return (payload?.conversations || []).filter(
      (conversation) => conversation.conversationType === 'PET_SITTER_PET_OWNER'
    )
  }, [conversationsQuery.data])

  const selected = conversations.find((conversation) => String(conversation._id) === String(selectedId)) || null
  const messagesQuery = useMessages(selected?._id, {}, { refetchInterval: 2500 })
  const messages = useMemo(() => unwrap(messagesQuery.data)?.messages || [], [messagesQuery.data])

  useEffect(() => {
    if (selected?._id && selected?.unreadCount > 0) markRead.mutate(selected._id)
  }, [markRead, selected?._id, selected?.unreadCount])

  useEffect(() => {
    if (!isOwner || !requestedSitterId || selectedId || conversationsQuery.isLoading) return

    const existing = conversations.find(
      (conversation) => String(getId(conversation.petSitterId)) === String(requestedSitterId)
    )
    if (existing) {
      setSelectedId(existing._id)
      return
    }

    getOrCreate
      .mutateAsync({ petSitterId: requestedSitterId, petOwnerId: user?.id })
      .then((response) => {
        const conversation = unwrap(response)
        if (!conversation?._id) throw new Error('Unable to prepare the Pet Sitter conversation')
        setSelectedId(conversation._id)
      })
      .catch((error) => toast.error(error?.message || 'Unable to open Pet Sitter chat'))
  }, [conversations, conversationsQuery.isLoading, getOrCreate, isOwner, requestedSitterId, selectedId, user?.id])

  useEffect(() => {
    const nextPreviews = files.map((file) => ({
      file,
      url: file.type?.startsWith('image/') ? URL.createObjectURL(file) : null,
    }))
    setPreviewItems(nextPreviews)

    return () => {
      nextPreviews.forEach((preview) => {
        if (preview.url) URL.revokeObjectURL(preview.url)
      })
    }
  }, [files])

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files || [])
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (!selectedFiles.length) return

    const nextFiles = [...files, ...selectedFiles]
    if (nextFiles.length > 10) {
      toast.error('You can attach up to 10 files at once.')
      return
    }

    const oversized = nextFiles.find((file) => file.size > 50 * 1024 * 1024)
    if (oversized) {
      toast.error('Each attachment must be 50MB or smaller.')
      return
    }

    setFiles(nextFiles)
  }

  const removeFile = (index) => {
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))
  }

  const send = async (event) => {
    event.preventDefault()
    if (!selected || sendMessage.isPending || uploadChatFiles.isPending) return
    if (!message.trim() && !files.length) return

    try {
      let attachments = []

      if (files.length) {
        const formData = new FormData()
        files.forEach((file) => formData.append('files', file))

        const uploadResponse = await uploadChatFiles.mutateAsync({
          formData,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total))
            }
          },
        })
        const uploadPayload = uploadResponse?.data?.data ?? uploadResponse?.data ?? uploadResponse
        const urls = uploadPayload?.urls || uploadResponse?.urls || []
        if (!Array.isArray(urls) || urls.length !== files.length) {
          throw new Error('One or more files could not be uploaded')
        }

        attachments = files.map((file, index) => ({
          type: file.type?.startsWith('image/') ? 'image' : 'file',
          url: urls[index],
          name: file.name,
          size: file.size,
          mimeType: file.type || null,
        }))
      }

      await sendMessage.mutateAsync({
        petSitterId: getId(selected.petSitterId),
        petOwnerId: getId(selected.petOwnerId),
        conversationId: selected._id,
        message: message.trim(),
        type: attachments.length ? 'FILE' : 'TEXT',
        attachments,
      })

      setMessage('')
      setFiles([])
      setUploadProgress(0)
    } catch (error) {
      toast.error(error?.message || 'Unable to send the message or attachment')
    } finally {
      setUploadProgress(0)
    }
  }

  return (
    <div className="content">
      <div className="container-fluid">
        <div className="card shadow-sm" style={{ minHeight: 620 }}>
          <div className="row g-0 h-100">
            <div className="col-md-4 col-xl-3 border-end">
              <div className="p-3 border-bottom">
                <h5 className="mb-0">{isOwner ? 'Pet Sitter chats' : 'Pet Owner chats'}</h5>
              </div>
              <div className="list-group list-group-flush">
                {conversations.map((conversation) => {
                  const person = getParticipant(conversation, user?.role)
                  return (
                    <button
                      type="button"
                      className={`list-group-item list-group-item-action ${String(selected?._id) === String(conversation._id) ? 'active' : ''}`}
                      key={conversation._id}
                      onClick={() => setSelectedId(conversation._id)}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <img
                          src={getImageUrl(person?.profileImage) || '/assets/img/doctors-dashboard/doctor-profile-img.jpg'}
                          className="rounded-circle"
                          width="42"
                          height="42"
                          style={{ objectFit: 'cover' }}
                          alt=""
                        />
                        <div className="text-start">
                          <strong>{person?.fullName || person?.name || 'Conversation'}</strong>
                          <div className="small text-muted">
                            {conversation.unreadCount ? `${conversation.unreadCount} unread` : 'Pet Sitter chat'}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
              {!conversations.length && <p className="text-muted small p-3 mb-0">No conversations yet.</p>}
            </div>

            <div className="col-md-8 col-xl-9 d-flex flex-column">
              <div className="p-3 border-bottom">
                {selected ? (
                  <>
                    <h5 className="mb-0">
                      {getParticipant(selected, user?.role)?.fullName || getParticipant(selected, user?.role)?.name || 'Conversation'}
                    </h5>
                    <small className="text-muted">Direct Pet Sitter messaging · no appointment required</small>
                  </>
                ) : (
                  <span className="text-muted">Select a conversation to start chatting</span>
                )}
              </div>

              <div className="flex-grow-1 p-3" style={{ minHeight: 420, maxHeight: 500, overflowY: 'auto' }}>
                {messages.map((item) => {
                  const mine = String(getId(item.senderId)) === String(user?.id)
                  return (
                    <div className={`d-flex mb-3 ${mine ? 'justify-content-end' : 'justify-content-start'}`} key={item._id}>
                      <div className={`rounded-3 px-3 py-2 ${mine ? 'bg-primary text-white' : 'bg-light border'}`} style={{ maxWidth: '75%' }}>
                        {item.message && <div style={{ whiteSpace: 'pre-wrap' }}>{item.message}</div>}
                        {getMessageAttachments(item).map((attachment, index) => {
                          const url = getImageUrl(attachment.url || attachment.fileUrl)
                          const name = attachment.name || attachment.fileName || 'Attachment'
                          if (isImageAttachment(attachment)) {
                            return <a href={url} target="_blank" rel="noreferrer" key={`${item._id}-${index}`}><img src={url} alt={name} style={{ display: 'block', maxWidth: 260, maxHeight: 220, objectFit: 'contain', borderRadius: 8, marginTop: 6 }} /></a>
                          }
                          return <a className={`d-flex align-items-center gap-2 small mt-2 ${mine ? 'text-white' : ''}`} href={url} target="_blank" rel="noreferrer" key={`${item._id}-${index}`}><i className="fa-solid fa-file-arrow-down" /><span>{name}{attachment.size ? ` · ${formatFileSize(attachment.size)}` : ''}</span></a>
                        })}
                      </div>
                    </div>
                  )
                })}
                {selected && !messages.length && <div className="text-center text-muted py-5">Start a direct conversation with this Pet Sitter.</div>}
              </div>

              {selected && (
                <form onSubmit={send} className="p-3 border-top">
                  {files.length > 0 && (
                    <div className="d-flex flex-wrap gap-2 mb-3" aria-label="Selected attachments">
                      {previewItems.map(({ file, url }, index) => (
                        <div className="border rounded p-2 d-flex align-items-center gap-2" style={{ maxWidth: 260 }} key={`${file.name}-${file.lastModified}-${index}`}>
                          {url ? <img src={url} alt={file.name} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 6 }} /> : <i className="fa-solid fa-file-lines fa-2x text-secondary" />}
                          <div className="small text-truncate" style={{ maxWidth: 150 }} title={file.name}>
                            <div className="text-truncate">{file.name}</div>
                            <span className="text-muted">{formatFileSize(file.size)}</span>
                          </div>
                          <button type="button" className="btn btn-sm btn-light" onClick={() => removeFile(index)} aria-label={`Remove ${file.name}`} title="Remove file"><i className="fa-solid fa-xmark" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="input-group">
                    <input className="form-control" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write a message…" />
                    <label className="btn btn-outline-secondary mb-0" title="Attach files">
                      <i className="fa-solid fa-paperclip" />
                      <input ref={fileInputRef} type="file" hidden multiple accept="*/*" onChange={handleFileSelect} />
                    </label>
                    <button className="btn btn-primary" disabled={sendMessage.isPending || uploadChatFiles.isPending || (!message.trim() && !files.length)}>
                      {uploadChatFiles.isPending ? `Uploading ${uploadProgress}%` : 'Send'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PetSitterChat
