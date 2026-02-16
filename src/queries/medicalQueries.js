/**
 * Medical & Health Queries
 * Medical records, vaccinations, and weight tracking.
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useMedicalRecords = (params = {}) =>
  useQuery({
    queryKey: ['medical-records', params],
    queryFn: () => api.get(API_ROUTES.MEDICAL_RECORDS.LIST, { params }),
  })

export const useMedicalRecord = (recordId) =>
  useQuery({
    queryKey: ['medical-records', recordId],
    queryFn: () => api.get(API_ROUTES.MEDICAL_RECORDS.GET(recordId)),
    enabled: !!recordId,
  })

export const useVaccinations = (params = {}) =>
  useQuery({
    queryKey: ['vaccinations', params],
    queryFn: () => api.get(API_ROUTES.VACCINATIONS.LIST, { params }),
  })

export const useUpcomingVaccinations = (params = {}) =>
  useQuery({
    queryKey: ['vaccinations', 'upcoming', params],
    queryFn: () => api.get(API_ROUTES.VACCINATIONS.UPCOMING, { params }),
  })

export const useVaccines = (params = {}) =>
  useQuery({
    queryKey: ['vaccines', params],
    queryFn: () => api.get(API_ROUTES.VACCINES.LIST, { params }),
  })

export const useWeightRecords = (params = {}) =>
  useQuery({
    queryKey: ['weight-records', params],
    queryFn: () => api.get(API_ROUTES.WEIGHT_RECORDS.LIST, { params }),
  })

export const useLatestWeightRecord = (petId) =>
  useQuery({
    queryKey: ['weight-records', 'latest', petId],
    queryFn: async () => {
      const res = await api.get(API_ROUTES.WEIGHT_RECORDS.LIST, { params: { petId, page: 1, limit: 1 } })
      const payload = res?.data || {}
      const records = payload.records || []
      return records.length > 0 ? records[0] : null
    },
    enabled: !!petId,
  })

