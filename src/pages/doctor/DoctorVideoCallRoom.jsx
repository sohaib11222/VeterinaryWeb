import AppointmentVideoCallRoom from '../../components/video/AppointmentVideoCallRoom'
import { useLanguage } from '../../contexts/LanguageContext'

const DoctorVideoCallRoom = () => {
  const { t } = useLanguage()
  return (
    <AppointmentVideoCallRoom
      backPath="/appointments"
      localRole={t('videoCall.veterinarian')}
      remoteRole={t('videoCall.petOwner')}
      remoteFallback={t('videoCall.waiting', { role: t('videoCall.petOwner').toLowerCase() })}
    />
  )
}

export default DoctorVideoCallRoom
