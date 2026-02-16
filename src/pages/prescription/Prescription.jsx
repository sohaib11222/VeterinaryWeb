import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { useAuth } from '../../contexts/AuthContext'
import { useAppointment, usePrescriptionByAppointment, downloadPrescriptionPdf } from '../../queries'
import { useUpsertPrescriptionForAppointment } from '../../mutations'

const emptyMedication = () => ({
  name: '',
  strength: '',
  form: '',
  route: '',
  dosage: '',
  frequency: '',
  duration: '',
  quantity: '',
  refills: 0,
  instructions: '',
  substitutionAllowed: true,
  isPrn: false,
})

const Prescription = () => {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const appointmentId = searchParams.get('appointmentId')

  const isVeterinarian = String(user?.role || '').toUpperCase() === 'VETERINARIAN'
  const isPetOwner = String(user?.role || '').toUpperCase() === 'PET_OWNER'

  const { data: appointmentRes, isLoading: appointmentLoading } = useAppointment(appointmentId)
  const appointment = useMemo(() => appointmentRes?.data ?? appointmentRes, [appointmentRes])

  const appointmentStatus = String(appointment?.status || '').toUpperCase()

  const { data: rxRes, isLoading: rxLoading } = usePrescriptionByAppointment(appointmentId, {
    enabled: Boolean(appointmentId) && appointmentStatus === 'COMPLETED',
  })

  const prescription = useMemo(() => {
    if (!rxRes) return null
    return rxRes?.data ?? rxRes
  }, [rxRes])

  const upsertRx = useUpsertPrescriptionForAppointment()

  const [form, setForm] = useState({
    diagnosis: '',
    clinicalNotes: '',
    allergies: '',
    advice: '',
    followUp: '',
    testsText: '',
    medications: [emptyMedication()],
    status: 'ISSUED',
  })

  useEffect(() => {
    if (!prescription) return

    setForm({
      diagnosis: prescription.diagnosis || '',
      clinicalNotes: prescription.clinicalNotes || '',
      allergies: prescription.allergies || '',
      advice: prescription.advice || '',
      followUp: prescription.followUp || '',
      testsText: Array.isArray(prescription.tests) ? prescription.tests.join('\n') : '',
      medications:
        Array.isArray(prescription.medications) && prescription.medications.length > 0
          ? prescription.medications.map((m) => ({
            name: m.name || '',
            strength: m.strength || '',
            form: m.form || '',
            route: m.route || '',
            dosage: m.dosage || '',
            frequency: m.frequency || '',
            duration: m.duration || '',
            quantity: m.quantity || '',
            refills: typeof m.refills === 'number' ? m.refills : 0,
            instructions: m.instructions || '',
            substitutionAllowed: m.substitutionAllowed !== false,
            isPrn: m.isPrn === true,
          }))
          : [emptyMedication()],
      status: prescription.status || 'ISSUED',
    })
  }, [prescription?._id])

  const backTo = isVeterinarian
    ? `/doctor-appointment-details?id=${appointmentId}`
    : `/patient-appointment-details?id=${appointmentId}`

  const canEdit = isVeterinarian

  const updateMedication = (index, key, value) => {
    setForm((prev) => {
      const meds = [...(prev.medications || [])]
      meds[index] = { ...meds[index], [key]: value }
      return { ...prev, medications: meds }
    })
  }

  const addMedication = () => setForm((prev) => ({ ...prev, medications: [...(prev.medications || []), emptyMedication()] }))

  const removeMedication = (index) => {
    setForm((prev) => {
      const meds = [...(prev.medications || [])]
      meds.splice(index, 1)
      return { ...prev, medications: meds.length > 0 ? meds : [emptyMedication()] }
    })
  }

  const handleSave = async () => {
    if (!appointmentId) {
      toast.error('Appointment ID is required')
      return
    }

    const tests = form.testsText
      ? form.testsText.split('\n').map((t) => t.trim()).filter(Boolean)
      : []

    const medications = (form.medications || [])
      .map((m) => ({
        name: (m.name || '').trim(),
        strength: m.strength?.trim() || null,
        form: m.form?.trim() || null,
        route: m.route?.trim() || null,
        dosage: m.dosage?.trim() || null,
        frequency: m.frequency?.trim() || null,
        duration: m.duration?.trim() || null,
        quantity: m.quantity?.trim() || null,
        refills: Number.isFinite(Number(m.refills)) ? Number(m.refills) : 0,
        instructions: m.instructions?.trim() || null,
        substitutionAllowed: m.substitutionAllowed !== false,
        isPrn: m.isPrn === true,
      }))
      .filter((m) => m.name)

    try {
      await upsertRx.mutateAsync({
        appointmentId,
        data: {
          diagnosis: form.diagnosis || null,
          clinicalNotes: form.clinicalNotes || null,
          allergies: form.allergies || null,
          advice: form.advice || null,
          followUp: form.followUp || null,
          tests,
          medications,
          status: form.status,
        },
      })
      toast.success('Prescription saved successfully')
    } catch (err) {
      toast.error(err?.message || 'Failed to save prescription')
    }
  }

  const handleDownload = async () => {
    if (!prescription?._id) {
      toast.error('Prescription not available')
      return
    }

    try {
      const blobData = await downloadPrescriptionPdf(prescription._id)
      const blob = blobData instanceof Blob ? blobData : new Blob([blobData], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `prescription-${prescription._id}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(err?.message || 'Failed to download PDF')
    }
  }

  if (!appointmentId) {
    return (
      <div className="alert alert-danger">
        Appointment ID is required.
      </div>
    )
  }

  if (appointmentLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading appointment...</p>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="alert alert-danger">
        Appointment not found.
      </div>
    )
  }

  if (appointmentStatus !== 'COMPLETED') {
    return (
      <div>
        <div className="dashboard-header">
          <div className="header-back">
            <Link to={backTo} className="back-arrow">
              <i className="fa-solid fa-arrow-left"></i>
            </Link>
            <h3>Prescription</h3>
          </div>
        </div>
        <div className="alert alert-warning">
          Prescription can only be viewed after the appointment is completed.
        </div>
      </div>
    )
  }

  const appointmentNumber = appointment?.appointmentNumber || `#${String(appointment?._id || '').slice(-6)}`
  const vet = appointment?.veterinarianId || {}
  const owner = appointment?.petOwnerId || {}
  const pet = appointment?.petId || {}

  return (
    <div>
      <div className="dashboard-header">
        <div className="header-back">
          <Link to={backTo} className="back-arrow">
            <i className="fa-solid fa-arrow-left"></i>
          </Link>
          <h3>Prescription</h3>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
            <div>
              <h5 className="mb-1">Appointment {appointmentNumber}</h5>
              <div className="text-muted">Veterinarian: {vet?.fullName || vet?.name || '—'}</div>
              <div className="text-muted">Pet Owner: {owner?.fullName || owner?.name || '—'}</div>
              <div className="text-muted">Pet: {pet?.name ? `${pet.name}${pet.breed ? ` (${pet.breed})` : ''}` : '—'}</div>
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={handleDownload}
                disabled={!prescription?._id}
              >
                Download PDF
              </button>
              {canEdit && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={upsertRx.isPending}
                >
                  {upsertRx.isPending ? 'Saving...' : 'Save Prescription'}
                </button>
              )}
            </div>
          </div>

          {rxLoading && (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

          {!rxLoading && !prescription && (
            <div className="alert alert-info mt-3 mb-0">
              {isPetOwner ? 'No prescription has been issued for this appointment yet.' : 'Create the prescription below and save it to issue to the pet owner.'}
            </div>
          )}

          <div className="row mt-4">
            <div className="col-md-6 mb-3">
              <label className="form-label">Diagnosis</label>
              <textarea
                className="form-control"
                rows={3}
                value={form.diagnosis}
                onChange={(e) => setForm((p) => ({ ...p, diagnosis: e.target.value }))}
                disabled={!canEdit}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Allergies</label>
              <textarea
                className="form-control"
                rows={3}
                value={form.allergies}
                onChange={(e) => setForm((p) => ({ ...p, allergies: e.target.value }))}
                disabled={!canEdit}
              />
            </div>
            <div className="col-12 mb-3">
              <label className="form-label">Clinical Notes</label>
              <textarea
                className="form-control"
                rows={4}
                value={form.clinicalNotes}
                onChange={(e) => setForm((p) => ({ ...p, clinicalNotes: e.target.value }))}
                disabled={!canEdit}
              />
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-2">
            <h5 className="mb-0">Medications</h5>
            {canEdit && (
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={addMedication}>
                Add Medication
              </button>
            )}
          </div>

          <div className="table-responsive mt-3">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Strength</th>
                  <th>Form</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Duration</th>
                  <th>Qty</th>
                  <th>Refills</th>
                  <th>Instructions</th>
                  {canEdit && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {(form.medications || []).map((m, idx) => (
                  <tr key={idx}>
                    <td>
                      <input
                        className="form-control"
                        value={m.name}
                        onChange={(e) => updateMedication(idx, 'name', e.target.value)}
                        disabled={!canEdit}
                      />
                    </td>
                    <td>
                      <input
                        className="form-control"
                        value={m.strength}
                        onChange={(e) => updateMedication(idx, 'strength', e.target.value)}
                        disabled={!canEdit}
                      />
                    </td>
                    <td>
                      <input
                        className="form-control"
                        value={m.form}
                        onChange={(e) => updateMedication(idx, 'form', e.target.value)}
                        disabled={!canEdit}
                      />
                    </td>
                    <td>
                      <input
                        className="form-control"
                        value={m.dosage}
                        onChange={(e) => updateMedication(idx, 'dosage', e.target.value)}
                        disabled={!canEdit}
                      />
                    </td>
                    <td>
                      <input
                        className="form-control"
                        value={m.frequency}
                        onChange={(e) => updateMedication(idx, 'frequency', e.target.value)}
                        disabled={!canEdit}
                      />
                    </td>
                    <td>
                      <input
                        className="form-control"
                        value={m.duration}
                        onChange={(e) => updateMedication(idx, 'duration', e.target.value)}
                        disabled={!canEdit}
                      />
                    </td>
                    <td>
                      <input
                        className="form-control"
                        value={m.quantity}
                        onChange={(e) => updateMedication(idx, 'quantity', e.target.value)}
                        disabled={!canEdit}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control"
                        value={m.refills}
                        onChange={(e) => updateMedication(idx, 'refills', Number(e.target.value))}
                        disabled={!canEdit}
                      />
                    </td>
                    <td>
                      <input
                        className="form-control"
                        value={m.instructions}
                        onChange={(e) => updateMedication(idx, 'instructions', e.target.value)}
                        disabled={!canEdit}
                      />
                    </td>
                    {canEdit && (
                      <td>
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeMedication(idx)}>
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="row mt-4">
            <div className="col-md-6 mb-3">
              <label className="form-label">Recommended Tests (one per line)</label>
              <textarea
                className="form-control"
                rows={4}
                value={form.testsText}
                onChange={(e) => setForm((p) => ({ ...p, testsText: e.target.value }))}
                disabled={!canEdit}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Follow Up</label>
              <textarea
                className="form-control"
                rows={4}
                value={form.followUp}
                onChange={(e) => setForm((p) => ({ ...p, followUp: e.target.value }))}
                disabled={!canEdit}
              />
            </div>
            <div className="col-12 mb-3">
              <label className="form-label">Advice</label>
              <textarea
                className="form-control"
                rows={4}
                value={form.advice}
                onChange={(e) => setForm((p) => ({ ...p, advice: e.target.value }))}
                disabled={!canEdit}
              />
            </div>
          </div>

          {canEdit && (
            <div className="mt-3">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              >
                <option value="ISSUED">ISSUED</option>
                <option value="DRAFT">DRAFT</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Prescription
