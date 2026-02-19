/**
 * Review Queries
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useMyVeterinarianReviews = (params = {}, options = {}) =>
  useQuery({
    queryKey: ['reviews', 'veterinarian', 'me', params],
    queryFn: () => api.get(API_ROUTES.VETERINARIANS.REVIEWS, { params }),
    ...options,
  })

export const useReviewsByVeterinarian = (veterinarianId, params = {}) =>
  useQuery({
    queryKey: ['reviews', 'veterinarian', veterinarianId, params],
    queryFn: () =>
      api.get(API_ROUTES.REVIEWS.BY_VETERINARIAN(veterinarianId), { params }),
    enabled: !!veterinarianId,
  })

export const usePublicReviews = (params = {}, options = {}) =>
  useQuery({
    queryKey: ['reviews', 'public', params],
    queryFn: () => api.get(API_ROUTES.REVIEWS.PUBLIC_LIST, { params }),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 30_000,
    ...options,
  })

