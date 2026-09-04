import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useFooterOptions = (queryOptions = {}) => useQuery({
  queryKey: ['footer-options'],
  queryFn: () => api.get(API_ROUTES.FOOTER_OPTIONS.GET),
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  ...queryOptions,
})
