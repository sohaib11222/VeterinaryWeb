import { Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'

const EmergencyVeterinarianSection = () => {
  const { t } = useLanguage()
  return <section className="home-emergency-vet" aria-labelledby="emergency-vet-title">
    <div className="container">
      <div className="home-emergency-vet__grid">
        <div className="home-emergency-vet__media aos" data-aos="fade-right">
          <Link to="/search" aria-label={t('home.findVeterinarian')}>
            <img
              src="/assets/img/pronto-soccorso-veterinario.jpeg"
              alt="Pronto Soccorso Veterinario H24"
            />
          </Link>
        </div>

        <div className="home-emergency-vet__content aos" data-aos="fade-left">
          <span className="home-emergency-vet__eyebrow">{t('home.emergencyEyebrow')}</span>
          <h2 id="emergency-vet-title">{t('home.emergencyTitle')}</h2>
          <p>{t('home.emergencyDescription')}</p>
          <Link to="/search" className="btn home-emergency-vet__button">
            {t('home.findVeterinarian')}
            <i className="fa-solid fa-arrow-right" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  </section>
}

export default EmergencyVeterinarianSection
