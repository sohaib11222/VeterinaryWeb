import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'

import { useVeterinarianInvoices } from '../../queries/invoiceQueries'
import apiClient from '../../utils/api'
import { API_ROUTES } from '../../utils/apiConfig'

const unwrap = (response) => response?.data ?? response

const getInvoiceFilename = (invoice) => {
  const reference = invoice?.relatedAppointmentId?.appointmentNumber || invoice?._id || 'invoice'
  return `veterinary-invoice-${String(reference).replace(/[^a-z0-9-_]/gi, '-')}.pdf`
}

const Invoices = () => {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [downloadingId, setDownloadingId] = useState('')
  const params = { page, limit: 20, search: search.trim() || undefined, status: status || undefined, fromDate: fromDate || undefined, toDate: toDate || undefined }
  const invoicesQuery = useVeterinarianInvoices(params)
  const payload = useMemo(() => unwrap(invoicesQuery.data), [invoicesQuery.data])
  const invoices = payload?.transactions || []
  const pagination = payload?.pagination || { page: 1, pages: 1, total: 0 }

  const updateFilters = (update) => {
    setPage(1)
    update()
  }

  const downloadInvoice = async (invoice) => {
    if (!invoice?._id) return
    try {
      setDownloadingId(String(invoice._id))
      const response = await apiClient.get(API_ROUTES.VETERINARIANS.INVOICE_PDF(invoice._id), { responseType: 'blob' })
      const downloadUrl = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = getInvoiceFilename(invoice)
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      toast.error(error?.data?.message || error?.message || 'Unable to download this invoice')
    } finally {
      setDownloadingId('')
    }
  }

  return (
    <section className="veterinary-dashboard">
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div className="veterinary-dashboard-header mb-0"><h2 className="dashboard-title"><i className="fa-solid fa-file-invoice-dollar me-3" />Invoices</h2><p className="dashboard-subtitle">Payment records for your completed veterinary appointments.</p></div>
        <span className="badge text-bg-light border px-3 py-2">{pagination.total || 0} invoices</span>
      </div>

      <div className="dashboard-card veterinary-card mb-4"><div className="dashboard-card-body"><div className="row g-3">
        <div className="col-xl-5 col-lg-6"><label className="visually-hidden" htmlFor="invoice-search">Search invoices</label><div className="input-group"><span className="input-group-text bg-white"><i className="fa-solid fa-magnifying-glass text-muted" /></span><input id="invoice-search" type="search" className="form-control" value={search} onChange={(event) => updateFilters(() => setSearch(event.target.value))} placeholder="Search pet, owner, appointment, or payment status" />{search && <button type="button" className="btn btn-outline-secondary" onClick={() => updateFilters(() => setSearch(''))}>Clear</button>}</div></div>
        <div className="col-xl-2 col-lg-2"><label className="visually-hidden" htmlFor="invoice-status">Payment status</label><select id="invoice-status" className="form-select" value={status} onChange={(event) => updateFilters(() => setStatus(event.target.value))}><option value="">All statuses</option><option value="SUCCESS">Successful</option><option value="PENDING">Pending</option><option value="FAILED">Failed</option><option value="REFUNDED">Refunded</option></select></div>
        <div className="col-xl-2 col-lg-2"><label className="visually-hidden" htmlFor="invoice-from">From date</label><input id="invoice-from" type="date" className="form-control" value={fromDate} onChange={(event) => updateFilters(() => setFromDate(event.target.value))} /></div>
        <div className="col-xl-2 col-lg-2"><label className="visually-hidden" htmlFor="invoice-to">To date</label><input id="invoice-to" type="date" className="form-control" value={toDate} onChange={(event) => updateFilters(() => setToDate(event.target.value))} /></div>
        <div className="col-xl-1 col-lg-12 d-grid"><button type="button" className="btn btn-outline-secondary" onClick={() => { setSearch(''); setStatus(''); setFromDate(''); setToDate(''); setPage(1) }} title="Reset filters"><i className="fa-solid fa-rotate-left" /></button></div>
      </div></div></div>

      <div className="dashboard-card veterinary-card"><div className="dashboard-card-body p-0">
        {invoicesQuery.isLoading ? <div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading invoices</span></div></div>
          : invoicesQuery.isError ? <div className="alert alert-danger m-3">{invoicesQuery.error?.message || 'Unable to load invoices.'}</div>
          : invoices.length === 0 ? <div className="text-center text-muted py-5"><i className="fa-regular fa-file-lines fa-2x mb-3" /><p className="mb-0">No invoices match your filters.</p></div>
          : <div className="p-3 d-grid gap-3">{invoices.map((invoice) => {
            const appointment = invoice?.relatedAppointmentId || {}
            const petOwner = appointment?.petOwnerId || invoice?.userId || {}
            const pet = appointment?.petId || {}
            const currency = invoice?.currency || 'EUR'
            const amount = Number(invoice?.amount || 0)
            const isDownloading = downloadingId === String(invoice?._id)
            return <article key={invoice._id} className="border rounded-3 p-3" style={{ background: '#fff' }}><div className="row g-3 align-items-center">
              <div className="col-xl-3 col-lg-4"><div className="text-muted small mb-1">INVOICE</div><div className="fw-semibold text-break">{appointment?.appointmentNumber || `#${String(invoice?._id || '').slice(-8).toUpperCase()}`}</div><small className="text-muted">{invoice?.createdAt ? new Date(invoice.createdAt).toLocaleString() : '—'}</small></div>
              <div className="col-xl-3 col-lg-4"><div className="text-muted small mb-1">PET OWNER & PET</div><div className="fw-semibold">{petOwner?.name || petOwner?.fullName || petOwner?.email || '—'}</div><small className="text-muted">{pet?.name ? `${pet.name}${pet.species ? ` · ${pet.species}` : ''}` : 'Pet unavailable'}</small></div>
              <div className="col-xl-2 col-lg-2"><div className="text-muted small mb-1">AMOUNT</div><div className="fw-bold">{currency === 'EUR' ? '€' : `${currency} `}{amount.toFixed(2)}</div></div>
              <div className="col-xl-2 col-lg-2"><div className="text-muted small mb-1">STATUS</div><span className={`badge ${String(invoice?.status || '').toUpperCase() === 'SUCCESS' ? 'bg-success' : 'bg-secondary'}`}>{invoice?.status || '—'}</span></div>
              <div className="col-xl-2 col-lg-12"><div className="d-flex justify-content-xl-end gap-2"><Link to={`/invoice-view/${encodeURIComponent(String(invoice._id))}`} className="btn btn-outline-primary btn-sm" title="View invoice" aria-label="View invoice"><i className="fa-solid fa-eye" /></Link><button type="button" className="btn btn-primary btn-sm" title="Download PDF" aria-label="Download PDF" onClick={() => downloadInvoice(invoice)} disabled={isDownloading}><i className={`fa-solid ${isDownloading ? 'fa-spinner fa-spin' : 'fa-download'}`} /></button></div></div>
            </div></article>
          })}</div>}
      </div></div>

      {(pagination.pages || 1) > 1 && <nav className="d-flex justify-content-center gap-2 mt-4" aria-label="Invoice pages"><button type="button" className="btn btn-outline-primary" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button><span className="align-self-center text-muted">Page {page} of {pagination.pages}</span><button type="button" className="btn btn-outline-primary" disabled={page >= pagination.pages} onClick={() => setPage((current) => current + 1)}>Next</button></nav>}
    </section>
  )
}

export default Invoices
