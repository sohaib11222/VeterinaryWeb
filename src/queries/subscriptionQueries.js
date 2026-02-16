/**
 * Subscription & Billing Queries
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useSubscriptionPlans = (params = undefined) => {
  const hasParams = !!params && Object.keys(params).length > 0
  return useQuery({
    queryKey: hasParams ? ['subscription-plans', params] : ['subscription-plans'],
    queryFn: () => api.get(API_ROUTES.SUBSCRIPTIONS.LIST_PLANS, hasParams ? { params } : undefined),
  })
}

export const useMySubscription = () =>
  useQuery({
    queryKey: ['subscriptions', 'my'],
    queryFn: () => api.get(API_ROUTES.SUBSCRIPTIONS.MY_SUBSCRIPTION),
  })

export const useBalance = () =>
  useQuery({
    queryKey: ['balance'],
    queryFn: () => api.get(API_ROUTES.BALANCE.BASE),
  })

export const useTransactions = (params = {}) =>
  useQuery({
    queryKey: ['transactions', params],
    queryFn: () => api.get(API_ROUTES.TRANSACTION.BASE, { params }),
  })

