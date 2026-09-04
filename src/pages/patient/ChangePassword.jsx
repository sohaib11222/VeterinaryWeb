import { Link } from 'react-router-dom'
import EmailVerifiedPasswordChangeForm from '../../components/auth/EmailVerifiedPasswordChangeForm'

const ChangePassword = () => (
  <div className="content doctor-content">
    <div className="container">
      <nav className="settings-tab mb-1">
        <ul className="nav nav-tabs-bottom" role="tablist">
          <li className="nav-item"><Link className="nav-link" to="/profile-settings">Account Settings</Link></li>
          <li className="nav-item"><Link className="nav-link active" to="/change-password">Change Password</Link></li>
        </ul>
      </nav>
      <EmailVerifiedPasswordChangeForm accountLabel="patient" />
    </div>
  </div>
)

export default ChangePassword
