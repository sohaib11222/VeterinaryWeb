import EmailVerifiedPasswordChangeForm from '../../components/auth/EmailVerifiedPasswordChangeForm'

const DoctorChangePassword = () => (
  <div className="content veterinary-dashboard">
    <div className="container-fluid">
      <div className="veterinary-dashboard-header mb-4">
        <h2 className="dashboard-title"><i className="fa-solid fa-lock me-3" />Change Password</h2>
        <p className="dashboard-subtitle">Secure your veterinary practice account with email verification.</p>
      </div>
      <EmailVerifiedPasswordChangeForm accountLabel="doctor" />
    </div>
  </div>
)

export default DoctorChangePassword
