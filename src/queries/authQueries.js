/**
 * Auth & system queries (VeterinaryFrontend)
 * Read-only queries using TanStack Query.
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

// Basic health check – useful to verify backend connectivity
export const useHealthCheck = () =>
  useQuery({
    queryKey: ['health'],
    queryFn: () => api.get(API_ROUTES.HEALTH),
    refetchOnWindowFocus: false,
  })

