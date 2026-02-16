/**
 * Veterinarian Mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useUpdateVeterinarianProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => api.put(API_ROUTES.VETERINARIANS.UPDATE_PROFILE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veterinarian', 'profile'] })
    },
  })
}

export const usePurchaseSubscription = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => api.post(API_ROUTES.SUBSCRIPTIONS.PURCHASE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions', 'my'] })
    },
  })
}

