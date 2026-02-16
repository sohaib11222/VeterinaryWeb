/**
 * Mapping Queries
 * All GET requests related to mapping and location.
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useRoute = (from, to, options = {}) =>
  useQuery({
    queryKey: ['mapping', 'route', from, to],
    queryFn: () =>
      api.get(API_ROUTES.MAPPING.ROUTE, {
        params: {
          fromLat: from.lat,
          fromLng: from.lng,
          toLat: to.lat,
          toLng: to.lng,
        },
      }),
    enabled: !!(from?.lat && from?.lng && to?.lat && to?.lng) && options.enabled !== false,
    ...options,
  })

export const useNearbyClinics = (lat, lng, radius = 10, options = {}) =>
  useQuery({
    queryKey: ['mapping', 'nearby', lat, lng, radius],
    queryFn: () => api.get(API_ROUTES.MAPPING.NEARBY, { params: { lat, lng, radius } }),
    enabled: !!(lat && lng) && options.enabled !== false,
    ...options,
  })

export const useClinicsWithCoordinates = (options = {}) =>
  useQuery({
    queryKey: ['mapping', 'clinics'],
    queryFn: () => api.get(API_ROUTES.MAPPING.CLINICS),
    enabled: options.enabled !== false,
    ...options,
  })

export const useClinicLocation = (clinicId, options = {}) =>
  useQuery({
    queryKey: ['mapping', 'clinic', clinicId],
    queryFn: () => api.get(API_ROUTES.MAPPING.CLINIC(clinicId)),
    enabled: !!clinicId && options.enabled !== false,
    ...options,
  })
