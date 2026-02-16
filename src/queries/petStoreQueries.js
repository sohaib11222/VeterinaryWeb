/**
 * Pet Store Queries
 * All GET requests related to pet stores.
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const usePetStores = (params = {}) =>
  useQuery({
    queryKey: ['pet-stores', params],
    queryFn: () => api.get(API_ROUTES.PET_STORES.LIST, { params }),
  })

export const usePetStore = (petStoreId) =>
  useQuery({
    queryKey: ['pet-store', petStoreId],
    queryFn: () => api.get(API_ROUTES.PET_STORES.GET(petStoreId)),
    enabled: !!petStoreId,
  })

export const useMyPetStore = (options = {}) =>
  useQuery({
    queryKey: ['pet-store', 'me'],
    queryFn: () => api.get(API_ROUTES.PET_STORES.ME),
    ...options,
  })

export const useMyPetStoreSubscription = (options = {}) =>
  useQuery({
    queryKey: ['pet-store', 'subscription', 'me'],
    queryFn: () => api.get(API_ROUTES.PET_STORES.MY_SUBSCRIPTION),
    ...options,
  })

