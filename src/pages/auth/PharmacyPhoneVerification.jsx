import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-toastify'
import { api } from '../../utils/api'
import { API_ROUTES } from '../../utils/apiConfig'
import InternationalPhoneInput, { isE164Phone } from '../../components/common/InternationalPhoneInput'

const PharmacyPhoneVerification = () => {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()

  const [phone, setPhone] = useState(user?.phone || '')
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const phoneTrimmed = useMemo(() => String(phone || '').trim(), [phone])
  const role = String(user?.role || '').toUpperCase()
  const isVeterinarian = role === 'VETERINARIAN'
  const nextPath = isVeterinarian ? '/doctor-verification-upload' : '/pet-store-verification-upload'
  const accountLabel = isVeterinarian ? 'Veterinarian' : 'Pharmacy or Parapharmacy'

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    if (!['VETERINARIAN', 'PET_STORE', 'PARAPHARMACY'].includes(role)) {
      navigate('/')
      return
    }

    if (user?.isPhoneVerified) {
      navigate(nextPath)
    }
  }, [user, navigate, nextPath, role])

  const handleResend = async () => {
    if (!user) return
    if (!isE164Phone(phoneTrimmed)) {
      toast.error('Enter a valid international phone number')
      return
    }
    setSending(true)
    try {
      await api.post(API_ROUTES.AUTH.SEND_PHONE_OTP, phoneTrimmed ? { phone: phoneTrimmed } : {})
      toast.success('Verification code sent to your phone')
    } catch (error) {
      toast.error(error?.data?.message || error?.message || 'Failed to send verification code')
    } finally {
      setSending(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()

    if (!code.trim()) {
      toast.error('Please enter the verification code')
      return
    }
    if (!isE164Phone(phoneTrimmed)) {
      toast.error('Enter a valid international phone number')
      return
    }

    setVerifying(true)
    try {
      const res = await api.post(API_ROUTES.AUTH.VERIFY_PHONE_OTP, {
        code: code.trim(),
        phone: phoneTrimmed || undefined,
      })

      const payload = res?.data ?? res
      const verifiedUser = payload?.user || payload?.data?.user
      if (verifiedUser) {
        updateUser(verifiedUser)
      } else {
        updateUser({ isPhoneVerified: true })
      }

      toast.success('Phone verified successfully')
      navigate(nextPath)
    } catch (error) {
      toast.error(error?.data?.message || error?.message || 'Invalid verification code')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="auth-pharmacy-flow">
      <div className="auth-pharmacy-flow__steps" aria-label="Registration progress">
        <span className="is-complete"><i className="fa-solid fa-check"></i><b>Account</b></span>
        <span className="is-active"><i className="fa-solid fa-mobile-screen-button"></i><b>Phone verification</b></span>
        <span><i className="fa-solid fa-file-shield"></i><b>Documents</b></span>
        <span><i className="fa-solid fa-circle-check"></i><b>Approval</b></span>
      </div>
      <div className="auth-pharmacy-flow__panel">
        <div className="auth-pharmacy-flow__header">
          <div className="logo-icon"><i className="fa-solid fa-mobile-screen-button" /></div>
          <div><h3>Verify your phone number</h3><p>Enter the verification code sent to your phone to continue with your {accountLabel} application.</p></div>
        </div>
        <form onSubmit={handleVerify} className="row g-3 mt-1">
          <div className="col-md-7">
            <label className="form-label">Phone number</label>
            <InternationalPhoneInput value={phone} onChange={setPhone} disabled={sending || verifying} />
            <small className="text-muted d-block mt-1">We use the selected country code when sending your verification code.</small>
          </div>
          <div className="col-md-5">
            <label className="form-label">Verification code</label>
            <input type="text" className="form-control" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="Enter code" maxLength={10} inputMode="numeric" autoComplete="one-time-code" />
          </div>
          <div className="col-md-7 d-flex align-items-center">
            <button type="button" className="btn btn-link px-0" onClick={handleResend} disabled={sending}>{sending ? 'Sending a new code…' : 'Didn’t receive a code? Resend'}</button>
          </div>
          <div className="col-md-5 d-grid">
            <button className="btn btn-primary-gradient" type="submit" disabled={verifying}>{verifying ? 'Verifying…' : 'Verify & continue'} <i className="fa-solid fa-arrow-right ms-2" /></button>
          </div>
        </form>
      </div>
      <div className="text-center mt-3"><Link to="/login" className="text-muted">Back to login</Link></div>
    </div>
  )
}

export default PharmacyPhoneVerification
