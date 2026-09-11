import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { useLanguage } from '../../contexts/LanguageContext'

import { useUpcomingVaccinations, useVaccinations, useVaccines } from '../../queries'
import { useDeleteVaccination, useUpdateVaccination } from '../../mutations'
import { getImageUrl } from '../../utils/apiConfig'

const DoctorVaccinations = () => {
  const { t, language } = useLanguage()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const [viewVaccination, setViewVaccination] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    id: null,
    vaccineId: '',
    vaccinationType: '',
    vaccinationDate: '',
    nextDueDate: '',
    batchNumber: '',
    notes: '',
  })

  const { data: vaccinesResponse } = useVaccines({ includeInactive: true })
  const vaccines = useMemo(() => vaccinesResponse?.data || vaccinesResponse || [], [vaccinesResponse])
  const vaccineMap = useMemo(() => {
    const m = {}
    ;(Array.isArray(vaccines) ? vaccines : []).forEach((v) => {
      if (v?._id) m[v._id] = v
    })
    return m
  }, [vaccines])

  const listParams = useMemo(() => ({ page, limit: 20 }), [page])

  const { data: vaccinationsResponse, isLoading } = useVaccinations(listParams)
  const vaccinationsPayload = vaccinationsResponse?.data || {}
  const vaccinations = vaccinationsPayload.vaccinations || []
  const pagination = vaccinationsPayload.pagination || { page: 1, limit: 20, total: 0, pages: 1 }

  const { data: upcomingResponse } = useUpcomingVaccinations({})
  const upcomingPayload = upcomingResponse?.data || {}
  const upcomingVaccinations = upcomingPayload.vaccinations || []

  const updateVaccination = useUpdateVaccination()
  const deleteVaccination = useDeleteVaccination()

  const formatDate = (d) => {
    if (!d) return '—'
    const dt = new Date(d)
    if (Number.isNaN(dt.getTime())) return '—'
    return dt.toLocaleDateString(language === 'it' ? 'it-IT' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const filteredVaccinations = useMemo(() => {
    const q = (search || '').trim().toLowerCase()
    if (!q) return vaccinations
    return vaccinations.filter((v) => {
      const type = (v.vaccineId?.name || v.vaccinationType || '').toLowerCase()
      const petName = (v.petId?.name || '').toLowerCase()
      const ownerName = (v.petOwnerId?.name || v.petOwnerId?.fullName || '').toLowerCase()
      const notes = (v.notes || '').toLowerCase()
      const batch = (v.batchNumber || '').toLowerCase()
      return type.includes(q) || petName.includes(q) || ownerName.includes(q) || notes.includes(q) || batch.includes(q)
    })
  }, [vaccinations, search])

  const handlePrevPage = (e) => {
    e.preventDefault()
    if (page > 1) setPage(page - 1)
  }

  const handleNextPage = (e) => {
    e.preventDefault()
    if (page < (pagination?.pages || 1)) setPage(page + 1)
  }

  const openEdit = (v) => {
    setEditForm({
      id: v?._id || null,
      vaccineId: v?.vaccineId?._id || v?.vaccineId || '',
      vaccinationType: v?.vaccinationType || v?.vaccineId?.name || '',
      vaccinationDate: v?.vaccinationDate ? String(v.vaccinationDate).slice(0, 10) : '',
      nextDueDate: v?.nextDueDate ? String(v.nextDueDate).slice(0, 10) : '',
      batchNumber: v?.batchNumber || '',
      notes: v?.notes || '',
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editForm.id) return

    const selectedVaccine = editForm.vaccineId ? vaccineMap[editForm.vaccineId] : null
    const vaccinationType = selectedVaccine?.name || editForm.vaccinationType

    if (!String(vaccinationType || '').trim()) {
      toast.error(t('doctorVaccinations.vaccineRequired'))
      return
    }

    if (!editForm.vaccinationDate) {
      toast.error(t('doctorVaccinations.dateRequired'))
      return
    }

    try {
      await updateVaccination.mutateAsync({
        id: editForm.id,
        data: {
          vaccineId: editForm.vaccineId || null,
          vaccinationType,
          vaccinationDate: editForm.vaccinationDate,
          nextDueDate: editForm.nextDueDate || null,
          batchNumber: editForm.batchNumber || null,
          notes: editForm.notes || null,
        },
      })
      toast.success(t('doctorVaccinations.updated'))
      setShowEditModal(false)
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || t('doctorVaccinations.updateFailed'))
    }
  }

  const handleDelete = async (id) => {
    const ok = window.confirm(t('doctorVaccinations.deleteConfirm'))
    if (!ok) return
    try {
      await deleteVaccination.mutateAsync(id)
      toast.success(t('doctorVaccinations.deleted'))
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || t('doctorVaccinations.deleteFailed'))
    }
  }

  const isSaving = updateVaccination.isPending || deleteVaccination.isPending

  return (
    <>
      <div className="content veterinary-dashboard doctor-vaccinations-mobile">
        <div className="container-fluid">
          <div className="row mb-4">
            <div className="col-12">
              <div className="veterinary-dashboard-header">
                <h2 className="dashboard-title">
                  <i className="fa-solid fa-syringe me-3"></i>
                  {t('doctorVaccinations.title')}
                </h2>
                <p className="dashboard-subtitle">{t('doctorVaccinations.subtitle')}</p>
              </div>
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-12">
              <div className="dashboard-card veterinary-card">
                <div className="dashboard-card-body">
                  <div className="d-flex justify-content-end align-items-center gap-2 flex-wrap">
                    <div className="input-block dash-search-input">
                      <input
                        type="text"
                        className="form-control"
                        placeholder={t('doctorVaccinations.searchPlaceholder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                      <span className="search-icon"><i className="fa-solid fa-magnifying-glass"></i></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {upcomingVaccinations.length > 0 && (
            <div className="row mb-4">
              <div className="col-12">
                <div className="dashboard-card veterinary-card">
                  <div className="dashboard-card-body">
                    <h5 className="mb-2">{t('doctorVaccinations.upcoming')}</h5>
                    <div className="table-responsive">
                      <table className="table table-center mb-0 veterinary-table vaccination-mobile-table">
                        <thead>
                          <tr>
                            <th>{t('doctorVaccinations.pet')}</th>
                            <th>{t('doctorVaccinations.vaccine')}</th>
                            <th>{t('doctorVaccinations.due')}</th>
                            <th>{t('doctorVaccinations.owner')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {upcomingVaccinations.map((v) => (
                            <tr key={v._id || `${v.petId?._id}-${v.vaccinationType}-${v.nextDueDate}`}>
                              <td data-label="Pet">
                                <span className="badge veterinary-badge">
                                  <img
                                    src={getImageUrl(v.petId?.photo) || '/assets/img/doctors-dashboard/profile-01.jpg'}
                                    alt={t('doctorVaccinations.pet')}
                                    className="avatar avatar-xs me-1"
                                  />
                                  {v.petId?.name || '—'}
                                </span>
                              </td>
                              <td data-label="Vaccine">{v.vaccineId?.name || v.vaccinationType || '—'}</td>
                              <td data-label="Due">{formatDate(v.nextDueDate)}</td>
                              <td data-label="Owner">{v.petOwnerId?.name || v.petOwnerId?.fullName || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="row">
            <div className="col-12">
              <div className="dashboard-card veterinary-card">
                <div className="dashboard-card-body">
                  <div className="custom-table veterinary-table">
                    <div className="table-responsive">
                      <table className="table table-center mb-0 veterinary-table vaccination-mobile-table">
                        <thead>
                          <tr>
                            <th>{t('doctorVaccinations.id')}</th>
                            <th>{t('doctorVaccinations.pet')}</th>
                            <th>{t('doctorVaccinations.vaccine')}</th>
                            <th>{t('doctorVaccinations.date')}</th>
                            <th>{t('doctorVaccinations.nextDue')}</th>
                            <th>{t('doctorVaccinations.owner')}</th>
                            <th>{t('doctorVaccinations.certificate')}</th>
                            <th>{t('doctorVaccinations.action')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {isLoading ? (
                            <tr>
                              <td colSpan={8} className="text-center py-4">{t('doctorVaccinations.loading')}</td>
                            </tr>
                          ) : filteredVaccinations.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="text-center py-4">{t('doctorVaccinations.empty')}</td>
                            </tr>
                          ) : (
                            filteredVaccinations.map((v) => (
                              <tr key={v._id}>
                                <td data-label="ID">
                                  <a className="link-primary" href="#" onClick={(e) => { e.preventDefault(); setViewVaccination(v) }}>
                                    #{String(v._id).slice(-6).toUpperCase()}
                                  </a>
                                </td>
                                <td data-label="Pet">
                                  <span className="badge veterinary-badge">
                                    <img
                                      src={getImageUrl(v.petId?.photo) || '/assets/img/doctors-dashboard/profile-01.jpg'}
                                    alt={t('doctorVaccinations.pet')}
                                      className="avatar avatar-xs me-1"
                                    />
                                    {v.petId?.name || '—'}
                                  </span>
                                </td>
                                <td data-label="Vaccine">{v.vaccineId?.name || v.vaccinationType || '—'}</td>
                                <td data-label="Date">{formatDate(v.vaccinationDate)}</td>
                                <td data-label="Next due">{formatDate(v.nextDueDate)}</td>
                                <td data-label="Owner">{v.petOwnerId?.name || v.petOwnerId?.fullName || '—'}</td>
                                <td data-label="Certificate">
                                  {v.certificateUrl ? (
                                    <a href={getImageUrl(v.certificateUrl) || '#'} target="_blank" rel="noreferrer" className="link-primary">{t('doctorVaccinations.certificateView')}</a>
                                  ) : (
                                    '—'
                                  )}
                                </td>
                                <td data-label="Actions">
                                  <div className="action-item veterinary-actions">
                                    <a href="#" className="veterinary-action-btn" title={t('doctorVaccinations.view')} aria-label={t('doctorVaccinations.view')} onClick={(e) => { e.preventDefault(); setViewVaccination(v) }}>
                                      <i className="fa-solid fa-eye"></i>
                                    </a>
                                    <a href="#" className="veterinary-action-btn" title={t('doctorVaccinations.edit')} aria-label={t('doctorVaccinations.edit')} onClick={(e) => { e.preventDefault(); openEdit(v) }}>
                                      <i className="fa-solid fa-pen"></i>
                                    </a>
                                    <a href="#" className="veterinary-action-btn text-danger" title={t('doctorVaccinations.delete')} aria-label={t('doctorVaccinations.delete')} onClick={(e) => { e.preventDefault(); handleDelete(v._id) }}>
                                      <i className="fa-solid fa-trash"></i>
                                    </a>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {pagination?.pages > 1 && (
                    <div className="pagination dashboard-pagination veterinary-pagination">
                      <ul>
                        <li>
                          <a href="#" className={`page-link veterinary-page-link prev ${page <= 1 ? 'disabled' : ''}`} onClick={handlePrevPage}>
                            <i className="fa-solid fa-chevron-left me-1"></i>{t('doctorVaccinations.previous')}
                          </a>
                        </li>
                        <li>
                          <a href="#" className="page-link veterinary-page-link active" onClick={(e) => e.preventDefault()}>
                            {page}
                          </a>
                        </li>
                        <li>
                          <a href="#" className={`page-link veterinary-page-link next ${page >= pagination.pages ? 'disabled' : ''}`} onClick={handleNextPage}>
                            {t('doctorVaccinations.next')}<i className="fa-solid fa-chevron-right ms-1"></i>
                          </a>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {viewVaccination && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={() => setViewVaccination(null)}></div>
          <div className="modal fade show" style={{ display: 'block', zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{viewVaccination.vaccineId?.name || viewVaccination.vaccinationType || t('doctorVaccinations.vaccination')}</h5>
                  <button type="button" className="btn-close" onClick={() => setViewVaccination(null)} aria-label={t('doctorVaccinations.close')}></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-2"><strong>{t('doctorVaccinations.pet')}:</strong> {viewVaccination.petId?.name || '—'}</div>
                    <div className="col-md-6 mb-2"><strong>{t('doctorVaccinations.owner')}:</strong> {viewVaccination.petOwnerId?.name || viewVaccination.petOwnerId?.fullName || '—'}</div>
                    <div className="col-md-6 mb-2"><strong>{t('doctorVaccinations.date')}:</strong> {formatDate(viewVaccination.vaccinationDate)}</div>
                    <div className="col-md-6 mb-2"><strong>{t('doctorVaccinations.nextDue')}:</strong> {formatDate(viewVaccination.nextDueDate)}</div>
                    <div className="col-md-6 mb-2"><strong>{t('doctorVaccinations.batchNumber')}:</strong> {viewVaccination.batchNumber || '—'}</div>
                    <div className="col-md-6 mb-2"><strong>{t('doctorVaccinations.appointment')}:</strong> {viewVaccination.relatedAppointmentId ? String(viewVaccination.relatedAppointmentId).slice(-6).toUpperCase() : '—'}</div>
                    <div className="col-12 mb-2"><strong>{t('doctorVaccinations.notes')}:</strong> {viewVaccination.notes || '—'}</div>
                    {viewVaccination.certificateUrl && (
                      <div className="col-12 mt-2">
                        <a className="btn btn-sm btn-primary" href={getImageUrl(viewVaccination.certificateUrl)} target="_blank" rel="noreferrer">{t('doctorVaccinations.openCertificate')}</a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {showEditModal && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={() => !isSaving && setShowEditModal(false)}></div>
          <div className="modal fade show" style={{ display: 'block', zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{t('doctorVaccinations.editTitle')}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowEditModal(false)} disabled={isSaving} aria-label={t('doctorVaccinations.close')}></button>
                </div>
                <form onSubmit={handleEditSubmit}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">{t('doctorVaccinations.vaccine')}</label>
                      <select className="form-select" value={editForm.vaccineId} onChange={(e) => setEditForm((p) => ({ ...p, vaccineId: e.target.value }))}>
                        <option value="">{t('doctorVaccinations.selectVaccine')}</option>
                        {Array.isArray(vaccines) && vaccines.map((v) => (
                          <option key={v._id} value={v._id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">{t('doctorVaccinations.vaccinationDate')}</label>
                        <input type="date" className="form-control" value={editForm.vaccinationDate} onChange={(e) => setEditForm((p) => ({ ...p, vaccinationDate: e.target.value }))} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">{t('doctorVaccinations.nextDueDate')}</label>
                        <input type="date" className="form-control" value={editForm.nextDueDate} onChange={(e) => setEditForm((p) => ({ ...p, nextDueDate: e.target.value }))} />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">{t('doctorVaccinations.batchNumber')}</label>
                      <input type="text" className="form-control" value={editForm.batchNumber} onChange={(e) => setEditForm((p) => ({ ...p, batchNumber: e.target.value }))} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">{t('doctorVaccinations.notes')}</label>
                      <textarea className="form-control" rows={3} value={editForm.notes} onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}></textarea>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)} disabled={isSaving}>
                      {t('doctorVaccinations.cancel')}
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                      {isSaving ? t('doctorClinicHours.loading') : t('doctorVaccinations.save')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default DoctorVaccinations
