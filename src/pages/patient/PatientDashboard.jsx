import { useEffect } from 'react'
import { Link } from 'react-router-dom'

const PatientDashboard = () => {
  useEffect(() => {
    // Initialize carousels if needed
    if (typeof window !== 'undefined' && window.$) {
      // Initialize appointment calendar slider
      if ($('.appointment-calender-slider').length) {
        $('.appointment-calender-slider').owlCarousel({
          loop: false,
          margin: 10,
          nav: true,
          dots: false,
          navContainer: '.slide-nav',
          responsive: {
            0: { items: 3 },
            600: { items: 5 },
            1000: { items: 7 }
          }
        })
      }

      // Initialize past appointments slider
      if ($('.past-appointments-slider').length) {
        $('.past-appointments-slider').owlCarousel({
          loop: false,
          margin: 20,
          nav: true,
          dots: false,
          navContainer: '.slide-nav2',
          responsive: {
            0: { items: 1 },
            600: { items: 2 },
            1000: { items: 2 }
          }
        })
      }
    }
  }, [])

  return (
    <div className="content veterinary-dashboard">
      <div className="container-fluid">
        <div className="row">
          <div className="col-lg-3 col-xl-2 theiaStickySidebar">
            {/* Sidebar is handled by DashboardLayout */}
          </div>
          <div className="col-lg-12 col-xl-12">
            {/* Veterinary Dashboard Header */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="veterinary-dashboard-header">
                  <h2 className="dashboard-title">
                    <i className="fa-solid fa-paw me-3"></i>
                    Pet Dashboard
                  </h2>
                  <p className="dashboard-subtitle">Manage your pets' health and veterinary appointments</p>
                </div>
              </div>
            </div>
            
            <div className="dashboard-header">
              <ul className="header-list-btns">
                <li>
                  <div className="dropdown header-dropdown">
                    <a className="dropdown-toggle" data-bs-toggle="dropdown" href="javascript:void(0);">
                      <img src="/assets/img/doctors-dashboard/profile-06.jpg" className="avatar dropdown-avatar" alt="Img" />
                      Hendrita
                    </a>
                    <div className="dropdown-menu dropdown-menu-end">
                      <a href="javascript:void(0);" className="dropdown-item">
                        <img src="/assets/img/doctors-dashboard/profile-06.jpg" className="avatar dropdown-avatar" alt="Img" />
                        Hendrita
                      </a>
                      <a href="javascript:void(0);" className="dropdown-item">
                        <img src="/assets/img/doctors-dashboard/profile-08.jpg" className="avatar dropdown-avatar" alt="Img" />
                        Laura
                      </a>
                      <a href="javascript:void(0);" className="dropdown-item">
                        <img src="/assets/img/doctors-dashboard/profile-07.jpg" className="avatar dropdown-avatar" alt="Img" />
                        Mathew
                      </a>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
            {/* Main Content Row - Favorite Veterinarians and Appointments */}
            <div className="row">
              <div className="col-xl-6 d-flex">
                <div className="favourites-dashboard w-100">
                  <div className="book-appointment-head veterinary-appointment-head">
                    <h3><span><i className="fa-solid fa-calendar-plus me-2"></i>Book a new</span>Pet Appointment</h3>
                    <span className="add-icon"><Link to="/search"><i className="fa-solid fa-circle-plus"></i></Link></span>
                  </div>
                  <div className="dashboard-card w-100 veterinary-card">
                    <div className="dashboard-card-head">
                      <div className="header-title">
                        <h5>
                          <i className="fa-solid fa-star me-2"></i>
                          Favorite Veterinarians
                        </h5>
                      </div>
                      <div className="card-view-link">
                        <Link to="/favourites">View All</Link>
                      </div>
                    </div>
                    <div className="dashboard-card-body">
                      <div className="doctor-fav-list">
                        <div className="doctor-info-profile">
                          <a href="#" className="table-avatar">
                            <img src="/assets/img/doctors-dashboard/doctor-profile-img.jpg" alt="Img" />
                          </a>
                          <div className="doctor-name-info">
                            <h5><a href="#">Dr. Sarah Mitchell</a></h5>
                            <span>Veterinarian</span>
                          </div>
                        </div>
                        <a href="#" className="cal-plus-icon"><i className="fa-solid fa-calendar-plus"></i></a>
                      </div>
                      <div className="doctor-fav-list">
                        <div className="doctor-info-profile">
                          <a href="#" className="table-avatar">
                            <img src="/assets/img/doctors/doctor-thumb-11.jpg" alt="Img" />
                          </a>
                          <div className="doctor-name-info">
                            <h5><a href="#">Dr. James Wilson</a></h5>
                            <span>Veterinary Surgeon</span>
                          </div>
                        </div>
                        <a href="#" className="cal-plus-icon"><i className="fa-solid fa-calendar-plus"></i></a>
                      </div>
                      <div className="doctor-fav-list">
                        <div className="doctor-info-profile">
                          <a href="#" className="table-avatar">
                            <img src="/assets/img/doctors/doctor-14.jpg" alt="Img" />
                          </a>
                          <div className="doctor-name-info">
                            <h5><a href="#">Dr. Emily Chen</a></h5>
                            <span>Pet Dentist</span>
                          </div>
                        </div>
                        <a href="#" className="cal-plus-icon"><i className="fa-solid fa-calendar-plus"></i></a>
                      </div>
                      <div className="doctor-fav-list">
                        <div className="doctor-info-profile">
                          <a href="#" className="table-avatar">
                            <img src="/assets/img/doctors/doctor-15.jpg" alt="Img" />
                          </a>
                          <div className="doctor-name-info">
                            <h5><a href="#">Dr. Michael Brown</a></h5>
                            <span>Veterinary Specialist</span>
                          </div>
                        </div>
                        <a href="#" className="cal-plus-icon"><i className="fa-solid fa-calendar-plus"></i></a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-xl-6 d-flex">
                <div className="dashboard-card w-100 veterinary-card">
                  <div className="dashboard-card-head">
                    <div className="header-title">
                      <h5>
                        <i className="fa-solid fa-calendar-days me-2"></i>
                        Upcoming Pet Appointments
                      </h5>
                    </div>
                    <div className="card-view-link">
                      <div className="owl-nav slide-nav text-end nav-control"></div>
                    </div>
                  </div>
                  <div className="dashboard-card-body">
                    <div className="apponiment-dates">
                      <ul className="appointment-calender-slider owl-carousel">
                        <li>
                          <a href="#">
                            <h5>19 <span>Mon</span></h5>
                          </a>
                        </li>
                        <li>
                          <a href="#">
                            <h5>20 <span>Tue</span></h5>
                          </a>
                        </li>
                        <li>
                          <a href="#" className="available-date">
                            <h5>21 <span>Wed</span></h5>
                          </a>
                        </li>
                        <li>
                          <a href="#" className="available-date">
                            <h5>22 <span>Thu</span></h5>
                          </a>
                        </li>
                        <li>
                          <a href="#">
                            <h5>23 <span>Fri</span></h5>
                          </a>
                        </li>
                        <li>
                          <a href="#">
                            <h5>24 <span>Sat</span></h5>
                          </a>
                        </li>
                        <li>
                          <a href="#">
                            <h5>25 <span>Sun</span></h5>
                          </a>
                        </li>
                      </ul>
                      <div className="appointment-dash-card">
                        <div className="doctor-fav-list">
                          <div className="doctor-info-profile">
                            <a href="#" className="table-avatar">
                              <img src="/assets/img/doctors-dashboard/doctor-profile-img.jpg" alt="Img" />
                            </a>
                            <div className="doctor-name-info">
                              <h5><a href="#">Dr. Sarah Mitchell</a></h5>
                              <span className="fs-12 fw-medium">Veterinarian</span>
                            </div>
                          </div>
                          <a href="#" className="cal-plus-icon"><i className="fa-solid fa-hospital"></i></a>
                        </div>
                        <div className="date-time">
                          <p><i className="fa-solid fa-clock"></i>21 Mar 2024 - 10:30 AM </p>
                        </div>
                        <div className="card-btns gap-3">
                          <Link to="/chat" className="btn veterinary-btn-secondary btn-md rounded-pill"><i className="fa-solid fa-comments me-2"></i>Chat Now</Link>
                          <Link to="/patient-appointments" className="btn veterinary-btn-primary btn-md rounded-pill"><i className="fa-solid fa-calendar-check me-2"></i>Attend</Link>
                        </div>
                      </div>
                      <div className="appointment-dash-card">
                        <div className="doctor-fav-list">
                          <div className="doctor-info-profile">
                            <a href="#" className="table-avatar">
                              <img src="/assets/img/doctors/doctor-17.jpg" alt="Img" />
                            </a>
                            <div className="doctor-name-info">
                              <h5><a href="#">Dr. James Wilson</a></h5>
                              <span className="fs-12 fw-medium">Veterinary Surgeon</span>
                            </div>
                          </div>
                          <a href="#" className="cal-plus-icon"><i className="fa-solid fa-video"></i></a>
                        </div>
                        <div className="date-time">
                          <p><i className="fa-solid fa-clock"></i>22 Mar 2024 - 2:30 PM </p>
                        </div>
                        <div className="card-btns gap-3">
                          <Link to="/chat" className="btn veterinary-btn-secondary btn-md rounded-pill"><i className="fa-solid fa-comments me-2"></i>Chat Now</Link>
                          <Link to="/patient-appointments" className="btn veterinary-btn-primary btn-md rounded-pill"><i className="fa-solid fa-calendar-check me-2"></i>Attend</Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Second Row - Notifications and Past Appointments */}
            <div className="row">
              <div className="col-xl-6 d-flex">
                <div className="dashboard-card w-100 veterinary-card">
                  <div className="dashboard-card-head">
                    <div className="header-title">
                      <h5>
                        <i className="fa-solid fa-bell me-2"></i>
                        Pet Notifications
                      </h5>
                    </div>
                    <div className="card-view-link">
                      <a href="#">View All</a>
                    </div>
                  </div>
                  <div className="dashboard-card-body">
                    <div className="table-responsive">
                      <table className="table dashboard-table veterinary-table">
                        <tbody>
                          <tr>
                            <td>
                              <div className="table-noti-info">
                                <div className="table-noti-icon color-violet">
                                  <i className="fa-solid fa-bell"></i>
                                </div>
                                <div className="table-noti-message">
                                  <h6><a href="#">Pet Appointment Confirmed on <span> 21 Mar 2024 </span> 10:30 AM</a></h6>
                                  <span className="message-time">Just Now</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <div className="table-noti-info">
                                <div className="table-noti-icon color-blue">
                                  <i className="fa-solid fa-star"></i>
                                </div>
                                <div className="table-noti-message">
                                  <h6><a href="#">You have a  <span> New </span> Review for your Pet Appointment </a></h6>
                                  <span className="message-time">5 Days ago</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <div className="table-noti-info">
                                <div className="table-noti-icon color-green">
                                  <i className="fa-solid fa-calendar-check"></i>
                                </div>
                                <div className="table-noti-message">
                                  <h6><a href="#">Pet Vaccination Reminder <span> Max </span> by 01:20 PM </a></h6>
                                  <span className="message-time">12:55 PM</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <div className="table-noti-info">
                                <div className="table-noti-icon color-yellow">
                                  <i className="fa-solid fa-money-bill-1-wave"></i>
                                </div>
                                <div className="table-noti-message">
                                  <h6><a href="#">Payment of <span> $200 </span> for Pet Treatment  by 01:20 PM </a></h6>
                                  <span className="message-time">2 Days ago</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-xl-6 d-flex">
                <div className="dashboard-card w-100 veterinary-card">
                  <div className="dashboard-card-head">
                    <div className="header-title">
                      <h5>
                        <i className="fa-solid fa-history me-2"></i>
                        Past Pet Appointments
                      </h5>
                    </div>
                    <div className="card-view-link">
                      <div className="owl-nav slide-nav2 text-end nav-control"></div>
                    </div>
                  </div>
                  <div className="dashboard-card-body">
                    <div className="past-appointments-slider owl-carousel">
                      <div className="appointment-dash-card past-appointment mt-0">
                        <div className="doctor-fav-list">
                          <div className="doctor-info-profile">
                            <a href="#" className="table-avatar">
                              <img src="/assets/img/doctors-dashboard/doctor-profile-img.jpg" alt="Img" />
                            </a>
                            <div className="doctor-name-info">
                              <h5><a href="#">Dr. Sarah Mitchell</a></h5>
                              <span>Veterinarian</span>
                            </div>
                          </div>
                          <span className="bg-orange badge"><i className="fa-solid fa-video me-1"></i>30 Min</span>
                        </div>
                        <div className="appointment-date-info">
                          <h6>Thursday, Mar 2024</h6>
                          <ul>
                            <li>
                              <span><i className="fa-solid fa-clock"></i></span>Time : 04:00 PM - 04:30 PM (30 Min)
                            </li>
                            <li>
                              <span><i className="fa-solid fa-location-dot"></i></span>New York, United States
                            </li>
                          </ul>
                        </div>
                        <div className="card-btns">
                          <Link to="/patient-appointments" className="btn veterinary-btn-outline btn-md rounded-pill">Reschedule</Link>
                          <Link to="/medical-details" className="btn veterinary-btn-primary btn-md rounded-pill">View Details</Link>
                        </div>
                      </div>
                      <div className="appointment-dash-card past-appointment mt-0">
                        <div className="doctor-fav-list">
                          <div className="doctor-info-profile">
                            <a href="#" className="table-avatar">
                              <img src="/assets/img/doctors/doctor-17.jpg" alt="Img" />
                            </a>
                            <div className="doctor-name-info">
                              <h5><a href="#">Dr. James Wilson</a></h5>
                              <span>Veterinary Surgeon</span>
                            </div>
                          </div>
                          <span className="bg-orange badge"><i className="fa-solid fa-video me-1"></i>30 Min</span>
                        </div>
                        <div className="appointment-date-info">
                          <h6>Friday, Mar 2024</h6>
                          <ul>
                            <li>
                              <span><i className="fa-solid fa-clock"></i></span>Time : 03:00 PM - 03:30 PM (30 Min)
                            </li>
                            <li>
                              <span><i className="fa-solid fa-location-dot"></i></span>New York, United States
                            </li>
                          </ul>
                        </div>
                        <div className="card-btns">
                          <Link to="/patient-appointments" className="btn veterinary-btn-outline btn-md rounded-pill">Reschedule</Link>
                          <Link to="/medical-details" className="btn veterinary-btn-primary btn-md rounded-pill">View Details</Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-xl-12 d-flex">
                <div className="dashboard-card w-100">
                  <div className="dashboard-card-head">
                    <div className="header-title">
                      <h5>Reports</h5>
                    </div>
                  </div>
                  <div className="dashboard-card-body">
                    <div className="account-detail-table">
                      <nav className="patient-dash-tab border-0 pb-0">
                        <ul className="nav nav-tabs-bottom">
                          <li className="nav-item">
                            <a className="nav-link active" href="#appoint-tab" data-bs-toggle="tab">Appointments</a>
                          </li>
                          <li className="nav-item">
                            <a className="nav-link" href="#medical-tab" data-bs-toggle="tab">Medical Records</a>
                          </li>
                          <li className="nav-item">
                            <a className="nav-link" href="#prsc-tab" data-bs-toggle="tab">Prescriptions</a>
                          </li>
                          <li className="nav-item">
                            <a className="nav-link" href="#invoice-tab" data-bs-toggle="tab">Invoices</a>
                          </li>
                        </ul>
                      </nav>
                      <div className="tab-content pt-0">
                        <div id="appoint-tab" className="tab-pane fade show active">
                          <div className="custom-new-table">
                            <div className="table-responsive">
                              <table className="table table-hover table-center mb-0">
                                <thead>
                                  <tr>
                                    <th>ID</th>
                                    <th>Doctor</th>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td>
                                      <a href="javascript:void(0);"><span className="link-primary">#AP1236</span></a>
                                    </td>
                                    <td>
                                      <h2 className="table-avatar">
                                        <Link to="/doctor-profile" className="avatar avatar-sm me-2">
                                          <img className="avatar-img rounded-3" src="/assets/img/doctors/doctor-thumb-24.jpg" alt="User Image" />
                                        </Link>
                                        <Link to="/doctor-profile">Dr. Robert Womack</Link>
                                      </h2>
                                    </td>
                                    <td>21 Mar 2024, 10:30 AM</td>
                                    <td>Video call</td>
                                    <td>
                                      <span className="badge badge-xs p-2 badge-soft-purple inline-flex align-items-center"><i className="fa-solid fa-circle me-1 fs-5"></i>Upcoming</span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>
                                      <a href="javascript:void(0);"><span className="link-primary">#AP3656</span></a>
                                    </td>
                                    <td>
                                      <h2 className="table-avatar">
                                        <Link to="/doctor-profile" className="avatar avatar-sm me-2">
                                          <img className="avatar-img rounded-3" src="/assets/img/doctors/doctor-thumb-23.jpg" alt="User Image" />
                                        </Link>
                                        <Link to="/doctor-profile">Dr. Patricia Cassidy</Link>
                                      </h2>
                                    </td>
                                    <td>28 Mar 2024, 11:40 AM</td>
                                    <td>Clinic Visit</td>
                                    <td>
                                      <span className="badge badge-xs p-2 badge-soft-purple inline-flex align-items-center"><i className="fa-solid fa-circle me-1 fs-5"></i>Completed</span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>
                                      <a href="javascript:void(0);"><span className="link-primary">#AP1246</span></a>
                                    </td>
                                    <td>
                                      <h2 className="table-avatar">
                                        <Link to="/doctor-profile" className="avatar avatar-sm me-2">
                                          <img className="avatar-img rounded-3" src="/assets/img/doctors/doctor-thumb-22.jpg" alt="User Image" />
                                        </Link>
                                        <Link to="/doctor-profile">Dr. Kevin Evans</Link>
                                      </h2>
                                    </td>
                                    <td>02 Apr 2024, 09:20 AM</td>
                                    <td>Audio Call</td>
                                    <td>
                                      <span className="badge badge-xs p-2 badge-soft-success inline-flex align-items-center"><i className="fa-solid fa-circle me-1 fs-5"></i>Completed</span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>
                                      <a href="javascript:void(0);"><span className="link-primary">#AP6985</span></a>
                                    </td>
                                    <td>
                                      <h2 className="table-avatar">
                                        <Link to="/doctor-profile" className="avatar avatar-sm me-2">
                                          <img className="avatar-img rounded-3" src="/assets/img/doctors/doctor-thumb-25.jpg" alt="User Image" />
                                        </Link>
                                        <Link to="/doctor-profile">Dr. Lisa Keating</Link>
                                      </h2>
                                    </td>
                                    <td>15 Apr 2024, 04:10 PM</td>
                                    <td>Clinic Visit</td>
                                    <td>
                                      <span className="badge badge-xs p-2 badge-soft-danger inline-flex align-items-center"><i className="fa-solid fa-circle me-1 fs-5"></i>Cancelled</span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>
                                      <a href="javascript:void(0);"><span className="link-primary">#AP3659</span></a>
                                    </td>
                                    <td>
                                      <h2 className="table-avatar">
                                        <Link to="/doctor-profile" className="avatar avatar-sm me-2">
                                          <img className="avatar-img rounded-3" src="/assets/img/doctors/doctor-thumb-26.jpg" alt="User Image" />
                                        </Link>
                                        <Link to="/doctor-profile">Dr. John Hammer</Link>
                                      </h2>
                                    </td>
                                    <td>10 May 2024, 06:00 PM</td>
                                    <td>Video Call</td>
                                    <td>
                                      <span className="badge badge-xs p-2 badge-soft-purple inline-flex align-items-center"><i className="fa-solid fa-circle me-1 fs-5"></i>Upcoming</span>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                        <div className="tab-pane fade" id="medical-tab">
                          <div className="custom-table">
                            <div className="table-responsive">
                              <table className="table table-center mb-0">
                                <thead>
                                  <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Date</th>
                                    <th>Record For</th>
                                    <th>Comments</th>
                                    <th>Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td><a href="javascript:void(0);" className="link-primary">#MR1236</a></td>
                                    <td>
                                      <a href="javascript:void(0);" className="lab-icon">Electro cardiography</a>
                                    </td>
                                    <td>24 Mar 2024</td>
                                    <td>
                                      <h2 className="table-avatar">
                                        <Link to="/paitent-details" className="avatar avatar-sm me-2">
                                          <img className="avatar-img rounded-3" src="/assets/img/doctors-dashboard/profile-06.jpg" alt="User Image" />
                                        </Link>
                                        <Link to="/paitent-details">Hendrita Clark</Link>
                                      </h2>
                                    </td>
                                    <td>Take Good Rest</td>
                                    <td>
                                      <div className="action-item">
                                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#view_report">
                                          <i className="isax isax-link-2"></i>
                                        </a>
                                        <a href="javascript:void(0);">
                                          <i className="isax isax-import"></i>
                                        </a>
                                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#delete_modal">
                                          <i className="isax isax-trash"></i>
                                        </a>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td><a href="javascript:void(0);" className="link-primary">#MR3656</a></td>
                                    <td>
                                      <a href="javascript:void(0);" className="lab-icon">Complete Blood Count</a>
                                    </td>
                                    <td>10 Apr 2024</td>
                                    <td>
                                      <h2 className="table-avatar">
                                        <Link to="/paitent-details" className="avatar avatar-sm me-2">
                                          <img className="avatar-img rounded-3" src="/assets/img/dependent/dependent-01.jpg" alt="User Image" />
                                        </Link>
                                        <Link to="/paitent-details">Laura Stewart</Link>
                                      </h2>
                                    </td>
                                    <td>Stable, no change</td>
                                    <td>
                                      <div className="action-item">
                                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#view_report">
                                          <i className="isax isax-link-2"></i>
                                        </a>
                                        <a href="javascript:void(0);">
                                          <i className="isax isax-import"></i>
                                        </a>
                                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#delete_modal">
                                          <i className="isax isax-trash"></i>
                                        </a>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td><a href="javascript:void(0);" className="link-primary">#MR1246</a></td>
                                    <td>
                                      <a href="javascript:void(0);" className="lab-icon">Blood Glucose Test</a>
                                    </td>
                                    <td>19 Apr 2024</td>
                                    <td>
                                      <h2 className="table-avatar">
                                        <Link to="/paitent-details" className="avatar avatar-sm me-2">
                                          <img className="avatar-img rounded-3" src="/assets/img/dependent/dependent-02.jpg" alt="User Image" />
                                        </Link>
                                        <Link to="/paitent-details">Mathew Charles </Link>
                                      </h2>
                                    </td>
                                    <td>All Clear</td>
                                    <td>
                                      <div className="action-item">
                                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#view_report">
                                          <i className="isax isax-link-2"></i>
                                        </a>
                                        <a href="javascript:void(0);">
                                          <i className="isax isax-import"></i>
                                        </a>
                                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#delete_modal">
                                          <i className="isax isax-trash"></i>
                                        </a>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td><a href="javascript:void(0);" className="link-primary">#MR6985</a></td>
                                    <td>
                                      <a href="javascript:void(0);" className="lab-icon">Liver Function Tests</a>
                                    </td>
                                    <td>27 Apr 2024</td>
                                    <td>
                                      <h2 className="table-avatar">
                                        <Link to="/paitent-details" className="avatar avatar-sm me-2">
                                          <img className="avatar-img rounded-3" src="/assets/img/dependent/dependent-03.jpg" alt="User Image" />
                                        </Link>
                                        <Link to="/paitent-details">Christopher Joseph</Link>
                                      </h2>
                                    </td>
                                    <td>Stable, no change</td>
                                    <td>
                                      <div className="action-item">
                                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#view_report">
                                          <i className="isax isax-link-2"></i>
                                        </a>
                                        <a href="javascript:void(0);">
                                          <i className="isax isax-import"></i>
                                        </a>
                                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#delete_modal">
                                          <i className="isax isax-trash"></i>
                                        </a>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td><a href="#" className="link-primary">#MR3659</a></td>
                                    <td>
                                      <a href="javascript:void(0);" className="lab-icon">Blood Cultures</a>
                                    </td>
                                    <td>10 May  2024</td>
                                    <td>
                                      <h2 className="table-avatar">
                                        <Link to="/paitent-details" className="avatar avatar-sm me-2">
                                          <img className="avatar-img rounded-3" src="/assets/img/dependent/dependent-04.jpg" alt="User Image" />
                                        </Link>
                                        <Link to="/paitent-details">Elisa Salcedo</Link>
                                      </h2>
                                    </td>
                                    <td>Take Good Rest</td>
                                    <td>
                                      <div className="action-item">
                                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#view_report">
                                          <i className="isax isax-link-2"></i>
                                        </a>
                                        <a href="javascript:void(0);">
                                          <i className="isax isax-import"></i>
                                        </a>
                                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#delete_modal">
                                          <i className="isax isax-trash"></i>
                                        </a>
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                        <div className="tab-pane fade" id="prsc-tab">
                          <div className="custom-table">
                            <div className="table-responsive">
                              <table className="table table-center mb-0">
                                <thead>
                                  <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Date</th>
                                    <th>Prescriped By</th>
                                    <th>Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td className="link-primary"><a href="#" data-bs-toggle="modal" data-bs-target="#view_prescription">#P1236</a></td>
                                    <td>
                                      <a href="javascript:void(0);" className="lab-icon prescription">Prescription</a>
                                    </td>
                                    <td>21 Mar 2024, 10:30 AM</td>
                                    <td>
                                      <h2 className="table-avatar">
                                        <Link to="/doctor-profile" className="avatar avatar-sm me-2">
                                          <img className="avatar-img rounded-3" src="/assets/img/doctors/doctor-thumb-02.jpg" alt="User Image" />
                                        </Link>
                                        <Link to="/doctor-profile">Edalin Hendry</Link>
                                      </h2>
                                    </td>
                                    <td>
                                      <div className="action-item">
                                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#view_prescription">
                                          <i className="isax isax-link-2"></i>
                                        </a>
                                        <a href="javascript:void(0);">
                                          <i className="isax isax-import"></i>
                                        </a>
                                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#delete_modal">
                                          <i className="isax isax-trash"></i>
                                        </a>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="link-primary"><a href="#" data-bs-toggle="modal" data-bs-target="#view_prescription">#P3656</a></td>
                                    <td>
                                      <a href="javascript:void(0);" className="lab-icon prescription">Prescription</a>
                                    </td>
                                    <td>28 Mar 2024, 11:40 AM</td>
                                    <td>
                                      <h2 className="table-avatar">
                                        <Link to="/doctor-profile" className="avatar avatar-sm me-2">
                                          <img className="avatar-img rounded-3" src="/assets/img/doctors/doctor-thumb-05.jpg" alt="User Image" />
                                        </Link>
                                        <Link to="/doctor-profile">John Homes</Link>
                                      </h2>
                                    </td>
                                    <td>
                                      <div className="action-item">
                                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#view_prescription">
                                          <i className="isax isax-link-2"></i>
                                        </a>
                                        <a href="javascript:void(0);">
                                          <i className="isax isax-import"></i>
                                        </a>
                                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#delete_modal">
                                          <i className="isax isax-trash"></i>
                                        </a>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="link-primary"><a href="#" data-bs-toggle="modal" data-bs-target="#view_prescription">#P1246</a></td>
                                    <td>
                                      <a href="javascript:void(0);" className="lab-icon prescription">Prescription</a>
                                    </td>
                                    <td>11 Apr 2024, 09:00 AM</td>
                                    <td>
                                      <h2 className="table-avatar">
                                        <Link to="/doctor-profile" className="avatar avatar-sm me-2">
                                          <img className="avatar-img rounded-3" src="/assets/img/doctors/doctor-thumb-03.jpg" alt="User Image" />
                                        </Link>
                                        <Link to="/doctor-profile">Shanta Neill</Link>
                                      </h2>
                                    </td>
                                    <td>
                                      <div className="action-item">
                                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#view_prescription">
                                          <i className="isax isax-link-2"></i>
                                        </a>
                                        <a href="javascript:void(0);">
                                          <i className="isax isax-import"></i>
                                        </a>
                                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#delete_modal">
                                          <i className="isax isax-trash"></i>
                                        </a>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="link-primary"><a href="#" data-bs-toggle="modal" data-bs-target="#view_prescription">#P6985</a></td>
                                    <td>
                                      <a href="javascript:void(0);" className="lab-icon prescription">Prescription</a>
                                    </td>
                                    <td>15 Apr 2024, 02:30 PM</td>
                                    <td>
                                      <h2 className="table-avatar">
                                        <Link to="/doctor-profile" className="avatar avatar-sm me-2">
                                          <img className="avatar-img rounded-3" src="/assets/img/doctors/doctor-thumb-08.jpg" alt="User Image" />
                                        </Link>
                                        <Link to="/doctor-profile">Anthony Tran</Link>
                                      </h2>
                                    </td>
                                    <td>
                                      <div className="action-item">
                                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#view_prescription">
                                          <i className="isax isax-link-2"></i>
                                        </a>
                                        <a href="javascript:void(0);">
                                          <i className="isax isax-import"></i>
                                        </a>
                                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#delete_modal">
                                          <i className="isax isax-trash"></i>
                                        </a>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="link-primary"><a href="#" data-bs-toggle="modal" data-bs-target="#view_prescription">#P3659</a></td>
                                    <td>
                                      <a href="javascript:void(0);" className="lab-icon prescription">Prescription</a>
                                    </td>
                                    <td>23 Apr 2024, 06:40 PM</td>
                                    <td>
                                      <h2 className="table-avatar">
                                        <Link to="/doctor-profile" className="avatar avatar-sm me-2">
                                          <img className="avatar-img rounded-3" src="/assets/img/doctors/doctor-thumb-01.jpg" alt="User Image" />
                                        </Link>
                                        <Link to="/doctor-profile">Susan Lingo</Link>
                                      </h2>
                                    </td>
                                    <td>
                                      <div className="action-item">
                                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#view_prescription">
                                          <i className="isax isax-link-2"></i>
                                        </a>
                                        <a href="javascript:void(0);">
                                          <i className="isax isax-import"></i>
                                        </a>
                                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#delete_modal">
                                          <i className="isax isax-trash"></i>
                                        </a>
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                        <div className="tab-pane fade" id="invoice-tab">
                          <div className="custom-table">
                            <div className="table-responsive">
                              <table className="table table-center mb-0">
                                <thead>
                                  <tr>
                                    <th>ID</th>
                                    <th>Doctor</th>
                                    <th>Appointment Date</th>
                                    <th>Booked on</th>
                                    <th>Amount</th>
                                    <th>Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td><a href="#" data-bs-toggle="modal" data-bs-target="#invoice_view" className="link-primary">#INV1236</a></td>
                                    <td>
                                      <h2 className="table-avatar">
                                        <Link to="/doctor-profile" className="avatar avatar-sm me-2">
                                          <img className="avatar-img rounded-3" src="/assets/img/doctors/doctor-thumb-21.jpg" alt="User Image" />
                                        </Link>
                                        <Link to="/doctor-profile">Edalin Hendry</Link>
                                      </h2>
                                    </td>
                                    <td>24 Mar 2024</td>
                                    <td>21 Mar 2024</td>
                                    <td>$300</td>
                                    <td>
                                      <div className="action-item">
                                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#invoice_view">
                                          <i className="isax isax-link-2"></i>
                                        </a>
                                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#delete_modal">
                                          <i className="isax isax-trash"></i>
                                        </a>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td><a href="#" data-bs-toggle="modal" data-bs-target="#invoice_view" className="link-primary">#NV3656</a></td>
                                    <td>
                                      <h2 className="table-avatar">
                                        <Link to="/doctor-profile" className="avatar avatar-sm me-2">
                                          <img className="avatar-img rounded-3" src="/assets/img/doctors/doctor-thumb-13.jpg" alt="User Image" />
                                        </Link>
                                        <Link to="/doctor-profile">John Homes</Link>
                                      </h2>
                                    </td>
                                    <td>17 Mar 2024</td>
                                    <td>14 Mar 2024</td>
                                    <td>$450</td>
                                    <td>
                                      <div className="action-item">
                                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#invoice_view">
                                          <i className="isax isax-link-2"></i>
                                        </a>
                                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#delete_modal">
                                          <i className="isax isax-trash"></i>
                                        </a>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td><a href="#" data-bs-toggle="modal" data-bs-target="#invoice_view" className="link-primary">#INV1246</a></td>
                                    <td>
                                      <h2 className="table-avatar">
                                        <Link to="/doctor-profile" className="avatar avatar-sm me-2">
                                          <img className="avatar-img rounded-3" src="/assets/img/doctors/doctor-thumb-03.jpg" alt="User Image" />
                                        </Link>
                                        <Link to="/doctor-profile">Shanta Neill</Link>
                                      </h2>
                                    </td>
                                    <td>11 Mar 2024</td>
                                    <td>07 Mar 2024</td>
                                    <td>$250</td>
                                    <td>
                                      <div className="action-item">
                                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#invoice_view">
                                          <i className="isax isax-link-2"></i>
                                        </a>
                                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#delete_modal">
                                          <i className="isax isax-trash"></i>
                                        </a>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td><a href="#" data-bs-toggle="modal" data-bs-target="#invoice_view" className="link-primary">#INV6985</a></td>
                                    <td>
                                      <h2 className="table-avatar">
                                        <Link to="/doctor-profile" className="avatar avatar-sm me-2">
                                          <img className="avatar-img rounded-3" src="/assets/img/doctors/doctor-thumb-08.jpg" alt="User Image" />
                                        </Link>
                                        <Link to="/doctor-profile">Anthony Tran</Link>
                                      </h2>
                                    </td>
                                    <td>26 Feb 2024</td>
                                    <td>23 Feb 2024</td>
                                    <td>$320</td>
                                    <td>
                                      <div className="action-item">
                                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#invoice_view">
                                          <i className="isax isax-link-2"></i>
                                        </a>
                                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#delete_modal">
                                          <i className="isax isax-trash"></i>
                                        </a>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td><a href="#" data-bs-toggle="modal" data-bs-target="#invoice_view" className="link-primary">#INV3659</a></td>
                                    <td>
                                      <h2 className="table-avatar">
                                        <Link to="/doctor-profile" className="avatar avatar-sm me-2">
                                          <img className="avatar-img rounded-3" src="/assets/img/doctors/doctor-thumb-01.jpg" alt="User Image" />
                                        </Link>
                                        <Link to="/doctor-profile">Susan Lingo</Link>
                                      </h2>
                                    </td>
                                    <td>18 Feb 2024</td>
                                    <td>15 Feb 2024</td>
                                    <td>$480</td>
                                    <td>
                                      <div className="action-item">
                                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#invoice_view">
                                          <i className="isax isax-link-2"></i>
                                        </a>
                                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#delete_modal">
                                          <i className="isax isax-trash"></i>
                                        </a>
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientDashboard
