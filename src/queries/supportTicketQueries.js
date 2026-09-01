import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

const stableParamsKey = (params = {}) => JSON.stringify(
  Object.keys(params || {}).sort().reduce((result, key) => ({ ...result, [key]: params[key] }), {})
)

export const useSupportTickets = (params = {}, queryOptions = {}) => useQuery({
  queryKey: ['support-tickets', stableParamsKey(params)],
  queryFn: () => api.get(API_ROUTES.SUPPORT_TICKETS.LIST, { params }),
  refetchInterval: 15000,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  ...queryOptions,
})

export const useSupportTicket = (ticketId, queryOptions = {}) => useQuery({
  queryKey: ['support-ticket', ticketId],
  queryFn: () => api.get(API_ROUTES.SUPPORT_TICKETS.GET(ticketId)),
  enabled: Boolean(ticketId),
  refetchInterval: 10000,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  ...queryOptions,
})

export const useSupportTicketUnreadCount = (queryOptions = {}) => useQuery({
  queryKey: ['support-tickets', 'unread-count'],
  queryFn: () => api.get(API_ROUTES.SUPPORT_TICKETS.UNREAD_COUNT),
  refetchInterval: 15000,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  ...queryOptions,
})
