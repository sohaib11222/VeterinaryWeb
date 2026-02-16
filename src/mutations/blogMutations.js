import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useCreateBlogPost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => api.post(API_ROUTES.BLOG.CREATE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog', 'posts'] })
    },
  })
}

export const useUpdateBlogPost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ blogPostId, data }) => api.put(API_ROUTES.BLOG.UPDATE(blogPostId), data),
    onSuccess: (_, variables) => {
      const id = variables?.blogPostId
      queryClient.invalidateQueries({ queryKey: ['blog', 'posts'] })
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['blog', 'post', id] })
      }
    },
  })
}

export const useDeleteBlogPost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (blogPostId) => api.delete(API_ROUTES.BLOG.DELETE(blogPostId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog', 'posts'] })
    },
  })
}

export const useUploadBlogCoverImage = () =>
  useMutation({
    mutationFn: (formData) => api.upload(API_ROUTES.UPLOAD.BLOG, formData),
  })
