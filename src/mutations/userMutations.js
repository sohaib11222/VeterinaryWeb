import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => api.put(API_ROUTES.USERS.UPDATE_PROFILE, data),
    onSuccess: (res) => {
      const updated = res?.data
      const userId = updated?.id || updated?._id
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['users', userId] })
      }
    },
  })
}

export const useUploadProfileImage = () =>
  useMutation({
    mutationFn: (file) => {
      const formData = new FormData()
      formData.append('file', file)
      return api.upload(API_ROUTES.UPLOAD.PROFILE, formData)
    },
  })
