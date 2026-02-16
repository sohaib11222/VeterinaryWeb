import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import DashboardLayout from '../../layouts/DashboardLayout'
import { useVaccines } from '../../queries'
import { useCreateVaccine, useDeleteVaccine } from '../../mutations'

const VaccineCatalog = () => {
  const [name, setName] = useState('')

  const { data } = useVaccines({ includeInactive: true })
  const vaccines = useMemo(() => data?.data || data || [], [data])

  const createVaccine = useCreateVaccine()
  const deleteVaccine = useDeleteVaccine()

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!String(name || '').trim()) {
      toast.error('Vaccine name is required')
      return
    }
    try {
      await createVaccine.mutateAsync({ name })
      toast.success('Vaccine created')
      setName('')
    } catch (err) {
      toast.error(err?.message || 'Failed to create vaccine')
    }
  }

  const handleDelete = async (id) => {
    const ok = window.confirm('Delete this vaccine?')
    if (!ok) return
    try {
      await deleteVaccine.mutateAsync(id)
      toast.success('Vaccine deleted')
    } catch (err) {
      toast.error(err?.message || 'Failed to delete vaccine')
    }
  }

  return (
    <DashboardLayout>
      <div className="page-wrapper">
        <div className="content container-fluid">
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <h3 className="page-title">Vaccine Catalog</h3>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-12">
              <div className="card">
                <div className="card-body">
                  <form className="row g-2 align-items-end" onSubmit={handleCreate}>
                    <div className="col-md-6">
                      <label className="form-label">Vaccine Name</label>
                      <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="col-md-3">
                      <button type="submit" className="btn btn-primary w-100" disabled={createVaccine.isPending}>
                        {createVaccine.isPending ? 'Saving...' : 'Add Vaccine'}
                      </button>
                    </div>
                  </form>

                  <div className="table-responsive mt-4">
                    <table className="table table-hover table-center mb-0">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Status</th>
                          <th className="text-end">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(vaccines) && vaccines.length > 0 ? (
                          vaccines.map((v) => (
                            <tr key={v._id}>
                              <td>{v.name}</td>
                              <td>{v.isActive ? 'Active' : 'Inactive'}</td>
                              <td className="text-end">
                                <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDelete(v._id)} disabled={deleteVaccine.isPending}>
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="text-center py-4">No vaccines found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default VaccineCatalog
