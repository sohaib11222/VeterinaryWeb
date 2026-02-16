import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useMyAppointmentReview = (appointmentId, options = {}) =>
  useQuery({
    queryKey: ['reviews', 'appointment', appointmentId, 'mine'],
    queryFn: () => api.get(API_ROUTES.REVIEWS.MY_APPOINTMENT_REVIEW(appointmentId)),
    enabled: Boolean(appointmentId) && (options.enabled ?? true),
    retry: false,
  })
