import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'

import { usePetOwnerPayments } from '../../queries'
import apiClient from '../../utils/api'
import { API_ROUTES } from '../../utils/apiConfig'
import { useLanguage } from '../../contexts/LanguageContext'

const unwrap = (response) => response?.data ?? response
const invoiceFilename = (invoice) => {
  const reference = invoice?.relatedAppointmentId?.appointmentNumber || invoice?._id || 'invoice'
  return `veterinary-invoice-${String(reference).replace(/[^a-z0-9-_]/gi, '-')}.pdf`
}

const PatientInvoices = () => {
  const { language, t } = useLanguage()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [downloadingId, setDownloadingId] = useState('')
  const params = { page, limit: 20, search: search.trim() || undefined, status: status || undefined, fromDate: fromDate || undefined, toDate: toDate || undefined }
  const query = usePetOwnerPayments(params)
  const payload = useMemo(() => unwrap(query.data), [query.data])
  const invoices = payload?.transactions || []
  const pagination = payload?.pagination || { page: 1, pages: 1, total: 0 }

  const updateFilter = (change) => {
    setPage(1)
    change()
  }
  const statusLabel = (value) => ({ SUCCESS: t('patient.successful'), PENDING: t('patient.pending'), FAILED: t('patient.failed'), REFUNDED: t('patient.refunded') }[String(value || '').toUpperCase()] || value || '—')

  const download = async (invoice) => {
    if (!invoice?._id) return
    try {
      setDownloadingId(String(invoice._id))
      const response = await apiClient.get(API_ROUTES.PET_OWNER.INVOICE_PDF(invoice._id), { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = invoiceFilename(invoice)
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(error?.data?.message || error?.message || t('common.unableDownload', 'Unable to download this invoice'))
    } finally {
      setDownloadingId('')
    }
  }

  return (
    <section className="veterinary-dashboard patient-invoices-mobile">
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div className="veterinary-dashboard-header mb-0">
          <h2 className="dashboard-title"><i className="fa-solid fa-file-invoice-dollar me-3" />{t('patient.invoices')}</h2>
          <p className="dashboard-subtitle">{t('patient.invoiceSubtitle')}</p>
        </div>
        <span className="badge text-bg-light border px-3 py-2">{t('patient.invoiceCount', { count: pagination.total || 0 })}</span>
      </div>

      <div className="dashboard-card veterinary-card mb-4"><div className="dashboard-card-body"><div className="row g-3">
        <div className="col-xl-5 col-lg-6"><label className="visually-hidden" htmlFor="patient-invoice-search">{t('patient.searchInvoices')}</label><div className="input-group"><span className="input-group-text bg-white"><i className="fa-solid fa-magnifying-glass text-muted" /></span><input id="patient-invoice-search" type="search" className="form-control" value={search} onChange={(event) => updateFilter(() => setSearch(event.target.value))} placeholder={t('patient.searchInvoices')} />{search && <button type="button" className="btn btn-outline-secondary" onClick={() => updateFilter(() => setSearch(''))}>{t('common.clear', 'Clear')}</button>}</div></div>
        <div className="col-xl-2 col-lg-2"><label className="visually-hidden" htmlFor="patient-invoice-status">{t('patient.payment')}</label><select id="patient-invoice-status" className="form-select" value={status} onChange={(event) => updateFilter(() => setStatus(event.target.value))}><option value="">{t('patient.allStatuses')}</option><option value="SUCCESS">{t('patient.successful')}</option><option value="PENDING">{t('patient.pending')}</option><option value="FAILED">{t('patient.failed')}</option><option value="REFUNDED">{t('patient.refunded')}</option></select></div>
        <div className="col-xl-2 col-lg-2"><label className="visually-hidden" htmlFor="patient-invoice-from">{t('common.from', 'From date')}</label><input id="patient-invoice-from" type="date" className="form-control" value={fromDate} onChange={(event) => updateFilter(() => setFromDate(event.target.value))} /></div>
        <div className="col-xl-2 col-lg-2"><label className="visually-hidden" htmlFor="patient-invoice-to">{t('common.to', 'To date')}</label><input id="patient-invoice-to" type="date" className="form-control" value={toDate} onChange={(event) => updateFilter(() => setToDate(event.target.value))} /></div>
        <div className="col-xl-1 col-lg-12 d-grid"><button type="button" className="btn btn-outline-secondary" onClick={() => { setSearch(''); setStatus(''); setFromDate(''); setToDate(''); setPage(1) }} title={t('common.reset', 'Reset filters')} aria-label={t('common.reset', 'Reset filters')}><i className="fa-solid fa-rotate-left" /></button></div>
      </div></div></div>

      <div className="dashboard-card veterinary-card"><div className="dashboard-card-body p-0">
        {query.isLoading ? <div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">{t('patient.loadingInvoices')}</span></div></div>
          : query.isError ? <div className="alert alert-danger m-3">{query.error?.message || t('patient.unableSupportTickets')}</div>
          : invoices.length === 0 ? <div className="text-center text-muted py-5"><i className="fa-regular fa-file-lines fa-2x mb-3" /><p className="mb-0">{t('patient.noInvoicesMatch')}</p></div>
          : <div className="p-3 d-grid gap-3">{invoices.map((invoice) => {
            const appointment = invoice?.relatedAppointmentId || {}
            const veterinarian = appointment?.veterinarianId || {}
            const pet = appointment?.petId || {}
            const isDownloading = downloadingId === String(invoice?._id)
            const amount = Number(invoice?.amount || 0)
            const currency = invoice?.currency || 'EUR'
            return <article key={invoice._id} className="border rounded-3 p-3 bg-white"><div className="row g-3 align-items-center">
              <div className="col-xl-3 col-lg-4"><div className="text-muted small mb-1">{t('patient.invoice')}</div><div className="fw-semibold text-break">{appointment?.appointmentNumber || `#${String(invoice?._id || '').slice(-8).toUpperCase()}`}</div><small className="text-muted">{invoice?.createdAt ? new Date(invoice.createdAt).toLocaleString(language === 'it' ? 'it-IT' : 'en-GB') : '—'}</small></div>
              <div className="col-xl-3 col-lg-4"><div className="text-muted small mb-1">{t('patient.veterinarianAndPet')}</div><div className="fw-semibold">{veterinarian?.name || veterinarian?.fullName || veterinarian?.email || '—'}</div><small className="text-muted">{pet?.name ? `${pet.name}${pet.species ? ` · ${pet.species}` : ''}` : t('patient.appointment.pet')}</small></div>
              <div className="col-xl-2 col-lg-2"><div className="text-muted small mb-1">{t('patient.amount')}</div><div className="fw-bold">{currency === 'EUR' ? '€' : `${currency} `}{amount.toFixed(2)}</div></div>
              <div className="col-xl-2 col-lg-2"><div className="text-muted small mb-1">{t('patient.status')}</div><span className={`badge ${String(invoice?.status || '').toUpperCase() === 'SUCCESS' ? 'bg-success' : 'bg-secondary'}`}>{statusLabel(invoice?.status)}</span></div>
              <div className="col-xl-2 col-lg-12"><div className="d-flex justify-content-xl-end gap-2 patient-invoice-actions"><Link to={`/patient-invoices/${encodeURIComponent(String(invoice._id))}`} className="btn btn-outline-primary btn-sm"><i className="fa-solid fa-eye me-1" />{t('common.view', 'View')}</Link><button type="button" className="btn btn-primary btn-sm" onClick={() => download(invoice)} disabled={isDownloading}><i className={`fa-solid ${isDownloading ? 'fa-spinner fa-spin' : 'fa-download'} me-1`} />{isDownloading ? t('patient.preparing') : t('patient.pdfDownload')}</button></div></div>
            </div></article>
          })}</div>}
      </div></div>

      {(pagination.pages || 1) > 1 && <nav className="d-flex justify-content-center gap-2 mt-4 patient-invoice-pagination" aria-label={t('patient.invoices')}><button type="button" className="btn btn-outline-primary" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>{t('patient.previous')}</button><span className="align-self-center text-muted">{t('patient.pageOf', { page, pages: pagination.pages })}</span><button type="button" className="btn btn-outline-primary" disabled={page >= pagination.pages} onClick={() => setPage((current) => current + 1)}>{t('patient.next')}</button></nav>}
    </section>
  )
}

export default PatientInvoices
