import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-toastify'
import AuthLayout from '../../layouts/AuthLayout'

const schema = yup.object({
  name: yup
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .required('Full name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  password_confirmation: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
})

const DoctorRegister = () => {
  const navigate = useNavigate()
  const { register: registerUser } = useAuth()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      }

      const response = await registerUser(payload, 'doctor')
      toast.success('Registration successful! Please upload verification documents.')

      // Trigger first-time onboarding prompts after approval/login
      try {
        localStorage.setItem('vet_onboarding_required', '1')
      } catch {
        // ignore
      }

      const status = response?.user?.status
      if (status === 'PENDING') {
        navigate('/doctor-verification-upload')
      } else {
        navigate('/doctor/dashboard')
      }
    } catch (error) {
      toast.error(error?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="content veterinary-dashboard">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-8 offset-md-2">
              <div className="account-content veterinary-doctor-register-container">
                <div className="row align-items-center justify-content-center">
                  <div className="col-md-7 col-lg-6 login-left veterinary-register-left">
                    <div className="veterinary-register-banner">
                      <img src="/assets/img/login-banner.png" className="img-fluid veterinary-banner-img" alt="MyPetPlus Veterinary Register" />
                      <div className="veterinary-banner-overlay">
                        <div className="veterinary-banner-content">
                          <i className="fa-solid fa-user-doctor fa-3x text-white mb-3"></i>
                          <h4 className="text-white">Join Our Veterinary Team</h4>
                          <p className="text-white">Become part of MyPetPlus's trusted veterinary network</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-12 col-lg-6 login-right veterinary-register-right">
                    <div className="login-header veterinary-doctor-register-header">
                      <div className="text-center mb-4">
                        <div className="veterinary-register-logo mb-3">
                          <i className="fa-solid fa-user-doctor fa-2x text-primary"></i>
                        </div>
                        <h3 className="veterinary-register-title">
                          <i className="fa-solid fa-stethoscope me-2"></i>Veterinarian Register
                        </h3>
                        <p className="veterinary-register-subtitle">Join our professional veterinary network</p>
                      </div>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)}>
                      <div className="mb-3 veterinary-form-group">
                        <label className="form-label veterinary-form-label">
                          <i className="fa-solid fa-user me-2"></i>Full Name
                        </label>
                        <input
                          type="text"
                          className={`form-control veterinary-form-control ${errors.name ? 'is-invalid' : ''}`}
                          placeholder="Enter your full name"
                          {...register('name')}
                        />
                        {errors.name && <div className="invalid-feedback veterinary-error-feedback">{errors.name.message}</div>}
                      </div>
                      <div className="mb-3 veterinary-form-group">
                        <label className="form-label veterinary-form-label">
                          <i className="fa-solid fa-envelope me-2"></i>Email
                        </label>
                        <input
                          type="email"
                          className={`form-control veterinary-form-control ${errors.email ? 'is-invalid' : ''}`}
                          placeholder="Enter your email"
                          {...register('email')}
                        />
                        {errors.email && <div className="invalid-feedback veterinary-error-feedback">{errors.email.message}</div>}
                      </div>
                      <div className="mb-3 veterinary-form-group">
                        <label className="form-label veterinary-form-label">
                          <i className="fa-solid fa-phone me-2"></i>Phone Number
                        </label>
                        <input
                          type="tel"
                          className={`form-control veterinary-form-control ${errors.phone ? 'is-invalid' : ''}`}
                          placeholder="Enter your phone number"
                          {...register('phone')}
                        />
                        {errors.phone && <div className="invalid-feedback veterinary-error-feedback">{errors.phone.message}</div>}
                      </div>
                      <div className="mb-3 veterinary-form-group">
                        <div className="form-group-flex">
                          <label className="form-label veterinary-form-label">
                            <i className="fa-solid fa-lock me-2"></i>Create Password
                          </label>
                        </div>
                        <div className="pass-group veterinary-pass-group">
                          <input
                            type="password"
                            className={`form-control pass-input veterinary-form-control ${errors.password ? 'is-invalid' : ''}`}
                            placeholder="Create a secure password"
                            {...register('password')}
                          />
                        </div>
                        {errors.password && <div className="invalid-feedback veterinary-error-feedback">{errors.password.message}</div>}
                      </div>
                      <div className="mb-3 veterinary-form-group">
                        <label className="form-label veterinary-form-label">
                          <i className="fa-solid fa-lock me-2"></i>Confirm Password
                        </label>
                        <input
                          type="password"
                          className={`form-control veterinary-form-control ${errors.password_confirmation ? 'is-invalid' : ''}`}
                          placeholder="Confirm your password"
                          {...register('password_confirmation')}
                        />
                        {errors.password_confirmation && <div className="invalid-feedback veterinary-error-feedback">{errors.password_confirmation.message}</div>}
                      </div>
                      <div className="mb-3 veterinary-register-btn-group">
                        <button className="btn veterinary-btn-primary-gradient w-100 veterinary-doctor-register-btn" type="submit" disabled={loading}>
                          <i className="fa-solid fa-user-plus me-2"></i>
                          {loading ? 'Registering...' : 'Join Veterinary Team'}
                        </button>
                      </div>
                      <div className="login-or veterinary-register-divider">
                        <span className="or-line veterinary-or-line"></span>
                        <span className="span-or veterinary-or-text">
                          <i className="fa-solid fa-paw me-1"></i>or
                        </span>
                      </div>
                      <div className="form-group text-center mb-3 veterinary-patient-register-group">
                        <Link to="/register" className="btn veterinary-btn-outline-primary w-100 veterinary-patient-register-btn">
                          <i className="fa-solid fa-user me-2"></i>
                          Register as Pet Owner
                        </Link>
                      </div>
                      <div className="account-signup veterinary-doctor-register-footer">
                        <p className="veterinary-footer-text">
                          <i className="fa-solid fa-sign-in-alt me-2"></i>
                          Already have account? <Link to="/login" className="veterinary-login-link">Sign In</Link>
                        </p>
                        <div className="veterinary-register-features mt-3">
                          <div className="row text-center">
                            <div className="col-4">
                              <i className="fa-solid fa-certificate text-success mb-2"></i>
                              <p className="small mb-0">Verified</p>
                            </div>
                            <div className="col-4">
                              <i className="fa-solid fa-heart text-danger mb-2"></i>
                              <p className="small mb-0">Pet Care</p>
                            </div>
                            <div className="col-4">
                              <i className="fa-solid fa-users text-info mb-2"></i>
                              <p className="small mb-0">Network</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}

export default DoctorRegister

