/**
 * Appointment Mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useCreateAppointment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => api.post(API_ROUTES.APPOINTMENTS.CREATE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['petOwner', 'appointments'] })
      queryClient.invalidateQueries({ queryKey: ['veterinarian', 'dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['petOwner', 'dashboard'] })
    },
  })
}

export const useAcceptAppointment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (appointmentId) =>
      api.post(API_ROUTES.APPOINTMENTS.ACCEPT(appointmentId)),
    onSuccess: (_, appointmentId) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] })
      queryClient.invalidateQueries({ queryKey: ['veterinarian', 'dashboard'] })
    },
  })
}

export const useRejectAppointment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ appointmentId, data }) =>
      api.post(API_ROUTES.APPOINTMENTS.REJECT(appointmentId), data),
    onSuccess: (_, variables) => {
      const id = variables?.appointmentId
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['appointment', id] })
      }
      queryClient.invalidateQueries({ queryKey: ['veterinarian', 'dashboard'] })
    },
  })
}

export const useCancelAppointment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ appointmentId, data }) =>
      api.post(API_ROUTES.APPOINTMENTS.CANCEL(appointmentId), data),
    onSuccess: (_, variables) => {
      const id = variables?.appointmentId
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['petOwner', 'appointments'] })
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['appointment', id] })
      }
    },
  })
}

export const useCompleteAppointment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ appointmentId, data }) =>
      api.post(API_ROUTES.APPOINTMENTS.COMPLETE(appointmentId), data || {}),
    onSuccess: (_, variables) => {
      const appointmentId = variables?.appointmentId
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      if (appointmentId) {
        queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] })
      }
      queryClient.invalidateQueries({ queryKey: ['veterinarian', 'dashboard'] })
    },
  })
}

export const useUpdateAppointmentStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ appointmentId, data }) =>
      api.put(API_ROUTES.APPOINTMENTS.UPDATE_STATUS(appointmentId), data),
    onSuccess: (_, variables) => {
      const id = variables?.appointmentId
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['appointment', id] })
      }
    },
  })
}

