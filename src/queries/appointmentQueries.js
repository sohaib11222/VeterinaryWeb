/**
 * Appointment Queries
 * All GET requests related to appointments.
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useAppointments = (params = {}, queryOptions = {}) =>
  useQuery({
    queryKey: ['appointments', params],
    queryFn: () => api.get(API_ROUTES.APPOINTMENTS.LIST, { params }),
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    ...queryOptions,
  })

export const useAppointment = (appointmentId, queryOptions = {}) =>
  useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => api.get(API_ROUTES.APPOINTMENTS.GET(appointmentId)),
    enabled: !!appointmentId,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    ...queryOptions,
  })

