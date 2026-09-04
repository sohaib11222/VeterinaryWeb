import { useMutation } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useCreateContactQuery = () => useMutation({
  mutationFn: (data) => api.post(API_ROUTES.CONTACT_QUERIES.CREATE, data),
})
