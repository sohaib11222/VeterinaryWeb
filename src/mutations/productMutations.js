/**
 * Product Mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useCreateProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => api.post(API_ROUTES.PRODUCTS.CREATE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['products', 'mine'] })
    },
  })
}

export const useUpdateProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, data }) =>
      api.put(API_ROUTES.PRODUCTS.UPDATE(productId), data),
    onSuccess: (_, variables) => {
      const id = variables?.productId
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['products', 'mine'] })
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['product', id] })
      }
    },
  })
}

export const useDeleteProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (productId) =>
      api.delete(API_ROUTES.PRODUCTS.DELETE(productId)),
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['products', 'mine'] })
      if (productId) {
        queryClient.invalidateQueries({ queryKey: ['product', productId] })
      }
    },
  })
}

