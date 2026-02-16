/**
 * Scheduling & Reschedule Mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

// ----------------- Weekly Schedule mutations (vet clinic hours) -----------------

// Upsert schedule for a single day (replaces timeSlots for that day)
export const useUpsertWeeklyScheduleDay = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => api.post(API_ROUTES.WEEKLY_SCHEDULE.BASE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-schedule'] })
    },
  })
}

// Update global appointment duration for the vet
export const useUpdateAppointmentDuration = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (duration) =>
      api.put(`${API_ROUTES.WEEKLY_SCHEDULE.BASE}/duration`, { duration }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-schedule'] })
    },
  })
}

// Add a single time slot to a day
export const useAddTimeSlot = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ dayOfWeek, payload }) =>
      api.post(
        `${API_ROUTES.WEEKLY_SCHEDULE.BASE}/day/${dayOfWeek}/slot`,
        payload
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-schedule'] })
    },
  })
}

// Update a specific time slot on a day
export const useUpdateTimeSlot = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ dayOfWeek, slotId, payload }) =>
      api.put(
        `${API_ROUTES.WEEKLY_SCHEDULE.BASE}/day/${dayOfWeek}/slot/${slotId}`,
        payload
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-schedule'] })
    },
  })
}

// Delete a specific time slot on a day
export const useDeleteTimeSlot = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ dayOfWeek, slotId }) =>
      api.delete(
        `${API_ROUTES.WEEKLY_SCHEDULE.BASE}/day/${dayOfWeek}/slot/${slotId}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-schedule'] })
    },
  })
}

// ----------------- Reschedule Request mutations -----------------

export const useCreateRescheduleRequest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => api.post(API_ROUTES.RESCHEDULE_REQUEST.CREATE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reschedule-requests'] })
      queryClient.invalidateQueries({
        queryKey: ['reschedule-requests', 'eligible-appointments'],
      })
    },
  })
}

export const useApproveRescheduleRequest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) =>
      api.post(API_ROUTES.RESCHEDULE_REQUEST.APPROVE(id), data || {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reschedule-requests'] })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })
}

export const useRejectRescheduleRequest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }) =>
      api.post(API_ROUTES.RESCHEDULE_REQUEST.REJECT(id), { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reschedule-requests'] })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })
}

export const usePayRescheduleFee = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, paymentMethod }) => api.post(API_ROUTES.RESCHEDULE_REQUEST.PAY(id), { paymentMethod }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reschedule-requests'] })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })
}

