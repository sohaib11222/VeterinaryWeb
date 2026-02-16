/**
 * Chat Mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useGetOrCreateConversation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post(API_ROUTES.CHAT.CONVERSATION, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] })
    },
  })
}

export const useSendMessage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => api.post(API_ROUTES.CHAT.SEND, data),
    onSuccess: (_, variables) => {
      const conversationId = variables?.conversationId
      if (conversationId) {
        queryClient.invalidateQueries({ queryKey: ['chat', 'messages', conversationId] })
      }
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'unread-count'] })
    },
  })
}

export const useMarkConversationRead = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (conversationId) => api.post(API_ROUTES.CHAT.MARK_READ(conversationId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'unread-count'] })
    },
  })
}

