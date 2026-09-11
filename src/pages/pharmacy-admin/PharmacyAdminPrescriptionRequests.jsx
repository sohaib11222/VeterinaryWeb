import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { getImageUrl } from '../../utils/apiConfig'
import { usePharmacyPrescriptionRequests } from '../../queries/productPrescriptionRequestQueries'
import { useReviewProductPrescriptionRequest } from '../../mutations/productPrescriptionRequestMutations'
import { useLanguage } from '../../contexts/LanguageContext'

const unwrap = (payload) => {
  const outer = payload?.data ?? payload
  return outer?.data ?? outer
}

const getVariantName = (request) => {
  const variant = request?.productId?.selectedVariant
  if (!variant) return 'Standard product'
  if (variant.name) return variant.name
  return [
    variant.strengthValue ? `${variant.strengthValue} ${variant.strengthUnit || ''}`.trim() : '',
    variant.dosageForm,
    variant.unitsPerPack ? `${variant.unitsPerPack} ${variant.unitLabel || 'units'}` : '',
  ].filter(Boolean).join(' · ') || 'Selected variant'
}

const statusClass = (status) => ({
  PENDING: 'bg-warning text-dark',
  APPROVED: 'bg-success',
  REJECTED: 'bg-danger',
}[String(status || '').toUpperCase()] || 'bg-secondary')

const PharmacyAdminPrescriptionRequests = () => {
  const { t, language } = useLanguage()
  const [filter, setFilter] = useState('PENDING')
  const [reviewingId, setReviewingId] = useState(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const params = useMemo(() => ({ status: filter, page: 1, limit: 50 }), [filter])
  const requestsQuery = usePharmacyPrescriptionRequests(params)
  const reviewMutation = useReviewProductPrescriptionRequest()

  const payload = useMemo(() => unwrap(requestsQuery.data), [requestsQuery.data])
  const requests = Array.isArray(payload?.requests) ? payload.requests : []

  const startReview = (request) => {
    setReviewingId(request?._id)
    setReviewNotes('')
  }

  const review = async (requestId, status) => {
    try {
      await reviewMutation.mutateAsync({ requestId, data: { status, reviewNotes } })
      toast.success(status === 'APPROVED' ? t('pharmacyAdmin.prescriptions.approvedSuccess') : t('pharmacyAdmin.prescriptions.rejectedSuccess'))
      setReviewingId(null)
      setReviewNotes('')
    } catch (error) {
      toast.error(error?.message || t('pharmacyAdmin.prescriptions.reviewFailed'))
    }
  }

  return (
    <div>
      <div className="page-header d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          <h3 className="page-title mb-1">{t('pharmacyAdmin.prescriptions.title')}</h3>
          <div className="text-muted">{t('pharmacyAdmin.prescriptions.subtitle')}</div>
        </div>
        <select className="form-select" style={{ width: 180 }} value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="PENDING">{t('pharmacyAdmin.prescriptions.pending')}</option>
          <option value="APPROVED">{t('pharmacyAdmin.prescriptions.approved')}</option>
          <option value="REJECTED">{t('pharmacyAdmin.prescriptions.rejected')}</option>
          <option value="ALL">{t('pharmacyAdmin.prescriptions.all')}</option>
        </select>
      </div>

      <div className="card">
        <div className="card-body">
          {requestsQuery.isLoading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">{t('pharmacyAdmin.prescriptions.loading')}</span></div></div>
          ) : requestsQuery.isError ? (
            <div className="alert alert-danger mb-0">{requestsQuery.error?.message || 'Failed to load prescription requests'}</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-5"><i className="fa-solid fa-file-prescription text-muted" style={{ fontSize: 34 }}></i><h5 className="mt-3">{t('pharmacyAdmin.prescriptions.empty')}</h5><p className="text-muted mb-0">{t('pharmacyAdmin.prescriptions.emptyHint')}</p></div>
          ) : (
            <div className="d-grid gap-3">
              {requests.map((request) => {
                const owner = request?.petOwnerId || {}
                const product = request?.productId || {}
                const fileUrl = getImageUrl(request?.prescriptionUrl) || request?.prescriptionUrl
                const isPending = request?.status === 'PENDING'
                const isReviewing = reviewingId === request?._id
                return (
                  <article className="border rounded-3 p-3" key={request?._id}>
                    <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                      <div>
                        <div className="d-flex align-items-center gap-2 flex-wrap"><h5 className="mb-0">{product?.name || 'Product unavailable'}</h5><span className={`badge ${statusClass(request?.status)}`}>{request?.status || 'PENDING'}</span></div>
                        <div className="text-muted small mt-1">{t('pharmacyAdmin.products.variantLabel')}: {getVariantName(request)}</div>
                        <div className="text-muted small mt-1">{request?.createdAt ? new Date(request.createdAt).toLocaleString(language === 'it' ? 'it-IT' : 'en-GB') : 'recently'}</div>
                      </div>
                      <div className="text-end">
                        <div className="fw-semibold">{owner?.fullName || owner?.name || 'Customer'}</div>
                        <div className="text-muted small">{owner?.email || '—'}{owner?.phone ? ` · ${owner.phone}` : ''}</div>
                      </div>
                    </div>

                    <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap mt-3 pt-3 border-top">
                      <a className="btn btn-outline-primary btn-sm" href={fileUrl} target="_blank" rel="noreferrer">
                        <i className="fa-solid fa-arrow-up-right-from-square me-2"></i>{t('pharmacyAdmin.prescriptions.openPrescription')}
                      </a>
                      {isPending && !isReviewing && <button type="button" className="btn btn-primary btn-sm" onClick={() => startReview(request)}>{t('pharmacyAdmin.prescriptions.review')}</button>}
                      {!isPending && request?.reviewNotes && <div className="text-muted small"><strong>{t('pharmacyAdmin.prescriptions.reviewNote')}</strong> {request.reviewNotes}</div>}
                    </div>

                    {isReviewing && (
                      <div className="mt-3 p-3 rounded-3" style={{ background: '#f8fafc' }}>
                        <label className="form-label">{t('pharmacyAdmin.prescriptions.reviewNote')}</label>
                        <textarea className="form-control" rows={3} value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} placeholder={t('pharmacyAdmin.prescriptions.notePlaceholder')} />
                        <div className="d-flex justify-content-end gap-2 mt-3 flex-wrap">
                          <button type="button" className="btn btn-light" onClick={() => setReviewingId(null)} disabled={reviewMutation.isPending}>{t('pharmacyAdmin.prescriptions.cancel')}</button>
                          <button type="button" className="btn btn-outline-danger" onClick={() => review(request._id, 'REJECTED')} disabled={reviewMutation.isPending}>{t('pharmacyAdmin.prescriptions.reject')}</button>
                          <button type="button" className="btn btn-success" onClick={() => review(request._id, 'APPROVED')} disabled={reviewMutation.isPending}>{t('pharmacyAdmin.prescriptions.approve')}</button>
                        </div>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PharmacyAdminPrescriptionRequests
