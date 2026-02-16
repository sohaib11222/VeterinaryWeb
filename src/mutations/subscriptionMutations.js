/**
 * Subscription & Billing Mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const usePurchaseSubscriptionPlan = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => api.post(API_ROUTES.SUBSCRIPTIONS.PURCHASE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions', 'my'] })
    },
  })
}

export const useUpdateSubscriptionPlanPrice = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, price }) => api.put(API_ROUTES.SUBSCRIPTION_PLANS.UPDATE(id), { price }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] })
    },
  })
}

