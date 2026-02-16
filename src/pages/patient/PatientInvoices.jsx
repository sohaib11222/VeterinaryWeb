import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePetOwnerPayments } from '../../queries'
import { getImageUrl } from '../../utils/apiConfig'

const PatientInvoices = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [petTypeFilter, setPetTypeFilter] = useState('ALL')
  const [serviceTypeFilter, setServiceTypeFilter] = useState('ALL')
  const [dateRange, setDateRange] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  const { fromDate, toDate } = useMemo(() => {
    const raw = (dateRange || '').trim()
    if (!raw) return { fromDate: undefined, toDate: undefined }
    const parts = raw.split(' - ')
    if (parts.length !== 2) return { fromDate: undefined, toDate: undefined }
    const a = parts[0]?.trim()
    const b = parts[1]?.trim()
    if (!a || !b) return { fromDate: undefined, toDate: undefined }
    return { fromDate: a, toDate: b }
  }, [dateRange])

  const { data, isLoading } = usePetOwnerPayments({
    status: statusFilter || undefined,
    fromDate,
    toDate,
    page,
    limit,
  })

  const payload = data?.data || data
  const transactions = payload?.transactions || []
  const pagination = payload?.pagination || {}
  const totalPages = Number(pagination?.pages || 1)

  useEffect(() => {
    setPage(1)
  }, [searchQuery, statusFilter, petTypeFilter, serviceTypeFilter, dateRange])

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    const d = new Date(dateString)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatCurrency = (amount, currency = 'EUR') => {
    if (amount === null || amount === undefined) return '—'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount)
  }

  const filteredTransactions = useMemo(() => {
    let rows = transactions

    if (petTypeFilter !== 'ALL') {
      rows = rows.filter((t) => {
        const species = (t.relatedAppointmentId?.petId?.species || '').toString().toLowerCase()
        if (petTypeFilter === 'DOG') return species.includes('dog')
        if (petTypeFilter === 'CAT') return species.includes('cat')
        return true
      })
    }

    if (serviceTypeFilter !== 'ALL') {
      rows = rows.filter((t) => {
        const reason = (t.relatedAppointmentId?.reason || '').toString().toLowerCase()
        if (serviceTypeFilter === 'CHECKUP') return reason.includes('checkup')
        if (serviceTypeFilter === 'SURGERY') return reason.includes('surgery')
        return true
      })
    }

    if (!searchQuery.trim()) return rows
    const q = searchQuery.toLowerCase()
    return rows.filter((t) => {
      const id = (t._id || '').toLowerCase()
      const appointmentNumber = (t.relatedAppointmentId?.appointmentNumber || '').toLowerCase()
      const vetName = (t.relatedAppointmentId?.veterinarianId?.name || '').toLowerCase()
      const petName = (t.relatedAppointmentId?.petId?.name || '').toLowerCase()
      return id.includes(q) || appointmentNumber.includes(q) || vetName.includes(q) || petName.includes(q)
    })
  }, [transactions, searchQuery, petTypeFilter, serviceTypeFilter])

  const pageNumbers = useMemo(() => {
    const pages = Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1
    const current = Number.isFinite(page) && page > 0 ? page : 1
    const start = Math.max(1, current - 2)
    const end = Math.min(pages, start + 4)
    const adjustedStart = Math.max(1, end - 4)
    const nums = []
    for (let i = adjustedStart; i <= end; i += 1) nums.push(i)
    return nums
  }, [page, totalPages])

  return (
    <div className="content veterinary-dashboard">
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
                    <i className="fa-solid fa-file-invoice-dollar me-3"></i>
                    Pet Invoices
                  </h2>
                  <p className="dashboard-subtitle">Manage your pet treatment invoices and payment history</p>
                </div>
              </div>
            </div>

            {/* Invoice Controls */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="dashboard-card veterinary-card">
                  <div className="dashboard-card-body">
                    <div className="row align-items-center">
                      <div className="col-lg-6 mb-3 mb-lg-0">
                        <div className="input-block dash-search-input">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search pet invoices..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                          <span className="search-icon"><i className="fa-solid fa-magnifying-glass"></i></span>
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="d-flex justify-content-lg-end align-items-center gap-2 flex-wrap">
                          <div className="form-sorts dropdown">
                            <a href="javascript:void(0);" className="dropdown-toggle veterinary-dropdown-btn" id="table-filter">
                              <i className="fa-solid fa-filter me-2"></i>Filter By
                            </a>
                            <div className="filter-dropdown-menu">
                              <div className="filter-set-view">
                                <div className="accordion" id="accordionExample">
                                  <div className="filter-set-content">
                                    <div className="filter-set-content-head">
                                      <a href="#" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                                        Pet Type<i className="fa-solid fa-chevron-right"></i>
                                      </a>
                                    </div>
                                    <div className="filter-set-contents accordion-collapse collapse show" id="collapseOne" data-bs-parent="#accordionExample">
                                      <ul>
                                        <li>
                                          <div className="filter-checks">
                                            <label className="checkboxs">
                                              <input
                                                type="checkbox"
                                                checked={petTypeFilter === 'ALL'}
                                                onChange={() => setPetTypeFilter('ALL')}
                                              />
                                              <span className="checkmarks"></span>
                                              <span className="check-title">All Pets</span>
                                            </label>
                                          </div>
                                        </li>
                                        <li>
                                          <div className="filter-checks">
                                            <label className="checkboxs">
                                              <input
                                                type="checkbox"
                                                checked={petTypeFilter === 'DOG'}
                                                onChange={() => setPetTypeFilter(petTypeFilter === 'DOG' ? 'ALL' : 'DOG')}
                                              />
                                              <span className="checkmarks"></span>
                                              <span className="check-title">Dogs</span>
                                            </label>
                                          </div>
                                        </li>
                                        <li>
                                          <div className="filter-checks">
                                            <label className="checkboxs">
                                              <input
                                                type="checkbox"
                                                checked={petTypeFilter === 'CAT'}
                                                onChange={() => setPetTypeFilter(petTypeFilter === 'CAT' ? 'ALL' : 'CAT')}
                                              />
                                              <span className="checkmarks"></span>
                                              <span className="check-title">Cats</span>
                                            </label>
                                          </div>
                                        </li>
                                      </ul>
                                    </div>
                                  </div>
                                  <div className="filter-set-content">
                                    <div className="filter-set-content-head">
                                      <a href="#" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                                        Service Type<i className="fa-solid fa-chevron-right"></i>
                                      </a>
                                    </div>
                                    <div className="filter-set-contents accordion-collapse collapse show" id="collapseTwo" data-bs-parent="#accordionExample">
                                      <ul>
                                        <li>
                                          <div className="filter-checks">
                                            <label className="checkboxs">
                                              <input
                                                type="checkbox"
                                                checked={serviceTypeFilter === 'ALL'}
                                                onChange={() => setServiceTypeFilter('ALL')}
                                              />
                                              <span className="checkmarks"></span>
                                              <span className="check-title">All Services</span>
                                            </label>
                                          </div>
                                        </li>
                                        <li>
                                          <div className="filter-checks">
                                            <label className="checkboxs">
                                              <input
                                                type="checkbox"
                                                checked={serviceTypeFilter === 'CHECKUP'}
                                                onChange={() => setServiceTypeFilter(serviceTypeFilter === 'CHECKUP' ? 'ALL' : 'CHECKUP')}
                                              />
                                              <span className="checkmarks"></span>
                                              <span className="check-title">Checkup</span>
                                            </label>
                                          </div>
                                        </li>
                                        <li>
                                          <div className="filter-checks">
                                            <label className="checkboxs">
                                              <input
                                                type="checkbox"
                                                checked={serviceTypeFilter === 'SURGERY'}
                                                onChange={() => setServiceTypeFilter(serviceTypeFilter === 'SURGERY' ? 'ALL' : 'SURGERY')}
                                              />
                                              <span className="checkmarks"></span>
                                              <span className="check-title">Surgery</span>
                                            </label>
                                          </div>
                                        </li>
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="position-relative daterange-wraper">
                            <div className="input-groupicon calender-input">
                              <input
                                type="text"
                                className="form-control date-range bookingrange"
                                placeholder="From Date - To Date"
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                              />
                            </div>
                            <i className="fa-solid fa-calendar-days"></i>
                          </div>
                          <div className="position-relative">
                            <select
                              className="form-select"
                              value={statusFilter}
                              onChange={(e) => setStatusFilter(e.target.value)}
                            >
                              <option value="">All Status</option>
                              <option value="SUCCESS">Success</option>
                              <option value="PENDING">Pending</option>
                              <option value="FAILED">Failed</option>
                              <option value="REFUNDED">Refunded</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-card veterinary-card">
              <div className="dashboard-card-body">
                <div className="custom-table veterinary-table">
                  <div className="table-responsive">
                    <table className="table table-center mb-0 veterinary-table">
                      <thead>
                        <tr>
                          <th>Invoice ID</th>
                          <th>Veterinarian</th>
                          <th>Pet</th>
                          <th>Service</th>
                          <th>Appointment Date</th>
                          <th>Booked on</th>
                          <th>Amount</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          <tr>
                            <td colSpan={8}>Loading...</td>
                          </tr>
                        ) : filteredTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={8}>No invoices found.</td>
                          </tr>
                        ) : (
                          filteredTransactions.map((txn) => {
                            const appointment = txn.relatedAppointmentId
                            const veterinarian = appointment?.veterinarianId
                            const pet = appointment?.petId
                            return (
                              <tr key={txn._id}>
                                <td>
                                  <Link to={`/patient-invoices/${txn._id}`} className="link-primary">
                                    {txn._id}
                                  </Link>
                                </td>
                                <td>
                                  <h2 className="table-avatar">
                                    <Link to="/doctor-profile" className="avatar avatar-sm me-2">
                                      <img
                                        className="avatar-img rounded-3"
                                        src={getImageUrl(veterinarian?.profileImage) || '/assets/img/doctors/doctor-thumb-21.jpg'}
                                        alt="Veterinarian"
                                      />
                                    </Link>
                                    <Link to="/doctor-profile">{veterinarian?.name || '—'}</Link>
                                  </h2>
                                </td>
                                <td>
                                  <span className="badge veterinary-badge">
                                    <img
                                      src={getImageUrl(pet?.photo) || '/assets/img/doctors-dashboard/profile-01.jpg'}
                                      alt="Pet"
                                      className="avatar avatar-xs me-1"
                                    />
                                    {pet?.name || '—'}
                                  </span>
                                </td>
                                <td>
                                  <span className="veterinary-service">{appointment?.reason || '—'}</span>
                                </td>
                                <td>{formatDate(appointment?.appointmentDate)}</td>
                                <td>{formatDate(txn.createdAt)}</td>
                                <td>
                                  <span className="veterinary-amount">{formatCurrency(txn.amount, txn.currency)}</span>
                                </td>
                                <td>
                                  <div className="action-item veterinary-actions">
                                    <Link to={`/patient-invoices/${txn._id}`} className="veterinary-action-btn" title="View Invoice">
                                      <i className="fa-solid fa-eye"></i>
                                    </Link>
                                    <Link
                                      to={`/patient-invoices/${txn._id}?download=1`}
                                      className="veterinary-action-btn"
                                      title="Download Invoice"
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      <i className="fa-solid fa-download"></i>
                                    </Link>
                                    <Link
                                      to={`/patient-invoices/${txn._id}?print=1`}
                                      className="veterinary-action-btn"
                                      title="Print Invoice"
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      <i className="fa-solid fa-print"></i>
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                <div className="pagination dashboard-pagination veterinary-pagination">
                  <ul>
                    <li>
                      <button
                        type="button"
                        className="page-link veterinary-page-link prev"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                      >
                        <i className="fa-solid fa-chevron-left me-1"></i>Prev
                      </button>
                    </li>
                    {pageNumbers.map((n) => (
                      <li key={n}>
                        <button
                          type="button"
                          className={`page-link veterinary-page-link ${n === page ? 'active' : ''}`}
                          onClick={() => setPage(n)}
                        >
                          {n}
                        </button>
                      </li>
                    ))}
                    <li>
                      <button
                        type="button"
                        className="page-link veterinary-page-link next"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                      >
                        Next<i className="fa-solid fa-chevron-right ms-1"></i>
                      </button>
                    </li>
                  </ul>
                </div>
                {/* /Pagination */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientInvoices

