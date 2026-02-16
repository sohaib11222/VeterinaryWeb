import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useUserById = (userId, options = {}) =>
  useQuery({
    queryKey: ['users', userId],
    queryFn: () => api.get(API_ROUTES.USERS.GET(userId)),
    enabled: Boolean(userId) && (options.enabled ?? true),
    ...options,
  })
