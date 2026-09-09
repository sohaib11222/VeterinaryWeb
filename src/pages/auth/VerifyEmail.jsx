import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { useAuth } from '../../contexts/AuthContext'
import { resendEmailVerification, verifyEmail } from '../../api/auth'

const VerifyEmail = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { setSession } = useAuth()
  const [email, setEmail] = useState(location.state?.email || searchParams.get('email') || '')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedCode = code.trim()

    if (!normalizedEmail) {
      toast.error('Enter the email address used during registration')
      return
    }
    if (!/^\d{6}$/.test(normalizedCode)) {
      toast.error('Enter the 6-digit verification code from your email')
      return
    }

    setLoading(true)
    try {
      const response = await verifyEmail(normalizedEmail, normalizedCode)
      setSession(response)
      toast.success('Email verified. Your MyPetPlus account is ready.')
      const verifiedRole = response?.user?.role || response?.data?.user?.role || location.state?.role || searchParams.get('role')
      navigate(verifiedRole === 'PET_SITTER' ? '/pet-sitter/dashboard' : '/patient/dashboard', { replace: true })
    } catch (error) {
      toast.error(error?.message || 'The verification code is invalid or expired')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      toast.error('Enter your registration email first')
      return
    }

    setResending(true)
    try {
      await resendEmailVerification(normalizedEmail)
      toast.success('A new verification code has been sent.')
    } catch (error) {
      toast.error(error?.message || 'Unable to send a new verification code')
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
                    <h3>Verify your email</h3>
                    <p>Enter the code we sent to your email address to activate your MyPetPlus account.</p>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label className="form-label"><i className="fa-solid fa-envelope me-2" />Email address</label>
                      <input className="form-control" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Verification code</label>
                      <input className="form-control" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength="6" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter 6-digit code" required />
                      <small className="text-muted">The code expires after 10 minutes.</small>
                    </div>
                    <button className="btn btn-primary-gradient w-100" type="submit" disabled={loading}>
                      <i className="fa-solid fa-check me-2" />{loading ? 'Verifying…' : 'Verify email and continue'}
                    </button>
                    <button type="button" className="btn btn-link w-100 mt-2" onClick={handleResend} disabled={loading || resending}>
                      {resending ? 'Sending…' : 'Resend verification code'}
                    </button>
                  </form>

                  <div className="account-signup mt-3">
                    <p>Already verified? <Link to="/login">Sign In</Link></p>
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
