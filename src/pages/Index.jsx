import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'

// Import components - matching home7 structure
import Header from '../components/common/Header'
import SpecializationsSection from '../components/home/SpecializationsSection'
import Ourdoctors from '../components/home/Ourdoctors'
import Feedback from '../components/home/Feedback'
import Blogsection from '../components/home/Blogsection'
import Chooseus from '../components/home/Chooseus'
import InsuranceCompaniesSection from '../components/home/InsuranceCompaniesSection'
import EmergencyVeterinarianSection from '../components/home/EmergencyVeterinarianSection'
import Footer from '../components/common/Footer'
import ProgressCircle from '../components/home/ProgressCircle'

const Index = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [animal, setAnimal] = useState('')
  const [location, setLocation] = useState('')
  const { t } = useLanguage()

  useEffect(() => {
    // Initialize AOS animations
    if (typeof window !== 'undefined') {
      import('aos').then((AOS) => {
        AOS.init({
          duration: 1200,
          once: true,
        })
      })
    }
  }, [])

  const handleHeroSearch = (event) => {
    event.preventDefault()

    const params = new URLSearchParams()
    const normalizedSearch = searchTerm.trim().toLowerCase().replace(/[._-]+/g, ' ')
    const searchingPetSitters = /\bpet\s*sitters?\b/.test(normalizedSearch) || normalizedSearch === 'petsitter' || normalizedSearch === 'petsitters'
    params.set('type', searchingPetSitters ? 'petSitters' : 'veterinarians')
    if (searchTerm.trim() && !searchingPetSitters) params.set('search', searchTerm.trim())
    if (animal) params.set('animal', animal)
    if (location.trim()) {
      params.set('location', location.trim())
      // Keep the broad location search for cities/regions, but also send an
      // explicit postal-code filter when the home input contains a ZIP/CAP.
      if (/^\d[\d\s-]{2,9}$/.test(location.trim())) params.set('postalCode', location.trim())
    }

    const queryString = params.toString()
    navigate(queryString ? `/search?${queryString}` : '/search')
  }

  useEffect(() => {
    document.body.classList.add('home-hero-header-transparent')
    return () => {
      document.body.classList.remove('home-hero-header-transparent')
    }
  }, [])

  return (
    <>
      <Header />
      <div className="main-wrapper home-twelve">
        <section className="home-hero-v2">
          <div className="home-hero-v2__overlay" />
          <div className="container">
            <div className="row">
              <div className="col-12">
                <div className="home-hero-v2__content aos" data-aos="fade-up">
                  <h1 className="home-hero-v2__title">{t('home.heroTitle1')}<br /><span>{t('home.heroTitle2')}</span></h1>
                  <form className="home-hero-search" onSubmit={handleHeroSearch}>
                    <div className="home-hero-search__field home-hero-search__field--service">
                      <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                      <label htmlFor="hero-service-search">
                        <span>{t('home.lookingFor')}</span>
                        <input
                          id="hero-service-search"
                          type="search"
                          value={searchTerm}
                          onChange={(event) => setSearchTerm(event.target.value)}
                          placeholder={t('home.lookingPlaceholder')}
                        />
                      </label>
                    </div>
                    <div className="home-hero-search__field">
                      <i className="fa-solid fa-paw" aria-hidden="true"></i>
                      <label htmlFor="hero-animal-search">
                        <span>{t('home.forAnimal')}</span>
                        <select
                          id="hero-animal-search"
                          value={animal}
                          onChange={(event) => setAnimal(event.target.value)}
                        >
                          <option value="">{t('home.animalPlaceholder')}</option>
                          <option value="Dog">{t('home.dog')}</option>
                          <option value="Cat">{t('home.cat')}</option>
                          <option value="Rabbit">{t('home.rabbit')}</option>
                          <option value="Bird">{t('home.bird')}</option>
                          <option value="Other">{t('home.otherPet')}</option>
                        </select>
                      </label>
                    </div>
                    <div className="home-hero-search__field">
                      <i className="fa-solid fa-location-dot" aria-hidden="true"></i>
                      <label htmlFor="hero-location-search">
                        <span>{t('home.where')}</span>
                        <input
                          id="hero-location-search"
                          type="text"
                          value={location}
                          onChange={(event) => setLocation(event.target.value)}
                          placeholder={t('home.locationPlaceholder')}
                        />
                      </label>
                    </div>
                    <button type="submit" className="home-hero-search__button">{t('home.search')}</button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      {/* Clinic and Specialities */}
      {/* <HomeClinic /> */}
      {/* Clinic and Specialities */}
      {/* Category Section */}
      {/* <BrowsebySpecialities/> */}
      {/* Category Section */}
      {/* Popular Section */}
      {/* <BookourBestDoctor/> */}
      {/* /Popular Section */}
      {/* <HomeFeatures /> */}
      {/* <HomeBlog/> */}
      <EmergencyVeterinarianSection />
      <SpecializationsSection />
      <Ourdoctors />
      <Feedback />
      <InsuranceCompaniesSection />
      <Blogsection />
      <Chooseus />
      <Footer />
      <ProgressCircle />
      </div>
    </>
  )
}

export default Index
