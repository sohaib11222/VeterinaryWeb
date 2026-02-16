import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useVeterinarianInvoices } from '../../queries'
import { getImageUrl } from '../../utils/apiConfig'

const Invoices = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  const { data, isLoading } = useVeterinarianInvoices({
    status: statusFilter || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    page,
    limit,
  })

  const payload = data?.data || data
  const transactions = payload?.transactions || []
  const pagination = payload?.pagination || {}
  const totalPages = Number(pagination?.pages || 1)

  useEffect(() => {
    setPage(1)
  }, [searchQuery, statusFilter, fromDate, toDate])

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

    const from = fromDate ? new Date(fromDate) : null
    const to = toDate ? new Date(toDate) : null
    const hasFrom = from && !Number.isNaN(from.getTime())
    const hasTo = to && !Number.isNaN(to.getTime())
    if (hasFrom || hasTo) {
      rows = rows.filter((t) => {
        const raw = t.relatedAppointmentId?.appointmentDate || t.createdAt
        if (!raw) return false
        const d = new Date(raw)
        if (Number.isNaN(d.getTime())) return false
        if (hasFrom && d < from) return false
        if (hasTo && d > to) return false
        return true
      })
    }

    if (!searchQuery.trim()) return rows
    const q = searchQuery.toLowerCase()
    return rows.filter((t) => {
      const id = (t._id || '').toLowerCase()
      const ownerName = (t.relatedAppointmentId?.petOwnerId?.name || '').toLowerCase()
      const petName = (t.relatedAppointmentId?.petId?.name || '').toLowerCase()
      const appointmentNumber = (t.relatedAppointmentId?.appointmentNumber || '').toLowerCase()
      return id.includes(q) || ownerName.includes(q) || petName.includes(q) || appointmentNumber.includes(q)
    })
  }, [transactions, searchQuery, fromDate, toDate])

  const resetFilters = () => {
    setSearchQuery('')
    setStatusFilter('')
    setFromDate('')
    setToDate('')
    setPage(1)
  }

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
            {/* Sidebar is handled by DashboardLayout */}
          </div>
          <div className="col-lg-12 col-xl-12">
            {/* Veterinary Invoices Header */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="veterinary-dashboard-header">
                  <h2 className="dashboard-title">
                    <i className="fa-solid fa-file-invoice me-3"></i>
                    Veterinary Invoices
                  </h2>
                  <p className="dashboard-subtitle">Manage billing and invoices for veterinary services</p>
                </div>
              </div>
            </div>

            {/* Invoices Controls */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="dashboard-card veterinary-card">
                  <div className="dashboard-card-body">
                    <div className="row align-items-center">
                      <div className="col-lg-6 mb-3 mb-lg-0">
                        <div className="search-field veterinary-search-field">
                          <input
                            type="text"
                            className="form-control veterinary-input"
                            placeholder="Search invoices by pet name or owner..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                          <span className="search-icon"><i className="fa-solid fa-magnifying-glass"></i></span>
                        </div>
                      </div>
                      <div className="col-lg-6 text-end">
                        <div className="d-flex justify-content-lg-end align-items-center gap-2 flex-wrap">
                          <div className="form-sorts dropdown">
                            <a href="javascript:void(0);" className="dropdown-toggle veterinary-dropdown-btn" id="table-filter">
                              <i className="fa-solid fa-filter me-2"></i>Filter By
                            </a>
                            <div className="filter-dropdown-menu">
                              <div className="filter-set-view">
                                <div className="filter-set-content">
                                  <div className="filter-set-content-head">
                                    <a href="javascript:void(0);" data-bs-toggle="collapse" data-bs-target="#collapseDate" aria-expanded="false" aria-controls="collapseDate">
                                      Date Range<i className="fa-solid fa-chevron-right"></i>
                                    </a>
                                  </div>
                                  <div className="filter-set-contents accordion-collapse collapse show" id="collapseDate" data-bs-parent="#accordionExample">
                                    <ul>
                                      <li>
                                        <div className="input-block dash-search-input w-100">
                                          <input
                                            type="text"
                                            className="form-control veterinary-input"
                                            placeholder="From Date"
                                            value={fromDate}
                                            onChange={(e) => setFromDate(e.target.value)}
                                          />
                                          <span className="search-icon"><i className="fa-solid fa-calendar"></i></span>
                                        </div>
                                      </li>
                                      <li>
                                        <div className="input-block dash-search-input w-100">
                                          <input
                                            type="text"
                                            className="form-control veterinary-input"
                                            placeholder="To Date"
                                            value={toDate}
                                            onChange={(e) => setToDate(e.target.value)}
                                          />
                                          <span className="search-icon"><i className="fa-solid fa-calendar"></i></span>
                                        </div>
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                                <div className="filter-set-content">
                                  <div className="filter-set-content-head">
                                    <a href="javascript:void(0);" data-bs-toggle="collapse" data-bs-target="#collapseStatus" aria-expanded="true" aria-controls="collapseStatus">
                                      Status<i className="fa-solid fa-chevron-right"></i>
                                    </a>
                                  </div>
                                  <div className="filter-set-contents accordion-collapse collapse show" id="collapseStatus" data-bs-parent="#accordionExample">
                                    <ul>
                                      <li>
                                        <div className="filter-checks">
                                          <label className="checkboxs">
                                            <input
                                              type="checkbox"
                                              checked={statusFilter === ''}
                                              onChange={() => setStatusFilter('')}
                                            />
                                            <span className="checkmarks"></span>
                                            <span className="check-title">All Status</span>
                                          </label>
                                        </div>
                                      </li>
                                      <li>
                                        <div className="filter-checks">
                                          <label className="checkboxs">
                                            <input
                                              type="checkbox"
                                              checked={statusFilter === 'SUCCESS'}
                                              onChange={() => setStatusFilter(statusFilter === 'SUCCESS' ? '' : 'SUCCESS')}
                                            />
                                            <span className="checkmarks"></span>
                                            <span className="check-title">Paid</span>
                                          </label>
                                        </div>
                                      </li>
                                      <li>
                                        <div className="filter-checks">
                                          <label className="checkboxs">
                                            <input
                                              type="checkbox"
                                              checked={statusFilter === 'PENDING'}
                                              onChange={() => setStatusFilter(statusFilter === 'PENDING' ? '' : 'PENDING')}
                                            />
                                            <span className="checkmarks"></span>
                                            <span className="check-title">Pending</span>
                                          </label>
                                        </div>
                                      </li>
                                      <li>
                                        <div className="filter-checks">
                                          <label className="checkboxs">
                                            <input
                                              type="checkbox"
                                              checked={statusFilter === 'FAILED'}
                                              onChange={() => setStatusFilter(statusFilter === 'FAILED' ? '' : 'FAILED')}
                                            />
                                            <span className="checkmarks"></span>
                                            <span className="check-title">Overdue</span>
                                          </label>
                                        </div>
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-3">
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
                              <div className="filter-reset-btns">
                                <button type="button" className="btn veterinary-btn-secondary me-2" onClick={resetFilters}>Reset</button>
                                <button type="button" className="btn veterinary-start-btn">Filter Now</button>
                              </div>
                            </div>
                          </div>
                          <button type="button" className="btn veterinary-start-btn" disabled>
                            <i className="fa-solid fa-plus me-2"></i>New Invoice
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="row">
              <div className="col-12">
                <div className="dashboard-card veterinary-card">
                  <div className="dashboard-card-body">
                    <div className="custom-table veterinary-invoices-table">
                      <div className="table-responsive">
                        <table className="table table-center mb-0 veterinary-table">
                          <thead>
                            <tr>
                              <th>
                                <i className="fa-solid fa-hashtag me-2"></i>ID
                              </th>
                              <th>
                                <i className="fa-solid fa-user me-2"></i>Pet Owner
                              </th>
                              <th>
                                <i className="fa-solid fa-paw me-2"></i>Pet
                              </th>
                              <th>
                                <i className="fa-solid fa-calendar-check me-2"></i>Appointment Date
                              </th>
                              <th>
                                <i className="fa-solid fa-calendar-days me-2"></i>Booked on
                              </th>
                              <th>
                                <i className="fa-solid fa-dollar-sign me-2"></i>Amount
                              </th>
                              <th>
                                <i className="fa-solid fa-cog me-2"></i>Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {isLoading ? (
                              <tr>
                                <td colSpan={7}>Loading...</td>
                              </tr>
                            ) : filteredTransactions.length === 0 ? (
                              <tr>
                                <td colSpan={7}>No invoices found.</td>
                              </tr>
                            ) : (
                              filteredTransactions.map((txn) => {
                                const appointment = txn.relatedAppointmentId
                                const petOwner = appointment?.petOwnerId
                                const pet = appointment?.petId
                                return (
                                  <tr key={txn._id}>
                                    <td>
                                      <Link to={`/invoice-view/${txn._id}`} className="veterinary-invoice-link">
                                        {txn._id}
                                      </Link>
                                    </td>
                                    <td>
                                      <h2 className="table-avatar">
                                        <a href="/doctor-profile" className="avatar avatar-sm me-2">
                                          <img
                                            className="avatar-img rounded-circle veterinary-avatar"
                                            src={getImageUrl(petOwner?.profileImage) || '/assets/img/doctors/doctor-thumb-02.jpg'}
                                            alt="Pet Owner"
                                          />
                                        </a>
                                        <div className="avatar-info">
                                          <a href="/doctor-profile">{petOwner?.name || '—'}</a>
                                          <small className="text-muted">Pet Owner</small>
                                        </div>
                                      </h2>
                                    </td>
                                    <td>
                                      <div className="pet-info">
                                        <div className="pet-avatar">
                                          <img
                                            src={getImageUrl(pet?.photo) || '/assets/img/doctors-dashboard/profile-01.jpg'}
                                            alt="Pet"
                                            className="rounded-circle"
                                          />
                                        </div>
                                        <div className="pet-details">
                                          <strong>{pet?.name || '—'}</strong>
                                          <small className="text-muted">{pet?.breed || pet?.species || '—'}</small>
                                        </div>
                                      </div>
                                    </td>
                                    <td>{formatDate(appointment?.appointmentDate)}</td>
                                    <td>{formatDate(txn.createdAt)}</td>
                                    <td>
                                      <span className="veterinary-amount">{formatCurrency(txn.amount, txn.currency)}</span>
                                      <span className="badge veterinary-badge ms-2">{txn.status}</span>
                                    </td>
                                    <td>
                                      <div className="veterinary-action-buttons">
                                        <Link to={`/invoice-view/${txn._id}`} className="veterinary-action-btn view-btn" title="View Invoice">
                                          <i className="fa-solid fa-eye"></i>
                                        </Link>
                                        <Link
                                          to={`/invoice-view/${txn._id}?print=1`}
                                          className="veterinary-action-btn print-btn"
                                          title="Print Invoice"
                                          target="_blank"
                                          rel="noreferrer"
                                        >
                                          <i className="fa-solid fa-print"></i>
                                        </Link>
                                        <Link
                                          to={`/invoice-view/${txn._id}?download=1`}
                                          className="veterinary-action-btn download-btn"
                                          title="Download Invoice"
                                          target="_blank"
                                          rel="noreferrer"
                                        >
                                          <i className="fa-solid fa-download"></i>
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
                            className="page-link veterinary-page-link"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                          >
                            <i className="fa-solid fa-chevron-left"></i>
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
                            className="page-link veterinary-page-link"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                          >
                            <i className="fa-solid fa-chevron-right"></i>
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Invoices
