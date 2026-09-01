import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

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

const CreateSupportTicket = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [form, setForm] = useState({ subject: '', category: 'APPOINTMENT', priority: 'MEDIUM', relatedType: '', relatedRecordId: '', description: '' })
  const [files, setFiles] = useState([])
  const appointmentsQuery = useAppointments({ page: 1, limit: 100 })
  const ordersQuery = useOrders({ page: 1, limit: 100 })
  const paymentsQuery = usePetOwnerPayments({ page: 1, limit: 100 })
  const createTicket = useCreateSupportTicket()
  const uploadAttachments = useUploadSupportTicketAttachments()
  const appointments = useMemo(() => toList(appointmentsQuery.data, ['appointments', 'items']), [appointmentsQuery.data])
  const orders = useMemo(() => toList(ordersQuery.data, ['orders', 'items']), [ordersQuery.data])
  const payments = useMemo(() => toList(paymentsQuery.data, ['payments', 'transactions', 'items']), [paymentsQuery.data])
  const relatedRecords = form.relatedType === 'APPOINTMENT' ? appointments : form.relatedType === 'ORDER' ? orders : form.relatedType === 'TRANSACTION' ? payments : []

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value, ...(key === 'relatedType' ? { relatedRecordId: '' } : {}) }))
  const chooseFiles = (event) => {
    const nextFiles = Array.from(event.target.files || [])
    if (nextFiles.length > 5) return toast.error('You can attach up to 5 files')
    if (nextFiles.some((file) => file.size > 25 * 1024 * 1024)) return toast.error('Each attachment must be 25 MB or smaller')
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
      const result = unwrapApiData(await createTicket.mutateAsync({
        subject: form.subject,
        category: form.category,
        priority: form.priority,
        description: form.description,
        relatedRecord: form.relatedType ? { type: form.relatedType, recordId: form.relatedRecordId || null } : null,
        attachments,
      }))
      toast.success(`Support ticket ${result?.ticketNumber || ''} created`)
      navigate(`/patient/support-tickets/${result?._id}`)
    } catch (error) {
      toast.error(error?.message || 'Unable to create the support ticket')
    }
  }
  const submitting = createTicket.isPending || uploadAttachments.isPending

  return <div className="content"><div className="container-fluid"><div className="d-flex align-items-center gap-3 mb-4"><Link to="/patient/support-tickets" className="btn btn-outline-secondary"><i className="fa-solid fa-arrow-left me-2" />Back</Link><div><h3 className="mb-0">Create support ticket</h3><small className="text-muted">Give our support team the details needed to help you quickly.</small></div></div><form onSubmit={submit}><div className="row g-4"><div className="col-xl-8"><div className="card"><div className="card-body"><div className="row g-3"><div className="col-12"><label className="form-label">Subject <span className="text-danger">*</span></label><input className="form-control" value={form.subject} onChange={(event) => update('subject', event.target.value)} minLength={4} maxLength={180} required placeholder="Briefly describe the issue" /></div><div className="col-md-6"><label className="form-label">Issue category <span className="text-danger">*</span></label><select className="form-select" value={form.category} onChange={(event) => update('category', event.target.value)}>{SUPPORT_CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div className="col-md-6"><label className="form-label">Priority</label><select className="form-select" value={form.priority} onChange={(event) => update('priority', event.target.value)}>{SUPPORT_PRIORITIES.map((value) => <option key={value} value={value}>{supportLabel(value)}</option>)}</select></div><div className="col-md-6"><label className="form-label">Related record (optional)</label><select className="form-select" value={form.relatedType} onChange={(event) => update('relatedType', event.target.value)}><option value="">No related record</option><option value="APPOINTMENT">Appointment</option><option value="ORDER">Order</option><option value="TRANSACTION">Payment / transaction</option></select></div>{form.relatedType && <div className="col-md-6"><label className="form-label">Select record</label><select className="form-select" value={form.relatedRecordId} onChange={(event) => update('relatedRecordId', event.target.value)} required><option value="">Choose a record</option>{relatedRecords.map((record) => <option key={record._id || record.id} value={record._id || record.id}>{record.appointmentNumber || record.orderNumber || record.transactionNumber || record._id} — {record.status || record.paymentStatus || 'Record'}</option>)}</select><small className="text-muted">Only your own records are available.</small></div>}<div className="col-12"><label className="form-label">Describe the problem <span className="text-danger">*</span></label><textarea className="form-control" rows={7} value={form.description} onChange={(event) => update('description', event.target.value)} minLength={10} maxLength={8000} required placeholder="Include what happened, when it happened, and anything that can help us investigate." /></div><div className="col-12"><label className="form-label">Attachments (optional)</label><input ref={fileInputRef} className="form-control" type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={chooseFiles} /><small className="text-muted">Up to 5 JPG, PNG, WebP, PDF, DOC, or DOCX files. 25 MB per file.</small>{files.length > 0 && <div className="mt-2 d-flex flex-wrap gap-2">{files.map((file) => <span className="badge bg-light text-dark border" key={`${file.name}-${file.lastModified}`}><i className="fa-solid fa-paperclip me-1" />{file.name}</span>)}</div>}</div></div></div></div></div><div className="col-xl-4"><div className="card"><div className="card-body"><h5>Before you submit</h5><ul className="small text-muted ps-3 mb-4"><li>Each ticket has its own secure conversation.</li><li>Attach screenshots, receipts, or other evidence if helpful.</li><li>We’ll notify you when support responds.</li></ul><button className="btn btn-primary w-100" type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit support ticket'} <i className="fa-solid fa-paper-plane ms-2" /></button></div></div></div></div></form></div></div>
}

export default CreateSupportTicket
