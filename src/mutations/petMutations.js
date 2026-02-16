/**
 * Pet Mutations
 * All write operations related to pets.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useCreatePet = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => api.post(API_ROUTES.PETS.CREATE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] })
    },
  })
}

export const useUploadPetImages = () =>
  useMutation({
    mutationFn: (files) => {
      const list = Array.isArray(files) ? files : files ? [files] : []
      const formData = new FormData()
      list.forEach((f) => formData.append('pet', f))
      return api.upload(API_ROUTES.UPLOAD.PET, formData)
    },
  })

export const useCreatePetWithUpload = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, files, ...data }) => {
      const list = files || file
      let urls = null

      if (list) {
        const formData = new FormData()
        const fl = Array.isArray(list) ? list : [list]
        fl.forEach((f) => formData.append('pet', f))
        const uploadRes = await api.upload(API_ROUTES.UPLOAD.PET, formData)
        urls = uploadRes?.data?.urls
      }

      const photos = Array.isArray(urls) ? urls : []
      const photo = photos.length > 0 ? photos[0] : undefined

      return api.post(API_ROUTES.PETS.CREATE, {
        ...data,
        ...(photo ? { photo } : {}),
        ...(photos.length > 0 ? { photos } : {}),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] })
    },
  })
}

export const useUpdatePetWithUpload = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ petId, file, files, data }) => {
      const list = files || file
      let urls = null

      if (list) {
        const formData = new FormData()
        const fl = Array.isArray(list) ? list : [list]
        fl.forEach((f) => formData.append('pet', f))
        const uploadRes = await api.upload(API_ROUTES.UPLOAD.PET, formData)
        urls = uploadRes?.data?.urls
      }

      const photos = Array.isArray(urls) ? urls : []
      const photo = photos.length > 0 ? photos[0] : undefined

      return api.put(API_ROUTES.PETS.UPDATE(petId), {
        ...(data || {}),
        ...(photo ? { photo } : {}),
        ...(photos.length > 0 ? { photos } : {}),
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pets'] })
      if (variables?.petId) {
        queryClient.invalidateQueries({ queryKey: ['pet', variables.petId] })
      }
    },
  })
}

export const useUpdatePet = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ petId, data }) =>
      api.put(API_ROUTES.PETS.UPDATE(petId), data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pets'] })
      if (variables?.petId) {
        queryClient.invalidateQueries({ queryKey: ['pet', variables.petId] })
      }
    },
  })
}

export const useDeletePet = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (petId) => api.delete(API_ROUTES.PETS.DELETE(petId)),
    onSuccess: (_, petId) => {
      queryClient.invalidateQueries({ queryKey: ['pets'] })
      if (petId) {
        queryClient.invalidateQueries({ queryKey: ['pet', petId] })
      }
    },
  })
}

