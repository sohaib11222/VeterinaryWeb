import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useUpdateAdminSupportTicket = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ticketId, data }) => api.patch(API_ROUTES.SUPPORT_TICKETS.ADMIN_UPDATE(ticketId), data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] }),
  })
}
