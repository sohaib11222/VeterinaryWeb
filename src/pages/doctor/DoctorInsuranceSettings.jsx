import DoctorProfileTabs from '../../components/doctor/DoctorProfileTabs'

const DoctorInsuranceSettings = () => {
  return (
    <div className="content veterinary-dashboard">
      <div className="container-fluid">
        <div className="row">
          <div className="col-lg-3 col-xl-2 theiaStickySidebar">
            {/* Sidebar will be rendered by DashboardLayout */}
          </div>
          <div className="col-lg-12 col-xl-12">
            {/* Veterinary Insurance Header */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="veterinary-dashboard-header">
                  <h2 className="dashboard-title">
                    <i className="fa-solid fa-shield-alt me-3"></i>
                    Insurance
                  </h2>
                  <p className="dashboard-subtitle">Manage the insurance companies you accept for your veterinary practice</p>
                </div>
              </div>
            </div>

            {/* Settings Tabs */}
            <DoctorProfileTabs />

            <div className="dashboard-header border-0 mb-0">
              <h3>Insurance</h3>
              <ul>
                <li>
                  <a href="#" className="btn veterinary-start-btn add-insurance">
                    <i className="fa-solid fa-plus me-2"></i>
                    Add New Insurance
                  </a>
                </li>
              </ul>
            </div>

            <form action="/doctor-insurance-settings">
              <div className="accordions insurance-infos" id="list-accord">
                {/* Insurance Item */}
                <div className="user-accordion-item">
                  <a href="#" className="accordion-wrap" data-bs-toggle="collapse" data-bs-target="#insurance1">Insurance<span>Delete</span></a>
                  <div className="accordion-collapse collapse show" id="insurance1" data-bs-parent="#list-accord">
                    <div className="content-collapse">
                      <div className="add-service-info">
                        <div className="add-info">
                          <div className="row align-items-center">
                            <div className="col-md-12">
                              <div className="form-wrap mb-2">
                                <div className="change-avatar img-upload">
                                  <div className="profile-img">
                                    <i className="fa-solid fa-file-image"></i>
                                  </div>
                                  <div className="upload-img">
                                    <h5>Logo</h5>
                                    <div className="imgs-load d-flex align-items-center">
                                      <div className="change-photo">
                                        Upload New 
                                        <input type="file" className="upload" />
                                      </div>
                                      <a href="#" className="upload-remove">Remove</a>
                                    </div>
                                    <p className="form-text">Your Image should Below 4 MB, Accepted format jpg,png,svg</p>
                                  </div>
                                </div>
                              </div>
                              <div className="form-wrap">
                                <label className="col-form-label">Insurance Name</label>
                                <input type="text" className="form-control" />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-end">
                          <a href="#" className="reset more-item">Reset</a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* /Insurance Item */}

                {/* Insurance Item 2 */}
                <div className="user-accordion-item">
                  <a href="#" className="collapsed accordion-wrap" data-bs-toggle="collapse" data-bs-target="#insurance2">Star Health<span>Delete</span></a>
                  <div className="accordion-collapse collapse" id="insurance2" data-bs-parent="#list-accord">
                    <div className="content-collapse">
                      <div className="add-service-info">
                        <div className="add-info">
                          <div className="row align-items-center">
                            <div className="col-md-12">
                              <div className="form-wrap mb-2">
                                <div className="change-avatar img-upload">
                                  <div className="profile-img">
                                    <i className="fa-solid fa-file-image"></i>
                                  </div>
                                  <div className="upload-img">
                                    <h5>Logo</h5>
                                    <div className="imgs-load d-flex align-items-center">
                                      <div className="change-photo">
                                        Upload New 
                                        <input type="file" className="upload" />
                                      </div>
                                      <a href="#" className="upload-remove">Remove</a>
                                    </div>
                                    <p className="form-text">Your Image should Below 4 MB, Accepted format jpg,png,svg</p>
                                  </div>
                                </div>
                              </div>
                              <div className="form-wrap">
                                <label className="col-form-label">Insurance Name</label>
                                <input type="text" className="form-control" defaultValue="Star health" />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-end">
                          <a href="#" className="reset more-item">Reset</a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* /Insurance Item 2 */}
              </div>
              
              <div className="modal-btn text-end">
                <a href="#" className="btn veterinary-btn-secondary me-2">
                  <i className="fa-solid fa-times me-1"></i>Cancel
                </a>
                <button className="btn veterinary-start-btn prime-btn">
                  <i className="fa-solid fa-save me-1"></i>Save Changes</button>
              </div>
            </form>
            {/* /Insurance Settings */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorInsuranceSettings

