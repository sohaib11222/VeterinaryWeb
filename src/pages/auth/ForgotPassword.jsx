import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { api } from '../../utils/api'
import { API_ROUTES } from '../../utils/apiConfig'
import { useLanguage } from '../../contexts/LanguageContext'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const requestCode = async (event) => {
    event.preventDefault()
    if (!email.trim()) {
      toast.error(t('auth.forgotPassword.emailRequired'))
      return
    }

    setLoading(true)
    try {
      await api.post(API_ROUTES.AUTH.FORGOT_PASSWORD, { email: email.trim() })
      setStep(2)
      toast.success(t('auth.forgotPassword.codeSent', { email: email.trim() }))
    } catch (error) {
      toast.error(error?.message || t('auth.forgotPassword.sending'))
    } finally {
      setLoading(false)
    }
  }

  const verifyCode = async (event) => {
    event.preventDefault()
    if (!/^\d{6}$/.test(code.trim())) {
      toast.error(t('auth.forgotPassword.codeRequired'))
      return
    }

    setLoading(true)
    try {
      await api.post(API_ROUTES.AUTH.VERIFY_RESET_CODE, { email: email.trim(), code: code.trim() })
      setStep(3)
      toast.success(t('auth.verifyEmail.success'))
    } catch (error) {
      toast.error(error?.message || t('auth.verifyEmail.codeRequired'))
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (event) => {
    event.preventDefault()
    if (newPassword.length < 8) {
      toast.error(t('auth.forgotPassword.passwordMin'))
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('auth.forgotPassword.passwordMatch'))
      return
    }

    setLoading(true)
    try {
      await api.post(API_ROUTES.AUTH.RESET_PASSWORD, {
        email: email.trim(),
        code: code.trim(),
        newPassword,
      })
      toast.success(t('auth.forgotPassword.resetSuccess'))
      navigate('/login')
    } catch (error) {
      toast.error(error?.message || t('auth.forgotPassword.resetting'))
    } finally {
      setLoading(false)
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
                  <img src="/assets/img/login-banner.png" className="img-fluid" alt="MyPetPlus password reset" />
                </div>
                <div className="col-md-12 col-lg-6 login-right">
                  <div className="login-header">
                    <div className="logo-icon"><i className="fa-solid fa-key" /></div>
                    <h3>{step === 1 ? t('auth.forgotPassword.title') : step === 2 ? t('auth.verifyEmail.title') : t('auth.forgotPassword.newPassword')}</h3>
                    <p>
                      {step === 1 && t('auth.forgotPassword.subtitle')}
                      {step === 2 && t('auth.forgotPassword.codePlaceholder')}
                      {step === 3 && t('auth.register.passwordPlaceholder')}
                    </p>
                  </div>

                  {step === 1 && (
                    <form onSubmit={requestCode}>
                      <div className="mb-3">
                        <label className="form-label"><i className="fa-solid fa-envelope me-2" />{t('auth.forgotPassword.email')}</label>
                        <input className="form-control" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                      </div>
                      <button className="btn btn-primary-gradient w-100" type="submit" disabled={loading}>
                        <i className="fa-solid fa-paper-plane me-2" />{loading ? t('auth.forgotPassword.sending') : t('auth.forgotPassword.sendCode')}
                      </button>
                    </form>
                  )}

                  {step === 2 && (
                    <form onSubmit={verifyCode}>
                      <div className="mb-3">
                        <label className="form-label">{t('auth.forgotPassword.code')}</label>
                        <input className="form-control" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength="6" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder={t('auth.forgotPassword.codePlaceholder')} required />
                        <small className="text-muted">{t('auth.verifyEmail.codePlaceholder')}</small>
                      </div>
                      <button className="btn btn-primary-gradient w-100" type="submit" disabled={loading}>
                        {loading ? t('auth.forgotPassword.verifying') : t('auth.forgotPassword.verifyCode')}
                      </button>
                      <button type="button" className="btn btn-link w-100 mt-2" onClick={() => setStep(1)} disabled={loading}>{t('auth.forgotPassword.emailPlaceholder')}</button>
                    </form>
                  )}

                  {step === 3 && (
                    <form onSubmit={resetPassword}>
                      <div className="mb-3">
                        <label className="form-label">{t('auth.forgotPassword.newPassword')}</label>
                        <input className="form-control" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength="8" placeholder={t('auth.forgotPassword.newPasswordPlaceholder')} required />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">{t('auth.forgotPassword.confirmPassword')}</label>
                        <input className="form-control" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength="8" placeholder={t('auth.forgotPassword.confirmPasswordPlaceholder')} required />
                      </div>
                      <button className="btn btn-primary-gradient w-100" type="submit" disabled={loading}>
                        {loading ? t('auth.forgotPassword.resetting') : t('auth.forgotPassword.resetPassword')}
                      </button>
                    </form>
                  )}

                  <div className="account-signup mt-3">
                    <p>{t('auth.login.password')}? <Link to="/login">{t('common.signIn')}</Link></p>
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

export default ForgotPassword
