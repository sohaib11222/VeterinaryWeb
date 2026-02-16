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

export const useWithdrawalRequests = (params = {}) =>
  useQuery({
    queryKey: ['withdrawals', params],
    queryFn: () => api.get(API_ROUTES.BALANCE.WITHDRAW_REQUESTS, { params }),
  })
