import { useState } from 'react'
import { toast } from 'react-toastify'

import { usePayRescheduleFee } from '../../mutations/scheduleMutations'

const RescheduleFeePayment = ({ requestId, fee, className = 'btn btn-primary', label = 'Pay Fee', onPaid }) => {
  const [isOpen, setIsOpen] = useState(false)
  const payFee = usePayRescheduleFee()
  const numericFee = Number(fee)
  const canPay = Boolean(requestId) && Number.isFinite(numericFee) && numericFee > 0

  if (!canPay) return null

  const close = () => {
    if (!payFee.isPending) setIsOpen(false)
  }

  const confirm = async () => {
    try {
      await payFee.mutateAsync({ id: requestId, paymentMethod: 'STRIPE' })
      toast.success('Reschedule fee paid. Your appointment is confirmed.')
      setIsOpen(false)
      onPaid?.()
    } catch (error) {
      toast.error(error?.data?.message || error?.message || 'Unable to process the reschedule payment')
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={() => setIsOpen(true)} disabled={payFee.isPending}>
        <i className="fa-solid fa-credit-card me-2" />{label}
      </button>

      {isOpen && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true" aria-labelledby="reschedule-payment-title">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 id="reschedule-payment-title" className="modal-title">Confirm reschedule payment</h5>
                  <button type="button" className="btn-close" aria-label="Close" onClick={close} disabled={payFee.isPending} />
                </div>
                <div className="modal-body">
                  <p className="mb-1">Your veterinarian has approved a fee for this rescheduled appointment.</p>
                  <p className="mb-0 fs-5 fw-semibold">Amount due: €{numericFee.toFixed(2)}</p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={close} disabled={payFee.isPending}>Cancel</button>
                  <button type="button" className="btn btn-primary" onClick={confirm} disabled={payFee.isPending}>
                    {payFee.isPending ? 'Processing…' : 'Confirm payment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}
    </>
  )
}

export default RescheduleFeePayment
