import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import { usePets, useWeightRecords } from '../../queries'
import { getImageUrl } from '../../utils/apiConfig'

const WeightRecords = () => {
  const navigate = useNavigate()
  const [selectedPetId, setSelectedPetId] = useState('')
  const [page, setPage] = useState(1)

  const { data: petsResponse } = usePets()
  const pets = petsResponse?.data || []

  const listParams = useMemo(
    () => ({
      page,
      limit: 20,
      ...(selectedPetId ? { petId: selectedPetId } : {}),
    }),
    [page, selectedPetId]
  )

  const { data: weightResponse, isLoading } = useWeightRecords(listParams)
  const payload = weightResponse?.data || {}
  const records = payload.records || []
  const pagination = payload.pagination || { page: 1, limit: 20, total: 0, pages: 1 }

  const latest = records.length > 0 ? records[0] : null

  const formatDate = (d) => {
    if (!d) return '—'
    const dt = new Date(d)
    if (Number.isNaN(dt.getTime())) return '—'
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatWeight = (w) => {
    if (!w || w.value === undefined || w.value === null) return '—'
    return `${w.value}${w.unit || 'kg'}`
  }

  const handlePrevPage = (e) => {
    e.preventDefault()
    if (page > 1) setPage(page - 1)
  }

  const handleNextPage = (e) => {
    e.preventDefault()
    if (page < (pagination?.pages || 1)) setPage(page + 1)
  }

  const handlePetChange = (e) => {
    setSelectedPetId(e.target.value)
    setPage(1)
  }

  return (
    <div className="content veterinary-dashboard">
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <div className="veterinary-dashboard-header">
              <div className="d-flex align-items-center mb-3">
                <button className="btn btn-outline-secondary me-3" onClick={() => navigate(-1)}>
                  <i className="fa-solid fa-chevron-left me-1"></i> Back
                </button>
                <h2 className="dashboard-title mb-0">
                  <i className="fa-solid fa-weight-scale me-3"></i>
                  Weight Records
                </h2>
              </div>
              <p className="dashboard-subtitle">Track your pet's weight history recorded during appointments</p>
            </div>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-12">
            <div className="dashboard-card veterinary-card">
              <div className="dashboard-card-body">
                <div className="d-flex justify-content-end align-items-center gap-2 flex-wrap">
                  <div className="input-block">
                    <select className="form-select" value={selectedPetId} onChange={handlePetChange}>
                      <option value="">All Pets</option>
                      {pets.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-12">
            <div className="dashboard-card veterinary-card">
              <div className="dashboard-card-body">
                <h5 className="mb-2">Latest Weight</h5>
                {latest ? (
                  <div className="d-flex align-items-center gap-3 flex-wrap">
                    <span className="badge veterinary-badge">
                      <img
                        src={getImageUrl(latest.petId?.photo) || '/assets/img/doctors-dashboard/profile-01.jpg'}
                        alt="Pet"
                        className="avatar avatar-xs me-1"
                      />
                      {latest.petId?.name || 'Pet'}
                    </span>
                    <span><strong>{formatWeight(latest.weight)}</strong></span>
                    <span className="text-muted">{formatDate(latest.date)}</span>
                  </div>
                ) : (
                  <div className="text-muted">No weight records yet</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="dashboard-card veterinary-card">
              <div className="dashboard-card-body">
                <div className="custom-table veterinary-table">
                  <div className="table-responsive">
                    <table className="table table-center mb-0 veterinary-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Pet</th>
                          <th>Weight</th>
                          <th>Date</th>
                          <th>Recorded By</th>
                          <th>Appointment</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          <tr>
                            <td colSpan={7} className="text-center py-4">Loading...</td>
                          </tr>
                        ) : records.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-4">No weight records found</td>
                          </tr>
                        ) : (
                          records.map((r) => (
                            <tr key={r._id}>
                              <td>#{String(r._id).slice(-6).toUpperCase()}</td>
                              <td>
                                <span className="badge veterinary-badge">
                                  <img
                                    src={getImageUrl(r.petId?.photo) || '/assets/img/doctors-dashboard/profile-01.jpg'}
                                    alt="Pet"
                                    className="avatar avatar-xs me-1"
                                  />
                                  {r.petId?.name || '—'}
                                </span>
                              </td>
                              <td>{formatWeight(r.weight)}</td>
                              <td>{formatDate(r.date)}</td>
                              <td>{r.recordedBy?.name || '—'}</td>
                              <td>{r.relatedAppointmentId ? String(r.relatedAppointmentId).slice(-6).toUpperCase() : '—'}</td>
                              <td>{r.notes || '—'}</td>
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
                          <i className="fa-solid fa-chevron-left me-1"></i>Prev
                        </a>
                      </li>
                      <li>
                        <a href="#" className="page-link veterinary-page-link active" onClick={(e) => e.preventDefault()}>
                          {page}
                        </a>
                      </li>
                      <li>
                        <a href="#" className={`page-link veterinary-page-link next ${page >= pagination.pages ? 'disabled' : ''}`} onClick={handleNextPage}>
                          Next<i className="fa-solid fa-chevron-right ms-1"></i>
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
  )
}

export default WeightRecords
