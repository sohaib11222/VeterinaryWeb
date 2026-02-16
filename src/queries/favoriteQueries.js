/**
 * Favorite Queries
 * GET requests for pet owner favorites (veterinarians).
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useFavorites = (petOwnerId, params = {}) =>
  useQuery({
    queryKey: ['favorites', petOwnerId, params],
    queryFn: () => api.get(API_ROUTES.FAVORITE.LIST(petOwnerId), { params }),
    enabled: !!petOwnerId,
  })
