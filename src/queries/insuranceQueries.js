import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useActiveInsuranceCompanies = (options = {}) =>
  useQuery({
    queryKey: ['insurance', 'active'],
    queryFn: () => api.get(API_ROUTES.INSURANCE.LIST),
    ...options,
  })
