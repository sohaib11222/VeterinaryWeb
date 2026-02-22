/**
 * Review Queries
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

const stableParamsKey = (params = {}) => {
  if (!params || typeof params !== 'object') return ''
  const keys = Object.keys(params).sort()
  const normalized = {}
  keys.forEach((k) => {
    normalized[k] = params[k]
  })
  return JSON.stringify(normalized)
}

export const useMyVeterinarianReviews = (params = {}, options = {}) =>
  useQuery({
    queryKey: ['reviews', 'veterinarian', 'me', stableParamsKey(params)],
    queryFn: () => api.get(API_ROUTES.VETERINARIANS.REVIEWS, { params }),
    ...options,
  })

export const useReviewsByVeterinarian = (veterinarianId, params = {}) =>
  useQuery({
    queryKey: ['reviews', 'veterinarian', veterinarianId, stableParamsKey(params)],
    queryFn: () =>
      api.get(API_ROUTES.REVIEWS.BY_VETERINARIAN(veterinarianId), { params }),
    enabled: !!veterinarianId,
  })

export const usePublicReviews = (params = {}, options = {}) =>
  useQuery({
    queryKey: ['reviews', 'public', stableParamsKey(params)],
    queryFn: () => api.get(API_ROUTES.REVIEWS.PUBLIC_LIST, { params, timeout: 8000 }),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: 30_000,
    retry: 1,
    retryDelay: 1000,
    ...options,
  })

