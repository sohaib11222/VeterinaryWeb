import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast } from 'react-toastify'
import { useAuth } from '../../contexts/AuthContext'

const schema = yup.object({
  name: yup.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters').required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  password_confirmation: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Confirm password is required'),
})

const PharmacyRegister = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { register: registerUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [accountType, setAccountType] = useState('pet_store')

  useEffect(() => {
    const sp = new URLSearchParams(location.search || '')
    const t = String(sp.get('type') || '').toLowerCase()
    if (t === 'pet_store' || t === 'parapharmacy') {
      setAccountType(t)
    }
  }, [location.search])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
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

      const response = await registerUser(payload, accountType)
      toast.success('Registration successful!')

      const role = response?.user?.role
      const status = response?.user?.status
      const isPhoneVerified = response?.user?.isPhoneVerified

      if ((role === 'PET_STORE' || role === 'PARAPHARMACY') && status === 'PENDING') {
        if (!isPhoneVerified) {
          navigate('/pharmacy-phone-verification')
          return
        }
        navigate('/pet-store-verification-upload')
        return
      }
      if (role === 'PET_STORE' || role === 'PARAPHARMACY') {
        navigate('/pharmacy-admin/dashboard')
        return
      }

      navigate('/login')
    } catch (error) {
      toast.error(error?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-8 offset-md-2">
              <div className="account-content">
                <div className="row align-items-center justify-content-center">
                  <div className="col-md-7 col-lg-6 login-left">
                    <img src="/assets/img/login-banner.png" className="img-fluid" alt="MyPetPlus Login" />
                  </div>
                  <div className="col-md-12 col-lg-6 login-right">
                    <div className="login-header">
                      <h3>
                        Pharmacy Register <Link to="/doctor-register">Are you a Doctor?</Link>
                      </h3>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)}>
                      <div className="mb-3">
                        <label className="form-label">Account Type</label>
                        <select
                          className="form-select"
                          value={accountType}
                          onChange={(e) => setAccountType(e.target.value)}
                        >
                          <option value="pet_store">Veterinary Pharmacy</option>
                          <option value="parapharmacy">Veterinary Parapharmacy</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Name</label>
                        <input type="text" className="form-control" {...register('name')} />
                        {errors.name && <div className="text-danger small mt-1">{errors.name.message}</div>}
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input type="email" className="form-control" {...register('email')} />
                        {errors.email && <div className="text-danger small mt-1">{errors.email.message}</div>}
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Phone</label>
                        <input className="form-control form-control-lg group_formcontrol form-control-phone" id="phone" type="text" {...register('phone')} />
                        {errors.phone && <div className="text-danger small mt-1">{errors.phone.message}</div>}
                      </div>
                      <div className="mb-3">
                        <div className="form-group-flex">
                          <label className="form-label">Create Password</label>
                        </div>
                        <div className="pass-group">
                          <input type="password" className="form-control pass-input" {...register('password')} />
                          <span className="feather-eye-off toggle-password"></span>
                        </div>
                        {errors.password && <div className="text-danger small mt-1">{errors.password.message}</div>}
                      </div>
                      <div className="mb-3">
                        <div className="form-group-flex">
                          <label className="form-label">Confirm Password</label>
                        </div>
                        <div className="pass-group">
                          <input type="password" className="form-control pass-input" {...register('password_confirmation')} />
                          <span className="feather-eye-off toggle-password"></span>
                        </div>
                        {errors.password_confirmation && (
                          <div className="text-danger small mt-1">{errors.password_confirmation.message}</div>
                        )}
                      </div>
                      <div className="mb-3">
                        <button className="btn btn-primary-gradient w-100" type="submit" disabled={loading}>
                          {loading ? 'Signing Up...' : 'Sign Up'}
                        </button>
                      </div>
                      <div className="login-or">
                        <span className="or-line"></span>
                        <span className="span-or">or</span>
                      </div>
                      <div className="social-login-btn">
                        <a href="javascript:void(0);" className="btn w-100">
                          <img src="/assets/img/icons/google-icon.svg" alt="google-icon" />
                          Sign in With Google
                        </a>
                        <a href="javascript:void(0);" className="btn w-100">
                          <img src="/assets/img/icons/facebook-icon.svg" alt="fb-icon" />
                          Sign in With Facebook
                        </a>
                      </div>
                      <div className="account-signup">
                        <p>
                          Already have account? <Link to="/login">Sign In</Link>
                        </p>
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

export default PharmacyRegister

