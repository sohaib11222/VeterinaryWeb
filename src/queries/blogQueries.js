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

export const useBlogPosts = (params = {}, queryOptions = {}) =>
  useQuery({
    queryKey: ['blog', 'posts', stableParamsKey(params)],
    queryFn: () => api.get(API_ROUTES.BLOG.LIST, { params }),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 30_000,
    ...queryOptions,
  })

export const useBlogPost = (blogPostId, queryOptions = {}) =>
  useQuery({
    queryKey: ['blog', 'post', blogPostId],
    queryFn: () => api.get(API_ROUTES.BLOG.GET(blogPostId)),
    enabled: !!blogPostId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 30_000,
    ...queryOptions,
  })
