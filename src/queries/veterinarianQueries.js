/**
 * Veterinarian Queries
 * All GET requests related to veterinarians.
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useVeterinarians = (params = {}, options = {}) =>
  useQuery({
    queryKey: ['veterinarians', params],
    queryFn: () => api.get(API_ROUTES.VETERINARIANS.LIST, { params }),
    ...options,
  })

export const useVeterinarianDashboard = (options = {}) =>
  useQuery({
    queryKey: ['veterinarian', 'dashboard'],
    queryFn: () => api.get(API_ROUTES.VETERINARIANS.DASHBOARD),
    ...options,
  })

export const useVeterinarianProfile = (options = {}) =>
  useQuery({
    queryKey: ['veterinarian', 'profile'],
    queryFn: () => api.get(API_ROUTES.VETERINARIANS.PROFILE),
    enabled: options.enabled ?? true,
    ...options,
  })

export const useVeterinarianPublicProfile = (veterinarianId) =>
  useQuery({
    queryKey: ['veterinarian', 'public', veterinarianId],
    queryFn: () => api.get(API_ROUTES.VETERINARIANS.PUBLIC_PROFILE(veterinarianId)),
    enabled: !!veterinarianId,
  })

