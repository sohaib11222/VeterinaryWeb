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

