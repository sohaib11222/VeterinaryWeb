import { useState } from 'react'
import { toast } from 'react-toastify'
import { api } from '../../utils/api'
import { API_ROUTES } from '../../utils/apiConfig'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'

const EmailVerifiedPasswordChangeForm = ({ accountLabel = 'account' }) => {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [codeSent, setCodeSent] = useState(false)
  const [codeVerified, setCodeVerified] = useState(false)
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [saving, setSaving] = useState(false)

  const requestCode = async () => {
    setSending(true)
    try {
      await api.post(API_ROUTES.AUTH.REQUEST_CHANGE_PASSWORD_CODE)
      setCodeSent(true)
      setCodeVerified(false)
      setCode('')
      toast.success(t('auth.changePassword.codeSent', { email: user?.email || t('auth.changePassword.fallbackEmail') }))
    } catch (error) {
      toast.error(error?.message || t('auth.changePassword.sendFailed'))
    } finally {
      setSending(false)
    }
  }

  const verifyCode = async (event) => {
    event.preventDefault()
    if (!/^\d{6}$/.test(code.trim())) {
      toast.error(t('auth.changePassword.codeInvalid'))
      return
    }

    setVerifying(true)
    try {
      await api.post(API_ROUTES.AUTH.VERIFY_CHANGE_PASSWORD_CODE, { code: code.trim() })
      setCodeVerified(true)
      toast.success(t('auth.changePassword.codeVerified'))
    } catch (error) {
      setCodeVerified(false)
      toast.error(error?.message || t('auth.changePassword.codeInvalidExpired'))
    } finally {
      setVerifying(false)
    }
  }

  const savePassword = async (event) => {
    event.preventDefault()
    if (newPassword.length < 8) {
      toast.error(t('auth.changePassword.passwordShort'))
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('auth.changePassword.passwordMismatch'))
      return
    }

    setSaving(true)
    try {
      await api.post(API_ROUTES.AUTH.CHANGE_PASSWORD, {
        code: code.trim(),
        newPassword,
      })
      toast.success(t('auth.changePassword.success'))
      setCode('')
      setNewPassword('')
      setConfirmPassword('')
      setCodeSent(false)
      setCodeVerified(false)
    } catch (error) {
      toast.error(error?.message || t('auth.changePassword.changeFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card">
      <div className="card-body">
        <div className="border-bottom pb-3 mb-4">
          <h5 className="mb-1">{t('auth.changePassword.title')}</h5>
          <p className="text-muted mb-0">
            {t('auth.changePassword.securityNote', { account: accountLabel })}
          </p>
        </div>

        <div className="mb-4 p-3 rounded" style={{ background: '#f5f8fb' }}>
          <div className="small text-muted mb-1">{t('auth.changePassword.registeredEmail')}</div>
          <strong>{user?.email || t('auth.changePassword.fallbackEmail')}</strong>
          <button type="button" className="btn btn-outline-primary btn-sm ms-3" onClick={requestCode} disabled={sending}>
            {sending ? t('auth.changePassword.sending') : codeSent ? t('auth.changePassword.resendCode') : t('auth.changePassword.sendCode')}
          </button>
        </div>

        {codeSent && !codeVerified && (
          <form onSubmit={verifyCode} className="col-md-6 px-0">
            <div className="mb-3">
              <label className="form-label">{t('auth.changePassword.codeLabel')} <span className="text-danger">*</span></label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength="6"
                className="form-control"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={t('auth.changePassword.codePlaceholder')}
                required
              />
              <small className="text-muted">{t('auth.changePassword.expiry')}</small>
            </div>
            <button type="submit" className="btn btn-primary-gradient rounded-pill" disabled={verifying}>
              {verifying ? t('auth.changePassword.verifying') : t('auth.changePassword.verifyCode')}
            </button>
          </form>
        )}

        {codeVerified && (
          <form onSubmit={savePassword} className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">{t('auth.changePassword.newPassword')} <span className="text-danger">*</span></label>
                <input
                  type="password"
                  autoComplete="new-password"
                  className="form-control"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder={t('auth.changePassword.newPasswordHint')}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">{t('auth.changePassword.confirmPassword')} <span className="text-danger">*</span></label>
                <input
                  type="password"
                  autoComplete="new-password"
                  className="form-control"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary-gradient rounded-pill" disabled={saving}>
                {saving ? t('auth.changePassword.saving') : t('auth.changePassword.save')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default EmailVerifiedPasswordChangeForm
