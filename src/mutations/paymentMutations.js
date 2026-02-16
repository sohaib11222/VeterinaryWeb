/**
 * Payment Mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../utils/api'

export const useProcessAppointmentPayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ appointmentId, amount, paymentMethod }) =>
      api.post('/payment/appointment', { appointmentId, amount, paymentMethod }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['appointment', variables?.appointmentId] })
    },
  })
}

export const useProcessSubscriptionPayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ subscriptionPlanId, amount, paymentMethod }) =>
      api.post('/payment/subscription', { subscriptionPlanId, amount, paymentMethod }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
      queryClient.invalidateQueries({ queryKey: ['veterinarian', 'subscription'] })
    },
  })
}

export const useProcessOrderPayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, paymentMethod, amount }) =>
      api.post('/payment/order', { orderId, paymentMethod, amount }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', variables?.orderId] })
    },
  })
}

export const useGetUserTransactions = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params) => api.get('/payment/transactions', { params }),
  })
}
