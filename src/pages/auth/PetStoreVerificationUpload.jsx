import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import AuthLayout from '../../layouts/AuthLayout'
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
  {
    key: 'petStoreLicense',
    docType: 'PET_STORE_LICENSE',
    label: 'Pet Store License',
    accept: '.pdf,.jpg,.jpeg,.png',
    required: true,
  },
  {
    key: 'pharmacistDegree',
    docType: 'PET_STORE_DEGREE',
    label: 'Pharmacist Degree / Qualification',
    accept: '.pdf,.jpg,.jpeg,.png',
    required: true,
  },
  {
    key: 'ownerId',
    docType: 'PET_STORE_OWNER_ID',
    label: 'Owner Photo ID',
    accept: '.pdf,.jpg,.jpeg,.png',
    required: true,
  },
  {
    key: 'addressProof',
    docType: 'PET_STORE_ADDRESS_PROOF',
    label: 'Address Proof (utility bill / lease agreement)',
    accept: '.pdf,.jpg,.jpeg,.png',
    required: true,
  },
]

const MAX_FILE_SIZE = 10 * 1024 * 1024

const PetStoreVerificationUpload = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [filePreviews, setFilePreviews] = useState({})
  const [selectedFiles, setSelectedFiles] = useState({})

  useEffect(() => {
    const role = String(user?.role || '').toUpperCase()
    if (role === 'PET_STORE' || role === 'PARAPHARMACY') {
      if (user?.isPhoneVerified === false) {
        navigate('/pharmacy-phone-verification')
      }
    }
  }, [navigate, user?.isPhoneVerified, user?.role])

  const {
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
  })

  const handleFileChange = (fieldName, event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      toast.error(`"${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed file size is 10MB.`)
      event.target.value = ''
      return
    }

    setSelectedFiles((prev) => ({ ...prev, [fieldName]: file }))
    setValue(fieldName, file, { shouldValidate: true, shouldDirty: true, shouldTouch: true })

    const reader = new FileReader()
    reader.onloadend = () => {
      setFilePreviews((prev) => ({
        ...prev,
        [fieldName]: {
          name: file.name,
          url: reader.result,
          type: file.type,
        },
      }))
    }
    reader.readAsDataURL(file)
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
      let uploadedCount = 0
      for (const doc of DOCS) {
        const file = selectedFiles[doc.key] || data?.[doc.key]
        if (file && (file instanceof File || file instanceof Blob || typeof file?.slice === 'function')) {
          await uploadDoc(file, doc.docType)
          uploadedCount++
        }
      }

      if (uploadedCount === 0) {
        toast.error('Please select at least one document to upload.')
        setLoading(false)
        return
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
    <AuthLayout>
      <div className="content login-page pt-0">
        <div className="container-fluid">
          <div className="account-content">
            <div className="d-flex align-items-center justify-content-center">
              <div className="login-right">
                <div className="inner-right-login">
                  <div className="login-header">
                    <div className="logo-icon">
                      <img src="/assets/img/pet-logo.jpg" alt="MyPetPlus logo" />
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
                      <h3 className="my-4">Pharmacy / Parapharmacy Verification</h3>
                      <p className="text-muted mb-4">
                        Please upload the required verification documents. Your account will remain pending until admin approval.
                      </p>

                      <div className="verify-box mb-4">
                        <ul className="verify-list">
                          <li className="verify-item">Pet Store License</li>
                          <li className="verify-item">Pharmacist Degree / Qualification</li>
                          <li className="verify-item">Owner Photo ID</li>
                          <li className="verify-item">Address Proof</li>
                        </ul>
                      </div>

                      {DOCS.map((doc) => (
                        <div key={doc.key} className="mb-3">
                          <label className="mb-2">
                            {doc.label} {doc.required ? <span className="text-danger">*</span> : null}
                          </label>
                          <div className="call-option file-option">
                            <input
                              type="file"
                              id={doc.key}
                              className="option-radio"
                              accept={doc.accept}
                              onChange={(e) => handleFileChange(doc.key, e)}
                            />
                            <label htmlFor={doc.key} className="call-lable verify-lable verify-file">
                              <img src="/assets/img/icons/file.png" alt="file-icon" />
                              {filePreviews?.[doc.key]?.name ? filePreviews[doc.key].name : `Upload ${doc.label}`}
                            </label>
                          </div>
                          {errors?.[doc.key] && (
                            <div className="text-danger small mt-1">{errors[doc.key]?.message}</div>
                          )}
                        </div>
                      ))}

                      <div className="mt-5">
                        <button type="submit" className="btn btn-primary w-100 btn-lg login-btn" disabled={loading}>
                          {loading ? 'Uploading...' : 'Submit for Verification'}
                        </button>
                      </div>

                      <div className="text-center mt-3">
                        <Link to="/pharmacy-register" className="text-muted">
                          ← Back to Registration
                        </Link>
                      </div>
                    </form>
                  </div>
                </div>
                <div className="login-bottom-copyright">
                  <span>© {new Date().getFullYear()} MyPetPlus. All rights reserved.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}

export default PetStoreVerificationUpload
