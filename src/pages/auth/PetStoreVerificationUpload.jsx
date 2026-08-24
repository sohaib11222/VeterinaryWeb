import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast } from 'react-toastify'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../utils/api'
import { API_ROUTES } from '../../utils/apiConfig'

const schema = yup.object({
  petStoreLicense: yup.mixed().required('Pet store license is required'),
  pharmacistDegree: yup.mixed().required('Pharmacist degree is required'),
  ownerId: yup.mixed().required('Owner ID is required'),
  addressProof: yup.mixed().required('Address proof is required'),
})

const DOCS = [
  { key: 'petStoreLicense', docType: 'PET_STORE_LICENSE', label: 'Business license', help: 'Pharmacy or Parapharmacy registration document', required: true },
  { key: 'pharmacistDegree', docType: 'PET_STORE_DEGREE', label: 'Professional qualification', help: 'Pharmacist degree or relevant qualification', required: true },
  { key: 'ownerId', docType: 'PET_STORE_OWNER_ID', label: 'Owner photo ID', help: 'Valid government-issued identification', required: true },
  { key: 'addressProof', docType: 'PET_STORE_ADDRESS_PROOF', label: 'Address proof', help: 'Utility bill or lease agreement', required: true },
]

const MAX_FILE_SIZE = 10 * 1024 * 1024

const PetStoreVerificationUpload = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState({})

  useEffect(() => {
    const role = String(user?.role || '').toUpperCase()
    if ((role === 'PET_STORE' || role === 'PARAPHARMACY') && user?.isPhoneVerified === false) {
      navigate('/pharmacy-phone-verification')
    }
  }, [navigate, user?.isPhoneVerified, user?.role])

  const { handleSubmit, formState: { errors }, setValue } = useForm({ resolver: yupResolver(schema) })

  const handleFileChange = (fieldName, event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`"${file.name}" is too large. The maximum file size is 10 MB.`)
      event.target.value = ''
      return
    }
    setSelectedFiles((previous) => ({ ...previous, [fieldName]: file }))
    setValue(fieldName, file, { shouldValidate: true, shouldDirty: true, shouldTouch: true })
  }

  const uploadDoc = async (file, docType) => {
    const formData = new FormData()
    formData.append('petStore', file, file.name)
    formData.append('docType', docType)
    return api.upload(API_ROUTES.UPLOAD.PET_STORE_DOCS, formData)
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      for (const doc of DOCS) {
        const file = selectedFiles[doc.key] || data?.[doc.key]
        if (!file || !(file instanceof File || file instanceof Blob || typeof file?.slice === 'function')) {
          throw new Error(`Please select ${doc.label.toLowerCase()}`)
        }
        await uploadDoc(file, doc.docType)
      }
      toast.success('Verification documents uploaded successfully!')
      navigate('/pending-approval')
    } catch (error) {
      toast.error(error?.message || 'Failed to upload documents. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-pharmacy-flow auth-pharmacy-flow--documents">
      <div className="auth-pharmacy-flow__steps" aria-label="Registration progress">
        <span className="is-complete"><i className="fa-solid fa-check"></i><b>Account</b></span>
        <span className="is-complete"><i className="fa-solid fa-check"></i><b>Phone verification</b></span>
        <span className="is-active"><i className="fa-solid fa-file-shield"></i><b>Documents</b></span>
        <span><i className="fa-solid fa-circle-check"></i><b>Approval</b></span>
      </div>
      <div className="auth-pharmacy-flow__panel">
        <div className="auth-pharmacy-flow__header">
          <div className="logo-icon"><i className="fa-solid fa-file-shield" /></div>
          <div><h3>Verify your business</h3><p>Upload the required documents. They are reviewed by the MyPetPlus team before your account can be approved.</p></div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
          <div className="auth-document-grid mt-3">
            {DOCS.map((doc) => {
              const file = selectedFiles[doc.key]
              return (
                <div className={`auth-document-card ${file ? 'is-selected' : ''}`} key={doc.key}>
                  <div className="auth-document-card__icon"><i className={`fa-solid ${file ? 'fa-circle-check' : 'fa-file-arrow-up'}`} /></div>
                  <div className="flex-grow-1 min-width-0">
                    <label htmlFor={doc.key} className="auth-document-card__title">{doc.label} {doc.required && <span className="text-danger">*</span>}</label>
                    <div className="auth-document-card__help">{file?.name || doc.help}</div>
                    {errors?.[doc.key] && <div className="text-danger small mt-1">{errors[doc.key]?.message}</div>}
                  </div>
                  <label htmlFor={doc.key} className="btn btn-sm btn-outline-primary mb-0">{file ? 'Replace' : 'Choose file'}</label>
                  <input type="file" id={doc.key} className="d-none" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => handleFileChange(doc.key, event)} />
                </div>
              )
            })}
          </div>
          <div className="auth-document-footer mt-3">
            <div className="text-muted small"><i className="fa-solid fa-shield-halved me-2"></i>PDF, JPG, and PNG files up to 10 MB. Your documents are used only for account verification.</div>
            <button type="submit" className="btn btn-primary-gradient" disabled={loading}>{loading ? 'Uploading documents…' : 'Submit for verification'} <i className="fa-solid fa-arrow-right ms-2" /></button>
          </div>
        </form>
      </div>
      <div className="text-center mt-3"><Link to="/pharmacy-phone-verification" className="text-muted">Back to phone verification</Link></div>
    </div>
  )
}

export default PetStoreVerificationUpload
