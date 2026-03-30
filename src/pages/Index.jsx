import { useEffect } from 'react'
import { Link } from 'react-router-dom'

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
              <div className="col-lg-7">
                <div className="home-hero-v2__content aos" data-aos="fade-up">
                  <h1 className="home-hero-v2__title">MyDoctorPet Veterinarians</h1>
                  <p className="home-hero-v2__subtitle">The professional version.</p>
                  <div className="home-hero-v2__actions">
                    <Link to="/search" className="btn btn-primary me-2">
                      Schedule Appointment
                    </Link>
                    <Link to="/about-us" className="btn btn-outline-light">
                      Learn More
                    </Link>
                  </div>
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
