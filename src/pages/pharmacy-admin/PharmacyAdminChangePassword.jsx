import EmailVerifiedPasswordChangeForm from '../../components/auth/EmailVerifiedPasswordChangeForm'

const PharmacyAdminChangePassword = () => (
  <div className="content">
    <div className="container">
      <div className="dashboard-header mb-4">
        <h3>Change Password</h3>
        <p className="text-muted mb-0">Protect your pharmacy or parapharmacy account with email verification.</p>
      </div>
      <EmailVerifiedPasswordChangeForm accountLabel="pharmacy" />
    </div>
  </div>
)

export default PharmacyAdminChangePassword
