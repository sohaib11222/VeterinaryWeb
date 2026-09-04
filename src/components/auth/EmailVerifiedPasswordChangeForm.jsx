import { useState } from 'react'
import { toast } from 'react-toastify'
import { api } from '../../utils/api'
import { API_ROUTES } from '../../utils/apiConfig'
import { useAuth } from '../../contexts/AuthContext'

const EmailVerifiedPasswordChangeForm = ({ accountLabel = 'account' }) => {
  const { user } = useAuth()
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
      toast.success(`A verification code has been sent to ${user?.email || 'your registered email address'}`)
    } catch (error) {
      toast.error(error?.message || 'Unable to send a verification code')
    } finally {
      setSending(false)
    }
  }

  const verifyCode = async (event) => {
    event.preventDefault()
    if (!/^\d{6}$/.test(code.trim())) {
      toast.error('Enter the 6-digit verification code from your email')
      return
    }

    setVerifying(true)
    try {
      await api.post(API_ROUTES.AUTH.VERIFY_CHANGE_PASSWORD_CODE, { code: code.trim() })
      setCodeVerified(true)
      toast.success('Email verification complete. You can now choose a new password.')
    } catch (error) {
      setCodeVerified(false)
      toast.error(error?.message || 'The verification code is invalid or expired')
    } finally {
      setVerifying(false)
    }
  }

  const savePassword = async (event) => {
    event.preventDefault()
    if (newPassword.length < 8) {
      toast.error('Your new password must be at least 8 characters long')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match')
      return
    }

    setSaving(true)
    try {
      await api.post(API_ROUTES.AUTH.CHANGE_PASSWORD, {
        code: code.trim(),
        newPassword,
      })
      toast.success('Your password has been changed successfully')
      setCode('')
      setNewPassword('')
      setConfirmPassword('')
      setCodeSent(false)
      setCodeVerified(false)
    } catch (error) {
      toast.error(error?.message || 'Unable to change your password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card">
      <div className="card-body">
        <div className="border-bottom pb-3 mb-4">
          <h5 className="mb-1">Change Password</h5>
          <p className="text-muted mb-0">
            For your security, we will verify the change through the registered email for this {accountLabel} account.
          </p>
        </div>

        <div className="mb-4 p-3 rounded" style={{ background: '#f5f8fb' }}>
          <div className="small text-muted mb-1">Registered email</div>
          <strong>{user?.email || 'Your registered email address'}</strong>
          <button type="button" className="btn btn-outline-primary btn-sm ms-3" onClick={requestCode} disabled={sending}>
            {sending ? 'Sending…' : codeSent ? 'Resend code' : 'Send verification code'}
          </button>
        </div>

        {codeSent && !codeVerified && (
          <form onSubmit={verifyCode} className="col-md-6 px-0">
            <div className="mb-3">
              <label className="form-label">Email verification code <span className="text-danger">*</span></label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength="6"
                className="form-control"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter the 6-digit code"
                required
              />
              <small className="text-muted">The code expires after 10 minutes.</small>
            </div>
            <button type="submit" className="btn btn-primary-gradient rounded-pill" disabled={verifying}>
              {verifying ? 'Verifying…' : 'Verify code'}
            </button>
          </form>
        )}

        {codeVerified && (
          <form onSubmit={savePassword} className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">New Password <span className="text-danger">*</span></label>
                <input
                  type="password"
                  autoComplete="new-password"
                  className="form-control"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Confirm New Password <span className="text-danger">*</span></label>
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
                {saving ? 'Saving…' : 'Save new password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default EmailVerifiedPasswordChangeForm
