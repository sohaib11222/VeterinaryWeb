/**
 * Pet Queries
 * All GET requests related to pets.
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const usePets = (params = {}) =>
  useQuery({
    queryKey: ['pets', params],
    queryFn: () => api.get(API_ROUTES.PETS.LIST, { params }),
  })

export const usePet = (petId) =>
  useQuery({
    queryKey: ['pet', petId],
    queryFn: () => api.get(API_ROUTES.PETS.GET(petId)),
    enabled: !!petId,
  })

