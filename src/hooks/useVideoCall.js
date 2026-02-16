import { useState, useCallback, useEffect } from 'react'
import { StreamVideoClient } from '@stream-io/video-react-sdk'
import { useAuth } from '../contexts/AuthContext'
import * as videoApi from '../api/video'

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY

export const useVideoCall = (appointmentId) => {
  const { user } = useAuth()
  const [client, setClient] = useState(null)
  const [call, setCall] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const requestMediaPermissions = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('MediaDevices API is not supported in this browser')
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      stream.getTracks().forEach((t) => t.stop())
      return true
    } catch (err) {
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        throw new Error('Camera and microphone permissions are required for video calls. Please allow access in your browser settings.')
      }
      if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        throw new Error('No camera or microphone found. Please connect a camera and microphone to use video calls.')
      }
      if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
        throw new Error('Camera or microphone is already in use by another application. Please close other applications using your camera/microphone.')
      }
      throw new Error(`Failed to access camera/microphone: ${err?.message || 'Unknown error'}`)
    }
  }

  const initializeCall = useCallback(async () => {
    if (!appointmentId || !user) return

    setLoading(true)
    setError(null)

    try {
      if (!STREAM_API_KEY) {
        throw new Error('Missing VITE_STREAM_API_KEY in frontend environment')
      }

      const sessionData = await videoApi.getVideoSessionByAppointment(appointmentId)
      const payload = sessionData?.data ?? sessionData
      const streamToken = payload?.streamToken
      const streamCallId = payload?.streamCallId || payload?.sessionId || `appointment-${appointmentId}`

      if (!streamToken) {
        throw new Error('No Stream token received from backend')
      }

      const userId = user._id || user.id
      if (!userId) {
        throw new Error('Missing user id')
      }

      const streamClient = new StreamVideoClient({
        apiKey: STREAM_API_KEY,
        user: {
          id: userId,
          name: user.fullName || user.name || user.email || 'User',
        },
        token: streamToken,
      })

      const streamCall = streamClient.call('default', streamCallId)

      setClient(streamClient)
      setCall(streamCall)

      return { streamClient, streamCall }
    } catch (err) {
      const message = err?.data?.message || err?.response?.data?.message || err?.message || 'Failed to initialize video call'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [appointmentId, user])

  const startCall = useCallback(async () => {
    if (!appointmentId || !user) return

    setLoading(true)
    setError(null)

    try {
      if (!STREAM_API_KEY) {
        throw new Error('Missing VITE_STREAM_API_KEY in frontend environment')
      }

      const sessionData = await videoApi.startVideoSession(appointmentId)
      const payload = sessionData?.data ?? sessionData
      const streamToken = payload?.streamToken
      const streamCallId = payload?.streamCallId || payload?.sessionId || `appointment-${appointmentId}`

      if (!streamToken) {
        throw new Error('No Stream token received from backend. Please check backend Stream credentials.')
      }

      const userId = user._id || user.id
      if (!userId) {
        throw new Error('Missing user id')
      }

      const streamClient = new StreamVideoClient({
        apiKey: STREAM_API_KEY,
        user: {
          id: userId,
          name: user.fullName || user.name || user.email || 'User',
        },
        token: streamToken,
      })

      const streamCall = streamClient.call('default', streamCallId)
      await requestMediaPermissions()

      await streamCall.join({ create: true })

      try {
        await streamCall.camera.enable()
      } catch {}
      try {
        await streamCall.microphone.enable()
      } catch {}

      setClient(streamClient)
      setCall(streamCall)

      return { streamClient, streamCall }
    } catch (err) {
      const message = err?.data?.message || err?.response?.data?.message || err?.message || 'Failed to start video call'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [appointmentId, user])

  const endCall = useCallback(async () => {
    const currentCall = call
    const currentClient = client

    if (currentCall) {
      try {
        await currentCall.leave()
      } catch {}
    }

    if (currentClient) {
      try {
        await currentClient.disconnectUser()
      } catch {}
    }

    setCall(null)
    setClient(null)
  }, [call, client])

  useEffect(() => {
    const currentCall = call
    return () => {
      if (currentCall) {
        currentCall.leave().catch(() => {})
      }
    }
  }, [call])

  return {
    client,
    call,
    loading,
    error,
    initializeCall,
    startCall,
    endCall,
  }
}
