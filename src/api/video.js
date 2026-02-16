import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const startVideoSession = async (appointmentId) => {
  return api.post(API_ROUTES.VIDEO.CREATE, { appointmentId })
}

export const endVideoSession = async (sessionId) => {
  return api.post(API_ROUTES.VIDEO.END, { sessionId })
}

export const getVideoSessionByAppointment = async (appointmentId) => {
  return api.get(API_ROUTES.VIDEO.BY_APPOINTMENT(appointmentId))
}
