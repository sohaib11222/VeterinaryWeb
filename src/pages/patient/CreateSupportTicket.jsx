import { useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import { useLanguage } from '../../contexts/LanguageContext'
import { useAppointments } from '../../queries/appointmentQueries'
import { useOrders } from '../../queries/orderQueries'
import { usePetOwnerPayments } from '../../queries/petOwnerQueries'
import { useCreateSupportTicket, useUploadSupportTicketAttachments } from '../../mutations/supportTicketMutations'
import { SUPPORT_CATEGORIES, SUPPORT_PRIORITIES, supportLabel, unwrapApiData } from '../../constants/supportTickets'

const toList = (response, keys) => {
  const data = unwrapApiData(response) || {}
  if (Array.isArray(data)) return data
  return keys.flatMap((key) => Array.isArray(data?.[key]) ? [data[key]] : []).flat()
}

const supportTranslationKey = (value) => ({
  LOW: 'low', MEDIUM: 'medium', HIGH: 'high', URGENT: 'urgent',
  APPOINTMENT: 'appointmentIssue', RESCHEDULE: 'rescheduleIssue', VIDEO_CALL: 'videoCallIssue', PAYMENT: 'paymentIssue',
  PHARMACY_ORDER: 'pharmacyOrderIssue', PARAPHARMACY_ORDER: 'parapharmacyOrderIssue', DELIVERY: 'deliveryIssue', REFUND: 'refundIssue',
  PRESCRIPTION: 'prescriptionIssue', ACCOUNT_REGISTRATION: 'accountRegistrationIssue', PET_PROFILE: 'petProfileIssue', VETERINARIAN: 'veterinarianIssue', TECHNICAL: 'technicalIssue', OTHER: 'other',
}[String(value || '').toUpperCase()])

const CreateSupportTicket = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLanguage()
  const basePath = location.pathname.startsWith('/pet-sitter') ? '/pet-sitter' : '/patient'
  const isPetSitter = basePath === '/pet-sitter'
  const fileInputRef = useRef(null)
  const [form, setForm] = useState({ subject: '', category: 'APPOINTMENT', priority: 'MEDIUM', relatedType: '', relatedRecordId: '', description: '' })
  const [files, setFiles] = useState([])
  const appointmentsQuery = useAppointments({ page: 1, limit: 100 }, { enabled: !isPetSitter })
  const ordersQuery = useOrders({ page: 1, limit: 100 }, { enabled: !isPetSitter })
  const paymentsQuery = usePetOwnerPayments({ page: 1, limit: 100 }, { enabled: !isPetSitter })
  const createTicket = useCreateSupportTicket()
  const uploadAttachments = useUploadSupportTicketAttachments()
  const appointments = useMemo(() => toList(appointmentsQuery.data, ['appointments', 'items']), [appointmentsQuery.data])
  const orders = useMemo(() => toList(ordersQuery.data, ['orders', 'items']), [ordersQuery.data])
  const payments = useMemo(() => toList(paymentsQuery.data, ['payments', 'transactions', 'items']), [paymentsQuery.data])
  const relatedRecords = form.relatedType === 'APPOINTMENT' ? appointments : form.relatedType === 'ORDER' ? orders : form.relatedType === 'TRANSACTION' ? payments : []
  const localizeSupportValue = (value) => {
    const key = supportTranslationKey(value)
    return key ? t(`patient.support.${key}`) : supportLabel(value)
  }

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value, ...(key === 'relatedType' ? { relatedRecordId: '' } : {}) }))
  const chooseFiles = (event) => {
    const nextFiles = Array.from(event.target.files || [])
    if (nextFiles.length > 5) return toast.error(t('patient.support.fileLimit'))
    if (nextFiles.some((file) => file.size > 25 * 1024 * 1024)) return toast.error(t('patient.support.fileSize'))
    setFiles(nextFiles)
  }
  const submit = async (event) => {
    event.preventDefault()
    try {
      let attachments = []
      if (files.length) {
        const formData = new FormData()
        files.forEach((file) => formData.append('supportTicket', file, file.name))
        const upload = unwrapApiData(await uploadAttachments.mutateAsync(formData))
        attachments = (upload?.attachments || []).map((attachment) => attachment._id)
      }
      const result = unwrapApiData(await createTicket.mutateAsync({ subject: form.subject, category: form.category, priority: form.priority, description: form.description, relatedRecord: form.relatedType ? { type: form.relatedType, recordId: form.relatedRecordId || null } : null, attachments }))
      toast.success(t('patient.support.createSuccess', { ticket: result?.ticketNumber || '' }))
      navigate(`${basePath}/support-tickets/${result?._id}`)
    } catch (error) {
      toast.error(error?.message || t('patient.support.createFailed'))
    }
  }
  const submitting = createTicket.isPending || uploadAttachments.isPending

  return (
    <div className="content"><div className="container-fluid">
      <div className="d-flex align-items-center gap-3 mb-4"><Link to={`${basePath}/support-tickets`} className="btn btn-outline-secondary"><i className="fa-solid fa-arrow-left me-2" />{t('common.back', 'Back')}</Link><div><h3 className="mb-0">{t('patient.createSupportTicket')}</h3><small className="text-muted">{t('patient.support.createDescription')}</small></div></div>
      <form onSubmit={submit}><div className="row g-4">
        <div className="col-xl-8"><div className="card"><div className="card-body"><div className="row g-3">
          <div className="col-12"><label className="form-label">{t('patient.support.subject')} <span className="text-danger">*</span></label><input className="form-control" value={form.subject} onChange={(event) => update('subject', event.target.value)} minLength={4} maxLength={180} required placeholder={t('patient.support.subjectPlaceholder')} /></div>
          <div className="col-md-6"><label className="form-label">{t('patient.support.issueCategory')} <span className="text-danger">*</span></label><select className="form-select" value={form.category} onChange={(event) => update('category', event.target.value)}>{SUPPORT_CATEGORIES.map(([value]) => <option key={value} value={value}>{localizeSupportValue(value)}</option>)}</select></div>
          <div className="col-md-6"><label className="form-label">{t('patient.priority')}</label><select className="form-select" value={form.priority} onChange={(event) => update('priority', event.target.value)}>{SUPPORT_PRIORITIES.map((value) => <option key={value} value={value}>{localizeSupportValue(value)}</option>)}</select></div>
          {!isPetSitter && <><div className="col-md-6"><label className="form-label">{t('patient.support.relatedOptional')}</label><select className="form-select" value={form.relatedType} onChange={(event) => update('relatedType', event.target.value)}><option value="">{t('patient.support.noRelated')}</option><option value="APPOINTMENT">{t('patient.support.appointmentIssue')}</option><option value="ORDER">{t('patient.orders')}</option><option value="TRANSACTION">{t('patient.support.paymentTransaction')}</option></select></div>{form.relatedType && <div className="col-md-6"><label className="form-label">{t('patient.support.selectRecord')}</label><select className="form-select" value={form.relatedRecordId} onChange={(event) => update('relatedRecordId', event.target.value)} required><option value="">{t('patient.support.chooseRecord')}</option>{relatedRecords.map((record) => <option key={record._id || record.id} value={record._id || record.id}>{record.appointmentNumber || record.orderNumber || record.transactionNumber || record._id} — {record.status || record.paymentStatus || t('patient.support.record')}</option>)}</select><small className="text-muted">{t('patient.support.ownRecords')}</small></div>}</>}
          <div className="col-12"><label className="form-label">{t('patient.support.describeProblem')} <span className="text-danger">*</span></label><textarea className="form-control" rows={7} value={form.description} onChange={(event) => update('description', event.target.value)} minLength={10} maxLength={8000} required placeholder={t('patient.support.descriptionPlaceholder')} /></div>
          <div className="col-12"><label className="form-label">{t('patient.support.attachmentsOptional')}</label><input ref={fileInputRef} className="form-control" type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={chooseFiles} /><small className="text-muted">{t('patient.support.attachmentHint')}</small>{files.length > 0 && <div className="mt-2 d-flex flex-wrap gap-2">{files.map((file) => <span className="badge bg-light text-dark border" key={`${file.name}-${file.lastModified}`}><i className="fa-solid fa-paperclip me-1" />{file.name}</span>)}</div>}</div>
        </div></div></div></div>
        <div className="col-xl-4"><div className="card"><div className="card-body"><h5>{t('patient.support.beforeSubmit')}</h5><ul className="small text-muted ps-3 mb-4"><li>{t('patient.support.secureConversation')}</li><li>{t('patient.support.evidenceHint')}</li><li>{t('patient.support.responseNotice')}</li></ul><button className="btn btn-primary w-100" type="submit" disabled={submitting}>{submitting ? t('patient.appointment.submitting') : t('patient.support.submitTicket')} <i className="fa-solid fa-paper-plane ms-2" /></button></div></div></div>
      </div></form>
    </div></div>
  )
}

export default CreateSupportTicket
