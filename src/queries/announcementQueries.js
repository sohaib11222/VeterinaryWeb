/**
 * Announcement Queries
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

const stableParamsKey = (params = {}) => {
  if (!params || typeof params !== 'object') return ''
  const keys = Object.keys(params).sort()
  const normalized = {}
  keys.forEach((k) => {
    normalized[k] = params[k]
  })
  return JSON.stringify(normalized)
}

export const useAnnouncements = (params = {}) =>
  useQuery({
    queryKey: ['announcements', params],
    queryFn: () => api.get(API_ROUTES.ANNOUNCEMENTS.LIST, { params }),
  })

export const useAnnouncement = (announcementId) =>
  useQuery({
    queryKey: ['announcement', announcementId],
    queryFn: () => api.get(API_ROUTES.ANNOUNCEMENTS.GET(announcementId)),
    enabled: !!announcementId,
  })

export const useAnnouncementReadStatus = (announcementId, params = {}, queryOptions = {}) =>
  useQuery({
    queryKey: ['announcement', 'read-status', announcementId, stableParamsKey(params)],
    queryFn: () => api.get(API_ROUTES.ANNOUNCEMENTS.READ_STATUS(announcementId), { params }),
    enabled: !!announcementId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 30_000,
    ...queryOptions,
  })

export const useVeterinarianAnnouncements = (params = {}, queryOptions = {}) =>
  useQuery({
    queryKey: ['announcements', 'veterinarian', stableParamsKey(params)],
    queryFn: () => api.get(API_ROUTES.ANNOUNCEMENTS.VETERINARIAN_LIST, { params }),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 30_000,
    ...queryOptions,
  })

export const useUnreadAnnouncementCount = (queryOptions = {}) =>
  useQuery({
    queryKey: ['announcements', 'unread-count'],
    queryFn: () => api.get(API_ROUTES.ANNOUNCEMENTS.UNREAD_COUNT),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 60_000,
    ...queryOptions,
  })

