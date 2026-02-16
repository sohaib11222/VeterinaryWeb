import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useCreateVaccine = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => api.post(API_ROUTES.VACCINES.CREATE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccines'] })
    },
  })
}

export const useUpdateVaccine = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => api.put(API_ROUTES.VACCINES.UPDATE(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccines'] })
    },
  })
}

export const useDeleteVaccine = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => api.delete(API_ROUTES.VACCINES.DELETE(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccines'] })
    },
  })
}
