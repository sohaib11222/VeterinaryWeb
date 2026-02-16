/**
 * Notification Queries
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

const stableParamsKey = (params = {}) => {
  if (!params || typeof params !== 'object') return ''
  const keys = Object.keys(params).sort()
  const normalized = {}
  keys.forEach((k) => {
    normalized[k] = params[k]
  })
  return JSON.stringify(normalized)
}

export const useNotifications = (params = {}, queryOptions = {}) =>
  useQuery({
    queryKey: ['notifications', stableParamsKey(params)],
    queryFn: () => api.get(API_ROUTES.NOTIFICATIONS.LIST, { params }),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 30_000,
    ...queryOptions,
  })

export const useUnreadNotificationsCount = (queryOptions = {}) =>
  useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.get(API_ROUTES.NOTIFICATIONS.UNREAD_COUNT),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 60_000,
    ...queryOptions,
  })

