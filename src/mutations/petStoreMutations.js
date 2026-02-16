/**
 * Pet Store Mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useCreatePetStore = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => api.post(API_ROUTES.PET_STORES.CREATE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet-stores'] })
    },
  })
}

export const useBuyPetStoreSubscription = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => api.post(API_ROUTES.PET_STORES.BUY_SUBSCRIPTION, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet-store', 'subscription', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['products', 'mine'], exact: false })
    },
  })
}

export const useUpdatePetStore = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ petStoreId, data }) =>
      api.put(API_ROUTES.PET_STORES.UPDATE(petStoreId), data),
    onSuccess: (_, variables) => {
      const id = variables?.petStoreId
      queryClient.invalidateQueries({ queryKey: ['pet-stores'] })
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['pet-store', id] })
      }
    },
  })
}

export const useDeletePetStore = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (petStoreId) =>
      api.delete(API_ROUTES.PET_STORES.DELETE(petStoreId)),
    onSuccess: (_, petStoreId) => {
      queryClient.invalidateQueries({ queryKey: ['pet-stores'] })
      if (petStoreId) {
        queryClient.invalidateQueries({ queryKey: ['pet-store', petStoreId] })
      }
    },
  })
}

