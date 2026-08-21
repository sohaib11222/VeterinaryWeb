import { useCallback, useEffect, useRef, useState } from 'react'
import { StreamVideoClient } from '@stream-io/video-react-sdk'

import { useAuth } from '../contexts/AuthContext'
import * as videoApi from '../api/video'

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY
const MEDIA_PERMISSION_TIMEOUT_MS = 12_000
const STREAM_JOIN_TIMEOUT_MS = 20_000

const responseData = (response) => response?.data?.data ?? response?.data ?? response

const within = (promise, timeoutMs, message) => new Promise((resolve, reject) => {
  const timer = window.setTimeout(() => reject(new Error(message)), timeoutMs)
  Promise.resolve(promise).then(
    (value) => { window.clearTimeout(timer); resolve(value) },
    (error) => { window.clearTimeout(timer); reject(error) }
  )
})

export const useVideoCall = (appointmentId) => {
  const { user } = useAuth()
  const [client, setClient] = useState(null)
  const [call, setCall] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const clientRef = useRef(null)
  const callRef = useRef(null)

  const requestMediaPermissions = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Camera and microphone are not supported in this browser')
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      stream.getTracks().forEach((track) => track.stop())
    } catch (err) {
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        throw new Error('Camera and microphone permissions are required. Please allow access in your browser settings.')
      }
      if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        throw new Error('No camera or microphone was found. Please connect one and try again.')
      }
      throw new Error(`Failed to access camera/microphone: ${err?.message || 'Unknown error'}`)
    }
  }, [])

  const createStreamCall = useCallback(async (payload) => {
    if (!STREAM_API_KEY) throw new Error('Missing VITE_STREAM_API_KEY in the frontend environment')

    const streamToken = payload?.streamToken
    const streamCallId = payload?.streamCallId || payload?.session?.sessionId
    const userId = user?._id || user?.id
    if (!streamToken || !streamCallId || !userId) {
      throw new Error('The video-call connection details are incomplete')
    }

    const streamClient = new StreamVideoClient({
      apiKey: STREAM_API_KEY,
      user: { id: userId, name: user?.fullName || user?.name || user?.email || 'User' },
      token: streamToken,
    })
    const streamCall = streamClient.call('default', streamCallId)

    try {
      await within(
        requestMediaPermissions(),
        MEDIA_PERMISSION_TIMEOUT_MS,
        'Camera and microphone access timed out. Check the browser permission prompt and try again.'
      )
      await within(
        streamCall.join({ create: true }),
        STREAM_JOIN_TIMEOUT_MS,
        'The video service did not connect in time. Please check your connection and call again.'
      )
      await Promise.allSettled([streamCall.camera.enable(), streamCall.microphone.enable()])
      // Keep the live SDK objects in refs before updating React state. The
      // cleanup must only run on unmount/end, not between setClient/setCall.
      clientRef.current = streamClient
      callRef.current = streamCall
      setClient(streamClient)
      setCall(streamCall)
      return { streamClient, streamCall }
    } catch (err) {
      await streamClient.disconnectUser().catch(() => {})
      throw err
    }
  }, [requestMediaPermissions, user])

  const startCall = useCallback(async ({ restartActive = false } = {}) => {
    if (!appointmentId || !user) return null
    setLoading(true)
    setError(null)
    try {
      return responseData(await videoApi.startVideoSession(appointmentId, { restartActive }))
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Failed to start video call'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [appointmentId, user])

  const getSession = useCallback(async () => {
    if (!appointmentId || !user) return null
    try {
      return responseData(await videoApi.getVideoSessionByAppointment(appointmentId))
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Failed to load video call'
      setError(message)
      throw err
    }
  }, [appointmentId, user])

  const joinActiveCall = useCallback(async (knownSession = null) => {
    setLoading(true)
    setError(null)
    try {
      const payload = await getSession()
      const activeSession = payload?.session || knownSession
      if (activeSession?.status !== 'ACTIVE') {
        throw new Error('The other participant has not accepted the call yet')
      }
      return await createStreamCall({ ...payload, session: activeSession })
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Failed to join video call'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [createStreamCall, getSession])

  const endCall = useCallback(async () => {
    const currentCall = callRef.current
    const currentClient = clientRef.current
    callRef.current = null
    clientRef.current = null
    setCall(null)
    setClient(null)
    await currentCall?.leave().catch(() => {})
    await currentClient?.disconnectUser().catch(() => {})
  }, [])

  useEffect(() => () => {
    const activeCall = callRef.current
    const activeClient = clientRef.current
    callRef.current = null
    clientRef.current = null
    activeCall?.leave().catch(() => {})
    activeClient?.disconnectUser().catch(() => {})
  }, [])

  return { client, call, loading, error, startCall, getSession, joinActiveCall, endCall }
}
