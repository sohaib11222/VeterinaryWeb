/**
 * Specialization Queries
 * GET requests for specializations (list for dropdowns).
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useSpecializations = () =>
  useQuery({
    queryKey: ['specializations'],
    queryFn: () => api.get(API_ROUTES.SPECIALIZATIONS.LIST),
  })
