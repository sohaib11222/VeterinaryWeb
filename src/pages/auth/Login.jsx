import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-toastify'
import { useLanguage } from '../../contexts/LanguageContext'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const schema = yup.object({
    email: yup.string().email(t('auth.login.validEmail')).required(t('auth.login.emailRequired')),
    password: yup.string().required(t('auth.login.passwordRequired')),
  })
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const response = await login(data.email, data.password)
      toast.success(t('auth.login.success'))

      const user = response?.user
      const role = user?.role
      const status = user?.status

      if (role === 'VETERINARIAN') {
        if (user?.isPhoneVerified === false) {
          navigate('/doctor-phone-verification')
        } else if (status === 'PENDING') {
          navigate('/pending-approval')
        } else if (status === 'APPROVED') {
          // On first login after approval/registration, prompt onboarding steps (profile -> timings -> subscription)
          try {
            if (!localStorage.getItem('vet_onboarding_required')) {
              localStorage.setItem('vet_onboarding_required', '1')
            }
          } catch {
            // ignore
          }
          navigate('/doctor/dashboard')
        } else {
          toast.error(t('auth.login.inactiveVet'))
          navigate('/login')
        }
      } else if (role === 'PET_OWNER') {
        navigate('/patient/dashboard')
      } else if (role === 'ADMIN') {
        toast.info('Admin panel is available in a separate application.')
        navigate('/')
      } else if (role === 'PET_STORE') {
        if (user?.isPhoneVerified === false) {
          navigate('/pharmacy-phone-verification')
        } else if (status === 'PENDING') {
          navigate('/pending-approval')
        } else if (status === 'APPROVED') {
          navigate('/pharmacy-admin/dashboard')
        } else {
          toast.error(t('auth.login.inactivePharmacy'))
          navigate('/login')
        }
      } else if (role === 'PARAPHARMACY') {
        if (user?.isPhoneVerified === false) {
          navigate('/pharmacy-phone-verification')
        } else if (status === 'PENDING') {
          navigate('/pending-approval')
        } else if (status === 'APPROVED') {
          navigate('/pharmacy-admin/dashboard')
        } else {
          toast.error(t('auth.login.inactiveParapharmacy'))
          navigate('/login')
        }
      } else if (role === 'PET_SITTER') {
        if (status === 'APPROVED') {
          navigate('/pet-sitter/dashboard')
        } else if (status === 'PENDING') {
          navigate('/pending-approval')
        } else {
          toast.error(t('auth.login.accountInactive'))
          navigate('/login')
        }
      } else {
        navigate('/patient/dashboard')
      }
    } catch (error) {
      toast.error(error?.message || t('auth.login.invalidCredentials'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="content veterinary-dashboard">
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-6 offset-md-3">
            <div className="account-content veterinary-login-container">
              <div className="account-box veterinary-login-card">
                <div className="account-wrapper veterinary-login-wrapper">
                  <div className="text-center mb-4">
                    <div className="veterinary-login-logo mb-3">
                      <i className="fa-solid fa-shield-heart"></i>
                    </div>
                    <h3 className="account-title veterinary-login-title">
                      <i className="fa-solid fa-heart-pulse me-2"></i>{t('auth.login.title')}
                    </h3>
                    <p className="account-subtitle veterinary-login-subtitle">
                      {t('auth.login.subtitle')}
                    </p>
                  </div>
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="form-group veterinary-form-group">
                      <label className="veterinary-form-label">
                        <i className="fa-solid fa-envelope me-2"></i>{t('auth.login.email')}
                      </label>
                      <input
                        type="email"
                        className={`form-control veterinary-form-control ${errors.email ? 'is-invalid' : ''}`}
                        placeholder={t('auth.login.emailPlaceholder')}
                        {...register('email')}
                      />
                      {errors.email && <div className="invalid-feedback veterinary-error-feedback">{errors.email.message}</div>}
                    </div>
                    <div className="form-group veterinary-form-group">
                      <div className="row">
                        <div className="col">
                          <label className="veterinary-form-label">
                            <i className="fa-solid fa-lock me-2"></i>{t('auth.login.password')}
                          </label>
                        </div>
                        <div className="col-auto">
                          <Link className="veterinary-forgot-link" to="/forgot-password">
                            <i className="fa-solid fa-key me-1"></i>{t('auth.login.forgotPassword')}
                          </Link>
                        </div>
                      </div>
                      <input
                        type="password"
                        className={`form-control veterinary-form-control ${errors.password ? 'is-invalid' : ''}`}
                        placeholder={t('auth.login.passwordPlaceholder')}
                        {...register('password')}
                      />
                      {errors.password && <div className="invalid-feedback veterinary-error-feedback">{errors.password.message}</div>}
                    </div>
                    <div className="form-group text-center veterinary-login-btn-group">
                      <button className="btn veterinary-btn-primary account-btn veterinary-login-btn" type="submit" disabled={loading}>
                        <i className="fa-solid fa-sign-in-alt me-2"></i>
                        {loading ? (
                          <>
                            <i className="fa-solid fa-spinner fa-spin me-2"></i>
                            {t('auth.login.submitting')}
                          </>
                        ) : (
                          t('auth.login.submit')
                        )}
                      </button>
                    </div>
                    <div className="account-footer veterinary-login-footer">
                      <p className="veterinary-footer-text">
                        <i className="fa-solid fa-user-plus me-2"></i>
                        {t('auth.login.newTo')} <Link to="/register" className="veterinary-register-link">{t('auth.login.createAccount')}</Link>
                      </p>
                      <div className="veterinary-login-features mt-3">
                        <div className="row text-center">
                          <div className="col-4">
                            <i className="fa-solid fa-shield-halved text-success mb-2"></i>
                            <p className="small mb-0">{t('auth.secureByDesign')}</p>
                          </div>
                          <div className="col-4">
                            <i className="fa-solid fa-notes-medical mb-2"></i>
                            <p className="small mb-0">Care Hub</p>
                          </div>
                          <div className="col-4">
                            <i className="fa-solid fa-calendar-check mb-2"></i>
                            <p className="small mb-0">Always Ready</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Development Test Links - Remove in production */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="mt-4 pt-3 border-top veterinary-dev-section">
                        <p className="text-muted small mb-2">
                          <i className="fa-solid fa-flask me-1"></i>🧪 Dev Test Links:
                        </p>
                        <div className="d-flex gap-2 flex-wrap">
                          <Link to="/doctor-verification-upload" className="btn btn-sm btn-outline-secondary veterinary-dev-btn">
                            <i className="fa-solid fa-file-upload me-1"></i>Test Verification
                          </Link>
                          <Link to="/pending-approval" className="btn btn-sm btn-outline-secondary veterinary-dev-btn">
                            <i className="fa-solid fa-clock me-1"></i>Test Pending
                          </Link>
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

