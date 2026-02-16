/**
 * Pet Owner Queries
 * All GET requests related to pet owner's own dashboard and histories.
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const usePetOwnerDashboard = () =>
  useQuery({
    queryKey: ['petOwner', 'dashboard'],
    queryFn: () => api.get(API_ROUTES.PET_OWNER.DASHBOARD),
  })

export const usePetOwnerAppointments = (params = {}) =>
  useQuery({
    queryKey: ['petOwner', 'appointments', params],
    queryFn: () => api.get(API_ROUTES.PET_OWNER.APPOINTMENTS, { params }),
  })

export const usePetOwnerPayments = (params = {}) =>
  useQuery({
    queryKey: ['petOwner', 'payments', params],
    queryFn: () => api.get(API_ROUTES.PET_OWNER.PAYMENTS, { params }),
  })

