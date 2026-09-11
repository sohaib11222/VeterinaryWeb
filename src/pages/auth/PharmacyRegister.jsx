import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast } from 'react-toastify'
import { useAuth } from '../../contexts/AuthContext'
import InternationalPhoneInput, { isE164Phone } from '../../components/common/InternationalPhoneInput'
import { useLanguage } from '../../contexts/LanguageContext'

const pharmacyBannerImage = '/assets/img/pharmacyregister.jpg'

const PharmacyRegister = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { register: registerUser } = useAuth()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [accountType, setAccountType] = useState('pet_store')
  const schema = yup.object({
    name: yup.string().min(2, t('auth.register.nameRequired')).max(50, t('auth.register.nameRequired')).required(t('auth.register.nameRequired')),
    email: yup.string().email(t('auth.register.validEmail')).required(t('auth.register.emailRequired')),
    phone: yup.string().test('e164-phone', t('auth.verification.invalidPhone'), isE164Phone).required(t('auth.register.phoneRequired')),
    password: yup.string().min(6, t('auth.register.passwordMin')).required(t('auth.register.passwordRequired')),
    password_confirmation: yup.string().oneOf([yup.ref('password')], t('auth.register.passwordMatch')).required(t('auth.register.confirmRequired')),
  })

  useEffect(() => {
    const sp = new URLSearchParams(location.search || '')
    const t = String(sp.get('type') || '').toLowerCase()
    if (t === 'pet_store' || t === 'parapharmacy') {
      setAccountType(t)
    }
  }, [location.search])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
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

      const response = await registerUser(payload, accountType)
      toast.success(t('auth.pharmacy.registrationSuccess'))

      const role = response?.user?.role
      const status = response?.user?.status
      const isPhoneVerified = response?.user?.isPhoneVerified

      if ((role === 'PET_STORE' || role === 'PARAPHARMACY') && status === 'PENDING') {
        if (!isPhoneVerified) {
          navigate('/pharmacy-phone-verification')
          return
        }
        navigate('/pet-store-verification-upload')
        return
      }
      if (role === 'PET_STORE' || role === 'PARAPHARMACY') {
        navigate('/pharmacy-admin/dashboard')
        return
      }

      navigate('/login')
    } catch (error) {
      toast.error(error?.message || t('auth.pharmacy.registrationFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-8 offset-md-2">
              <div className="account-content">
                <div className="row align-items-center justify-content-center">
                  <div className="col-md-7 col-lg-6 login-left" style={{ display: 'block' }}>
                    <img
                      src={pharmacyBannerImage}
                      className="img-fluid"
                      alt="MyPetPlus Pharmacy Register"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.src = '/assets/img/login-banner.png'
                      }}
                    />
                  </div>
                  <div className="col-md-12 col-lg-6 login-right">
                    <div className="login-header">
                      <div className="logo-icon"><i className="fa-solid fa-briefcase-medical" /></div>
                      <h3>{t('auth.pharmacy.title')}</h3>
                      <p>{t('auth.pharmacy.subtitle')}</p>
                      <Link to="/doctor-register" className="small">{t('auth.pharmacy.veterinarianLink')}</Link>
                    </div>
                    <form className="auth-form-grid" onSubmit={handleSubmit(onSubmit)}>
                      <div className="mb-3 auth-form-grid__full">
                        <label className="form-label"><i className="fa-solid fa-building-shield me-2" />{t('auth.pharmacy.accountType')}</label>
                        <select
                          className="form-select"
                          value={accountType}
                          onChange={(e) => setAccountType(e.target.value)}
                        >
                          <option value="pet_store">{t('auth.pharmacy.pharmacy')}</option>
                          <option value="parapharmacy">{t('auth.pharmacy.parapharmacy')}</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label"><i className="fa-solid fa-user-tag me-2" />{t('auth.pharmacy.name')}</label>
                        <input type="text" className="form-control" {...register('name')} />
                        {errors.name && <div className="text-danger small mt-1">{errors.name.message}</div>}
                      </div>
                      <div className="mb-3">
                        <label className="form-label"><i className="fa-solid fa-envelope me-2" />{t('auth.pharmacy.email')}</label>
                        <input type="email" className="form-control" {...register('email')} />
                        {errors.email && <div className="text-danger small mt-1">{errors.email.message}</div>}
                      </div>
                      <div className="mb-3 auth-form-grid__full">
                        <label className="form-label"><i className="fa-solid fa-phone me-2" />{t('auth.pharmacy.phone')}</label>
                        <input type="hidden" {...register('phone')} />
                        <InternationalPhoneInput
                          value={watch('phone') || ''}
                          onChange={(phone) => setValue('phone', phone, { shouldDirty: true, shouldValidate: true })}
                          invalid={Boolean(errors.phone)}
                        />
                        <small className="text-muted d-block mt-1">{t('auth.pharmacy.phoneHint')}</small>
                        {errors.phone && <div className="text-danger small mt-1">{errors.phone.message}</div>}
                      </div>
                      <div className="mb-3">
                        <div className="form-group-flex">
                          <label className="form-label"><i className="fa-solid fa-lock me-2" />{t('auth.pharmacy.password')}</label>
                        </div>
                        <div className="pass-group">
                          <input type="password" className="form-control pass-input" {...register('password')} />
                          <span className="feather-eye-off toggle-password"></span>
                        </div>
                        {errors.password && <div className="text-danger small mt-1">{errors.password.message}</div>}
                      </div>
                      <div className="mb-3">
                        <div className="form-group-flex">
                          <label className="form-label"><i className="fa-solid fa-lock me-2" />{t('auth.pharmacy.confirmPassword')}</label>
                        </div>
                        <div className="pass-group">
                          <input type="password" className="form-control pass-input" {...register('password_confirmation')} />
                          <span className="feather-eye-off toggle-password"></span>
                        </div>
                        {errors.password_confirmation && (
                          <div className="text-danger small mt-1">{errors.password_confirmation.message}</div>
                        )}
                      </div>
                      <div className="mb-3 auth-form-grid__full">
                        <button className="btn btn-primary-gradient w-100" type="submit" disabled={loading}>
                          <><i className="fa-solid fa-arrow-right-to-bracket me-2" />{loading ? t('auth.pharmacy.submitting') : t('auth.pharmacy.submit')}</>
                        </button>
                      </div>
                      <div className="login-or auth-form-grid__full">
                        <span className="or-line"></span>
                        <span className="span-or">or</span>
                      </div>
                    
                      <div className="account-signup">
                        <p>
                          {t('auth.pharmacy.alreadyHave')} <Link to="/login">{t('common.signIn')}</Link>
                        </p>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}

export default PharmacyRegister

