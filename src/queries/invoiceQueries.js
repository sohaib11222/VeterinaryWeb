import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useVeterinarianInvoices = (params = {}) =>
  useQuery({
    queryKey: ['veterinarian', 'invoices', params],
    queryFn: () => api.get(API_ROUTES.VETERINARIANS.INVOICES, { params }),
  })

export const useVeterinarianInvoice = (transactionId) =>
  useQuery({
    queryKey: ['veterinarian', 'invoices', transactionId],
    queryFn: () => api.get(API_ROUTES.VETERINARIANS.INVOICE(transactionId)),
    enabled: !!transactionId,
  })

export const usePaymentTransaction = (transactionId) =>
  useQuery({
    queryKey: ['payment', 'transaction', transactionId],
    queryFn: () => api.get(API_ROUTES.PAYMENT.TRANSACTION(transactionId)),
    enabled: !!transactionId,
  })
