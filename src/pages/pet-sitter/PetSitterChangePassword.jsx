import EmailVerifiedPasswordChangeForm from '../../components/auth/EmailVerifiedPasswordChangeForm'

const PetSitterChangePassword = () => <div className="content"><div className="container-fluid"><h3 className="mb-1"><i className="fa-solid fa-lock me-2" />Change Password</h3><p className="text-muted mb-4">Request a verification code, confirm it, then set a new password.</p><EmailVerifiedPasswordChangeForm accountLabel="Pet Sitter" /></div></div>

export default PetSitterChangePassword
