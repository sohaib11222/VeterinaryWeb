import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useUpdatePetSitterProfile = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.patch(API_ROUTES.PET_SITTERS.UPDATE_ME, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet-sitter'] })
    },
  })
}

export const useUpdateAdminPetSitterStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }) => api.patch(API_ROUTES.ADMIN.PET_SITTER_STATUS(id), { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'pet-sitters'] }),
  })
}
