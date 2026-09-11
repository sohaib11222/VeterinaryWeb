import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { usePetOwnerInvoice } from '../../queries'
import apiClient from '../../utils/api'
import { API_ROUTES } from '../../utils/apiConfig'
import { useLanguage } from '../../contexts/LanguageContext'

const unwrap = (response) => response?.data ?? response
const money = (amount, currency = 'EUR') => `${currency === 'EUR' ? '€' : `${currency} `}${Number(amount || 0).toFixed(2)}`

const PatientInvoiceView = () => {
  const { transactionId } = useParams()
  const { language, t } = useLanguage()
  const [isDownloading, setIsDownloading] = useState(false)
  const query = usePetOwnerInvoice(transactionId)
  const invoice = useMemo(() => unwrap(query.data), [query.data])
  const appointment = invoice?.relatedAppointmentId || {}
  const veterinarian = appointment?.veterinarianId || {}
  const pet = appointment?.petId || {}

  const download = async () => {
    if (!invoice?._id) return
    try {
      setIsDownloading(true)
      const response = await apiClient.get(API_ROUTES.PET_OWNER.INVOICE_PDF(invoice._id), { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `veterinary-invoice-${String(appointment?.appointmentNumber || invoice._id).replace(/[^a-z0-9-_]/gi, '-')}.pdf`
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(error?.data?.message || error?.message || t('patient.invoiceDetail.downloadFailed'))
    } finally { setIsDownloading(false) }
  }

  if (query.isLoading) return <div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">{t('patient.invoiceDetail.loading')}</span></div></div>
  if (query.isError || !invoice?._id) return <div className="alert alert-danger">{query.error?.message || t('patient.invoiceDetail.notFound')}</div>

  const status = String(invoice?.status || 'SUCCESS').toUpperCase()
  const infoRows = [
    [t('patient.invoiceDetail.invoiceReference'), appointment?.appointmentNumber || `#${String(invoice._id).slice(-8).toUpperCase()}`],
    [t('patient.invoiceDetail.issued'), invoice?.createdAt ? new Date(invoice.createdAt).toLocaleString(language === 'it' ? 'it-IT' : 'en-GB') : '—'],
    [t('patient.invoiceDetail.paymentMethod'), invoice?.provider || 'STRIPE'],
    [t('patient.invoiceDetail.transactionId'), String(invoice._id)],
  ]

  return <section className="veterinary-dashboard patient-invoice-view-mobile"><div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4 patient-invoice-toolbar"><Link to="/patient-invoices" className="btn btn-outline-secondary"><i className="fa-solid fa-arrow-left me-2" />{t('patient.invoiceDetail.back')}</Link><button type="button" className="btn btn-primary" onClick={download} disabled={isDownloading}><i className={`fa-solid ${isDownloading ? 'fa-spinner fa-spin' : 'fa-download'} me-2`} />{isDownloading ? t('patient.invoiceDetail.preparingPdf') : t('patient.invoiceDetail.downloadPdf')}</button></div>
    <article className="card border-0 shadow-sm overflow-hidden"><div className="card-body p-0"><header className="p-4 p-lg-5 patient-invoice-hero"><div className="row align-items-start g-3"><div className="col-md-7"><div className="text-uppercase small opacity-75 mb-2">MyPetPlus · {t('patient.invoiceDetail.veterinaryCare')}</div><h1 className="h2 mb-2">{t('patient.invoice')}</h1><p className="mb-0 opacity-75">{appointment?.appointmentNumber || t('patient.invoiceDetail.transaction', { id: String(invoice._id).slice(-8).toUpperCase() })}</p></div><div className="col-md-5 text-md-end"><span className={`badge fs-6 ${status === 'SUCCESS' ? 'text-bg-light text-success' : 'text-bg-warning'}`}>{status === 'SUCCESS' ? t('patient.successful') : status}</span><div className="display-6 fw-bold mt-3">{money(invoice?.amount, invoice?.currency)}</div></div></div></header>
      <div className="p-4 p-lg-5"><div className="row g-4 mb-5"><section className="col-md-6"><h2 className="h6 text-uppercase text-muted mb-3">{t('patient.invoiceDetail.veterinarian')}</h2><div className="fw-semibold fs-5">{veterinarian?.name || veterinarian?.fullName || veterinarian?.email || '—'}</div><div className="text-muted">{veterinarian?.email || t('patient.invoiceDetail.noEmail')}</div></section><section className="col-md-6"><h2 className="h6 text-uppercase text-muted mb-3">{t('patient.invoiceDetail.myPet')}</h2><div className="fw-semibold fs-5">{pet?.name || '—'}</div><div className="text-muted">{[pet?.species, pet?.breed].filter(Boolean).join(' · ') || t('patient.invoiceDetail.petUnavailable')}</div></section></div>
        <div className="border rounded-3 p-3 p-md-4 mb-4"><div className="row g-3"><div className="col-md-8"><div className="text-muted small text-uppercase mb-1">{t('patient.invoiceDetail.appointment')}</div><div className="fw-semibold">{appointment?.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString(language === 'it' ? 'it-IT' : 'en-GB') : '—'} {appointment?.appointmentTime ? `· ${appointment.appointmentTime}` : ''}</div></div><div className="col-md-4 text-md-end"><div className="text-muted small text-uppercase mb-1">{t('patient.invoiceDetail.consultationTotal')}</div><div className="h4 mb-0">{money(invoice?.amount, invoice?.currency)}</div></div></div></div>
        <div className="row g-0 border rounded-3 overflow-hidden">{infoRows.map(([label, value]) => <div className="col-md-6 border-bottom p-3" key={label}><div className="small text-muted text-uppercase">{label}</div><div className="text-break">{value}</div></div>)}</div>
      </div></div></article>
  </section>
}

export default PatientInvoiceView
