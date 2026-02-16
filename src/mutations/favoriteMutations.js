/**
 * Favorite Mutations
 * Add / remove veterinarian favorites (PET_OWNER).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../utils/api'
import { API_ROUTES } from '../utils/apiConfig'

export const useAddFavorite = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (veterinarianId) =>
      api.post(API_ROUTES.FAVORITE.ADD, { veterinarianId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })
}

export const useRemoveFavorite = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (favoriteId) => api.delete(API_ROUTES.FAVORITE.REMOVE(favoriteId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })
}
