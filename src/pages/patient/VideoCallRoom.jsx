import AppointmentVideoCallRoom from '../../components/video/AppointmentVideoCallRoom'

const VideoCallRoom = () => (
  <AppointmentVideoCallRoom
    backPath="/patient-appointments"
    localRole="Pet owner"
    remoteRole="Veterinarian"
    remoteFallback="Waiting for the veterinarian to join…"
  />
)

export default VideoCallRoom
