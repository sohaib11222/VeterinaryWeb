import { useEffect, useMemo } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { usePaymentTransaction } from '../../queries'
import { getImageUrl } from '../../utils/apiConfig'

const PatientInvoiceView = () => {
  const { transactionId } = useParams()
  const location = useLocation()
  const { data, isLoading } = usePaymentTransaction(transactionId)

  const txn = useMemo(() => {
    const payload = data?.data || data
    return payload || null
  }, [data])

  const appointment = txn?.relatedAppointmentId
  const veterinarian = appointment?.veterinarianId
  const petOwner = appointment?.petOwnerId
  const pet = appointment?.petId

  useEffect(() => {
    if (isLoading || !txn) return
    const params = new URLSearchParams(location.search || '')
    const shouldPrint = params.get('print') === '1' || params.get('download') === '1'
    if (!shouldPrint) return
    const t = window.setTimeout(() => window.print(), 300)
    return () => window.clearTimeout(t)
  }, [isLoading, txn, location.search])

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

  if (!transactionId) {
    return (
      <div className="content">
        <div className="container">
          <div className="row">
            <div className="col-12">Invoice not found.</div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="content">
        <div className="container">
          <div className="row">
            <div className="col-12">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="content">
      <div className="container">
        <div className="row">
          <div className="col-lg-8 offset-lg-2">
            <div className="invoice-content">
              <div className="invoice-item">
                <div className="row">
                  <div className="col-md-6">
                    <div className="invoice-logo">
                      <img src="/assets/img/pet-logo.jpg" alt="logo" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <p className="invoice-details">
                      <strong>Order:</strong> {appointment?.appointmentNumber || txn?._id || '—'} <br />
                      <strong>Issued:</strong> {formatDate(txn?.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="invoice-item">
                <div className="row">
                  <div className="col-md-6">
                    <div className="invoice-info">
                      <strong className="customer-text">Invoice From</strong>
                      <p className="invoice-details invoice-details-two">
                        <img
                          src={getImageUrl(veterinarian?.profileImage) || '/assets/img/doctors/doctor-thumb-21.jpg'}
                          alt="Veterinarian"
                          className="avatar avatar-sm me-2"
                        />
                        {veterinarian?.name || '—'} <br />
                        {veterinarian?.email || ''}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="invoice-info invoice-info2">
                      <strong className="customer-text">Invoice To</strong>
                      <p className="invoice-details">
                        <img
                          src={getImageUrl(petOwner?.profileImage) || '/assets/img/doctors/doctor-thumb-02.jpg'}
                          alt="Pet Owner"
                          className="avatar avatar-sm me-2"
                        />
                        {petOwner?.name || '—'} <br />
                        {petOwner?.email || ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="invoice-item">
                <div className="row">
                  <div className="col-md-12">
                    <div className="invoice-info">
                      <strong className="customer-text">Payment Method</strong>
                      <p className="invoice-details invoice-details-two">
                        {txn?.provider || '—'} <br />
                        {txn?.status || ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="invoice-item invoice-table-wrap">
                <div className="row">
                  <div className="col-md-12">
                    <div className="invoice-table">
                      <div className="table-responsive">
                        <table className="table table-bordered">
                          <thead>
                            <tr>
                              <th>Description</th>
                              <th className="text-center">Quantity</th>
                              <th className="text-center">VAT</th>
                              <th className="text-end">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>
                                <img
                                  src={getImageUrl(pet?.photo) || '/assets/img/doctors-dashboard/profile-01.jpg'}
                                  alt="Pet"
                                  className="avatar avatar-sm me-2"
                                />
                                {(appointment?.reason || 'Appointment') + (pet?.name ? ` (${pet.name})` : '')}
                              </td>
                              <td className="text-center">1</td>
                              <td className="text-center">0</td>
                              <td className="text-end">{formatCurrency(txn?.amount, txn?.currency)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 col-xl-4 ms-auto">
                    <div className="table-responsive">
                      <table className="invoice-table-two table">
                        <tbody>
                          <tr>
                            <th>Subtotal:</th>
                            <td><span>{formatCurrency(txn?.amount, txn?.currency)}</span></td>
                          </tr>
                          <tr>
                            <th>Discount:</th>
                            <td><span>—</span></td>
                          </tr>
                          <tr>
                            <th>Total Amount:</th>
                            <td><span>{formatCurrency(txn?.amount, txn?.currency)}</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div className="d-flex gap-2">
                <Link to="/patient-invoices" className="btn btn-primary">
                  Back
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientInvoiceView
