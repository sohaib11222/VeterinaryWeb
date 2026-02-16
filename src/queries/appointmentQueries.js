/**
 * Appointment Queries
 * All GET requests related to appointments.
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useAppointments = (params = {}) =>
  useQuery({
    queryKey: ['appointments', params],
    queryFn: () => api.get(API_ROUTES.APPOINTMENTS.LIST, { params }),
  })

export const useAppointment = (appointmentId) =>
  useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => api.get(API_ROUTES.APPOINTMENTS.GET(appointmentId)),
    enabled: !!appointmentId,
  })

