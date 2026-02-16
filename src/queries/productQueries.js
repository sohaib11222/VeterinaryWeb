/**
 * Product Queries
 * All GET requests related to products.
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useProducts = (params = {}) =>
  useQuery({
    queryKey: ['products', params],
    queryFn: () => api.get(API_ROUTES.PRODUCTS.LIST, { params }),
  })

export const useProduct = (productId) =>
  useQuery({
    queryKey: ['product', productId],
    queryFn: () => api.get(API_ROUTES.PRODUCTS.GET(productId)),
    enabled: !!productId,
  })

export const useMyProducts = (params = {}) =>
  useQuery({
    queryKey: ['products', 'mine', params],
    queryFn: () => api.get(API_ROUTES.PRODUCTS.MINE, { params }),
  })

