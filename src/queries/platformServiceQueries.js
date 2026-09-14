import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

const stable = (params = {}) => JSON.stringify(Object.keys(params).sort().reduce((out, key) => ({ ...out, [key]: params[key] }), {}))

export const usePlatformServices = (options = {}) => useQuery({
  queryKey: ['platform-services'],
  queryFn: () => api.get(API_ROUTES.PLATFORM_SERVICES.LIST),
  ...options,
})

export const useMyPlatformServices = (options = {}) => useQuery({
  queryKey: ['platform-services', 'mine'],
  queryFn: () => api.get(API_ROUTES.PLATFORM_SERVICES.MINE),
  ...options,
})

export const useServiceProviders = (slug, params = {}, options = {}) => useQuery({
  queryKey: ['platform-services', slug, 'providers', stable(params)],
  queryFn: () => api.get(API_ROUTES.PLATFORM_SERVICES.PROVIDERS(slug), { params }),
  enabled: Boolean(slug),
  ...options,
})
