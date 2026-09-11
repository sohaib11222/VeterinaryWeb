import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { useAuth } from '../../contexts/AuthContext'
import { resendEmailVerification, verifyEmail } from '../../api/auth'
import { useLanguage } from '../../contexts/LanguageContext'

const VerifyEmail = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { setSession } = useAuth()
  const { t } = useLanguage()
  const [email, setEmail] = useState(location.state?.email || searchParams.get('email') || '')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedCode = code.trim()

    if (!normalizedEmail) {
      toast.error(t('auth.forgotPassword.emailRequired'))
      return
    }
    if (!/^\d{6}$/.test(normalizedCode)) {
      toast.error(t('auth.verifyEmail.codeRequired'))
      return
    }

    setLoading(true)
    try {
      const response = await verifyEmail(normalizedEmail, normalizedCode)
      setSession(response)
      toast.success(t('auth.verifyEmail.success'))
      const verifiedRole = response?.user?.role || response?.data?.user?.role || location.state?.role || searchParams.get('role')
      navigate(verifiedRole === 'PET_SITTER' ? '/pet-sitter/dashboard' : '/patient/dashboard', { replace: true })
    } catch (error) {
      toast.error(error?.message || t('auth.verifyEmail.codeRequired'))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      toast.error(t('auth.forgotPassword.emailRequired'))
      return
    }

    setResending(true)
    try {
      await resendEmailVerification(normalizedEmail)
      toast.success(t('auth.verifyEmail.resend'))
    } catch (error) {
      toast.error(error?.message || t('auth.verifyEmail.resending'))
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="content">
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-8 offset-md-2">
            <div className="account-content">
              <div className="row align-items-center justify-content-center">
                <div className="col-md-7 col-lg-6 login-left">
                  <img src="/assets/img/login-banner.png" className="img-fluid" alt="Verify MyPetPlus email" />
                </div>
                <div className="col-md-12 col-lg-6 login-right">
                  <div className="login-header">
                    <div className="logo-icon"><i className="fa-solid fa-envelope-circle-check" /></div>
                    <h3>{t('auth.verifyEmail.title')}</h3>
                    <p>{t('auth.verifyEmail.subtitle')}</p>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label className="form-label"><i className="fa-solid fa-envelope me-2" />{t('auth.forgotPassword.email')}</label>
                      <input className="form-control" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">{t('auth.verifyEmail.code')}</label>
                      <input className="form-control" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength="6" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder={t('auth.verifyEmail.codePlaceholder')} required />
                      <small className="text-muted">{t('auth.forgotPassword.codePlaceholder')}</small>
                    </div>
                    <button className="btn btn-primary-gradient w-100" type="submit" disabled={loading}>
                      <i className="fa-solid fa-check me-2" />{loading ? t('auth.verifyEmail.verifying') : t('auth.verifyEmail.verify')}
                    </button>
                    <button type="button" className="btn btn-link w-100 mt-2" onClick={handleResend} disabled={loading || resending}>
                      {resending ? t('auth.verifyEmail.resending') : t('auth.verifyEmail.resend')}
                    </button>
                  </form>

                  <div className="account-signup mt-3">
                    <p>{t('auth.verifyEmail.success')} <Link to="/login">{t('common.signIn')}</Link></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail
