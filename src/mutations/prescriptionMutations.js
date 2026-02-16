import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useUpsertPrescriptionForAppointment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ appointmentId, data }) => api.post(API_ROUTES.PRESCRIPTIONS.UPSERT_FOR_APPOINTMENT(appointmentId), data),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] })
      if (variables?.appointmentId) {
        queryClient.invalidateQueries({ queryKey: ['prescriptions', 'appointment', variables.appointmentId] })
      }
    },
  })
}
