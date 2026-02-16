/**
 * Scheduling & Reschedule Queries
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

// ----------------- Availability (general) -----------------

// Authenticated vet: get their own availability definition
export const useAvailability = (params = {}) =>
  useQuery({
    queryKey: ['availability', params],
    queryFn: () => api.get(API_ROUTES.AVAILABILITY.LIST, { params }),
  })

// Public: get available slots for a given vet + date
export const useAvailableSlots = ({ veterinarianId, date, enabled = true }) =>
  useQuery({
    queryKey: ['availability-slots', { veterinarianId, date }],
    queryFn: () =>
      api.get(`${API_ROUTES.AVAILABILITY.BASE}/slots`, {
        params: { veterinarianId, date },
      }),
    enabled: !!veterinarianId && !!date && enabled,
  })

// Public: check if a specific time slot is available
export const useCheckTimeSlot = ({ veterinarianId, date, timeSlot, enabled = true }) =>
  useQuery({
    queryKey: ['availability-check', { veterinarianId, date, timeSlot }],
    queryFn: () =>
      api.get(`${API_ROUTES.AVAILABILITY.BASE}/check`, {
        params: { veterinarianId, date, timeSlot },
      }),
    enabled: !!veterinarianId && !!date && !!timeSlot && enabled,
  })

// ----------------- Weekly Schedule (vet clinic hours) -----------------

// Authenticated vet: get their weekly schedule (days + timeSlots)
export const useWeeklySchedule = () =>
  useQuery({
    queryKey: ['weekly-schedule'],
    queryFn: () => api.get(API_ROUTES.WEEKLY_SCHEDULE.LIST),
  })

export const useWeeklyAvailableSlotsForDate = ({ veterinarianId, date, enabled = true }) =>
  useQuery({
    queryKey: ['weekly-schedule-slots', { veterinarianId, date }],
    queryFn: () =>
      api.get(`${API_ROUTES.WEEKLY_SCHEDULE.BASE}/slots`, {
        params: { veterinarianId, date },
      }),
    enabled: !!veterinarianId && !!date && enabled,
  })

export const useRescheduleRequests = (params = {}) =>
  useQuery({
    queryKey: ['reschedule-requests', params],
    queryFn: () => api.get(API_ROUTES.RESCHEDULE_REQUEST.LIST, { params }),
  })

export const useEligibleRescheduleAppointments = () =>
  useQuery({
    queryKey: ['reschedule-requests', 'eligible-appointments'],
    queryFn: () => api.get(API_ROUTES.RESCHEDULE_REQUEST.ELIGIBLE_APPOINTMENTS),
  })

