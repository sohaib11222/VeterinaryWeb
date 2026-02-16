import { useState } from 'react'
import { Link } from 'react-router-dom'

const SocialMedia = () => {
  const [socialLinks, setSocialLinks] = useState([
    { platform: 'Facebook', url: '', selected: true },
    { platform: 'Twitter', url: '', selected: true },
    { platform: 'LinkedIn', url: '', selected: true },
    { platform: 'Instagram', url: '', selected: true },
    { platform: 'YouTube', url: '', selected: false },
    { platform: 'Pinterest', url: '', selected: false }
  ])

  const handlePlatformChange = (index, platform) => {
    const updatedLinks = [...socialLinks]
    updatedLinks[index].platform = platform
    setSocialLinks(updatedLinks)
  }

  const handleUrlChange = (index, url) => {
    const updatedLinks = [...socialLinks]
    updatedLinks[index].url = url
    setSocialLinks(updatedLinks)
  }

  const addNewSocialMedia = () => {
    setSocialLinks([...socialLinks, { platform: 'Facebook', url: '', selected: true }])
  }

  const removeSocialMedia = (index) => {
    const updatedLinks = socialLinks.filter((_, i) => i !== index)
    setSocialLinks(updatedLinks)
  }

  return (
    <div className="content veterinary-dashboard">
      <div className="container-fluid">
        <div className="row">
          <div className="col-lg-3 col-xl-2 theiaStickySidebar">
            {/* Sidebar is handled by DashboardLayout */}
          </div>
          <div className="col-lg-12 col-xl-12">
            {/* Veterinary Social Media Header */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="veterinary-dashboard-header">
                  <h2 className="dashboard-title">
                    <i className="fa-solid fa-share-nodes me-3"></i>
                    Veterinary Social Media
                  </h2>
                  <p className="dashboard-subtitle">Connect with pet owners through social media platforms</p>
                </div>
              </div>
            </div>
            
            <div className="add-btn text-end mb-4">
              <button onClick={addNewSocialMedia} className="btn veterinary-btn-primary prime-btn add-social-media">
                <i className="fa-solid fa-plus me-2"></i>
                Add New Social Media
              </button>
            </div>
            <div className="card veterinary-card">
              <div className="card-body">
                <form className="social-media-form">
                  {socialLinks.map((link, index) => (
                    <div key={index} className="social-media-links d-flex align-items-center mb-3">
                      <div className="input-block input-block-new select-social-link me-3">
                        <select 
                          className="select veterinary-input" 
                          value={link.platform}
                          onChange={(e) => handlePlatformChange(index, e.target.value)}
                        >
                          <option value="Facebook">Facebook</option>
                          <option value="Twitter">Twitter</option>
                          <option value="LinkedIn">LinkedIn</option>
                          <option value="Instagram">Instagram</option>
                          <option value="YouTube">YouTube</option>
                          <option value="Pinterest">Pinterest</option>
                        </select>
                      </div>
                      <div className="input-block input-block-new flex-fill me-3">
                        <input 
                          type="text" 
                          className="form-control veterinary-input" 
                          placeholder={`Add ${link.platform} URL for your veterinary practice`}
                          value={link.url}
                          onChange={(e) => handleUrlChange(index, e.target.value)}
                        />
                      </div>
                      <div className="social-media-icon me-2">
                        {link.platform === 'Facebook' && <i className="fa-brands fa-facebook fa-lg text-primary"></i>}
                        {link.platform === 'Twitter' && <i className="fa-brands fa-twitter fa-lg text-info"></i>}
                        {link.platform === 'LinkedIn' && <i className="fa-brands fa-linkedin fa-lg text-primary"></i>}
                        {link.platform === 'Instagram' && <i className="fa-brands fa-instagram fa-lg text-danger"></i>}
                        {link.platform === 'YouTube' && <i className="fa-brands fa-youtube fa-lg text-danger"></i>}
                        {link.platform === 'Pinterest' && <i className="fa-brands fa-pinterest fa-lg text-danger"></i>}
                      </div>
                      {socialLinks.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeSocialMedia(index)}
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <div className="form-set-button mt-4">
                    <button type="button" className="btn veterinary-btn-secondary me-2">
                      <i className="fa-solid fa-times me-2"></i>
                      Cancel
                    </button>
                    <button type="submit" className="btn veterinary-btn-primary">
                      <i className="fa-solid fa-save me-2"></i>
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
            {/* Social Media Tips */}
            <div className="alert alert-info mt-4 veterinary-alert">
              <div className="d-flex">
                <div className="flex-shrink-0">
                  <i className="fa-solid fa-lightbulb"></i>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="alert-heading">Veterinary Social Media Tips</h6>
                  <p className="mb-2 small">
                    <strong>Best practices for veterinary practices:</strong>
                  </p>
                  <ul className="small mb-0">
                    <li>Share pet care tips and educational content</li>
                    <li>Post before/after treatment success stories (with permission)</li>
                    <li>Feature your clinic team and facilities</li>
                    <li>Engage with pet owners through Q&A sessions</li>
                    <li>Share seasonal pet health reminders</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SocialMedia

