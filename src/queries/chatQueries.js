/**
 * Chat Queries
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

export const useConversations = (params = {}, queryOptions = {}) =>
  useQuery({
    queryKey: ['chat', 'conversations', stableParamsKey(params)],
    queryFn: () => api.get(API_ROUTES.CHAT.CONVERSATIONS, { params }),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 15000,
    staleTime: 0,
    ...queryOptions,
  })

export const useMessages = (conversationId, params = {}, queryOptions = {}) =>
  useQuery({
    queryKey: ['chat', 'messages', conversationId, stableParamsKey(params)],
    queryFn: () => api.get(API_ROUTES.CHAT.MESSAGES(conversationId), { params }),
    enabled: !!conversationId,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
    ...queryOptions,
  })

export const useUnreadChatCount = (queryOptions = {}) =>
  useQuery({
    queryKey: ['chat', 'unread-count'],
    queryFn: () => api.get(API_ROUTES.CHAT.UNREAD_COUNT),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
    ...queryOptions,
  })

