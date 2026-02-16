import React, { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Owlcarousel from "react-owl-carousel";
import {
  big_paw,
  small_paw,
} from "../../assets/images";
import { useVeterinarians } from "../../queries/veterinarianQueries";
import { getImageUrl } from "../../utils/apiConfig";
import AOS from "aos";
import "aos/dist/aos.css";

const Ourdoctors = () => {
  //Aos

  useEffect(() => {
    AOS.init({
      duration: 1200,
      once: true,
    });
  }, []);
  const options = {
    loop: true,
    margin: 24,
    dots: false,
    nav: true,
    smartSpeed: 2000,
    navContainer: ".slide-nav-16",
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
      575: {
        items: 2,
      },
      768: {
        items: 2,
      },
      1000: {
        items: 4,
      },
      1300: {
        items: 4,
      },
    },
  };

  const { data: vetsRes, isLoading, error } = useVeterinarians(
    { page: 1, limit: 8 },
    { refetchOnWindowFocus: false, refetchOnReconnect: false, staleTime: 30_000 }
  );

  const veterinarians = useMemo(() => {
    const raw = vetsRes?.data;
    return raw?.veterinarians || [];
  }, [vetsRes]);

  const renderStars = (rating) => {
    const r = Number(rating) || 0;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i key={i} className={`fa-solid fa-star ${i <= r ? "rated" : ""}`} />
      );
    }
    return stars;
  };

  const doctorCards = useMemo(() => {
    return veterinarians.map((vet) => {
      const vetUserId = vet?.userId?._id;
      const profileLink = vetUserId ? `/doctor-profile/${vetUserId}` : "/doctor-profile";
      const bookingLink = vetUserId ? `/booking?vet=${vetUserId}` : "/booking";

      const clinics = vet?.clinics;
      const c0 = Array.isArray(clinics) ? clinics[0] : null;
      const locationText = [c0?.city, c0?.state, c0?.country].filter(Boolean).join(", ") || "—";

      const specs = vet?.specializations;
      const firstSpec = Array.isArray(specs) ? specs[0] : null;
      const specializationLabel =
        (firstSpec && typeof firstSpec === "object" ? firstSpec.name || firstSpec.type : firstSpec) ||
        "Veterinary";

      const onlineFee = vet?.consultationFees?.online;
      const clinicFee = vet?.consultationFees?.clinic;
      const fee = onlineFee ?? clinicFee ?? null;
      const coverImg = getImageUrl(vet?.userId?.profileImage) || "/assets/img/doctors/doctor-01.jpg";

      return {
        key: vetUserId || vet?._id || Math.random(),
        profileLink,
        bookingLink,
        name: vet?.userId?.fullName || vet?.userId?.name || "Veterinarian",
        role: specializationLabel,
        image: coverImg,
        location: locationText,
        fee,
        feeLabel: onlineFee != null ? "Online" : clinicFee != null ? "Clinic" : "Consultation",
        rating: vet?.ratingAvg ?? 0,
        ratingCount: vet?.ratingCount ?? 0,
      };
    });
  }, [veterinarians]);

  const carouselOptions = useMemo(() => {
    const canLoop = doctorCards.length > 4;
    return {
      ...options,
      loop: canLoop,
      nav: doctorCards.length > 1,
    };
  }, [doctorCards.length]);

  return (
    <>
      {/* Our Doctors */}
      <div className="blog-section-fourteen our-doctor-twelve">
        <div className="floating-bg">
          <img src={small_paw} alt="" />
          <img src={big_paw} alt="" />
        </div>
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="section-header-fourteen service-inner-fourteen">
                <div className="service-inner-fourteen">
                  <div className="service-inner-fourteen-two">
                    <h3>OUR TEAM</h3>
                  </div>
                </div>
                <h2>Meet Our Doctors</h2>
                <p>Our Qualified Professionals</p>
              </div>
            </div>
          </div>
          {error ? (
            <div className="text-center py-5 text-danger">Failed to load doctors</div>
          ) : isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : doctorCards.length === 0 ? (
            <div className="text-center py-5 text-muted">No doctors available.</div>
          ) : (
            <Owlcarousel
              className="blog-slider-twelve owl-theme aos"
              data-aos="fade-up"
              {...carouselOptions}
            >
              {doctorCards.map((d) => (
                <div key={d.key} className="card blog-inner-fourt-all">
                  <div className="card-body blog-inner-fourt-main">
                    <div className="blog-inner-right-fourt">
                      <Link to={d.profileLink}>
                        <div className="blog-inner-right-img">
                          <img
                            src={d.image}
                            alt="image"
                            className="img-fluid "
                            style={{ width: 323, height: 215, objectFit: "cover" }}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "/assets/img/doctors/doctor-01.jpg";
                            }}
                          />
                          <div className="blog-inner-top-content content-pricing">
                            <span>
                              {d.fee != null ? `€ ${d.fee}` : "€ —"}
                            </span>
                          </div>
                          <div className="blog-inner-top-content">
                            <span>{d.role}</span>
                          </div>
                        </div>
                      </Link>
                      <h4 className="blog-inner-right-fourt-care">
                        <Link to={d.profileLink}>{d.name}</Link>
                      </h4>
                      <ul className="articles-list nav blog-articles-list">
                        <li>
                          <i className="fa fa-location-dot" /> {d.location}
                        </li>
                      </ul>
                      <div className="blog-list-ratings">
                        {renderStars(d.rating)}
                        <span>({d.ratingCount || 0})</span>
                      </div>
                      <Link to={d.bookingLink} className="btn btn-primary">
                        Consult
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </Owlcarousel>
          )}
          <div className="owl-nav slide-nav-16 text-end nav-control" />
          <div
            className="blog-btn-sec text-center aos aos-init aos-animate"
            data-aos="fade-up"
          >
            <Link
              to="/search"
              className="btn btn-primary btn-view"
            >
              See All Doctors
            </Link>
          </div>
        </div>
      </div>
      {/* /Our Doctors */}
    </>
  );
};

export default Ourdoctors;
