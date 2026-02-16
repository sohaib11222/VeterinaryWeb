import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { useSubscriptionPlans } from '../../queries'
import { useUpdateSubscriptionPlanPrice } from '../../mutations'

const SubscriptionPlanPrices = () => {
  const { data } = useSubscriptionPlans()
  const plans = useMemo(() => {
    const payload = data?.data ?? data
    const list = payload?.data ?? payload
    return Array.isArray(list) ? list : []
  }, [data])

  const [draftPrices, setDraftPrices] = useState({})

  const updatePrice = useUpdateSubscriptionPlanPrice()

  const getDraftValue = (plan) => {
    const key = String(plan?._id || '')
    if (!key) return ''
    const v = draftPrices[key]
    if (v === undefined || v === null || v === '') return String(plan?.price ?? '')
    return String(v)
  }

  const handleChange = (id, value) => {
    setDraftPrices((prev) => ({ ...prev, [id]: value }))
  }

  const handleSave = async (plan) => {
    const id = plan?._id
    if (!id) return

    const raw = draftPrices[String(id)]
    const price = Number(raw)

    if (Number.isNaN(price) || price < 0) {
      toast.error('Invalid price')
      return
    }

    try {
      await updatePrice.mutateAsync({ id, price })
      toast.success('Price updated')
    } catch (err) {
      toast.error(err?.message || 'Failed to update price')
    }
  }

  return (
    <div className="content container-fluid">
      <div className="page-header">
        <div className="row">
          <div className="col-sm-12">
            <h3 className="page-title">Subscription Plan Prices</h3>
            <p className="text-muted mb-0">Admin can edit plan price only.</p>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover table-center mb-0">
                  <thead>
                    <tr>
                      <th>Plan</th>
                      <th style={{ width: 180 }}>Price (EUR)</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-4 text-muted">No plans found</td>
                      </tr>
                    ) : (
                      plans.map((p) => (
                        <tr key={p._id}>
                          <td>{p?.name}</td>
                          <td>
                            <input
                              className="form-control"
                              type="number"
                              min={0}
                              step={1}
                              value={getDraftValue(p)}
                              onChange={(e) => handleChange(String(p._id), e.target.value)}
                            />
                          </td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={() => handleSave(p)}
                              disabled={updatePrice.isPending}
                            >
                              Save
                            </button>
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
    </div>
  )
}

export default SubscriptionPlanPrices
