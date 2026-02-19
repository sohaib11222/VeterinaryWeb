import { Link, useLocation } from 'react-router-dom'

const Footer = () => {
  const location = useLocation()
  const path = location.pathname

  // Default footer for most pages
  const DefaultFooter = () => (
    <footer className="footer footer-one">
      <div className="footer-top">
        <div className="container">
          <div className="row">
            <div className="col-lg-3 col-md-4">
              <div className="footer-widget footer-about">
                <div className="footer-logo">
                  <Link to="/"><img src="/assets/img/pet-logo.jpg" alt="logo" /></Link>
                </div>
                <div className="footer-about-content">
                  <p>
                    Book veterinary visits, manage pet records, and stay on top of follow-ups — all in
                    one place.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="row">
                <div className="col-lg-3 col-md-4">
                  <div className="footer-widget footer-menu">
                    <h2 className="footer-title">Company</h2>
                    <ul>
                      <li><Link to="/">Home</Link></li>
                      <li><Link to="/search">Specialities</Link></li>
                      <li><Link to="/search">Consult</Link></li>
                    </ul>
                  </div>
                </div>

                <div className="col-lg-3 col-md-4">
                  <div className="footer-widget footer-menu">
                    <h2 className="footer-title">Specialities</h2>
                    <ul>
                      <li><Link to="/search">Neurology</Link></li>
                      <li><Link to="/search">Cardiology</Link></li>
                      <li><Link to="/search">Dentistry</Link></li>
                    </ul>
                  </div>
                </div>

                <div className="col-lg-6 col-md-4">
                  <div className="footer-widget footer-contact">
                    <h2 className="footer-title">Contact Us</h2>
                    <div className="footer-contact-info">
                      <div className="footer-address">
                        <p><i className="isax isax-location"></i> 3556 Beech Street, USA</p>
                      </div>
                      <div className="footer-address">
                        <p><i className="feather-phone-call"></i> +1 315 369 5943</p>
                      </div>
                      <div className="footer-address mb-0">
                        <p><i className="feather-mail"></i> support@mypetplus.com</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-3 col-md-7">
              <div className="footer-widget">
                <h2 className="footer-title">Join Our Newsletter</h2>
                <div className="subscribe-form">
                  <form action="#">
                    <input type="email" className="form-control" placeholder="Enter Email" />
                    <button type="submit" className="btn">Submit</button>
                  </form>
                </div>
                <div className="social-icon">
                  <ul>
                    <li><a href="#"><i className="fa-brands fa-facebook"></i></a></li>
                    <li><a href="#"><i className="fa-brands fa-instagram"></i></a></li>
                    <li><a href="#"><i className="fa-brands fa-x-twitter"></i></a></li>
                    <li><a href="#"><i className="fa-brands fa-linkedin"></i></a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <div className="copyright">
            <div className="row">
              <div className="col-md-6 col-lg-6">
                <div className="copyright-text">
                  <p className="mb-0">Copyright © {new Date().getFullYear()} MyPetPlus. All Rights Reserved</p>
                </div>
              </div>
              <div className="col-md-6 col-lg-6">
                <div className="copyright-menu">
                  <ul className="policy-menu">
                    <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                    <li><Link to="/terms-condition">Terms and Conditions</Link></li>
                    <li><Link to="/login">Login & Register</Link></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )

  // Footer for index-4
  if (path === '/index-4') {
    return <DefaultFooter />
  }

  // Return default footer for all other pages
  return <DefaultFooter />
}

export default Footer

