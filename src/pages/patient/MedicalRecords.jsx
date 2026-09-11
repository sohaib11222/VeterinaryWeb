import { Link } from 'react-router-dom'
import { useMemo, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { usePets, useMedicalRecords, useUpcomingVaccinations, useVaccinations, useMyPrescriptions, downloadPrescriptionPdf } from '../../queries'
import { useCreateMedicalRecordWithUpload, useDeleteMedicalRecord } from '../../mutations'
import { getImageUrl } from '../../utils/apiConfig'
import { useLanguage } from '../../contexts/LanguageContext'

const MedicalRecords = () => {
  const { language, t } = useLanguage()
  const [activeTab, setActiveTab] = useState('medical')

  const [search, setSearch] = useState('')
  const [selectedPetId, setSelectedPetId] = useState('')
  const [page, setPage] = useState(1)
  const [vaccinationPage, setVaccinationPage] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [viewRecord, setViewRecord] = useState(null)
  const [viewVaccination, setViewVaccination] = useState(null)

  const [addForm, setAddForm] = useState({
    petId: '',
    title: '',
    description: '',
    recordType: 'GENERAL',
    file: null,
  })

  const fileInputRef = useRef(null)

  const recordTypeFilter = useMemo(() => {
    return activeTab === 'prescription' ? 'PRESCRIPTION' : undefined
  }, [activeTab])

  const listParams = useMemo(
    () => ({
      page,
      limit: 20,
      ...(selectedPetId ? { petId: selectedPetId } : {}),
      ...(recordTypeFilter ? { recordType: recordTypeFilter } : {}),
    }),
    [page, selectedPetId, recordTypeFilter]
  )

  const { data: petsResponse } = usePets()
  const pets = petsResponse?.data || []

  const { data: recordsResponse, isLoading } = useMedicalRecords(listParams)
  const recordsPayload = recordsResponse?.data || {}
  const records = recordsPayload.records || []
  const pagination = recordsPayload.pagination || { page: 1, limit: 20, total: 0, pages: 1 }

  const vaccinationParams = useMemo(
    () => ({
      page: vaccinationPage,
      limit: 20,
      ...(selectedPetId ? { petId: selectedPetId } : {}),
    }),
    [vaccinationPage, selectedPetId]
  )

  const { data: vaccinationsResponse, isLoading: isVaccinationsLoading } = useVaccinations(vaccinationParams)
  const vaccinationsPayload = vaccinationsResponse?.data || {}
  const vaccinations = vaccinationsPayload.vaccinations || []
  const vaccinationsPagination = vaccinationsPayload.pagination || { page: 1, limit: 20, total: 0, pages: 1 }

  const { data: upcomingResponse } = useUpcomingVaccinations(selectedPetId ? { petId: selectedPetId } : {})
  const upcomingPayload = upcomingResponse?.data || {}
  const upcomingVaccinations = upcomingPayload.vaccinations || []

  const createRecord = useCreateMedicalRecordWithUpload()
  const deleteRecord = useDeleteMedicalRecord()

  const prescriptionsParams = useMemo(
    () => ({
      page: 1,
      limit: 100,
      ...(selectedPetId ? { petId: selectedPetId } : {}),
    }),
    [selectedPetId]
  )

  const { data: prescriptionsRes, isLoading: isPrescriptionsLoading } = useMyPrescriptions(prescriptionsParams, { enabled: activeTab === 'prescription' })
  const prescriptionsPayload = prescriptionsRes?.data?.data ?? prescriptionsRes?.data ?? prescriptionsRes ?? {}
  const prescriptions = prescriptionsPayload.prescriptions || []

  const filtered = useMemo(() => {
    const q = (search || '').trim().toLowerCase()
    if (!q) return records
    return records.filter((r) => {
      const title = (r.title || '').toLowerCase()
      const desc = (r.description || '').toLowerCase()
      const petName = (r.petId?.name || '').toLowerCase()
      const type = (r.recordType || '').toLowerCase()
      const fileName = (r.fileName || '').toLowerCase()
      return (
        title.includes(q) ||
        desc.includes(q) ||
        petName.includes(q) ||
        type.includes(q) ||
        fileName.includes(q)
      )
    })
  }, [records, search])

  const filteredPrescriptions = useMemo(() => {
    const q = (search || '').trim().toLowerCase()
    if (!q) return prescriptions
    return prescriptions.filter((p) => {
      const petName = (p.petId?.name || '').toLowerCase()
      const vetName = (p.veterinarianId?.fullName || p.veterinarianId?.name || '').toLowerCase()
      const dx = (p.diagnosis || '').toLowerCase()
      const notes = (p.clinicalNotes || '').toLowerCase()
      const advice = (p.advice || '').toLowerCase()
      return petName.includes(q) || vetName.includes(q) || dx.includes(q) || notes.includes(q) || advice.includes(q)
    })
  }, [prescriptions, search])

  const filteredVaccinations = useMemo(() => {
    const q = (search || '').trim().toLowerCase()
    if (!q) return vaccinations
    return vaccinations.filter((v) => {
      const type = (v.vaccinationType || '').toLowerCase()
      const petName = (v.petId?.name || '').toLowerCase()
      const vetName = (v.veterinarianId?.name || '').toLowerCase()
      const notes = (v.notes || '').toLowerCase()
      const batch = (v.batchNumber || '').toLowerCase()
      return type.includes(q) || petName.includes(q) || vetName.includes(q) || notes.includes(q) || batch.includes(q)
    })
  }, [vaccinations, search])

  const formatDate = (d) => {
    if (!d) return '—'
    const dt = new Date(d)
    if (Number.isNaN(dt.getTime())) return '—'
    return dt.toLocaleDateString(language === 'it' ? 'it-IT' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const resetAddForm = () => {
    setAddForm({ petId: selectedPetId || '', title: '', description: '', recordType: 'GENERAL', file: null })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const openAddModal = () => {
    resetAddForm()
    setShowAddModal(true)
  }


  const handleAddSubmit = async (e) => {
    e.preventDefault()

    if (!addForm.petId) {
      toast.error(t('patient.medical.selectPetError'))
      return
    }
    if (!addForm.title.trim()) {
      toast.error(t('patient.medical.titleRequired'))
      return
    }
    if (!addForm.file) {
      toast.error(t('patient.medical.fileRequired'))
      return
    }

    try {
      await createRecord.mutateAsync({
        petId: addForm.petId,
        title: addForm.title,
        description: addForm.description || null,
        recordType: addForm.recordType,
        file: addForm.file,
      })
      toast.success(t('patient.medical.created'))
      setShowAddModal(false)
    } catch (err) {
      toast.error(err?.message || t('patient.medical.createFailed'))
    }
  }

  const handleDelete = async (recordId) => {
    const ok = window.confirm(t('patient.medical.deleteConfirm'))
    if (!ok) return
    try {
      await deleteRecord.mutateAsync(recordId)
      toast.success(t('patient.medical.deleted'))
    } catch (err) {
      toast.error(err?.message || t('patient.medical.deleteFailed'))
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setPage(1)
    setVaccinationPage(1)
    setSearch('')
  }

  const handlePrevPage = (e) => {
    e.preventDefault()
    if (page > 1) setPage(page - 1)
  }

  const handleNextPage = (e) => {
    e.preventDefault()
    if (page < (pagination?.pages || 1)) setPage(page + 1)
  }

  const handlePrevVaccinationPage = (e) => {
    e.preventDefault()
    if (vaccinationPage > 1) setVaccinationPage(vaccinationPage - 1)
  }

  const handleNextVaccinationPage = (e) => {
    e.preventDefault()
    if (vaccinationPage < (vaccinationsPagination?.pages || 1)) setVaccinationPage(vaccinationPage + 1)
  }

  return (
    <>
      <div className="content veterinary-dashboard patient-medical-reports-mobile">
        <div className="container-fluid">
          <div className="row">
            <div className="col-lg-3 col-xl-2 theiaStickySidebar">
              {/* PatientSidebar will be rendered by DashboardLayout */}
            </div>
            <div className="col-lg-12 col-xl-12">
            {/* Veterinary Dashboard Header */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="veterinary-dashboard-header">
                  <h2 className="dashboard-title">
                    <i className="fa-solid fa-file-medical me-3"></i>
                    {t('patient.medical.title')}
                  </h2>
                  <p className="dashboard-subtitle">{t('patient.medical.subtitle')}</p>
                </div>
              </div>
            </div>

            {/* Records Controls */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="dashboard-card veterinary-card">
                  <div className="dashboard-card-body">
                    <div className="row align-items-center">
                      <div className="col-lg-6 mb-3 mb-lg-0">
                        <div className="appointment-tabs veterinary-tabs">
                          <ul className="nav patient-medical-tabs">
                            <li>
                              <a href="#" className={`nav-link veterinary-tab ${activeTab === 'medical' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabChange('medical') }} data-bs-toggle="tab" data-bs-target="#medical">
                                <i className="fa-solid fa-notes-medical me-2"></i>{t('patient.medical.medicalRecords')}
                              </a>
                            </li>
                            <li>
                              <a href="#" className={`nav-link veterinary-tab ${activeTab === 'prescription' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabChange('prescription') }} data-bs-toggle="tab" data-bs-target="#prescription">
                                <i className="fa-solid fa-prescription me-2"></i>{t('patient.medical.prescriptions')}
                              </a>
                            </li>
                            <li>
                              <a href="#" className={`nav-link veterinary-tab ${activeTab === 'vaccinations' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabChange('vaccinations') }} data-bs-toggle="tab" data-bs-target="#vaccinations">
                                <i className="fa-solid fa-syringe me-2"></i>{t('patient.medical.vaccinations')}
                              </a>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="d-flex justify-content-lg-end align-items-center gap-2 flex-wrap patient-medical-controls">
                          <div className="input-block dash-search-input">
                            <input
                              type="text"
                              className="form-control"
                              placeholder={t('patient.medical.search')}
                              value={search}
                              onChange={(e) => setSearch(e.target.value)}
                            />
                            <span className="search-icon"><i className="fa-solid fa-magnifying-glass"></i></span>
                          </div>
                          <div className="input-block">
                            <select
                              className="form-select"
                              value={selectedPetId}
                              onChange={(e) => {
                                setSelectedPetId(e.target.value)
                                setPage(1)
                                setVaccinationPage(1)
                              }}
                            >
                              <option value="">{t('patient.medical.allPets')}</option>
                              {pets.map((p) => (
                                <option key={p._id} value={p._id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          {activeTab === 'medical' && (
                            <button type="button" className="btn veterinary-btn-primary rounded-pill" onClick={openAddModal}>
                              <i className="fa-solid fa-plus me-2"></i>{t('patient.medical.addRecord')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="tab-content pt-0">
              <div className={`tab-pane fade ${activeTab === 'vaccinations' ? 'show active' : ''}`} id="vaccinations">
                <div className="dashboard-card veterinary-card">
                  <div className="dashboard-card-body">
                    {upcomingVaccinations.length > 0 && (
                      <div className="mb-3">
                        <h5 className="mb-2">{t('patient.medical.upcoming')}</h5>
                        <div className="table-responsive">
                          <table className="table table-center mb-0 veterinary-table medical-upcoming-table">
                            <thead>
                              <tr>
                                <th>{t('patient.appointment.pet')}</th>
                                <th>{t('patient.reports.type')}</th>
                                <th>{t('patient.medical.due')}</th>
                                <th>{t('patient.appointment.veterinarian')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {upcomingVaccinations.map((v) => (
                                <tr key={v._id || `${v.petId?._id}-${v.vaccinationType}-${v.nextDueDate}`}>
                                  <td data-label="Pet">
                                    <span className="badge veterinary-badge">
                                      <img
                                        src={getImageUrl(v.petId?.photo) || '/assets/img/doctors-dashboard/profile-01.jpg'}
                                        alt={t('patient.appointment.pet')}
                                        className="avatar avatar-xs me-1"
                                      />
                                      {v.petId?.name || '—'}
                                    </span>
                                  </td>
                                  <td data-label="Vaccine">{v.vaccinationType || '—'}</td>
                                  <td data-label="Due">{formatDate(v.nextDueDate)}</td>
                                  <td data-label="Veterinarian">{v.veterinarianId?.name || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="custom-table veterinary-table">
                      <div className="table-responsive">
                        <table className="table table-center mb-0 veterinary-table medical-vaccination-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>{t('patient.appointment.pet')}</th>
                              <th>{t('patient.reports.type')}</th>
                              <th>{t('patient.reports.date')}</th>
                              <th>{t('patient.medical.nextDue')}</th>
                              <th>{t('patient.appointment.veterinarian')}</th>
                              <th>{t('patient.medical.certificate')}</th>
                              <th>{t('patient.action')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {isVaccinationsLoading ? (
                              <tr>
                                <td colSpan={8} className="text-center py-4">{t('common.loading', 'Loading…')}</td>
                              </tr>
                            ) : filteredVaccinations.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="text-center py-4">{t('patient.medical.noVaccinations')}</td>
                              </tr>
                            ) : (
                              filteredVaccinations.map((v) => (
                                <tr key={v._id}>
                                  <td data-label="Record ID">
                                    <a className="link-primary" href="#" onClick={(e) => { e.preventDefault(); setViewVaccination(v) }}>
                                      #{String(v._id).slice(-6).toUpperCase()}
                                    </a>
                                  </td>
                                  <td data-label="Pet">
                                    <span className="badge veterinary-badge">
                                      <img
                                        src={getImageUrl(v.petId?.photo) || '/assets/img/doctors-dashboard/profile-01.jpg'}
                                        alt={t('patient.appointment.pet')}
                                        className="avatar avatar-xs me-1"
                                      />
                                      {v.petId?.name || '—'}
                                    </span>
                                  </td>
                                  <td data-label="Vaccine">{v.vaccinationType || '—'}</td>
                                  <td data-label="Date">{formatDate(v.vaccinationDate)}</td>
                                  <td data-label="Next due">{formatDate(v.nextDueDate)}</td>
                                  <td data-label="Veterinarian">{v.veterinarianId?.name || '—'}</td>
                                  <td data-label="Certificate">
                                    {v.certificateUrl ? (
                                      <a href={getImageUrl(v.certificateUrl) || '#'} target="_blank" rel="noreferrer" className="link-primary">{t('common.view', 'View')}</a>
                                    ) : (
                                      '—'
                                    )}
                                  </td>
                                  <td data-label="Actions">
                                    <div className="action-item veterinary-actions">
                                      <a href="#" className="veterinary-action-btn" title={t('common.view', 'View')} onClick={(e) => { e.preventDefault(); setViewVaccination(v) }}>
                                        <i className="fa-solid fa-eye"></i>
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

                    {vaccinationsPagination?.pages > 1 && (
                      <div className="pagination dashboard-pagination veterinary-pagination">
                        <ul>
                          <li>
                            <a href="#" className={`page-link veterinary-page-link prev ${vaccinationPage <= 1 ? 'disabled' : ''}`} onClick={handlePrevVaccinationPage}>
                              <i className="fa-solid fa-chevron-left me-1"></i>{t('patient.previous')}
                            </a>
                          </li>
                          <li>
                            <a href="#" className="page-link veterinary-page-link active" onClick={(e) => e.preventDefault()}>
                              {vaccinationPage}
                            </a>
                          </li>
                          <li>
                            <a href="#" className={`page-link veterinary-page-link next ${vaccinationPage >= vaccinationsPagination.pages ? 'disabled' : ''}`} onClick={handleNextVaccinationPage}>
                              {t('patient.next')}<i className="fa-solid fa-chevron-right ms-1"></i>
                            </a>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Prescription Tab (recordType = PRESCRIPTION) */}
              <div className={`tab-pane fade ${activeTab === 'prescription' ? 'show active' : ''}`} id="prescription">
                <div className="dashboard-card veterinary-card">
                  <div className="dashboard-card-body">
                    <div className="custom-table veterinary-table">
                      <div className="table-responsive">
                        <table className="table table-center mb-0 veterinary-table medical-prescription-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>{t('patient.reports.date')}</th>
                              <th>{t('patient.appointment.pet')}</th>
                              <th>{t('patient.appointment.veterinarian')}</th>
                              <th>{t('patient.action')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {isPrescriptionsLoading ? (
                              <tr>
                                <td colSpan={5} className="text-center py-4">{t('common.loading', 'Loading…')}</td>
                              </tr>
                            ) : filteredPrescriptions.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="text-center py-4">{t('patient.medical.noPrescriptions')}</td>
                              </tr>
                            ) : (
                              filteredPrescriptions.map((rx) => (
                                <tr key={rx._id}>
                                  <td data-label="Prescription ID">
                                    #{String(rx._id).slice(-6).toUpperCase()}
                                  </td>
                                  <td data-label="Issued">{formatDate(rx.issuedAt || rx.createdAt)}</td>
                                  <td data-label="Pet">
                                    <span className="badge veterinary-badge">
                                      <i className="fa-solid fa-paw me-1"></i>{rx.petId?.name || '—'}
                                    </span>
                                  </td>
                                  <td data-label="Veterinarian">{rx.veterinarianId?.fullName || rx.veterinarianId?.name || '—'}</td>
                                  <td data-label="Actions">
                                    <div className="action-item veterinary-actions">
                                      <Link to={`/patient/prescription?appointmentId=${rx.appointmentId?._id || rx.appointmentId}`} className="veterinary-action-btn" title={t('common.view', 'View')}>
                                        <i className="fa-solid fa-eye"></i>
                                      </Link>
                                      <a
                                        href="#"
                                        className="veterinary-action-btn"
                                        title={t('patient.pdfDownload')}
                                        onClick={async (e) => {
                                          e.preventDefault()
                                          try {
                                            const blobData = await downloadPrescriptionPdf(rx._id)
                                            const blob = blobData instanceof Blob ? blobData : new Blob([blobData], { type: 'application/pdf' })
                                            const url = window.URL.createObjectURL(blob)
                                            const a = document.createElement('a')
                                            a.href = url
                                            a.download = `prescription-${rx._id}.pdf`
                                            document.body.appendChild(a)
                                            a.click()
                                            a.remove()
                                            window.URL.revokeObjectURL(url)
                                          } catch (err) {
                                            toast.error(err?.message || t('common.unableDownload', 'Unable to download PDF'))
                                          }
                                        }}
                                      >
                                        <i className="fa-solid fa-download"></i>
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
                  </div>
                </div>
              </div>
              {/* /Prescription Tab */}

              {/* Medical Records Tab */}
              <div className={`tab-pane fade ${activeTab === 'medical' ? 'show active' : ''}`} id="medical">
                <div className="dashboard-card veterinary-card">
                  <div className="dashboard-card-body">
                    <div className="custom-table veterinary-table">
                      <div className="table-responsive">
                        <table className="table table-center mb-0 veterinary-table medical-records-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>{t('patient.medical.recordTitle')}</th>
                              <th>{t('patient.reports.type')}</th>
                              <th>{t('patient.reports.date')}</th>
                              <th>{t('patient.appointment.pet')}</th>
                              <th>{t('patient.medical.description')}</th>
                              <th>{t('patient.action')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {isLoading ? (
                              <tr>
                                <td colSpan={7} className="text-center py-4">{t('common.loading', 'Loading…')}</td>
                              </tr>
                            ) : filtered.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="text-center py-4">{t('patient.medical.noRecords')}</td>
                              </tr>
                            ) : (
                              filtered.map((record) => (
                                <tr key={record._id}>
                                  <td data-label="Record ID">
                                    <a className="link-primary" href="#" onClick={(e) => { e.preventDefault(); setViewRecord(record) }}>
                                      #{String(record._id).slice(-6).toUpperCase()}
                                    </a>
                                  </td>
                                  <td data-label="Title">
                                    <a href="#" className="lab-icon veterinary-lab-icon" onClick={(e) => { e.preventDefault(); setViewRecord(record) }}>
                                      <i className="fa-solid fa-flask me-2"></i>{record.title}
                                    </a>
                                  </td>
                                  <td data-label="Type">{record.recordType || 'GENERAL'}</td>
                                  <td data-label="Date">{formatDate(record.uploadedDate)}</td>
                                  <td data-label="Pet">{record.petId?.name || '—'}</td>
                                  <td data-label="Description"><span className="veterinary-notes">{record.description || '—'}</span></td>
                                  <td data-label="Actions">
                                    <div className="action-item veterinary-actions">
                                      <a href="#" className="veterinary-action-btn" title={t('common.view', 'View')} onClick={(e) => { e.preventDefault(); setViewRecord(record) }}>
                                        <i className="fa-solid fa-eye"></i>
                                      </a>
                                      <a href={getImageUrl(record.fileUrl) || '#'} target="_blank" rel="noreferrer" className="veterinary-action-btn" title={t('patient.reports.download')}>
                                        <i className="fa-solid fa-download"></i>
                                      </a>
                                      <a href="#" className="veterinary-action-btn text-danger" title={t('common.delete', 'Delete')} onClick={(e) => { e.preventDefault(); handleDelete(record._id) }}>
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
                              <i className="fa-solid fa-chevron-left me-1"></i>{t('patient.previous')}
                            </a>
                          </li>
                          <li>
                            <a href="#" className="page-link veterinary-page-link active" onClick={(e) => e.preventDefault()}>
                              {page}
                            </a>
                          </li>
                          <li>
                            <a href="#" className={`page-link veterinary-page-link next ${page >= pagination.pages ? 'disabled' : ''}`} onClick={handleNextPage}>
                              {t('patient.next')}<i className="fa-solid fa-chevron-right ms-1"></i>
                            </a>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* /Medical Records Tab */}
            </div>
            </div>
          </div>
        </div>
      </div>

      <MedicalRecordModals
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        addForm={addForm}
        setAddForm={setAddForm}
        pets={pets}
        fileInputRef={fileInputRef}
        handleAddSubmit={handleAddSubmit}
        createRecord={createRecord}
        viewRecord={viewRecord}
        setViewRecord={setViewRecord}
        formatDate={formatDate}
      />

      <VaccinationModals
        viewVaccination={viewVaccination}
        setViewVaccination={setViewVaccination}
        formatDate={formatDate}
      />
    </>
  )
}

const MedicalRecordModals = ({
  showAddModal,
  setShowAddModal,
  addForm,
  setAddForm,
  pets,
  fileInputRef,
  handleAddSubmit,
  createRecord,
  viewRecord,
  setViewRecord,
  formatDate,
}) => {
  const { t } = useLanguage()
  const fileUrl = viewRecord?.fileUrl ? getImageUrl(viewRecord.fileUrl) : null

  return (
    <>
      {showAddModal && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={() => setShowAddModal(false)}></div>
          <div className="modal fade show patient-medical-report-modal" style={{ display: 'block', zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{t('patient.medical.addTitle')}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
                </div>
                <form onSubmit={handleAddSubmit}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">{t('patient.appointment.pet')} <span className="text-danger">*</span></label>
                      <select className="form-select" value={addForm.petId} onChange={(e) => setAddForm((p) => ({ ...p, petId: e.target.value }))}>
                        <option value="">{t('patient.medical.selectPet')}</option>
                        {pets.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">{t('patient.medical.recordTitle')} <span className="text-danger">*</span></label>
                      <input type="text" className="form-control" value={addForm.title} onChange={(e) => setAddForm((p) => ({ ...p, title: e.target.value }))} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">{t('patient.medical.description')}</label>
                      <textarea className="form-control" rows={3} value={addForm.description} onChange={(e) => setAddForm((p) => ({ ...p, description: e.target.value }))}></textarea>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">{t('patient.medical.recordType')}</label>
                      <select className="form-select" value={addForm.recordType} onChange={(e) => setAddForm((p) => ({ ...p, recordType: e.target.value }))}>
                        <option value="GENERAL">{t('patient.medical.general')}</option>
                        <option value="LAB_REPORT">{t('patient.medical.labReport')}</option>
                        <option value="XRAY">{t('patient.medical.xray')}</option>
                        <option value="VACCINATION">{t('patient.medical.vaccinations')}</option>
                        <option value="SURGERY">{t('patient.medical.surgery')}</option>
                        <option value="WEIGHT">{t('patient.medical.weight')}</option>
                        <option value="PRESCRIPTION">{t('patient.medical.prescriptions')}</option>
                        <option value="OTHER">{t('patient.medical.other')}</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">{t('patient.medical.file')} <span className="text-danger">*</span></label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="form-control"
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={(e) => setAddForm((p) => ({ ...p, file: e.target.files?.[0] || null }))}
                      />
                      {addForm.file && (
                        <div className="mt-2">
                          <span className="badge bg-secondary">{addForm.file.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                      {t('patient.settings.cancel')}
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={createRecord.isPending}>
                      {createRecord.isPending ? t('patient.medical.uploading') : t('patient.medical.addRecord')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {viewRecord && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={() => setViewRecord(null)}></div>
          <div className="modal fade show patient-medical-report-modal" style={{ display: 'block', zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{viewRecord.title}</h5>
                  <button type="button" className="btn-close" onClick={() => setViewRecord(null)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-2"><strong>{t('patient.reports.type')}:</strong> {viewRecord.recordType || t('patient.medical.general')}</div>
                  <div className="mb-2"><strong>{t('patient.appointment.pet')}:</strong> {viewRecord.petId?.name || '—'}</div>
                  <div className="mb-2"><strong>{t('patient.reports.date')}:</strong> {formatDate(viewRecord.uploadedDate)}</div>
                  {viewRecord.description && (
                    <div className="mb-3">
                      <strong>{t('patient.medical.description')}:</strong>
                      <div className="mt-1">{viewRecord.description}</div>
                    </div>
                  )}
                  {fileUrl && (
                    <div className="d-flex gap-2 flex-wrap">
                      <a className="btn btn-sm btn-primary" href={fileUrl} target="_blank" rel="noreferrer">
                        {t('patient.reports.download')}
                      </a>
                      <a className="btn btn-sm btn-outline-secondary" href={fileUrl} target="_blank" rel="noreferrer">
                        {t('common.open', 'Open')}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default MedicalRecords

const VaccinationModals = ({
  viewVaccination,
  setViewVaccination,
  formatDate,
}) => {
  const { t } = useLanguage()
  const certificateUrl = viewVaccination?.certificateUrl ? getImageUrl(viewVaccination.certificateUrl) : null

  return (
    <>
      {viewVaccination && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={() => setViewVaccination(null)}></div>
          <div className="modal fade show patient-medical-report-modal" style={{ display: 'block', zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{viewVaccination.vaccinationType || t('patient.medical.vaccinations')}</h5>
                  <button type="button" className="btn-close" onClick={() => setViewVaccination(null)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-2"><strong>{t('patient.appointment.pet')}:</strong> {viewVaccination.petId?.name || '—'}</div>
                  <div className="mb-2"><strong>{t('patient.reports.date')}:</strong> {formatDate(viewVaccination.vaccinationDate)}</div>
                  <div className="mb-2"><strong>{t('patient.medical.nextDue')}:</strong> {formatDate(viewVaccination.nextDueDate)}</div>
                  <div className="mb-2"><strong>{t('patient.appointment.veterinarian')}:</strong> {viewVaccination.veterinarianId?.name || '—'}</div>
                  <div className="mb-2"><strong>{t('patient.medical.batchNumber')}:</strong> {viewVaccination.batchNumber || '—'}</div>
                  {viewVaccination.notes && (
                    <div className="mb-3">
                      <strong>{t('patient.appointment.notes')}:</strong>
                      <div className="mt-1">{viewVaccination.notes}</div>
                    </div>
                  )}
                  {certificateUrl && (
                    <div className="d-flex gap-2 flex-wrap">
                      <a className="btn btn-sm btn-primary" href={certificateUrl} target="_blank" rel="noreferrer">
                        {t('patient.medical.downloadCertificate')}
                      </a>
                      <a className="btn btn-sm btn-outline-secondary" href={certificateUrl} target="_blank" rel="noreferrer">
                        {t('common.open', 'Open')}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}


