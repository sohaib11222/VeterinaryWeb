import { useMemo, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import apiClient from '../../utils/api'
import { useLanguage } from '../../contexts/LanguageContext'
import { useSupportTicket } from '../../queries/supportTicketQueries'
import { useReopenSupportTicket, useReplyToSupportTicket, useUploadSupportTicketAttachments } from '../../mutations/supportTicketMutations'
import { priorityBadgeClass, supportBadgeClass, supportLabel, unwrapApiData } from '../../constants/supportTickets'

const attachmentIsImage = (attachment) => String(attachment?.mimeType || '').startsWith('image/')
const supportTranslationKey = (value) => ({
  OPEN: 'open', IN_PROGRESS: 'inProgress', WAITING_FOR_PATIENT: 'waitingForPatient', RESOLVED: 'resolved', CLOSED: 'closed',
  LOW: 'low', MEDIUM: 'medium', HIGH: 'high', URGENT: 'urgent',
  APPOINTMENT: 'appointmentIssue', RESCHEDULE: 'rescheduleIssue', VIDEO_CALL: 'videoCallIssue', PAYMENT: 'paymentIssue',
  PHARMACY_ORDER: 'pharmacyOrderIssue', PARAPHARMACY_ORDER: 'parapharmacyOrderIssue', DELIVERY: 'deliveryIssue', REFUND: 'refundIssue',
  PRESCRIPTION: 'prescriptionIssue', ACCOUNT_REGISTRATION: 'accountRegistrationIssue', PET_PROFILE: 'petProfileIssue', VETERINARIAN: 'veterinarianIssue', TECHNICAL: 'technicalIssue', OTHER: 'other',
}[String(value || '').toUpperCase()])

const SupportTicketDetail = () => {
  const { ticketId } = useParams()
  const location = useLocation()
  const { language, t } = useLanguage()
  const basePath = location.pathname.startsWith('/pet-sitter') ? '/pet-sitter' : '/patient'
  const fileInputRef = useRef(null)
  const [body, setBody] = useState('')
  const [files, setFiles] = useState([])
  const ticketQuery = useSupportTicket(ticketId)
  const replyTicket = useReplyToSupportTicket()
  const reopenTicket = useReopenSupportTicket()
  const uploadAttachments = useUploadSupportTicketAttachments()
  const ticket = useMemo(() => unwrapApiData(ticketQuery.data), [ticketQuery.data])
  const messages = Array.isArray(ticket?.messages) ? ticket.messages : []
  const activities = Array.isArray(ticket?.activities) ? ticket.activities : []
  const replyDisabled = ['RESOLVED', 'CLOSED'].includes(String(ticket?.status || '').toUpperCase())
  const dateTime = (value) => value ? new Date(value).toLocaleString(language === 'it' ? 'it-IT' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—'
  const localizeSupportValue = (value) => {
    const key = supportTranslationKey(value)
    return key ? t(`patient.support.${key}`) : supportLabel(value)
  }

  const chooseFiles = (event) => {
    const next = Array.from(event.target.files || [])
    if (next.length > 5) return toast.error(t('patient.support.fileLimit'))
    if (next.some((file) => file.size > 25 * 1024 * 1024)) return toast.error(t('patient.support.fileSize'))
    setFiles(next)
  }

  const sendReply = async (event) => {
    event.preventDefault()
    if (!body.trim() && !files.length) return
    try {
      let attachments = []
      if (files.length) {
        const formData = new FormData()
        files.forEach((file) => formData.append('supportTicket', file, file.name))
        const upload = unwrapApiData(await uploadAttachments.mutateAsync(formData))
        attachments = (upload?.attachments || []).map((attachment) => attachment._id)
      }
      await replyTicket.mutateAsync({ ticketId, data: { body: body.trim(), attachments } })
      setBody('')
      setFiles([])
      if (fileInputRef.current) fileInputRef.current.value = ''
      toast.success(t('patient.support.replySuccess'))
    } catch (error) {
      toast.error(error?.message || t('patient.support.replyFailed'))
    }
  }

  const reopen = async () => {
    try {
      await reopenTicket.mutateAsync(ticketId)
      toast.success(t('patient.support.reopenSuccess'))
    } catch (error) {
      toast.error(error?.message || t('patient.support.reopenFailed'))
    }
  }

  const downloadAttachment = async (attachment) => {
    try {
      const response = await apiClient.get(attachment.downloadUrl, { responseType: 'blob' })
      const objectUrl = URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = attachment.name || 'support-attachment'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)
    } catch (error) {
      toast.error(error?.message || t('patient.support.attachmentDownloadFailed'))
    }
  }

  if (ticketQuery.isLoading) return <div className="content"><div className="container-fluid text-center py-5"><div className="spinner-border text-primary" /></div></div>
  if (ticketQuery.isError || !ticket) return <div className="content"><div className="container-fluid"><div className="alert alert-danger">{ticketQuery.error?.message || t('patient.support.ticketNotFound')}</div><Link className="btn btn-outline-primary" to={`${basePath}/support-tickets`}>{t('patient.support.backToTickets')}</Link></div></div>

  return (
    <div className="content"><div className="container-fluid">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div className="d-flex gap-3"><Link to={`${basePath}/support-tickets`} className="btn btn-outline-secondary align-self-start" aria-label={t('patient.support.backToTickets')}><i className="fa-solid fa-arrow-left" /></Link><div><div className="d-flex align-items-center flex-wrap gap-2"><h3 className="mb-0">{ticket.ticketNumber}</h3><span className={`badge ${supportBadgeClass(ticket.status)}`}>{localizeSupportValue(ticket.status)}</span><span className={`badge ${priorityBadgeClass(ticket.priority)}`}>{localizeSupportValue(ticket.priority)}</span></div><p className="mb-0 text-muted">{ticket.subject}</p></div></div>
        {ticket.status === 'RESOLVED' && <button type="button" className="btn btn-outline-primary" disabled={reopenTicket.isPending} onClick={reopen}><i className="fa-solid fa-rotate-left me-2" />{t('patient.support.reopen')}</button>}
      </div>
      <div className="row g-4">
        <div className="col-xl-8">
          <div className="card mb-4"><div className="card-body"><div className="d-flex justify-content-between flex-wrap gap-2 mb-3"><h5 className="mb-0">{t('patient.support.conversation')}</h5><small className="text-muted">{t('patient.support.created')} {dateTime(ticket.createdAt)}</small></div><div className="d-flex flex-column gap-3">{messages.map((message) => { const mine = ['PET_OWNER', 'PET_SITTER'].includes(message.senderRole); return <div className={`d-flex ${mine ? 'justify-content-end' : 'justify-content-start'}`} key={message._id}><div className={`rounded-3 p-3 ${mine ? 'bg-primary text-white' : 'bg-light border'}`} style={{ maxWidth: '82%' }}><div className={`small fw-semibold mb-1 ${mine ? 'text-white-50' : 'text-muted'}`}>{mine ? t('patient.support.you') : t('patient.support.supportTeam')} · {dateTime(message.createdAt)}</div>{message.body && <div style={{ whiteSpace: 'pre-wrap' }}>{message.body}</div>}{message.attachments?.length > 0 && <div className="d-flex flex-wrap gap-2 mt-2">{message.attachments.map((attachment) => <button type="button" key={attachment._id} onClick={() => downloadAttachment(attachment)} className={`btn btn-sm ${mine ? 'btn-outline-light' : 'btn-outline-secondary'}`}><i className={`fa-solid ${attachmentIsImage(attachment) ? 'fa-image' : 'fa-paperclip'} me-1`} />{attachment.name}</button>)}</div>}</div></div> })}</div></div></div>
          <div className="card"><div className="card-body">{replyDisabled ? <div className="alert alert-secondary mb-0">{ticket.status === 'RESOLVED' ? t('patient.support.replyDisabledResolved') : t('patient.support.replyDisabledClosed')}</div> : <form onSubmit={sendReply}><label className="form-label fw-semibold">{t('patient.support.reply')}</label><textarea className="form-control mb-3" rows={4} value={body} onChange={(event) => setBody(event.target.value)} maxLength={8000} placeholder={t('patient.support.replyPlaceholder')} /><input ref={fileInputRef} className="form-control mb-2" type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={chooseFiles} />{files.length > 0 && <div className="d-flex flex-wrap gap-2 mb-3">{files.map((file) => <span className="badge bg-light text-dark border" key={`${file.name}-${file.lastModified}`}>{file.name}</span>)}</div>}<div className="d-flex justify-content-end"><button className="btn btn-primary" type="submit" disabled={replyTicket.isPending || uploadAttachments.isPending || (!body.trim() && !files.length)}>{replyTicket.isPending || uploadAttachments.isPending ? t('patient.support.sending') : t('patient.support.sendReply')} <i className="fa-solid fa-paper-plane ms-2" /></button></div></form>}</div></div>
        </div>
        <div className="col-xl-4">
          <div className="card mb-4"><div className="card-body"><h5>{t('patient.support.ticketDetails')}</h5><dl className="row small mb-0"><dt className="col-5 text-muted">{t('patient.category')}</dt><dd className="col-7">{localizeSupportValue(ticket.category)}</dd><dt className="col-5 text-muted">{t('patient.priority')}</dt><dd className="col-7">{localizeSupportValue(ticket.priority)}</dd><dt className="col-5 text-muted">{t('patient.support.created')}</dt><dd className="col-7">{dateTime(ticket.createdAt)}</dd><dt className="col-5 text-muted">{t('patient.support.relatedRecord')}</dt><dd className="col-7">{ticket.relatedRecord?.type ? `${localizeSupportValue(ticket.relatedRecord.type)}${ticket.relatedRecord.recordId ? ` · ${ticket.relatedRecord.recordId}` : ''}` : '—'}</dd></dl></div></div>
          <div className="card mb-4"><div className="card-body"><h5>{t('patient.support.originalRequest')}</h5><p className="mb-0 text-muted" style={{ whiteSpace: 'pre-wrap' }}>{ticket.description}</p></div></div>
          <div className="card"><div className="card-body"><h5>{t('patient.support.activity')}</h5><div className="d-flex flex-column gap-3">{activities.map((activity) => <div className="d-flex gap-2" key={activity._id}><i className="fa-solid fa-circle-check text-primary mt-1" /><div><div className="small">{activity.summary}</div><small className="text-muted">{dateTime(activity.createdAt)}</small></div></div>)}</div></div></div>
        </div>
      </div>
    </div></div>
  )
}

export default SupportTicketDetail
