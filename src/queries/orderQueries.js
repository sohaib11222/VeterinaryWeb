/**
 * Order Queries
 * All GET requests related to orders.
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useOrders = (params = {}) =>
  useQuery({
    queryKey: ['orders', params],
    queryFn: () => api.get(API_ROUTES.ORDERS.LIST, { params }),
  })

export const useOrder = (orderId) =>
  useQuery({
    queryKey: ['order', orderId],
    queryFn: () => api.get(API_ROUTES.ORDERS.GET(orderId)),
    enabled: !!orderId,
  })

