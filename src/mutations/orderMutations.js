/**
 * Order Mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useCreateOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => api.post(API_ROUTES.ORDERS.CREATE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export const useUpdateShippingFee = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, shippingFee }) => api.put(API_ROUTES.ORDERS.UPDATE_SHIPPING(orderId), { shippingFee }),
    onSuccess: (_, variables) => {
      const id = variables?.orderId
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['order', id] })
      }
    },
  })
}

export const usePayForOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, data }) => api.post(API_ROUTES.ORDERS.PAY(orderId), data),
    onSuccess: (_, variables) => {
      const id = variables?.orderId
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['order', id] })
      }
    },
  })
}

export const useCancelOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId) => api.post(API_ROUTES.ORDERS.CANCEL(orderId)),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      if (orderId) {
        queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      }
    },
  })
}

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, data }) =>
      api.put(API_ROUTES.ORDERS.UPDATE_STATUS(orderId), data),
    onSuccess: (_, variables) => {
      const id = variables?.orderId
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['order', id] })
      }
    },
  })
}

