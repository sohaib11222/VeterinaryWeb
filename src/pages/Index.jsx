import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Import components - matching home7 structure
import Header from '../components/common/Header'
import SpecializationsSection from '../components/home/SpecializationsSection'
import Ourdoctors from '../components/home/Ourdoctors'
import Feedback from '../components/home/Feedback'
import Blogsection from '../components/home/Blogsection'
import Chooseus from '../components/home/Chooseus'
import InsuranceCompaniesSection from '../components/home/InsuranceCompaniesSection'
import Footer from '../components/common/Footer'
import ProgressCircle from '../components/home/ProgressCircle'

const Index = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [animal, setAnimal] = useState('')
  const [location, setLocation] = useState('')

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
    if (searchTerm.trim()) params.set('search', searchTerm.trim())
    if (animal) params.set('animal', animal)
    if (location.trim()) params.set('city', location.trim())

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
                  <h1 className="home-hero-v2__title">Everything your pet needs, <span>close to you</span></h1>
                  <p className="home-hero-v2__subtitle">Find the best professionals and services for your pet’s well-being.</p>
                  <form className="home-hero-search" onSubmit={handleHeroSearch}>
                    <div className="home-hero-search__field home-hero-search__field--service">
                      <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                      <label htmlFor="hero-service-search">
                        <span>What are you looking for?</span>
                        <input
                          id="hero-service-search"
                          type="search"
                          value={searchTerm}
                          onChange={(event) => setSearchTerm(event.target.value)}
                          placeholder="Veterinarian, grooming, dog sitter..."
                        />
                      </label>
                    </div>
                    <div className="home-hero-search__field">
                      <i className="fa-solid fa-paw" aria-hidden="true"></i>
                      <label htmlFor="hero-animal-search">
                        <span>For which animal?</span>
                        <select
                          id="hero-animal-search"
                          value={animal}
                          onChange={(event) => setAnimal(event.target.value)}
                        >
                          <option value="">Dog, cat, rabbit...</option>
                          <option value="Dog">Dog</option>
                          <option value="Cat">Cat</option>
                          <option value="Rabbit">Rabbit</option>
                          <option value="Bird">Bird</option>
                          <option value="Other">Other pet</option>
                        </select>
                      </label>
                    </div>
                    <div className="home-hero-search__field">
                      <i className="fa-solid fa-location-dot" aria-hidden="true"></i>
                      <label htmlFor="hero-location-search">
                        <span>Where?</span>
                        <input
                          id="hero-location-search"
                          type="text"
                          value={location}
                          onChange={(event) => setLocation(event.target.value)}
                          placeholder="City or ZIP code"
                        />
                      </label>
                    </div>
                    <button type="submit" className="home-hero-search__button">Search</button>
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
