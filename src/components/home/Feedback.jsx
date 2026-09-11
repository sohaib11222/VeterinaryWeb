import React, { useEffect, useMemo } from "react";
import Owlcarousel from "react-owl-carousel";
import {
  home_12_testimonial,
  two_paw,
} from "../../assets/images";
import { usePublicReviews } from "../../queries/reviewQueries";
import { getImageUrl } from "../../utils/apiConfig";
import { useLanguage } from "../../contexts/LanguageContext";
import AOS from "aos";
import "aos/dist/aos.css";

const Feedback = () => {
  const { t } = useLanguage();
  //Aos

  useEffect(() => {
    AOS.init({ duration: 1200, once: true });
  }, []);
  const options = {
    loop: true,
    margin: 24,
    dots: false,
    nav: true,
    smartSpeed: 2000,
    navText: [
      '<i class="fa-solid fa-caret-left "></i>',
      '<i class="fa-solid fa-caret-right"></i>',
    ],
    responsive: {
      0: {
        items: 1,
      },
      500: {
        items: 1,
      },
      768: {
        items: 1,
      },
      1000: {
        items: 1,
      },
      1300: {
        items: 1,
      },
    },
  };

  const { data: reviewsRes, isLoading, error } = usePublicReviews({ page: 1, limit: 10 });

  const reviews = useMemo(() => {
    const payload = reviewsRes?.data ?? reviewsRes;
    // API can return wrapped payload: { success, message, data: { reviews } }
    return payload?.reviews || payload?.data?.reviews || payload?.data?.data?.reviews || [];
  }, [reviewsRes]);

  const testimonialCards = useMemo(() => {
    return reviews
      .filter((r) => r && (r.reviewText || r.rating))
      .slice(0, 10)
      .map((r) => {
        const petOwner = r?.petOwnerId;
        const vet = r?.veterinarianId;
        const name = petOwner?.name || petOwner?.fullName || "Pet Owner";
        const location = vet?.name ? `${t('home.verifiedReview')}: ${vet.name}` : t('home.verifiedReview');
        const avatar = getImageUrl(petOwner?.profileImage) || "/assets/img/patients/patient.jpg";
        const rating = Number(r?.rating || 0);
        const text = String(r?.reviewText || "").trim();
        return {
          key: r?._id || Math.random(),
          name,
          location,
          avatar,
          rating,
          text: text || t('home.greatExperience'),
        };
      });
  }, [reviews, t]);

  const renderStars = (rating) => {
    const r = Math.max(0, Math.min(5, Number(rating) || 0));
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i key={i} className={`fas fa-star ${i <= r ? "filled" : ""}`} />
      );
    }
    return stars;
  };

  const carouselOptions = useMemo(() => {
    const canLoop = testimonialCards.length > 1;
    return {
      ...options,
      loop: canLoop,
      nav: testimonialCards.length > 1,
    };
  }, [testimonialCards.length]);
  
  return (
    <>
      {/* Feedback */}
      <section className="clients-section-fourteen">
        <div className="floating-bg">
          <img src={two_paw} alt="" />
        </div>
        <div className="container">
          <div className="row">
            <div className="col-lg-5">
              <div className="client-inner-main">
                <img
                  src={home_12_testimonial}
                  alt="image"
                  className="img-fluid"
                />
              </div>
            </div>
            <div className="col-lg-7 col-md-12">
              <div className="section-header-fourteen service-inner-fourteen">
                <div className="service-inner-fourteen">
                  <div className="service-inner-fourteen-two">
                    <h3>{t('home.reviewsEyebrow')}</h3>
                  </div>
                </div>
                <h2>{t('home.testimonials')}</h2>
                <p>{t('home.reviewDescription')}</p>
              </div>
              <Owlcarousel
                key={`testimonials-${testimonialCards.length}`}
                className="feedback-slider-fourteen owl-theme aos"
                data-aos="fade-up"
                {...carouselOptions}
              >
                {error ? (
                  <div className="card feedback-card">
                    <div className="card-body feedback-card-body text-center py-5 text-danger">
                      {t('home.failedReviews')}
                    </div>
                  </div>
                ) : isLoading ? (
                  <div className="card feedback-card">
                    <div className="card-body feedback-card-body text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">{t('common.loading')}</span>
                      </div>
                    </div>
                  </div>
                ) : testimonialCards.length === 0 ? (
                  <div className="card feedback-card">
                    <div className="card-body feedback-card-body text-center py-5 text-muted">
                      {t('home.noReviews')}
                    </div>
                  </div>
                ) : (
                  testimonialCards.map((t) => (
                    <div key={t.key} className="card feedback-card">
                      <div className="card-body feedback-card-body">
                        <div className="feedback-inner-main">
                          <div className="feedback-inner-img">
                            <img
                              src={t.avatar}
                              alt="image"
                              className="img-fluid"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = "/assets/img/patients/patient.jpg";
                              }}
                            />
                            <div className="feedback-user-details">
                              <h4>{t.name}</h4>
                              <h6>{t.location}</h6>
                              <div className="rating rating-fourteen">
                                {renderStars(t.rating)}
                              </div>
                            </div>
                          </div>
                          <p>"{t.text}"</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </Owlcarousel>
            </div>
          </div>
        </div>
      </section>
      {/* /Feedback */}
    </>
  );
};

export default Feedback;
