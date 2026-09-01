import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

const VIDEO_REQUEST_CONFIG = { timeout: 15_000 }

export const startVideoSession = async (appointmentId) => {
  return api.post(API_ROUTES.VIDEO.CREATE, { appointmentId }, VIDEO_REQUEST_CONFIG)
}

export const endVideoSession = async (sessionId) => {
  return api.post(API_ROUTES.VIDEO.END, { sessionId }, VIDEO_REQUEST_CONFIG)
}

export const acceptVideoSession = async (sessionId) => {
  return api.post(API_ROUTES.VIDEO.ACCEPT, { sessionId }, VIDEO_REQUEST_CONFIG)
}

export const getIncomingVideoSessions = async () => {
  return api.get(API_ROUTES.VIDEO.INCOMING, VIDEO_REQUEST_CONFIG)
}

export const getVideoSessionByAppointment = async (appointmentId) => {
  return api.get(API_ROUTES.VIDEO.BY_APPOINTMENT(appointmentId), VIDEO_REQUEST_CONFIG)
}
