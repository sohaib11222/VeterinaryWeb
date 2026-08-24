import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useProductPrescriptionEligibility = (productId, variantId, options = {}) =>
  useQuery({
    queryKey: ['product-prescription-eligibility', productId, variantId || 'default'],
    queryFn: () => api.get(API_ROUTES.PRODUCT_PRESCRIPTIONS.ELIGIBILITY(productId, variantId)),
    enabled: Boolean(productId) && options.enabled !== false,
    refetchInterval: 30_000,
    ...options,
  })

export const useMyProductPrescriptionRequests = (params = {}, options = {}) =>
  useQuery({
    queryKey: ['product-prescription-requests', 'mine', params],
    queryFn: () => api.get(API_ROUTES.PRODUCT_PRESCRIPTIONS.MINE, { params }),
    ...options,
  })

export const usePharmacyPrescriptionRequests = (params = {}, options = {}) =>
  useQuery({
    queryKey: ['product-prescription-requests', 'pharmacy', params],
    queryFn: () => api.get(API_ROUTES.PRODUCT_PRESCRIPTIONS.PHARMACY, { params }),
    refetchInterval: 20_000,
    ...options,
  })

export const usePharmacyPendingPrescriptionCount = (options = {}) =>
  useQuery({
    queryKey: ['product-prescription-requests', 'pharmacy', 'pending-count'],
    queryFn: () => api.get(API_ROUTES.PRODUCT_PRESCRIPTIONS.PHARMACY_PENDING_COUNT),
    refetchInterval: 20_000,
    ...options,
  })
