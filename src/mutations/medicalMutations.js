/**
 * Medical & Health Mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

// Medical records
export const useCreateMedicalRecord = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => api.post(API_ROUTES.MEDICAL_RECORDS.CREATE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-records'] })
    },
  })
}

export const useUploadMedicalRecordFiles = () =>
  useMutation({
    mutationFn: (files) => {
      const list = Array.isArray(files) ? files : files ? [files] : []
      const formData = new FormData()
      // Backend expects field name 'medicalRecords'
      list.forEach((f) => formData.append('medicalRecords', f))
      return api.upload(API_ROUTES.UPLOAD.MEDICAL_RECORDS, formData)
    },
  })

export const useCreateMedicalRecordWithUpload = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, files, ...record }) => {
      const list = files || file
      const uploadRes = await (async () => {
        const formData = new FormData()
        const fl = Array.isArray(list) ? list : list ? [list] : []
        fl.forEach((f) => formData.append('medicalRecords', f))
        return api.upload(API_ROUTES.UPLOAD.MEDICAL_RECORDS, formData)
      })()

      const urls = uploadRes?.data?.urls
      const fileUrl = Array.isArray(urls) && urls.length > 0 ? urls[0] : null
      if (!fileUrl) {
        throw new Error('File upload failed')
      }

      const firstFile = Array.isArray(list) ? list?.[0] : list

      return api.post(API_ROUTES.MEDICAL_RECORDS.CREATE, {
        ...record,
        fileUrl,
        fileName: record.fileName ?? firstFile?.name ?? null,
        fileSize: record.fileSize ?? firstFile?.size ?? null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-records'] })
    },
  })
}

export const useDeleteMedicalRecord = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (recordId) =>
      api.delete(API_ROUTES.MEDICAL_RECORDS.DELETE(recordId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-records'] })
    },
  })
}

// Vaccinations
export const useCreateVaccination = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => api.post(API_ROUTES.VACCINATIONS.CREATE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccinations'] })
      queryClient.invalidateQueries({ queryKey: ['vaccinations', 'upcoming'] })
    },
  })
}

export const useUpdateVaccination = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) =>
      api.put(API_ROUTES.VACCINATIONS.UPDATE(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccinations'] })
      queryClient.invalidateQueries({ queryKey: ['vaccinations', 'upcoming'] })
    },
  })
}

export const useDeleteVaccination = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => api.delete(API_ROUTES.VACCINATIONS.DELETE(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccinations'] })
      queryClient.invalidateQueries({ queryKey: ['vaccinations', 'upcoming'] })
    },
  })
}

// Weight records
export const useCreateWeightRecord = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => api.post(API_ROUTES.WEIGHT_RECORDS.CREATE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-records'] })
    },
  })
}

export const useUpdateWeightRecord = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) =>
      api.put(API_ROUTES.WEIGHT_RECORDS.UPDATE(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-records'] })
    },
  })
}

export const useDeleteWeightRecord = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => api.delete(API_ROUTES.WEIGHT_RECORDS.DELETE(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-records'] })
    },
  })
}

