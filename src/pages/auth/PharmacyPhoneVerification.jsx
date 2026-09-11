import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-toastify'
import { api } from '../../utils/api'
import { API_ROUTES } from '../../utils/apiConfig'
import InternationalPhoneInput, { isE164Phone } from '../../components/common/InternationalPhoneInput'
import { useLanguage } from '../../contexts/LanguageContext'

const PharmacyPhoneVerification = () => {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
  const { t } = useLanguage()

  const [phone, setPhone] = useState(user?.phone || '')
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const phoneTrimmed = useMemo(() => String(phone || '').trim(), [phone])
  const role = String(user?.role || '').toUpperCase()
  const isVeterinarian = role === 'VETERINARIAN'
  const nextPath = isVeterinarian ? '/doctor-verification-upload' : '/pet-store-verification-upload'
  const accountLabel = isVeterinarian ? t('nav.doctors') : `${t('auth.pharmacy.pharmacy')} / ${t('auth.pharmacy.parapharmacy')}`

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
      toast.error(t('auth.verification.invalidPhone'))
      return
    }
    setSending(true)
    try {
      await api.post(API_ROUTES.AUTH.SEND_PHONE_OTP, phoneTrimmed ? { phone: phoneTrimmed } : {})
      toast.success(t('auth.verification.sendAgain'))
    } catch (error) {
      toast.error(error?.data?.message || error?.message || t('auth.verification.invalidCode'))
    } finally {
      setSending(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()

    if (!code.trim()) {
      toast.error(t('auth.verifyEmail.codeRequired'))
      return
    }
    if (!isE164Phone(phoneTrimmed)) {
      toast.error(t('auth.verification.invalidPhone'))
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

      toast.success(t('auth.verification.phoneSuccess'))
      navigate(nextPath)
    } catch (error) {
      toast.error(error?.data?.message || error?.message || t('auth.verification.invalidCode'))
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="auth-pharmacy-flow">
      <div className="auth-pharmacy-flow__steps" aria-label={t('auth.authLayout.featuresAria')}>
        <span className="is-complete"><i className="fa-solid fa-check"></i><b>{t('auth.verification.account')}</b></span>
        <span className="is-active"><i className="fa-solid fa-mobile-screen-button"></i><b>{t('auth.verification.phone')}</b></span>
        <span><i className="fa-solid fa-file-shield"></i><b>{t('auth.verification.documents')}</b></span>
        <span><i className="fa-solid fa-circle-check"></i><b>{t('auth.verification.approval')}</b></span>
      </div>
      <div className="auth-pharmacy-flow__panel">
        <div className="auth-pharmacy-flow__header">
          <div className="logo-icon"><i className="fa-solid fa-mobile-screen-button" /></div>
          <div><h3>{t('auth.verification.phoneTitle')}</h3><p>{t('auth.verification.phoneDescription', { account: accountLabel })}</p></div>
        </div>
        <form onSubmit={handleVerify} className="row g-3 mt-1">
          <div className="col-md-7">
            <label className="form-label">{t('auth.verification.phoneNumber')}</label>
            <InternationalPhoneInput value={phone} onChange={setPhone} disabled={sending || verifying} />
            <small className="text-muted d-block mt-1">{t('auth.verification.codeHint')}</small>
          </div>
          <div className="col-md-5">
            <label className="form-label">{t('auth.verification.code')}</label>
            <input type="text" className="form-control" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder={t('auth.verification.enterCode')} maxLength={10} inputMode="numeric" autoComplete="one-time-code" />
          </div>
          <div className="col-md-7 d-flex align-items-center">
            <button type="button" className="btn btn-link px-0" onClick={handleResend} disabled={sending}>{sending ? t('auth.verification.sending') : t('auth.verification.sendAgain')}</button>
          </div>
          <div className="col-md-5 d-grid">
            <button className="btn btn-primary-gradient" type="submit" disabled={verifying}>{verifying ? t('auth.verification.verifying') : t('auth.verification.verifyContinue')} <i className="fa-solid fa-arrow-right ms-2" /></button>
          </div>
        </form>
      </div>
      <div className="text-center mt-3"><Link to="/login" className="text-muted">{t('auth.verification.backToLogin')}</Link></div>
    </div>
  )
}

export default PharmacyPhoneVerification
