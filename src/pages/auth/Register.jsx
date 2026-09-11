import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-toastify'
import { useLanguage } from '../../contexts/LanguageContext'

const Register = () => {
  const navigate = useNavigate()
  const { register: registerUser } = useAuth()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const schema = yup.object({
    name: yup.string().min(2, t('auth.register.nameRequired')).max(50, t('auth.register.nameRequired')).required(t('auth.register.nameRequired')),
    email: yup.string().email(t('auth.register.validEmail')).required(t('auth.register.emailRequired')),
    phone: yup.string().required(t('auth.register.phoneRequired')),
    password: yup.string().min(6, t('auth.register.passwordMin')).required(t('auth.register.passwordRequired')),
    password_confirmation: yup.string().oneOf([yup.ref('password')], t('auth.register.passwordMatch')).required(t('auth.register.confirmRequired')),
  })
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      }
      const response = await registerUser(payload, 'patient')
      if (response?.requiresEmailVerification) {
        toast.success(t('auth.verifyEmail.resend'))
        navigate(`/verify-email?email=${encodeURIComponent(response.email || data.email)}`, {
          state: { email: response.email || data.email },
        })
        return
      }

      toast.success(t('auth.register.success'))

      const role = response?.user?.role
      if (role === 'VETERINARIAN') {
        const status = response.user.status
        if (status === 'PENDING') {
          navigate('/doctor-verification-upload')
        } else {
          navigate('/doctor/dashboard')
        }
      } else {
        navigate('/patient/dashboard')
      }
    } catch (error) {
      toast.error(error?.message || t('auth.register.emailRequired'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="content veterinary-dashboard">
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-6 offset-md-3">
            <div className="account-content veterinary-register-container">
              <div className="account-box veterinary-register-card">
                <div className="account-wrapper veterinary-register-wrapper">
                  <div className="text-center mb-4">
                    <div className="veterinary-register-logo mb-3">
                      <i className="fa-solid fa-heart-pulse"></i>
                    </div>
                    <h3 className="account-title veterinary-register-title">
                      <i className="fa-solid fa-heart-pulse me-2"></i>{t('auth.register.title')}
                    </h3>
                    <p className="account-subtitle veterinary-register-subtitle">
                      {t('auth.register.subtitle')}
                    </p>
                  </div>
                  <form className="auth-form-grid" onSubmit={handleSubmit(onSubmit)}>
                    <div className="form-group veterinary-form-group">
                      <label className="veterinary-form-label">
                        <i className="fa-solid fa-user me-2"></i>{t('auth.register.name')}
                      </label>
                      <input
                        type="text"
                        className={`form-control veterinary-form-control ${errors.name ? 'is-invalid' : ''}`}
                        placeholder={t('auth.register.namePlaceholder')}
                        {...register('name')}
                      />
                      {errors.name && <div className="invalid-feedback veterinary-error-feedback">{errors.name.message}</div>}
                    </div>
                    <div className="form-group veterinary-form-group">
                      <label className="veterinary-form-label">
                        <i className="fa-solid fa-envelope me-2"></i>{t('auth.register.email')}
                      </label>
                      <input
                        type="email"
                        className={`form-control veterinary-form-control ${errors.email ? 'is-invalid' : ''}`}
                        placeholder={t('auth.register.emailPlaceholder')}
                        {...register('email')}
                      />
                      {errors.email && <div className="invalid-feedback veterinary-error-feedback">{errors.email.message}</div>}
                    </div>
                    <div className="form-group veterinary-form-group auth-form-grid__full">
                      <label className="veterinary-form-label">
                        <i className="fa-solid fa-phone me-2"></i>{t('auth.register.phone')}
                      </label>
                      <input
                        type="tel"
                        className={`form-control veterinary-form-control ${errors.phone ? 'is-invalid' : ''}`}
                        placeholder={t('auth.register.phonePlaceholder')}
                        {...register('phone')}
                      />
                      {errors.phone && <div className="invalid-feedback veterinary-error-feedback">{errors.phone.message}</div>}
                    </div>
                    <div className="form-group veterinary-form-group">
                      <label className="veterinary-form-label">
                        <i className="fa-solid fa-lock me-2"></i>{t('auth.register.password')}
                      </label>
                      <input
                        type="password"
                        className={`form-control veterinary-form-control ${errors.password ? 'is-invalid' : ''}`}
                        placeholder={t('auth.register.passwordPlaceholder')}
                        {...register('password')}
                      />
                      {errors.password && <div className="invalid-feedback veterinary-error-feedback">{errors.password.message}</div>}
                    </div>
                    <div className="form-group veterinary-form-group">
                      <label className="veterinary-form-label">
                        <i className="fa-solid fa-lock me-2"></i>{t('auth.register.confirmPassword')}
                      </label>
                      <input
                        type="password"
                        className={`form-control veterinary-form-control ${errors.password_confirmation ? 'is-invalid' : ''}`}
                        placeholder={t('auth.register.confirmPasswordPlaceholder')}
                        {...register('password_confirmation')}
                      />
                      {errors.password_confirmation && <div className="invalid-feedback veterinary-error-feedback">{errors.password_confirmation.message}</div>}
                    </div>
                    <div className="form-group text-center veterinary-register-btn-group auth-form-grid__full">
                      <button className="btn veterinary-btn-primary account-btn veterinary-register-btn" type="submit" disabled={loading}>
                        <i className="fa-solid fa-user-plus me-2"></i>
                        {loading ? (
                          <>
                            <i className="fa-solid fa-spinner fa-spin me-2"></i>
                            {t('auth.register.submitting')}
                          </>
                        ) : (
                          t('auth.register.submit')
                        )}
                      </button>
                    </div>
                    <div className="login-or veterinary-register-divider auth-form-grid__full">
                      <span className="or-line veterinary-or-line"></span>
                      <span className="span-or veterinary-or-text">
                        <i className="fa-solid fa-plus me-1"></i>or
                      </span>
                    </div>
                    <div className="auth-role-options auth-form-grid__full">
                      <Link to="/doctor-register" className="btn veterinary-btn-outline-primary account-btn veterinary-doctor-register-btn">
                        <i className="fa-solid fa-user-doctor me-2"></i>{t('nav.doctors')}
                      </Link>
                      <Link to="/pharmacy-register?type=pet_store" className="btn veterinary-btn-outline-primary account-btn veterinary-doctor-register-btn">
                        <i className="fa-solid fa-pills me-2"></i>{t('nav.pharmacy')}
                      </Link>
                      <Link to="/pharmacy-register?type=parapharmacy" className="btn veterinary-btn-outline-primary account-btn veterinary-doctor-register-btn">
                        <i className="fa-solid fa-prescription-bottle-medical me-2"></i>Parapharmacy
                      </Link>
                      <Link to="/pet-sitter/register" className="btn veterinary-btn-outline-primary account-btn veterinary-doctor-register-btn">
                        <i className="fa-solid fa-paw me-2"></i>{t('nav.becomePetSitter')}
                      </Link>
                    </div>
                    <div className="account-footer veterinary-register-footer">
                      <p className="veterinary-footer-text">
                        <i className="fa-solid fa-sign-in-alt me-2"></i>
                        {t('auth.register.alreadyHave')} <Link to="/login" className="veterinary-login-link">{t('auth.register.login')}</Link>
                      </p>
                      <div className="veterinary-register-features mt-3">
                        <div className="row text-center">
                          <div className="col-4">
                            <i className="fa-solid fa-shield-halved text-success mb-2"></i>
                            <p className="small mb-0">{t('auth.secureByDesign')}</p>
                          </div>
                          <div className="col-4">
                            <i className="fa-solid fa-stethoscope mb-2"></i>
                            <p className="small mb-0">Care Team</p>
                          </div>
                          <div className="col-4">
                            <i className="fa-solid fa-circle-check mb-2"></i>
                            <p className="small mb-0">Simple Setup</p>
                          </div>
                        </div>
                      </div>
                    </div>
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

export default Register

