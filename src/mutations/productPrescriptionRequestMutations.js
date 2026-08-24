import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useSubmitProductPrescriptionRequest = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post(API_ROUTES.PRODUCT_PRESCRIPTIONS.BASE, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-prescription-requests', 'mine'] })
      queryClient.invalidateQueries({ queryKey: ['product-prescription-eligibility', variables?.productId] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export const useReviewProductPrescriptionRequest = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ requestId, data }) => api.put(API_ROUTES.PRODUCT_PRESCRIPTIONS.REVIEW(requestId), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-prescription-requests', 'pharmacy'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
