import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

// Import images
import {
  dot_1,
  dot_2,
  home_12_banner_1,
  home_12_banner_2,
  home_12_banner_bg,
  home_12_banner_bg2,
  ring_1,
  ring_2
} from '../assets/images'

// Import components - matching home7 structure
import Header from '../components/common/Header'
import SpecializationsSection from '../components/home/SpecializationsSection'
import Ourdoctors from '../components/home/Ourdoctors'
import Feedback from '../components/home/Feedback'
import Blogsection from '../components/home/Blogsection'
import Chooseus from '../components/home/Chooseus'
import Footer from '../components/common/Footer'
import ProgressCircle from '../components/home/ProgressCircle'

const Index = () => {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(null)

  const handleDateChange = (date) => {
    setSelectedDate(date)
  }

  const handleSearchSubmit = (e) => {
    e?.preventDefault?.()
    navigate('/search')
  }

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

  return (
    <>
      <Header />
      <div className="main-wrapper home-twelve">
      {/* Home Banner */}
      {/* Home Banner */}
      <section className="banner-section-fourteen banner-section-twelve">
        <div className="banner-section-twelve-bg">
          <img src={home_12_banner_bg} alt="" />
          <img src={home_12_banner_bg2} alt="" />
        </div>
        <div className="container">
          <div className="row">
            <div className="col-lg-6">
              <div
                className="banner-img banner-img-twelve aos"
                data-aos="fade-up"
              >
                <img src={home_12_banner_1} className="img-fluid" alt="" />
                <img src={home_12_banner_2} className="img-fluid" alt="" />
                <div className="banner-banner-img-twelve-bg">
                  <img src={dot_1} alt="" />
                  <img src={dot_2} alt="" />
                  <img src={ring_1} alt="" />
                  <img src={ring_2} alt="" />
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div
                className="banner-content banner-content-fourteen aos"
                data-aos="fade-up"
              >
                <h1>
                  We take care <span>of Your Pets</span>
                </h1>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit,</p>
                <div className="banner-btns-fourteen ">
                  <Link to="/consultation" className="btn btn-primary me-2">
                    Start a Consult
                  </Link>
                  <Link to="/booking" className="btn btn-primary ">
                    Schedule a Call
                  </Link>
                </div>
              </div>
              <div className="search-box-fourteen aos" data-aos="fade-up">
                <form
                  onSubmit={handleSearchSubmit}
                  className="form-block d-flex"
                >
                  <div className="search-input">
                    <div className="form-group">
                      <label>Date</label>
                      <DatePicker
                        className="form-control datetimepicker"
                        selected={selectedDate}
                        onChange={handleDateChange}
                        placeholderText="Thu, Mar 24, 2022"
                      />
                    </div>
                  </div>
                  <div className="search-input">
                    <div className="form-group mb-0">
                      <label className="location-icon">Location</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="San Diego Branch"
                      />
                    </div>
                  </div>
                  <div className="search-btn">
                    <button className="btn btn-primary" type="submit">
                      Book Now
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* /Home Banner */}
      {/* /Home Banner */}
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
      <Blogsection />
      <Chooseus />
      <Footer />
      <ProgressCircle />
      </div>
    </>
  )
}

export default Index
