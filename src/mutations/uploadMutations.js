import { useMutation } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useUploadChatFile = () =>
  useMutation({
    mutationFn: (formData) => api.upload(API_ROUTES.UPLOAD.CHAT, formData),
  })

export const useUploadChatFiles = () =>
  useMutation({
    mutationFn: (formData) => api.upload(API_ROUTES.UPLOAD.CHAT_MULTIPLE, formData),
  })
