import { Link, useLocation } from 'react-router-dom'
import { useFooterOptions } from '../../queries/footerOptionQueries'

const DEFAULT_FOOTER_OPTIONS = {
  address: '3556 Beech Street, USA',
  supportEmail: 'support@mypetplus.com',
  phoneNumber: '+1 315 369 5943',
  socialLinks: [],
}

const socialIconFor = (platform) => {
  const value = String(platform || '').toLowerCase()
  if (value.includes('facebook')) return 'fa-facebook'
  if (value.includes('instagram')) return 'fa-instagram'
  if (value === 'x' || value.includes('twitter')) return 'fa-x-twitter'
  if (value.includes('linkedin')) return 'fa-linkedin'
  if (value.includes('youtube')) return 'fa-youtube'
  if (value.includes('tiktok')) return 'fa-tiktok'
  return 'fa-link'
}

const Footer = () => {
  const location = useLocation()
  const path = location.pathname
  const { data: footerResponse } = useFooterOptions()
  const footerOptions = {
    ...DEFAULT_FOOTER_OPTIONS,
    ...(footerResponse?.data || footerResponse || {}),
  }
  const socialLinks = Array.isArray(footerOptions.socialLinks)
    ? footerOptions.socialLinks.filter((link) => link?.isActive !== false && link?.url)
    : []

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
                        <p><i className="isax isax-location"></i> {footerOptions.address}</p>
                      </div>
                      <div className="footer-address">
                        <p><i className="feather-phone-call"></i> {footerOptions.phoneNumber}</p>
                      </div>
                      <div className="footer-address mb-0">
                        <p><i className="feather-mail"></i> {footerOptions.supportEmail}</p>
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
                    {socialLinks.map((link, index) => (
                      <li key={`${link.platform}-${index}`}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={link.platform}
                        >
                          <i className={`fa-brands ${socialIconFor(link.platform)}`}></i>
                        </a>
                      </li>
                    ))}
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

