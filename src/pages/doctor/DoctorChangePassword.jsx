import { useState } from 'react'

const DoctorChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required'
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long'
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      // TODO: Implement password change API call
      console.log('Password change submitted:', formData)
      alert('Password changed successfully!')
      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    }
  }

  const togglePasswordVisibility = (field) => {
    switch (field) {
      case 'current':
        setShowCurrentPassword(!showCurrentPassword)
        break
      case 'new':
        setShowNewPassword(!showNewPassword)
        break
      case 'confirm':
        setShowConfirmPassword(!showConfirmPassword)
        break
    }
  }
  return (
    <div className="content veterinary-dashboard">
      <div className="container-fluid">
        <div className="row">
          <div className="col-lg-3 col-xl-2 theiaStickySidebar">
            {/* Sidebar is handled by DashboardLayout */}
          </div>
          <div className="col-lg-12 col-xl-12">
            {/* Veterinary Change Password Header */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="veterinary-dashboard-header">
                  <h2 className="dashboard-title">
                    <i className="fa-solid fa-lock me-3"></i>
                    Change Password
                  </h2>
                  <p className="dashboard-subtitle">Update your veterinary practice account password</p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="card veterinary-card pass-card">
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="input-block input-block-new">
                        <label className="form-label">
                          <i className="fa-solid fa-key me-2"></i>
                          Current Password
                        </label>
                        <div className="pass-group">
                          <input 
                            type={showCurrentPassword ? 'text' : 'password'}
                            className={`form-control pass-input veterinary-input ${errors.currentPassword ? 'is-invalid' : ''}`}
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleInputChange}
                            placeholder="Enter your current password"
                          />
                          <span 
                            className={`feather ${showCurrentPassword ? 'feather-eye' : 'feather-eye-off'} toggle-password`}
                            onClick={() => togglePasswordVisibility('current')}
                            style={{ cursor: 'pointer' }}
                          ></span>
                          {errors.currentPassword && (
                            <div className="invalid-feedback">{errors.currentPassword}</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="input-block input-block-new">
                        <label className="form-label">
                          <i className="fa-solid fa-shield-halved me-2"></i>
                          New Password
                        </label>
                        <div className="pass-group">
                          <input 
                            type={showNewPassword ? 'text' : 'password'}
                            className={`form-control pass-input veterinary-input ${errors.newPassword ? 'is-invalid' : ''}`}
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleInputChange}
                            placeholder="Enter your new password"
                          />
                          <span 
                            className={`feather ${showNewPassword ? 'feather-eye' : 'feather-eye-off'} toggle-password`}
                            onClick={() => togglePasswordVisibility('new')}
                            style={{ cursor: 'pointer' }}
                          ></span>
                          {errors.newPassword && (
                            <div className="invalid-feedback">{errors.newPassword}</div>
                          )}
                        </div>
                        <small className="text-muted">
                          Password must be at least 8 characters long
                        </small>
                      </div>
                      
                      <div className="input-block input-block-new mb-0">
                        <label className="form-label">
                          <i className="fa-solid fa-lock me-2"></i>
                          Confirm New Password
                        </label>
                        <div className="pass-group">
                          <input 
                            type={showConfirmPassword ? 'text' : 'password'}
                            className={`form-control pass-input-sub veterinary-input ${errors.confirmPassword ? 'is-invalid' : ''}`}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="Confirm your new password"
                          />
                          <span 
                            className={`feather ${showConfirmPassword ? 'feather-eye' : 'feather-eye-off'} toggle-password-sub`}
                            onClick={() => togglePasswordVisibility('confirm')}
                            style={{ cursor: 'pointer' }}
                          ></span>
                          {errors.confirmPassword && (
                            <div className="invalid-feedback">{errors.confirmPassword}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      {/* Password Requirements */}
                      <div className="password-requirements">
                        <h5 className="mb-3">
                          <i className="fa-solid fa-shield-virus me-2"></i>
                          Password Requirements
                        </h5>
                        <ul className="list-unstyled">
                          <li className="mb-2">
                            <i className="fa-solid fa-check-circle text-success me-2"></i>
                            At least 8 characters long
                          </li>
                          <li className="mb-2">
                            <i className="fa-solid fa-check-circle text-success me-2"></i>
                            Contains uppercase and lowercase letters
                          </li>
                          <li className="mb-2">
                            <i className="fa-solid fa-check-circle text-success me-2"></i>
                            Contains at least one number
                          </li>
                          <li className="mb-2">
                            <i className="fa-solid fa-check-circle text-success me-2"></i>
                            Contains at least one special character
                          </li>
                        </ul>
                      </div>
                      
                      {/* Security Tips */}
                      <div className="security-tips mt-4">
                        <h5 className="mb-3">
                          <i className="fa-solid fa-lightbulb me-2"></i>
                          Security Tips
                        </h5>
                        <div className="alert alert-info veterinary-alert">
                          <ul className="small mb-0">
                            <li>Use a unique password for your veterinary practice account</li>
                            <li>Avoid using personal information like pet names or birthdates</li>
                            <li>Consider using a password manager for secure storage</li>
                            <li>Update your password regularly for maximum security</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="form-set-button">
                <button type="button" className="btn veterinary-btn-secondary me-2" onClick={() => {
                  setFormData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  })
                  setErrors({})
                }}>
                  <i className="fa-solid fa-times me-2"></i>
                  Cancel
                </button>
                <button type="submit" className="btn veterinary-btn-primary">
                  <i className="fa-solid fa-save me-2"></i>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorChangePassword

