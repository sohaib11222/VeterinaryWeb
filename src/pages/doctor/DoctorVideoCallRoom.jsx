import AppointmentVideoCallRoom from '../../components/video/AppointmentVideoCallRoom'

const DoctorVideoCallRoom = () => (
  <AppointmentVideoCallRoom
    backPath="/appointments"
    localRole="Veterinarian"
    remoteRole="Pet owner"
    remoteFallback="Waiting for the pet owner to join…"
  />
)

export default DoctorVideoCallRoom
