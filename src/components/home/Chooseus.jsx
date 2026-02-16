import React, { useEffect } from "react";
import { home_12_why_us } from "../../assets/images";
import AOS from "aos";
import "aos/dist/aos.css";

const Chooseus = () => {
  //Aos

  useEffect(() => {
    AOS.init({ duration: 1200, once: true });
  }, []);
  return (
    <>
      {/* Choose us */}
      <section className="choose-us-fourteen">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="section-header-fourteen text-center">
                <div className="service-inner-fourteen justify-content-center">
                  <div className="service-inner-fourteen-two">
                    <h3>Why Us</h3>
                  </div>
                </div>
                <h2>Why Choose Us</h2>
                <p>Trusted veterinary care for your pets — online and in-clinic.</p>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-6">
              <div className="choose-us-right-main">
                <img src={home_12_why_us} alt="image" className="img-fluid" />
              </div>
            </div>
            <div className="col-lg-6 col-md-12 col-sm-12 col-xs-12">
              <div className="why-us-content">
                <div
                  className="us-faq aos"
                  data-aos="fade-up"
                  data-aos-delay={200}
                >
                  <div className="accordion" id="accordionExample">
                    <div className="accordion-item">
                      <h2 className="accordion-header" id="headingOne">
                        <button
                          className="accordion-button"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#collapseOne"
                          aria-expanded="true"
                          aria-controls="collapseOne"
                        >
                          Do you offer online consultations?
                        </button>
                      </h2>
                      <div
                        id="collapseOne"
                        className="accordion-collapse collapse shade show"
                        aria-labelledby="headingOne"
                        data-bs-parent="#accordionExample"
                      >
                        <div className="accordion-body">
                          <h6>
                            Yes. You can book an online consultation with a veterinarian for common concerns, follow-ups, and guidance. If your pet needs hands-on care, we’ll recommend an in-clinic visit.
                          </h6>
                        </div>
                      </div>
                    </div>
                    <div className="accordion-item">
                      <h2 className="accordion-header" id="headingTwo">
                        <button
                          className="accordion-button collapsed"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#collapseTwo"
                          aria-expanded="false"
                          aria-controls="collapseTwo"
                        >
                          How do I book an appointment?
                        </button>
                      </h2>
                      <div
                        id="collapseTwo"
                        className="accordion-collapse collapse shade"
                        aria-labelledby="headingTwo"
                        data-bs-parent="#accordionExample"
                      >
                        <div className="accordion-body">
                          <h6>
                            Go to Search, pick a veterinarian, view their profile, and choose a time that works for you. You can book directly from the profile page in just a few steps.
                          </h6>
                        </div>
                      </div>
                    </div>
                    <div className="accordion-item">
                      <h2 className="accordion-header" id="headingThree">
                        <button
                          className="accordion-button collapsed"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#collapseThree"
                          aria-expanded="false"
                          aria-controls="collapseThree"
                        >
                          Are your veterinarians verified?
                        </button>
                      </h2>
                      <div
                        id="collapseThree"
                        className="accordion-collapse collapse shade"
                        aria-labelledby="headingThree"
                        data-bs-parent="#accordionExample"
                      >
                        <div className="accordion-body">
                          <h6>
                            Yes. Veterinarians complete a verification process before they can accept appointments. You can also view ratings and reviews on each doctor’s profile.
                          </h6>
                        </div>
                      </div>
                    </div>
                    <div className="accordion-item">
                      <h2 className="accordion-header" id="headingFour">
                        <button
                          className="accordion-button collapsed"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#collapseFour"
                          aria-expanded="false"
                          aria-controls="collapseFour"
                        >
                          What pets do you support?
                        </button>
                      </h2>
                      <div
                        id="collapseFour"
                        className="accordion-collapse collapse shade"
                        aria-labelledby="headingFour"
                        data-bs-parent="#accordionExample"
                      >
                        <div className="accordion-body">
                          <h6>
                            We support common companion animals (dogs, cats, rabbits, and more). Availability may vary by veterinarian specialty and your location.
                          </h6>
                        </div>
                      </div>
                    </div>
                    <div className="accordion-item">
                      <h2 className="accordion-header" id="headingFive">
                        <button
                          className="accordion-button collapsed"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#collapseFive"
                          aria-expanded="false"
                          aria-controls="collapseFive"
                        >
                          What if my pet has an emergency?
                        </button>
                      </h2>
                      <div
                        id="collapseFive"
                        className="accordion-collapse collapse shade"
                        aria-labelledby="headingFive"
                        data-bs-parent="#accordionExample"
                      >
                        <div className="accordion-body">
                          <h6>
                            For urgent or life-threatening issues, please contact your nearest emergency veterinary clinic immediately. For non-emergency concerns, you can book the earliest available online or in-clinic appointment.
                          </h6>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* /Choose us */}
    </>
  );
};

export default Chooseus;
