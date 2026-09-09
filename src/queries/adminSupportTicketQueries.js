import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

const stable = (params = {}) => JSON.stringify(Object.keys(params).sort().reduce((out, key) => ({ ...out, [key]: params[key] }), {}))
export const useAdminSupportTickets = (params = {}, options = {}) => useQuery({
  queryKey: ['admin-support-tickets', stable(params)],
  queryFn: () => api.get(API_ROUTES.SUPPORT_TICKETS.ADMIN_LIST, { params }),
  refetchInterval: 15000,
  ...options,
})
