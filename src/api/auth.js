import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

// Map frontend userType to backend USER_ROLES
const mapUserTypeToRole = (userType) => {
  switch (userType) {
    case 'doctor':
    case 'veterinarian':
      return 'VETERINARIAN'
    case 'pet_store':
    case 'petstore':
    case 'store':
      return 'PET_STORE'
    case 'parapharmacy':
      return 'PARAPHARMACY'
    case 'pet_owner':
    case 'patient':
    default:
      return 'PET_OWNER'
  }
}

export const login = async (email, password) => {
  const res = await api.post(API_ROUTES.AUTH.LOGIN, { email, password })
  // api returns outer { success, message, data }
  const payload = res?.data ?? res
  return payload
}

export const register = async (data, userType = 'patient') => {
  const role = mapUserTypeToRole(userType)
  const body = { ...data, role }
  const res = await api.post(API_ROUTES.AUTH.REGISTER, body)
  const payload = res?.data ?? res
  return payload
}

// For now we rely on localStorage for current user; no /auth/me endpoint yet
export const getUserFromStorage = () => {
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const forgotPassword = async (email) => {
  return api.post(API_ROUTES.AUTH.FORGOT_PASSWORD, { email })
}

export const resetPassword = async (email, code, newPassword) => {
  return api.post(API_ROUTES.AUTH.RESET_PASSWORD, { email, code, newPassword })
}

export const verifyEmail = async (email, code) => {
  return api.post(API_ROUTES.AUTH.VERIFY_EMAIL, { email, code })
}

export const resendEmailVerification = async (email) => {
  return api.post(API_ROUTES.AUTH.RESEND_EMAIL_VERIFICATION, { email })
}

export const verifyResetCode = async (email, code) => {
  return api.post(API_ROUTES.AUTH.VERIFY_RESET_CODE, { email, code })
}

export const requestChangePasswordCode = async () => {
  return api.post(API_ROUTES.AUTH.REQUEST_CHANGE_PASSWORD_CODE)
}

export const verifyChangePasswordCode = async (code) => {
  return api.post(API_ROUTES.AUTH.VERIFY_CHANGE_PASSWORD_CODE, { code })
}

export const changePasswordWithCode = async (code, newPassword) => {
  return api.post(API_ROUTES.AUTH.CHANGE_PASSWORD, { code, newPassword })
}

