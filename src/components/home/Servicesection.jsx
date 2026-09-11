import React, { useEffect } from "react";
import {
  bath_tub,
  big_paw,
  bottel,
  injection,
  pet_doctor,
  small_paw,
} from "../../assets/images";
import AOS from "aos";
import "aos/dist/aos.css";
import { useLanguage } from "../../contexts/LanguageContext";

const Servicesection = () => {
  const { t } = useLanguage();
  //Aos

  useEffect(() => {
    AOS.init({ duration: 1200, once: true });
  }, []);
  return (
    <>
      {/* services Section */}
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
                    <h3>{t('home.servicesEyebrow')}</h3>
                  </div>
                </div>
                <h2>{t('home.whatWeCanDo')}</h2>
                <p>{t('home.professionalServices')}</p>
              </div>
            </div>
          </div>
          <div className="row row-gap justify-content-center">
            <div className="col-lg-3 col-md-4 col-sm-12">
              <div className="our-services-list">
                <div className="service-icon">
                  <img src={injection} alt="" />
                </div>
                <h4>{t('home.vaccination')}</h4>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed.
                </p>
              </div>
            </div>
            <div className="col-lg-3 col-md-4 col-sm-12">
              <div className="our-services-list">
                <div className="service-icon">
                  <img src={bottel} alt="" />
                </div>
                <h4>{t('home.petMedicine')}</h4>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed.
                </p>
              </div>
            </div>
            <div className="col-lg-3 col-md-4 col-sm-12">
              <div className="our-services-list">
                <div className="service-icon">
                  <img src={bath_tub} alt="" />
                </div>
                <h4>{t('home.petGrooming')}</h4>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed.
                </p>
              </div>
            </div>
            <div className="col-lg-3 col-md-4 col-sm-12">
              <div className="our-services-list">
                <div className="service-icon">
                  <img src={pet_doctor} alt="" />
                </div>
                <h4>{t('home.petCare')}</h4>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* /services Section */}
    </>
  );
};

export default Servicesection;
