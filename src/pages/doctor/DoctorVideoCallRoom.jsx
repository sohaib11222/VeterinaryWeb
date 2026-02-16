import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  ParticipantView,
  StreamCall,
  StreamTheme,
  StreamVideo,
  useCallStateHooks,
} from '@stream-io/video-react-sdk'

import { useAuth } from '../../contexts/AuthContext'
import { useVideoCall } from '../../hooks/useVideoCall'
import * as videoApi from '../../api/video'
import { useAppointment } from '../../queries'

const DoctorVideoCallRoom = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const appointmentId = searchParams.get('appointmentId')
  const { user } = useAuth()

  const { data: appointmentResponse, isLoading: appointmentLoading } = useAppointment(appointmentId)
  const appointment = useMemo(() => appointmentResponse?.data ?? appointmentResponse, [appointmentResponse])

  const { client, call, loading, error, startCall, endCall } = useVideoCall(appointmentId)

  const startCallRef = useRef(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const pendingNavigation = useRef(null)
  const [isCallActive, setIsCallActive] = useState(false)
  const [timeValidationError, setTimeValidationError] = useState(null)
  const errorShownRef = useRef(false)

  const checkAppointmentTime = () => {
    if (!appointment) return { isValid: false, message: 'Appointment not found' }

    const now = new Date()
    const appointmentStartDateTime = new Date(appointment.appointmentDate)
    const [startHours, startMinutes] = String(appointment.appointmentTime || '').split(':').map(Number)
    appointmentStartDateTime.setHours(startHours, startMinutes, 0, 0)

    const duration = appointment.appointmentDuration || 30
    let appointmentEndDateTime
    if (appointment.appointmentEndTime) {
      const [endHours, endMinutes] = String(appointment.appointmentEndTime || '').split(':').map(Number)
      appointmentEndDateTime = new Date(appointment.appointmentDate)
      appointmentEndDateTime.setHours(endHours, endMinutes, 0, 0)
    } else {
      appointmentEndDateTime = new Date(appointmentStartDateTime.getTime() + duration * 60 * 1000)
    }

    const bufferTime = 2 * 60 * 1000
    const earliestAllowedTime = new Date(appointmentStartDateTime.getTime() - bufferTime)

    if (now < earliestAllowedTime) {
      return {
        isValid: false,
        message: `Video call is only available within the appointment window. It will be available 2 minutes before the start time. Your appointment starts at ${appointmentStartDateTime.toLocaleString()}.`,
        startTime: appointmentStartDateTime,
        endTime: appointmentEndDateTime,
      }
    }

    if (now > appointmentEndDateTime) {
      return {
        isValid: false,
        message: `The appointment time has passed. The appointment window was from ${appointmentStartDateTime.toLocaleString()} to ${appointmentEndDateTime.toLocaleString()}. Video call is no longer available.`,
        startTime: appointmentStartDateTime,
        endTime: appointmentEndDateTime,
      }
    }

    return { isValid: true, message: null, startTime: appointmentStartDateTime, endTime: appointmentEndDateTime }
  }

  useEffect(() => {
    if (!appointment || appointmentLoading || errorShownRef.current) return
    const timeCheck = checkAppointmentTime()
    if (!timeCheck.isValid) {
      errorShownRef.current = true
      setTimeValidationError(timeCheck.message)
    }
  }, [appointment, appointmentLoading])

  useEffect(() => {
    if (!appointmentId || !user) return
    if (startCallRef.current) return
    if (loading || appointmentLoading) return
    if (timeValidationError) return

    const timeCheck = checkAppointmentTime()
    if (!timeCheck.isValid) {
      if (!errorShownRef.current) {
        errorShownRef.current = true
        setTimeValidationError(timeCheck.message)
      }
      return
    }

    startCallRef.current = true
    startCall()
      .then(() => {
        setIsCallActive(true)
      })
      .catch((err) => {
        startCallRef.current = false
        setIsCallActive(false)
        const message = err?.data?.message || err?.response?.data?.message || err?.message || 'Failed to start video call'

        const looksTimeRelated =
          message.includes('Communication window') ||
          message.includes('appointment time') ||
          message.includes('appointment window') ||
          message.includes('time window') ||
          message.includes('not arrived') ||
          message.includes('expired')

        if (looksTimeRelated) {
          if (!errorShownRef.current) {
            errorShownRef.current = true
            setTimeValidationError(message)
          }
          return
        }

        if (message.toLowerCase().includes('permission')) {
          toast.error(message, { autoClose: 8000, toastId: 'permission-error' })
          return
        }

        toast.error(message, { toastId: 'call-error' })
      })
  }, [appointmentId, user, loading, appointmentLoading, timeValidationError, startCall])

  const handleEndCall = async () => {
    try {
      setIsCallActive(false)
      try {
        const sessionData = await videoApi.getVideoSessionByAppointment(appointmentId)
        const payload = sessionData?.data ?? sessionData
        if (payload?.sessionId) {
          await videoApi.endVideoSession(payload.sessionId)
        }
      } catch {}
      await endCall()
    } finally {
      navigate('/appointments')
    }
  }

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isCallActive && call) {
        e.preventDefault()
        e.returnValue = 'You have an active call. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isCallActive, call])

  useEffect(() => {
    if (!isCallActive) return

    const handlePopState = (e) => {
      e.preventDefault()
      setShowLeaveConfirm(true)
      pendingNavigation.current = () => {
        window.history.pushState(null, '', window.location.href)
        handleEndCall()
      }
    }

    window.history.pushState(null, '', window.location.href)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isCallActive])

  if (timeValidationError) {
    return (
      <div className="content doctor-content">
        <div className="container">
          <div className="row">
            <div className="col-lg-10 mx-auto">
              <div className="alert alert-warning mt-4" role="alert">
                <h5 className="alert-heading">Appointment Time Issue</h5>
                <p className="mb-3">{timeValidationError}</p>
                <button className="btn btn-primary" onClick={() => navigate('/appointments')}>
                  Back to Appointments
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!appointmentId) {
    return (
      <div className="content doctor-content">
        <div className="container">
          <div className="alert alert-warning mt-4">Missing appointmentId</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="content doctor-content">
        <div className="container">
          <div className="alert alert-danger mt-4">
            <h5>Error</h5>
            <p className="mb-3">{error}</p>
            <button className="btn btn-primary" onClick={() => navigate('/appointments')}>
              Back to Appointments
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading || !client || !call) {
    return (
      <div className="content doctor-content">
        <div className="container">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Preparing video call...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <StreamTheme className="str-video__theme-dark">
            <VideoCallContent onEndCall={handleEndCall} />
          </StreamTheme>
        </StreamCall>
      </StreamVideo>

      {showLeaveConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', maxWidth: '420px', textAlign: 'center' }}>
            <h5 style={{ marginBottom: '15px' }}>End Call?</h5>
            <p style={{ marginBottom: '20px', color: '#666' }}>You have an active call. Are you sure you want to end it?</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowLeaveConfirm(false)
                  pendingNavigation.current = null
                  window.history.pushState(null, '', window.location.href)
                }}
              >
                Stay in Call
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  setShowLeaveConfirm(false)
                  handleEndCall()
                }}
              >
                End Call
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const VideoCallContent = ({ onEndCall }) => {
  const { useCallCallingState, useParticipants, useMicrophoneState, useCameraState } = useCallStateHooks()
  const callingState = useCallCallingState()
  const participants = useParticipants()
  const micState = useMicrophoneState()
  const cameraState = useCameraState()

  if (callingState !== 'joined') {
    return (
      <div className="content doctor-content" style={{ height: '100vh', padding: 0, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
        <div className="text-center text-white">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Joining call... (State: {callingState})</p>
        </div>
      </div>
    )
  }

  const localParticipant = participants.find((p) => p.isLocalParticipant)
  const remoteParticipants = participants.filter((p) => !p.isLocalParticipant)
  const uniqueRemoteParticipants = Array.from(new Map(remoteParticipants.map((p) => [p.userId, p])).values())

  const getDisplayName = (participant) => {
    return participant?.user?.name || participant?.name || participant?.userId || 'User'
  }

  const toggleMic = async () => {
    if (micState.microphone.enabled) await micState.microphone.disable()
    else await micState.microphone.enable()
  }

  const toggleCamera = async () => {
    if (cameraState.camera.enabled) await cameraState.camera.disable()
    else await cameraState.camera.enable()
  }

  return (
    <div className="content doctor-content" style={{ height: '100vh', padding: 0, margin: 0, overflow: 'hidden', backgroundColor: '#000' }}>
      <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            padding: '15px 20px',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '18px' }}>Video Consultation</div>
          <div style={{ color: '#fff', fontSize: '14px' }}>{localParticipant && uniqueRemoteParticipants.length > 0 ? '2 participants' : '1 participant'}</div>
        </div>

        <div
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'row',
            gap: '10px',
            padding: '10px',
          }}
        >
          <ParticipantTile
            participant={uniqueRemoteParticipants.length > 0 ? uniqueRemoteParticipants[0] : null}
            fallbackText="Waiting for patient to join..."
            title={uniqueRemoteParticipants.length > 0 ? getDisplayName(uniqueRemoteParticipants[0]) : 'Patient'}
            badges={['Patient', 'Receiver']}
          />

          <ParticipantTile
            participant={localParticipant}
            fallbackText="Initializing your video..."
            title="You"
            badges={['Doctor', 'Caller']}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            padding: '20px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div style={{ backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: '50px', padding: '12px 20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
            <button
              onClick={toggleMic}
              style={{ width: '50px', height: '50px', borderRadius: '50%', border: 'none', backgroundColor: micState.microphone.enabled ? '#4CAF50' : '#dc3545', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}
              title={micState.microphone.enabled ? 'Mute Microphone' : 'Unmute Microphone'}
            >
              <i className={`fa-solid ${micState.microphone.enabled ? 'fa-microphone' : 'fa-microphone-slash'}`}></i>
            </button>
            <button
              onClick={onEndCall}
              style={{ width: '60px', height: '60px', borderRadius: '50%', border: 'none', backgroundColor: '#dc3545', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}
              title="End Call"
            >
              <i className="fa-solid fa-phone-slash"></i>
            </button>
            <button
              onClick={toggleCamera}
              style={{ width: '50px', height: '50px', borderRadius: '50%', border: 'none', backgroundColor: cameraState.camera.enabled ? '#4CAF50' : '#dc3545', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}
              title={cameraState.camera.enabled ? 'Disable Camera' : 'Enable Camera'}
            >
              <i className={`fa-solid ${cameraState.camera.enabled ? 'fa-video' : 'fa-video-slash'}`}></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const ParticipantTile = ({ participant, fallbackText, title, badges }) => {
  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        position: 'relative',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        overflow: 'hidden',
        minWidth: 0,
      }}
    >
      <div style={{ position: 'absolute', inset: 0 }}>
        {participant ? (
          <ParticipantView participant={participant} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px', textAlign: 'center', padding: '20px' }}>
            {fallbackText}
          </div>
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 12,
          bottom: 12,
          zIndex: 40,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          maxWidth: '90%',
        }}
      >
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, textShadow: '0 1px 2px rgba(0,0,0,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {badges.map((b) => (
            <span key={b} style={{ backgroundColor: 'rgba(0,0,0,0.65)', color: '#fff', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, border: '1px solid rgba(255,255,255,0.12)' }}>
              {b}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DoctorVideoCallRoom

