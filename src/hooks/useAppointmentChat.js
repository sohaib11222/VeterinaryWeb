import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useGetOrCreateConversation } from '../mutations'

const idOf = (value) => {
  if (!value) return ''
  return typeof value === 'object' ? value._id || value.id || '' : value
}

const unwrapConversation = (response) => {
  const outer = response?.data ?? response
  return outer?.data ?? outer
}

// Prepare the conversation before changing routes. This prevents the chat
// page from rendering while its conversation is still being created.
export const useAppointmentChat = (route = '/chat') => {
  const navigate = useNavigate()
  const getOrCreateConversation = useGetOrCreateConversation()
  const [openingAppointmentId, setOpeningAppointmentId] = useState('')

  const openChat = useCallback(async (appointment) => {
    const source = appointment?.raw || appointment?._raw || appointment || {}
    const appointmentId = idOf(source._id) || idOf(appointment?.appointmentId) || idOf(appointment?.id)
    const veterinarianId = idOf(source.veterinarianId)
    const petOwnerId = idOf(source.petOwnerId)

    if (!appointmentId || !veterinarianId || !petOwnerId) {
      throw new Error('This appointment does not have enough information to open chat yet.')
    }

    setOpeningAppointmentId(String(appointmentId))
    try {
      const response = await getOrCreateConversation.mutateAsync({
        veterinarianId,
        petOwnerId,
        appointmentId,
      })
      const conversation = unwrapConversation(response)
      if (!conversation?._id) {
        throw new Error('The appointment chat could not be prepared.')
      }

      navigate(
        `${route}?conversationId=${encodeURIComponent(String(conversation._id))}&appointmentId=${encodeURIComponent(String(appointmentId))}`,
        { state: { chatReady: true } }
      )
      return conversation
    } finally {
      setOpeningAppointmentId('')
    }
  }, [getOrCreateConversation, navigate, route])

  return {
    openChat,
    openingAppointmentId,
    isOpening: (appointmentId) => String(openingAppointmentId || '') === String(appointmentId || ''),
  }
}

