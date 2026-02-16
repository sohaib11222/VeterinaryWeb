import React, { useEffect, useMemo } from "react";
import Owlcarousel from "react-owl-carousel";
import {
  home_12_testimonial,
  two_paw,
} from "../../assets/images";
import { usePublicReviews } from "../../queries/reviewQueries";
import { getImageUrl } from "../../utils/apiConfig";
import AOS from "aos";
import "aos/dist/aos.css";

const Feedback = () => {
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
    return payload?.reviews || [];
  }, [reviewsRes]);

  const testimonialCards = useMemo(() => {
    return reviews
      .filter((r) => r && (r.reviewText || r.rating))
      .slice(0, 10)
      .map((r) => {
        const petOwner = r?.petOwnerId;
        const vet = r?.veterinarianId;
        const name = petOwner?.name || petOwner?.fullName || "Pet Owner";
        const location = vet?.name ? `Reviewed ${vet.name}` : "Verified review";
        const avatar = getImageUrl(petOwner?.profileImage) || "/assets/img/patients/patient.jpg";
        const rating = Number(r?.rating || 0);
        const text = String(r?.reviewText || "").trim();
        return {
          key: r?._id || Math.random(),
          name,
          location,
          avatar,
          rating,
          text: text || "Great experience.",
        };
      });
  }, [reviews]);

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
                    <h3>CLIENT REVIEWS</h3>
                  </div>
                </div>
                <h2>Testimonials</h2>
                <p>What our customers says about us</p>
              </div>
              <Owlcarousel
                className="feedback-slider-fourteen owl-theme aos"
                data-aos="fade-up"
                {...carouselOptions}
              >
                {error ? (
                  <div className="card feedback-card">
                    <div className="card-body feedback-card-body text-center py-5 text-danger">
                      Failed to load reviews
                    </div>
                  </div>
                ) : isLoading ? (
                  <div className="card feedback-card">
                    <div className="card-body feedback-card-body text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  </div>
                ) : testimonialCards.length === 0 ? (
                  <div className="card feedback-card">
                    <div className="card-body feedback-card-body text-center py-5 text-muted">
                      No reviews yet.
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
