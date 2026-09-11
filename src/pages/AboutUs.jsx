import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Breadcrumb from '../components/common/Breadcrumb'
import { usePublicReviews } from '../queries/reviewQueries'
import { useFooterOptions } from '../queries/footerOptionQueries'
import { getImageUrl } from '../utils/apiConfig'
import { useLanguage } from '../contexts/LanguageContext'

const DEFAULT_CONTACT_OPTIONS = {
  address: '3556 Beech Street, USA',
  phoneNumber: '+1 315 369 5943',
}

const AboutUs = () => {
  const { t } = useLanguage()
  const whyChooseUs = [
    {
      id: 1,
      icon: '/assets/img/icons/choose-01.svg',
      title: t('publicPages.about.preventive'),
      description: t('publicPages.about.intro1')
    },
    {
      id: 2,
      icon: '/assets/img/icons/choose-02.svg',
      title: t('publicPages.about.diagnostics'),
      description: t('publicPages.about.intro2')
    },
    {
      id: 3,
      icon: '/assets/img/icons/choose-03.svg',
      title: t('publicPages.about.compassionate'),
      description: t('publicPages.about.intro1')
    },
    {
      id: 4,
      icon: '/assets/img/icons/choose-04.svg',
      title: t('publicPages.about.scheduling'),
      description: t('publicPages.about.intro2')
    }
  ]

  const faqs = [
    {
      id: 1,
      question: t('publicPages.about.faq1q'),
      answer: t('publicPages.about.faq1a'),
      isOpen: true
    },
    {
      id: 2,
      question: t('publicPages.about.faq2q'),
      answer: t('publicPages.about.faq2a'),
      isOpen: false
    },
    {
      id: 3,
      question: t('publicPages.about.faq3q'),
      answer: t('publicPages.about.faq3a'),
      isOpen: false
    },
    {
      id: 4,
      question: t('publicPages.about.faq4q'),
      answer: t('publicPages.about.faq4a'),
      isOpen: false
    },
    {
      id: 5,
      question: t('publicPages.about.faq5q'),
      answer: t('publicPages.about.faq5a'),
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
  const { data: footerResponse } = useFooterOptions()
  const contactOptions = {
    ...DEFAULT_CONTACT_OPTIONS,
    ...(footerResponse?.data || footerResponse || {}),
  }

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
        const name = petOwner?.name || petOwner?.fullName || t('publicPages.aboutContent.petOwner')
        const subtitle = vet?.name ? t('publicPages.aboutContent.reviewed', { name: vet.name }) : t('publicPages.aboutContent.verifiedReview')
        const avatar = getImageUrl(petOwner?.profileImage) || '/assets/img/patients/patient.jpg'
        const rating = Number(r?.rating || 0)
        const text = String(r?.reviewText || '').trim()
        return {
          key: r?._id || Math.random(),
          name,
          subtitle,
          avatar,
          rating,
          text: text || t('publicPages.aboutContent.greatExperience')
        }
      })
  }, [testimonials, t])

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
      <Breadcrumb title={t('publicPages.about.title')} li1={t('publicPages.about.title')} li2={t('publicPages.about.title')} />

      {/* About Us */}
      <section className="about-section">
        <div className="container">
          <div className="row align-items-start g-4">
            <div className="col-lg-6 col-md-12">
              <div className="section-inner-header about-inner-header">
                <h6>{t('publicPages.about.eyebrow')}</h6>
                <h2>{t('publicPages.about.heading')}</h2>
              </div>
              <div className="about-content">
                <div className="about-content-details">
                  <p>
                    {t('publicPages.about.intro1')}
                  </p>
                  <p>
                    {t('publicPages.about.intro2')}
                  </p>
                </div>
                <div className="about-inline-cards">
                  <div className="about-inline-card">
                    <h5>{t('publicPages.about.preventive')}</h5>
                    <p>{t('publicPages.aboutContent.preventiveDescription')}</p>
                  </div>
                  <div className="about-inline-card">
                    <h5>{t('publicPages.about.diagnostics')}</h5>
                    <p>{t('publicPages.aboutContent.diagnosticsDescription')}</p>
                  </div>
                  <div className="about-inline-card">
                    <h5>{t('publicPages.about.scheduling')}</h5>
                    <p>{t('publicPages.aboutContent.schedulingDescription')}</p>
                  </div>
                </div>
                <div className="about-contact">
                  <div className="about-contact-icon">
                    <span>
                      <img src="/assets/img/icons/phone-icon.svg" alt="phone-image" />
                    </span>
                  </div>
                  <div className="about-contact-text">
                    <p>{t('publicPages.aboutContent.urgentQuestion')}</p>
                    <h4><a href={`tel:${contactOptions.phoneNumber}`}>{contactOptions.phoneNumber}</a></h4>
                    <p className="mb-0"><i className="fa-solid fa-location-dot me-1" aria-hidden="true"></i>{contactOptions.address}</p>
                  </div>
                </div>
                <div className="about-actions">
                  <Link to="/search" className="btn btn-primary me-2">
                    {t('publicPages.aboutContent.findVeterinarian')}
                  </Link>
                  <Link to="/contact-us" className="btn btn-outline-primary">
                    {t('publicPages.aboutContent.contactUs')}
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
                <h2>{t('publicPages.aboutContent.whyChoose')}</h2>
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
                  <h2>{t('publicPages.aboutContent.carePlanTitle')}</h2>
                  <p>{t('publicPages.aboutContent.carePlanBody')}</p>
                  <Link to="/contact-us" className="btn btn-primary">{t('publicPages.aboutContent.contactWithUs')}</Link>
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
                  <h3>{t('publicPages.aboutContent.trusted')}</h3>
                  <p>{t('publicPages.aboutContent.trustedDescription')}</p>
                  <div className="about-stat-row">
                    <div className="about-stat">
                      <h4>24/7</h4>
                      <p>{t('publicPages.aboutContent.supportGuidance')}</p>
                    </div>
                    <div className="about-stat">
                      <h4>{t('publicPages.aboutContent.fast')}</h4>
                      <p>{t('publicPages.aboutContent.onlineBooking')}</p>
                    </div>
                    <div className="about-stat">
                      <h4>{t('publicPages.aboutContent.safe')}</h4>
                      <p>{t('publicPages.aboutContent.petFirst')}</p>
                    </div>
                  </div>
                  <Link to="/search" className="btn btn-primary">
                    {t('publicPages.aboutContent.exploreVeterinarians')}
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
                      <h5>{t('publicPages.aboutContent.gentleHandling')}</h5>
                      <p>{t('publicPages.aboutContent.gentleDescription')}</p>
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
                      <h5>{t('publicPages.aboutContent.clearRecommendations')}</h5>
                      <p>{t('publicPages.aboutContent.clearRecommendationsDescription')}</p>
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
                <h6>{t('publicPages.aboutContent.testimonials')}</h6>
                <h2>{t('publicPages.aboutContent.testimonialsTitle')}</h2>
              </div>

              {reviewsError ? (
                <div className="text-center py-5 text-danger">{t('publicPages.aboutContent.testimonialsLoadFailed')}</div>
              ) : reviewsLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : testimonialCards.length === 0 ? (
                <div className="text-center py-5 text-muted">{t('publicPages.aboutContent.testimonialsEmpty')}</div>
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
                <h6>{t('publicPages.aboutContent.getAnswer')}</h6>
                <h2>{t('publicPages.about.faqTitle')}</h2>
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
                    <p>{t('publicPages.aboutContent.happyPets')}</p>
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
