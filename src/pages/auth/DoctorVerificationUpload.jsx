import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast } from 'react-toastify'

import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../utils/api'
import { API_ROUTES } from '../../utils/apiConfig'
import { useLanguage } from '../../contexts/LanguageContext'

const schema = yup.object({
  registrationCertificate: yup.mixed().required('Registration certificate is required'),
  goodStandingCertificate: yup.mixed().required('Certificate of good standing is required'),
  cv: yup.mixed().required('Curriculum Vitae is required'),
  specialistRegistration: yup.mixed().notRequired(),
  digitalSignature: yup.mixed().notRequired(),
})

const DOCUMENTS = [
  { key: 'registrationCertificate', type: 'REGISTRATION_CERTIFICATE', label: 'Veterinary registration certificate', help: 'Current registration with the Veterinary Medical Council', accept: '.pdf,.jpg,.jpeg,.png', required: true },
  { key: 'goodStandingCertificate', type: 'GOOD_STANDING_CERTIFICATE', label: 'Certificate of good standing', help: 'Issued within the last three months', accept: '.pdf,.jpg,.jpeg,.png', required: true },
  { key: 'cv', type: 'CURRICULUM_VITAE', label: 'Curriculum Vitae', help: 'Your current professional CV', accept: '.pdf,.doc,.docx', required: true },
  { key: 'specialistRegistration', type: 'SPECIALIST_REGISTRATION', label: 'Specialist registration', help: 'Optional — include this if you hold a specialist registration', accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'digitalSignature', type: 'DIGITAL_SIGNATURE', label: 'Digital signature record', help: 'Optional — signature copy and registration number', accept: '.pdf,.jpg,.jpeg,.png' },
]

const MAX_FILE_SIZE = 10 * 1024 * 1024

const DoctorVerificationUpload = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState({})
  const { handleSubmit, formState: { errors }, setValue } = useForm({ resolver: yupResolver(schema) })

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    if (String(user.role || '').toUpperCase() !== 'VETERINARIAN') {
      navigate('/', { replace: true })
      return
    }
    if (!user.isPhoneVerified) navigate('/doctor-phone-verification', { replace: true })
  }, [navigate, user])

  const handleFileChange = (key, event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`"${file.name}" is too large. The maximum file size is 10 MB.`)
      event.target.value = ''
      return
    }

    setSelectedFiles((previous) => ({ ...previous, [key]: file }))
    setValue(key, file, { shouldValidate: true, shouldDirty: true, shouldTouch: true })
  }

  const onSubmit = async (data) => {
    if (!user?.isPhoneVerified) {
      toast.error(t('auth.verification.phoneTitle'))
      navigate('/doctor-phone-verification')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      for (const document of DOCUMENTS) {
        const file = selectedFiles[document.key] || data?.[document.key]
        if (document.required && !file) throw new Error(`Please select ${document.label.toLowerCase()}`)
        if (file) {
          formData.append('veterinarianDocs', file, file.name)
          formData.append('documentType', document.type)
        }
      }

      await api.upload(API_ROUTES.UPLOAD.VETERINARIAN_DOCS, formData)
      toast.success(t('auth.verification.documentsSuccess'))
      navigate('/pending-approval')
    } catch (error) {
      toast.error(error?.message || t('auth.verification.documentsFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-pharmacy-flow auth-pharmacy-flow--documents">
      <div className="auth-pharmacy-flow__steps" aria-label={t('auth.authLayout.featuresAria')}>
        <span className="is-complete"><i className="fa-solid fa-check" /><b>{t('auth.verification.account')}</b></span>
        <span className="is-complete"><i className="fa-solid fa-check" /><b>{t('auth.verification.phone')}</b></span>
        <span className="is-active"><i className="fa-solid fa-file-shield" /><b>{t('auth.verification.documents')}</b></span>
        <span><i className="fa-solid fa-circle-check" /><b>{t('auth.verification.approval')}</b></span>
      </div>

      <div className="auth-pharmacy-flow__panel">
        <div className="auth-pharmacy-flow__header">
          <div className="logo-icon"><i className="fa-solid fa-file-shield" /></div>
          <div>
            <h3>{t('auth.authLayout.veterinaryTitle')}</h3>
            <p>Upload the required professional documents. The MyPetPlus team reviews them before approving your veterinary account.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
          <div className="auth-document-grid mt-3">
            {DOCUMENTS.map((document) => {
              const file = selectedFiles[document.key]
              return (
                <div className={`auth-document-card ${file ? 'is-selected' : ''}`} key={document.key}>
                  <div className="auth-document-card__icon"><i className={`fa-solid ${file ? 'fa-circle-check' : 'fa-file-arrow-up'}`} /></div>
                  <div className="flex-grow-1 min-width-0">
                    <label htmlFor={document.key} className="auth-document-card__title">
                      {document.label} {document.required && <span className="text-danger">*</span>}
                    </label>
                    <div className="auth-document-card__help">{file?.name || document.help}</div>
                    {errors?.[document.key] && <div className="text-danger small mt-1">{errors[document.key]?.message}</div>}
                  </div>
                  <label htmlFor={document.key} className="btn btn-sm btn-outline-primary mb-0">{file ? t('common.save') : t('common.next')}</label>
                  <input type="file" id={document.key} className="d-none" accept={document.accept} onChange={(event) => handleFileChange(document.key, event)} />
                </div>
              )
            })}
          </div>

          <div className="auth-document-footer mt-3">
            <div className="text-muted small"><i className="fa-solid fa-shield-halved me-2" />PDF, JPG, PNG, DOC, and DOCX files up to 10 MB. Your documents are used only for account verification.</div>
            <button type="submit" className="btn btn-primary-gradient" disabled={loading}>
              {loading ? t('auth.verification.sending') : t('auth.verification.verifyContinue')} <i className="fa-solid fa-arrow-right ms-2" />
            </button>
          </div>
        </form>
      </div>

      <div className="text-center mt-3"><Link to="/doctor-phone-verification" className="text-muted">{t('auth.verification.backToLogin')}</Link></div>
    </div>
  )
}

export default DoctorVerificationUpload
