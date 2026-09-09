import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

const stable = (params = {}) => JSON.stringify(Object.keys(params).sort().reduce((out, key) => ({ ...out, [key]: params[key] }), {}))

export const usePetSitters = (params = {}, options = {}) => useQuery({
  queryKey: ['pet-sitters', stable(params)],
  queryFn: () => api.get(API_ROUTES.PET_SITTERS.LIST, { params }),
  refetchInterval: 15000,
  ...options,
})

export const usePetSitter = (id, options = {}) => useQuery({
  queryKey: ['pet-sitter', id],
  queryFn: () => api.get(API_ROUTES.PET_SITTERS.PUBLIC_PROFILE(id)),
  enabled: Boolean(id),
  refetchInterval: 15000,
  ...options,
})

export const useMyPetSitterProfile = (options = {}) => useQuery({
  queryKey: ['pet-sitter', 'me'],
  queryFn: () => api.get(API_ROUTES.PET_SITTERS.ME),
  enabled: options.enabled ?? true,
  refetchInterval: 15000,
  ...options,
})

export const useAdminPetSitters = (params = {}, options = {}) => useQuery({
  queryKey: ['admin', 'pet-sitters', stable(params)],
  queryFn: () => api.get(API_ROUTES.ADMIN.PET_SITTERS, { params }),
  refetchInterval: 15000,
  ...options,
})
