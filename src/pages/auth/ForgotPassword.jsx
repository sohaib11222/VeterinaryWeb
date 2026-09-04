import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { api } from '../../utils/api'
import { API_ROUTES } from '../../utils/apiConfig'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const requestCode = async (event) => {
    event.preventDefault()
    if (!email.trim()) {
      toast.error('Enter your registered email address')
      return
    }

    setLoading(true)
    try {
      await api.post(API_ROUTES.AUTH.FORGOT_PASSWORD, { email: email.trim() })
      setStep(2)
      toast.success('If this email is registered, a verification code has been sent.')
    } catch (error) {
      toast.error(error?.message || 'Unable to send the verification code')
    } finally {
      setLoading(false)
    }
  }

  const verifyCode = async (event) => {
    event.preventDefault()
    if (!/^\d{6}$/.test(code.trim())) {
      toast.error('Enter the 6-digit verification code from your email')
      return
    }

    setLoading(true)
    try {
      await api.post(API_ROUTES.AUTH.VERIFY_RESET_CODE, { email: email.trim(), code: code.trim() })
      setStep(3)
      toast.success('Email verification complete. Set your new password below.')
    } catch (error) {
      toast.error(error?.message || 'The verification code is invalid or expired')
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (event) => {
    event.preventDefault()
    if (newPassword.length < 8) {
      toast.error('Your new password must be at least 8 characters long')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match')
      return
    }

    setLoading(true)
    try {
      await api.post(API_ROUTES.AUTH.RESET_PASSWORD, {
        email: email.trim(),
        code: code.trim(),
        newPassword,
      })
      toast.success('Password reset successfully. You can now sign in.')
      navigate('/login')
    } catch (error) {
      toast.error(error?.message || 'Unable to reset your password')
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
                    <h3>{step === 1 ? 'Reset your password' : step === 2 ? 'Verify your email' : 'Set a new password'}</h3>
                    <p>
                      {step === 1 && 'Enter your registered email address and we will send a verification code.'}
                      {step === 2 && `Enter the 6-digit code sent to ${email}.`}
                      {step === 3 && 'Choose a secure new password for your MyPetPlus account.'}
                    </p>
                  </div>

                  {step === 1 && (
                    <form onSubmit={requestCode}>
                      <div className="mb-3">
                        <label className="form-label"><i className="fa-solid fa-envelope me-2" />Email address</label>
                        <input className="form-control" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                      </div>
                      <button className="btn btn-primary-gradient w-100" type="submit" disabled={loading}>
                        <i className="fa-solid fa-paper-plane me-2" />{loading ? 'Sending…' : 'Send verification code'}
                      </button>
                    </form>
                  )}

                  {step === 2 && (
                    <form onSubmit={verifyCode}>
                      <div className="mb-3">
                        <label className="form-label">Verification code</label>
                        <input className="form-control" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength="6" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter 6-digit code" required />
                        <small className="text-muted">The code expires after 10 minutes.</small>
                      </div>
                      <button className="btn btn-primary-gradient w-100" type="submit" disabled={loading}>
                        {loading ? 'Verifying…' : 'Verify code'}
                      </button>
                      <button type="button" className="btn btn-link w-100 mt-2" onClick={() => setStep(1)} disabled={loading}>Use a different email</button>
                    </form>
                  )}

                  {step === 3 && (
                    <form onSubmit={resetPassword}>
                      <div className="mb-3">
                        <label className="form-label">New password</label>
                        <input className="form-control" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength="8" required />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Confirm new password</label>
                        <input className="form-control" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength="8" required />
                      </div>
                      <button className="btn btn-primary-gradient w-100" type="submit" disabled={loading}>
                        {loading ? 'Saving…' : 'Reset password'}
                      </button>
                    </form>
                  )}

                  <div className="account-signup mt-3">
                    <p>Remember your password? <Link to="/login">Sign In</Link></p>
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
