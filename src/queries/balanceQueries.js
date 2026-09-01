/**
 * Balance & Withdrawal Queries
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useBalance = () =>
  useQuery({
    queryKey: ['balance'],
    queryFn: () => api.get(API_ROUTES.BALANCE.BASE),
  })

export const useWithdrawalRequests = (params = {}, queryOptions = {}) =>
  useQuery({
    queryKey: ['withdrawals', params],
    queryFn: () => api.get(API_ROUTES.BALANCE.WITHDRAW_REQUESTS, { params }),
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    ...queryOptions,
  })
