/**
 * Announcement Mutations
 * (Primarily admin-side; included for completeness)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => api.post(API_ROUTES.ANNOUNCEMENTS.BASE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
  })
}

export const useUpdateAnnouncement = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ announcementId, data }) =>
      api.put(API_ROUTES.ANNOUNCEMENTS.GET(announcementId), data),
    onSuccess: (_, variables) => {
      const id = variables?.announcementId
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['announcement', id] })
      }
    },
  })
}

export const useDeleteAnnouncement = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (announcementId) =>
      api.delete(API_ROUTES.ANNOUNCEMENTS.GET(announcementId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      queryClient.invalidateQueries({ queryKey: ['announcements', 'veterinarian'] })
      queryClient.invalidateQueries({ queryKey: ['announcements', 'unread-count'] })
    },
  })
}

export const useMarkAnnouncementAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (announcementId) =>
      api.post(API_ROUTES.ANNOUNCEMENTS.MARK_READ(announcementId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', 'veterinarian'] })
      queryClient.invalidateQueries({ queryKey: ['announcements', 'unread-count'] })
    },
  })
}

