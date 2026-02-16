/**
 * Auth mutations (VeterinaryFrontend)
 * All write operations related to authentication.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

// Register user (typically PET_OWNER or VETERINARIAN)
export const useRegister = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => api.post(API_ROUTES.AUTH.REGISTER, data),
    onSuccess: (data) => {
      if (data?.data?.token) {
        localStorage.setItem('token', data.data.token)
      }
      if (data?.data?.refreshToken) {
        localStorage.setItem('refreshToken', data.data.refreshToken)
      }
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

// Login user
export const useLogin = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => api.post(API_ROUTES.AUTH.LOGIN, data),
    onSuccess: (data) => {
      if (data?.data?.token) {
        localStorage.setItem('token', data.data.token)
      }
      if (data?.data?.refreshToken) {
        localStorage.setItem('refreshToken', data.data.refreshToken)
      }
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

// Change password
export const useChangePassword = () =>
  useMutation({
    mutationFn: (data) => api.post(API_ROUTES.AUTH.CHANGE_PASSWORD, data),
  })

