import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

const invalidateSupport = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
  queryClient.invalidateQueries({ queryKey: ['support-ticket'] })
  queryClient.invalidateQueries({ queryKey: ['notifications'] })
}

export const useUploadSupportTicketAttachments = () => useMutation({
  mutationFn: (formData) => api.upload(API_ROUTES.SUPPORT_TICKETS.UPLOAD_ATTACHMENTS, formData),
})

export const useCreateSupportTicket = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post(API_ROUTES.SUPPORT_TICKETS.CREATE, data),
    onSuccess: () => invalidateSupport(queryClient),
  })
}

export const useReplyToSupportTicket = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ticketId, data }) => api.post(API_ROUTES.SUPPORT_TICKETS.REPLY(ticketId), data),
    onSuccess: () => invalidateSupport(queryClient),
  })
}

export const useReopenSupportTicket = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ticketId) => api.post(API_ROUTES.SUPPORT_TICKETS.REOPEN(ticketId)),
    onSuccess: () => invalidateSupport(queryClient),
  })
}
