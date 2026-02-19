import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Breadcrumb from '../components/common/Breadcrumb'
import { usePublicReviews } from '../queries/reviewQueries'
import { getImageUrl } from '../utils/apiConfig'

const AboutUs = () => {
  const whyChooseUs = [
    {
      id: 1,
      icon: '/assets/img/icons/choose-01.svg',
      title: 'Experienced Veterinary Team',
      description: 'From routine wellness checks to complex cases, our licensed veterinarians and technicians treat every pet with patience and expertise.'
    },
    {
      id: 2,
      icon: '/assets/img/icons/choose-02.svg',
      title: 'Modern Diagnostics & Care',
      description: 'We use advanced diagnostics and evidence-based treatment plans to provide clear answers and effective care.'
    },
    {
      id: 3,
      icon: '/assets/img/icons/choose-03.svg',
      title: 'Compassionate, Pet-First Approach',
      description: 'Your pet’s comfort matters. We explain options, respect your budget, and focus on long-term health.'
    },
    {
      id: 4,
      icon: '/assets/img/icons/choose-04.svg',
      title: 'Easy Scheduling & Follow-ups',
      description: 'Book appointments in minutes, keep records organized, and stay informed with reminders and updates.'
    }
  ]

  const faqs = [
    {
      id: 1,
      question: 'Can I book an appointment online?',
      answer: 'Yes. Use the search and booking flow to select a veterinarian, choose a date, and confirm your visit in a few steps.',
      isOpen: true
    },
    {
      id: 2,
      question: 'Do you offer preventive care and vaccinations?',
      answer: 'We provide wellness exams, vaccination schedules, parasite prevention, nutrition guidance, and senior pet care tailored to your pet’s needs.',
      isOpen: false
    },
    {
      id: 3,
      question: 'What should I bring to my first visit?',
      answer: 'Bring any previous medical records, vaccination history, current medications, and notes about symptoms or behavior changes.',
      isOpen: false
    },
    {
      id: 4,
      question: 'Do you treat both cats and dogs?',
      answer: 'Yes. Our veterinarians provide care for cats and dogs, and we can recommend partners for specialized or exotic pet care when needed.',
      isOpen: false
    },
    {
      id: 5,
      question: 'How do follow-ups and prescriptions work?',
      answer: 'After your visit, you can review care notes, prescriptions, and invoices in your dashboard. Refills and follow-ups are handled by your veterinarian.',
      isOpen: false
    }
  ]

  const [openFaq, setOpenFaq] = useState(1)

  const toggleFaq = (id) => {
    setOpenFaq(openFaq === id ? null : id)
  }

  const aboutImages = useMemo(
    () => ({
      hero:
        'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1400&q=80',
      clinic:
        'https://images.unsplash.com/photo-1581881067989-7e3eaf45f4f6?auto=format&fit=crop&w=1400&q=80',
      care:
        'https://images.unsplash.com/photo-1601758123927-196d60f38f3f?auto=format&fit=crop&w=1400&q=80',
      faq:
        'https://images.unsplash.com/photo-1558944351-dae1be0d0c2f?auto=format&fit=crop&w=1400&q=80'
    }),
    []
  )

  const { data: reviewsRes, isLoading: reviewsLoading, error: reviewsError } = usePublicReviews({
    page: 1,
    limit: 9
  })

  const testimonials = useMemo(() => {
    const payload = reviewsRes?.data ?? reviewsRes
    return payload?.reviews || []
  }, [reviewsRes])

  const testimonialCards = useMemo(() => {
    return testimonials
      .filter((r) => r && (r.reviewText || r.rating))
      .slice(0, 6)
      .map((r) => {
        const petOwner = r?.petOwnerId
        const vet = r?.veterinarianId
        const name = petOwner?.name || petOwner?.fullName || 'Pet Owner'
        const subtitle = vet?.name ? `Reviewed ${vet.name}` : 'Verified review'
        const avatar = getImageUrl(petOwner?.profileImage) || '/assets/img/patients/patient.jpg'
        const rating = Number(r?.rating || 0)
        const text = String(r?.reviewText || '').trim()
        return {
          key: r?._id || Math.random(),
          name,
          subtitle,
          avatar,
          rating,
          text: text || 'Great experience.'
        }
      })
  }, [testimonials])

  const renderStars = (rating) => {
    const r = Math.max(0, Math.min(5, Number(rating) || 0))
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i
          key={i}
          className={`fas fa-star ${i <= r ? 'filled' : ''}`}
          aria-hidden="true"
        />
      )
    }
    return stars
  }

  return (
    <div className="content">
      <Breadcrumb title="About Us" li1="About Us" li2="About Us" />

      {/* About Us */}
      <section className="about-section">
        <div className="container">
          <div className="row align-items-start g-4">
            <div className="col-lg-6 col-md-12">
              <div className="section-inner-header about-inner-header">
                <h6>About Veterinary Care</h6>
                <h2>A modern veterinary experience built around your pet</h2>
              </div>
              <div className="about-content">
                <div className="about-content-details">
                  <p>
                    Our mission is simple: deliver dependable, compassionate veterinary care while making
                    it easier for pet parents to book appointments, manage records, and stay on top of
                    follow-ups.
                  </p>
                  <p>
                    Whether you’re coming in for a routine wellness check or something urgent, we combine
                    experienced clinicians with practical technology so you always know what’s happening
                    and what to do next.
                  </p>
                </div>
                <div className="about-inline-cards">
                  <div className="about-inline-card">
                    <h5>Preventive Care</h5>
                    <p>Wellness exams, vaccines, parasite prevention, nutrition.</p>
                  </div>
                  <div className="about-inline-card">
                    <h5>Diagnostics</h5>
                    <p>Clear answers with modern tools and transparent guidance.</p>
                  </div>
                  <div className="about-inline-card">
                    <h5>Follow-ups</h5>
                    <p>Prescriptions, invoices, and records organized in one place.</p>
                  </div>
                </div>
                <div className="about-contact">
                  <div className="about-contact-icon">
                    <span>
                      <img src="/assets/img/icons/phone-icon.svg" alt="phone-image" />
                    </span>
                  </div>
                  <div className="about-contact-text">
                    <p>Questions or urgent care?</p>
                    <h4>+1 315 369 5943</h4>
                  </div>
                </div>
                <div className="about-actions">
                  <Link to="/search" className="btn btn-primary me-2">
                    Find a Veterinarian
                  </Link>
                  <Link to="/contact-us" className="btn btn-outline-primary">
                    Contact Us
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-lg-6 col-md-12">
              <div className="about-media-grid">
                <div className="about-media-main">
                  <img
                    src={aboutImages.hero}
                    className="img-fluid"
                    alt="Veterinarian caring for a pet"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* /About Us */}

      {/* Why Choose Us */}
      <section className="why-choose-section">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="section-inner-header text-center">
                <h2>Why Choose Us</h2>
              </div>
            </div>
          </div>
          <div className="row">
            {whyChooseUs.map((item) => (
              <div key={item.id} className="col-lg-3 col-md-6 d-flex">
                <div className="card why-choose-card w-100">
                  <div className="card-body">
                    <div className="why-choose-icon">
                      <span><img src={item.icon} alt="choose-image" /></span>
                    </div>
                    <div className="why-choose-content">
                      <h4>{item.title}</h4>
                      <p>{item.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* /Why Choose Us */}

      {/* Way Section */}
      <section className="way-section">
        <div className="container">
          <div className="way-bg">
            <div className="way-shapes-img">
              <div className="way-shapes-left">
                <img src="/assets/img/shape-06.png" alt="shape-image" />
              </div>
              <div className="way-shapes-right">
                <img src="/assets/img/shape-07.png" alt="shape-image" />
              </div>
            </div>
            <div className="row align-items-end">
              <div className="col-lg-7 col-md-12">
                <div className="section-inner-header way-inner-header mb-0">
                  <h2>Care plans that fit your pet’s life</h2>
                  <p>
                    From puppies and kittens to senior pets, we’ll help you build a plan for wellness,
                    prevention, and long-term comfort.
                  </p>
                  <Link to="/contact-us" className="btn btn-primary">Contact With Us</Link>
                </div>
              </div>
              <div className="col-lg-5 col-md-12">
                <div className="way-img">
                  <img src="/assets/img/about-us.png" className="img-fluid" alt="doctor-way-image" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* /Way Choose Us */}

      {/* Doctors Section */}
      <section className="about-highlight-section">
        <div className="container">
          <div className="row g-4 align-items-stretch">
            <div className="col-lg-4 col-md-12 d-flex">
              <div className="card about-highlight-card w-100">
                <div className="card-body">
                  <h3>Trusted by pet parents</h3>
                  <p>
                    We focus on clear communication and practical treatment plans so you can make
                    confident decisions for your pet.
                  </p>
                  <div className="about-stat-row">
                    <div className="about-stat">
                      <h4>24/7</h4>
                      <p>Support guidance</p>
                    </div>
                    <div className="about-stat">
                      <h4>Fast</h4>
                      <p>Online booking</p>
                    </div>
                    <div className="about-stat">
                      <h4>Safe</h4>
                      <p>Pet-first care</p>
                    </div>
                  </div>
                  <Link to="/search" className="btn btn-primary">
                    Explore Veterinarians
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-lg-8 col-md-12">
              <div className="row g-4">
                <div className="col-md-6 d-flex">
                  <div className="card about-image-card w-100">
                    <img
                      src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1400&q=80"
                      className="img-fluid"
                      alt="Dog at the vet"
                      loading="lazy"
                    />
                    <div className="card-body">
                      <h5>Gentle handling</h5>
                      <p>Low-stress visits designed to keep pets calm and comfortable.</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 d-flex">
                  <div className="card about-image-card w-100">
                    <img
                      src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1400&q=80"
                      className="img-fluid"
                      alt="Veterinarian examining a cat"
                      loading="lazy"
                    />
                    <div className="card-body">
                      <h5>Clear recommendations</h5>
                      <p>We explain what we see, what it means, and what your options are.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* /Doctors Section */}

      {/* Testimonial Section */}
      <section className="testimonial-section">
        <div className="testimonial-shape-img">
          <div className="testimonial-shape-left">
            <img src="/assets/img/shape-04.png" alt="shape-image" />
          </div>
          <div className="testimonial-shape-right">
            <img src="/assets/img/shape-05.png" alt="shape-image" />
          </div>
        </div>
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="section-inner-header testimonial-header text-center">
                <h6>Testimonials</h6>
                <h2>What Pet Parents Say</h2>
              </div>

              {reviewsError ? (
                <div className="text-center py-5 text-danger">Failed to load testimonials</div>
              ) : reviewsLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : testimonialCards.length === 0 ? (
                <div className="text-center py-5 text-muted">No testimonials yet.</div>
              ) : (
                <div className="row g-4">
                  {testimonialCards.map((t) => (
                    <div key={t.key} className="col-lg-4 col-md-6 d-flex">
                      <div className="card about-testimonial-card w-100">
                        <div className="card-body">
                          <div className="about-testimonial-top">
                            <img
                              src={t.avatar}
                              className="about-testimonial-avatar"
                              alt="client-image"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.onerror = null
                                e.currentTarget.src = '/assets/img/patients/patient.jpg'
                              }}
                            />
                            <div>
                              <h6 className="mb-1">{t.name}</h6>
                              <p className="mb-0 text-muted">{t.subtitle}</p>
                              <div className="rating">{renderStars(t.rating)}</div>
                            </div>
                          </div>
                          <p className="about-testimonial-text">“{t.text}”</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      {/* /Testimonial Section */}

      {/* FAQ Section */}
      <section className="faq-section faq-section-inner">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="section-inner-header text-center">
                <h6>Get Your Answer</h6>
                <h2>Frequently Asked Questions</h2>
              </div>
            </div>
          </div>
          <div className="row align-items-center">
            <div className="col-lg-6 col-md-12">
              <div className="faq-img">
                <img src="/assets/img/about-faq.png" className="img-fluid" alt="img" />
                <div className="faq-patients-count">
                  <div className="faq-smile-img">
                    <img src="/assets/img/icons/smiling-icon.svg" alt="icon" />
                  </div>
                  <div className="faq-patients-content">
                    <h4><span className="count-digit">5</span>k+</h4>
                    <p>Happy Pets</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6 col-md-12">
              <div className="faq-info">
                <div className="accordion" id="accordionExample">
                  {faqs.map((faq) => (
                    <div key={faq.id} className="accordion-item">
                      <h2 className="accordion-header" id={`heading${faq.id}`}>
                        <button
                          className={`accordion-button ${openFaq === faq.id ? '' : 'collapsed'}`}
                          type="button"
                          onClick={() => toggleFaq(faq.id)}
                          aria-expanded={openFaq === faq.id}
                          aria-controls={`collapse${faq.id}`}
                        >
                          {faq.question}
                        </button>
                      </h2>
                      <div
                        id={`collapse${faq.id}`}
                        className={`accordion-collapse collapse ${openFaq === faq.id ? 'show' : ''}`}
                        aria-labelledby={`heading${faq.id}`}
                        data-bs-parent="#accordionExample"
                      >
                        <div className="accordion-body">
                          <div className="accordion-content">
                            <p>{faq.answer}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* /FAQ Section */}
    </div>
  )
}

export default AboutUs
