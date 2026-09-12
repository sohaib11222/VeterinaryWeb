import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'

const EmergencyVeterinarianSection = () => {
  const { t } = useLanguage()
  const [activeSlide, setActiveSlide] = useState(0)

  const slides = [
    {
      id: 'emergency',
      image: '/assets/img/pronto-soccorso-veterinario.jpeg',
      imageAlt: 'Pronto Soccorso Veterinario H24',
      href: '/search',
      eyebrow: t('home.emergencyEyebrow'),
      title: t('home.emergencyTitle'),
      description: t('home.emergencyDescription'),
      cta: t('home.findVeterinarian'),
    },
    {
      id: 'pet-shop',
      image: '/assets/img/left-vet.png',
      imageAlt: t('home.petShopImageAlt'),
      href: '/pharmacy-search',
      eyebrow: t('home.petShopEyebrow'),
      title: t('home.petShopTitle'),
      description: t('home.petShopDescription'),
      cta: t('home.findPetShop'),
      featureImage: '/assets/img/icons-vet.png',
      featureImageAlt: t('home.petShopFeaturesAlt'),
    },
  ]

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setActiveSlide((currentSlide) => (currentSlide + 1) % slides.length)
    }, 7000)

    return () => window.clearInterval(timer)
  }, [slides.length])

  const selectSlide = (index) => setActiveSlide((index + slides.length) % slides.length)
  const slide = slides[activeSlide]

  return <section className="home-emergency-vet home-service-slider" aria-roledescription="carousel" aria-label={t('home.servicesSliderLabel')}>
    <div className="container">
      <article className={`home-service-slider__slide home-service-slider__slide--${slide.id}`} key={slide.id}>
        <div className="home-emergency-vet__grid">
          <div className="home-emergency-vet__media home-service-slider__media">
            <Link to={slide.href} aria-label={slide.cta}>
              <img
                src={slide.image}
                alt={slide.imageAlt}
              />
            </Link>
          </div>

          <div className="home-emergency-vet__content home-service-slider__content">
            <span className="home-emergency-vet__eyebrow">{slide.eyebrow}</span>
            <h2 id="emergency-vet-title">{slide.title}</h2>
            <p>{slide.description}</p>
            <Link to={slide.href} className="btn home-emergency-vet__button">
              {slide.cta}
              <i className="fa-solid fa-arrow-right" aria-hidden="true" />
            </Link>
            {slide.featureImage && (
              <img className="home-service-slider__features" src={slide.featureImage} alt={slide.featureImageAlt} />
            )}
          </div>
        </div>
      </article>

      <div className="home-service-slider__navigation" aria-label={t('home.servicesSliderNavigation')}>
        <button type="button" className="home-service-slider__arrow" onClick={() => selectSlide(activeSlide - 1)} aria-label={t('home.previousSlide')}>
          <i className="fa-solid fa-arrow-left" aria-hidden="true" />
        </button>
        <div className="home-service-slider__pagination">
          {slides.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={index === activeSlide ? 'is-active' : ''}
              onClick={() => selectSlide(index)}
              aria-label={t('home.goToSlide', { number: index + 1 })}
              aria-current={index === activeSlide ? 'true' : undefined}
            />
          ))}
        </div>
        <button type="button" className="home-service-slider__arrow" onClick={() => selectSlide(activeSlide + 1)} aria-label={t('home.nextSlide')}>
          <i className="fa-solid fa-arrow-right" aria-hidden="true" />
        </button>
      </div>
    </div>
  </section>
}

export default EmergencyVeterinarianSection
