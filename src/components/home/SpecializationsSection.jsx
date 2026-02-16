import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import AOS from 'aos'
import 'aos/dist/aos.css'

import { useSpecializations } from '../../queries/specializationQueries'
import { bath_tub, big_paw, bottel, injection, pet_doctor, small_paw } from '../../assets/images'

const iconSet = [injection, bottel, bath_tub, pet_doctor]

const defaultItems = [
  { name: 'General Veterinary', icon: injection },
  { name: 'Pet Nutrition', icon: bottel },
  { name: 'Dermatology', icon: bath_tub },
  { name: 'Surgery', icon: pet_doctor },
]

const SpecializationsSection = () => {
  const { data } = useSpecializations()

  useEffect(() => {
    AOS.init({ duration: 1200, once: true })
  }, [])

  const specializationsList = useMemo(() => {
    const raw = data?.data?.data ?? data?.data ?? data
    return Array.isArray(raw) ? raw : []
  }, [data])

  const items = useMemo(() => {
    const list = specializationsList
      .map((spec, idx) => {
        const name = spec?.name || spec?.type || ''
        if (!name) return null
        return {
          key: spec?._id || `${name}-${idx}`,
          name,
          icon: iconSet[idx % iconSet.length],
        }
      })
      .filter(Boolean)

    const finalList = list.length > 0 ? list.slice(0, 4) : defaultItems
    return finalList
  }, [specializationsList])

  return (
    <section className="services-section-fourteen">
      <div className="floating-bg">
        <img src={big_paw} alt="" />
        <img src={small_paw} alt="" />
      </div>
      <div className="container">
        <div className="row">
          <div className="col-lg-12 aos" data-aos="fade-up">
            <div className="section-header-fourteen service-inner-fourteen">
              <div className="service-inner-fourteen">
                <div className="service-inner-fourteen-two">
                  <h3>OUR SPECIALIZATIONS</h3>
                </div>
              </div>
              <h2>Browse Specializations</h2>
              <p>Find the right veterinarian for your pet</p>
            </div>
          </div>
        </div>

        <div className="row row-gap justify-content-center">
          {items.map((item, idx) => (
            <div key={item.key || idx} className="col-lg-3 col-md-4 col-sm-12">
              <div className="our-services-list">
                <div className="service-icon">
                  <img src={item.icon} alt="" />
                </div>
                <h4>{item.name}</h4>
                <p>Explore veterinarians in this specialization.</p>
                <div className="mt-3">
                  <Link to="/search" className="btn btn-sm btn-primary">
                    View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default SpecializationsSection
