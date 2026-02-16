import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/api'
import apiClient from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const usePrescriptionByAppointment = (appointmentId, options = {}) =>
  useQuery({
    queryKey: ['prescriptions', 'appointment', appointmentId],
    queryFn: async () => {
      try {
        return await api.get(API_ROUTES.PRESCRIPTIONS.BY_APPOINTMENT(appointmentId))
      } catch (err) {
        if (err?.status === 404) return null
        throw err
      }
    },
    enabled: Boolean(appointmentId) && (options.enabled ?? true),
    retry: false,
  })

export const useMyPrescriptions = (params = {}, options = {}) =>
  useQuery({
    queryKey: ['prescriptions', 'mine', params],
    queryFn: () => api.get(API_ROUTES.PRESCRIPTIONS.LIST_MINE, { params }),
    enabled: options.enabled ?? true,
  })

export const downloadPrescriptionPdf = async (prescriptionId) => {
  const res = await apiClient.get(API_ROUTES.PRESCRIPTIONS.PDF(prescriptionId), {
    responseType: 'blob',
  })
  return res?.data
}
