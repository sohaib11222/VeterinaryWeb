import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'

import { useAppointments } from '../../queries'
import { getImageUrl } from '../../utils/apiConfig'
import { useAppointmentChat } from '../../hooks/useAppointmentChat'
import { useLanguage } from '../../contexts/LanguageContext'

const DoctorAppointmentsGrid = () => {
  const { language, t } = useLanguage()
  const { data: appointmentsResponse, isLoading } = useAppointments({ limit: 50 })
  const [chatAlert, setChatAlert] = useState('')
  const { openChat: openAppointmentChat, openingAppointmentId, isOpening } = useAppointmentChat('/chat-doctor')

  const appointments = useMemo(() => {
    const payload = appointmentsResponse?.data ?? appointmentsResponse
    const list = payload?.appointments ?? payload
    return Array.isArray(list) ? list : []
  }, [appointmentsResponse])

  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter((a) => ['PENDING', 'CONFIRMED'].includes(String(a.status || '').toUpperCase()))
      .map((a) => {
        const pet = a.petId || {}
        const dateStr = a.appointmentDate ? new Date(a.appointmentDate).toLocaleDateString(language === 'it' ? 'it-IT' : 'en-GB') : ''
        const timeStr = a.appointmentTime || ''
        const appointmentId = a._id
        const detailsUrl = appointmentId ? `/doctor-appointment-details?id=${appointmentId}` : '/doctor-appointment-details'
        const petImg = getImageUrl(pet.photo) || '/assets/img/doctors-dashboard/profile-01.jpg'
        return {
          _id: a._id,
          appointmentId,
          id: a.appointmentNumber || a._id,
          patientName: pet.name ? `${pet.name}${pet.breed ? ` (${pet.breed})` : ''}` : t('doctorPets.pet'),
          dateTime: `${dateStr} ${timeStr}`.trim(),
          visitType: a.reason || t('doctorLegacy.consultation'),
          detailsUrl,
          petImg,
          _raw: a,
        }
      })
  }, [appointments, language, t])

  const completedAppointments = useMemo(() => {
    return appointments
      .filter((a) => String(a.status || '').toUpperCase() === 'COMPLETED')
      .map((a) => {
        const pet = a.petId || {}
        const dateStr = a.appointmentDate ? new Date(a.appointmentDate).toLocaleDateString(language === 'it' ? 'it-IT' : 'en-GB') : ''
        const timeStr = a.appointmentTime || ''
        const appointmentId = a._id
        const detailsUrl = appointmentId ? `/doctor-appointment-details?id=${appointmentId}` : '/doctor-appointment-details'
        const petImg = getImageUrl(pet.photo) || '/assets/img/doctors-dashboard/profile-01.jpg'
        return {
          _id: a._id,
          appointmentId,
          id: a.appointmentNumber || a._id,
          patientName: pet.name ? `${pet.name}${pet.breed ? ` (${pet.breed})` : ''}` : t('doctorPets.pet'),
          dateTime: `${dateStr} ${timeStr}`.trim(),
          visitType: a.reason || t('doctorLegacy.consultation'),
          detailsUrl,
          petImg,
          _raw: a,
        }
      })
  }, [appointments, language, t])

  const cancelledAppointments = useMemo(() => {
    return appointments
      .filter((a) => ['CANCELLED', 'REJECTED'].includes(String(a.status || '').toUpperCase()))
      .map((a) => {
        const pet = a.petId || {}
        const dateStr = a.appointmentDate ? new Date(a.appointmentDate).toLocaleDateString(language === 'it' ? 'it-IT' : 'en-GB') : ''
        const timeStr = a.appointmentTime || ''
        const appointmentId = a._id
        const detailsUrl = appointmentId ? `/doctor-appointment-details?id=${appointmentId}` : '/doctor-appointment-details'
        const petImg = getImageUrl(pet.photo) || '/assets/img/doctors-dashboard/profile-01.jpg'
        return {
          _id: a._id,
          appointmentId,
          id: a.appointmentNumber || a._id,
          patientName: pet.name ? `${pet.name}${pet.breed ? ` (${pet.breed})` : ''}` : t('doctorPets.pet'),
          dateTime: `${dateStr} ${timeStr}`.trim(),
          visitType: a.reason || t('doctorLegacy.consultation'),
          detailsUrl,
          petImg,
          _raw: a,
        }
      })
  }, [appointments, language, t])

  const handleOpenChat = async (appointment) => {
    try {
      setChatAlert('')
      await openAppointmentChat(appointment)
    } catch (error) {
      setChatAlert(error?.data?.message || error?.message || t('doctorLegacy.unableChat'))
    }
  }

  return (
    <div className="content veterinary-dashboard">
      <div className="container-fluid">
        {openingAppointmentId ? (
          <div className="alert alert-info" role="status"><i className="fa-solid fa-spinner fa-spin me-2" />{t('doctorLegacy.openingChat')}</div>
        ) : chatAlert ? (
          <div className="alert alert-warning" role="alert">
            {chatAlert}
          </div>
        ) : null}
        <div className="filter-head">
          <div className="position-relative daterange-wraper me-2">
            <div className="input-groupicon calender-input">
              <input type="text" className="form-control date-range bookingrange" placeholder={t('doctorLegacy.fromTo')} />
            </div>
            <i className="isax isax-calendar-1"></i>
          </div>
          <div className="form-sorts dropdown">
            <a href="javascript:void(0);" className="dropdown-toggle" id="table-filter"><i className="isax isax-filter me-2"></i>{t('doctorLegacy.filterBy')}</a>
            <div className="filter-dropdown-menu">
              <div className="filter-set-view">
                <div className="accordion" id="accordionExample">
                  <div className="filter-set-content">
                    <div className="filter-set-content-head">
                      <a href="#" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">{t('doctorLegacy.name')}<i className="fa-solid fa-chevron-right"></i></a>
                    </div>
                    <div className="filter-set-contents accordion-collapse collapse show" id="collapseTwo" data-bs-parent="#accordionExample">
                      <ul>
                        <li>
                          <div className="input-block dash-search-input w-100">
                            <input type="text" className="form-control" placeholder={t('doctorLegacy.search')} />
                            <span className="search-icon"><i className="fa-solid fa-magnifying-glass"></i></span>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="filter-set-content">
                    <div className="filter-set-content-head">
                      <a href="#" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">{t('doctorLegacy.appointmentType')}<i className="fa-solid fa-chevron-right"></i></a>
                    </div>
                    <div className="filter-set-contents accordion-collapse collapse show" id="collapseOne" data-bs-parent="#accordionExample">
                      <ul>
                        <li>
                          <div className="filter-checks">
                            <label className="checkboxs">
                              <input type="checkbox" defaultChecked />
                              <span className="checkmarks"></span>
                              <span className="check-title">{t('doctorLegacy.allType')}</span>
                            </label>
                          </div>
                        </li>
                        <li>
                          <div className="filter-checks">
                            <label className="checkboxs">
                              <input type="checkbox" />
                              <span className="checkmarks"></span>
                              <span className="check-title">{t('doctorLegacy.videoCall')}</span>
                            </label>
                          </div>
                        </li>
                        <li>
                          <div className="filter-checks">
                            <label className="checkboxs">
                              <input type="checkbox" />
                              <span className="checkmarks"></span>
                              <span className="check-title">{t('doctorLegacy.audioCall')}</span>
                            </label>
                          </div>
                        </li>
                        <li>
                          <div className="filter-checks">
                            <label className="checkboxs">
                              <input type="checkbox" />
                              <span className="checkmarks"></span>
                              <span className="check-title">{t('doctorLegacy.chat')}</span>
                            </label>
                          </div>
                        </li>
                        <li>
                          <div className="filter-checks">
                            <label className="checkboxs">
                              <input type="checkbox" />
                              <span className="checkmarks"></span>
                              <span className="check-title">{t('doctorLegacy.directVisit')}</span>
                            </label>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="filter-set-content">
                    <div className="filter-set-content-head">
                      <a href="#" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">{t('doctorLegacy.visitType')}<i className="fa-solid fa-chevron-right"></i></a>
                    </div>
                    <div className="filter-set-contents accordion-collapse collapse show" id="collapseThree" data-bs-parent="#accordionExample">
                      <ul>
                        <li>
                          <div className="filter-checks">
                            <label className="checkboxs">
                              <input type="checkbox" defaultChecked />
                              <span className="checkmarks"></span>
                              <span className="check-title">{t('doctorLegacy.allVisit')}</span>
                            </label>
                          </div>
                        </li>
                        <li>
                          <div className="filter-checks">
                            <label className="checkboxs">
                              <input type="checkbox" />
                              <span className="checkmarks"></span>
                              <span className="check-title">{t('doctorLegacy.general')}</span>
                            </label>
                          </div>
                        </li>
                        <li>
                          <div className="filter-checks">
                            <label className="checkboxs">
                              <input type="checkbox" />
                              <span className="checkmarks"></span>
                              <span className="check-title">{t('doctorLegacy.consultation')}</span>
                            </label>
                          </div>
                        </li>
                        <li>
                          <div className="filter-checks">
                            <label className="checkboxs">
                              <input type="checkbox" />
                              <span className="checkmarks"></span>
                              <span className="check-title">{t('doctorLegacy.followUp')}</span>
                            </label>
                          </div>
                        </li>
                        <li>
                          <div className="filter-checks">
                            <label className="checkboxs">
                              <input type="checkbox" />
                              <span className="checkmarks"></span>
                              <span className="check-title">{t('doctorLegacy.directVisit')}</span>
                            </label>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="filter-reset-btns">
                  <a href="#" className="btn btn-light">{t('doctorLegacy.reset')}</a>
                  <a href="#" className="btn btn-primary">{t('doctorLegacy.filterNow')}</a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="tab-content appointment-tab-content">
        <div className="tab-pane fade show active" id="pills-upcoming" role="tabpanel" aria-labelledby="pills-upcoming-tab">
          <div className="row">
            {/* Appointment Grid */}
            {isLoading ? (
              <div className="col-12 text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">{t('doctorLegacy.loading')}</span>
                </div>
              </div>
            ) : (
              upcomingAppointments.map((apt) => (
                <div key={apt._id} className="col-xl-4 col-lg-6 col-md-12 d-flex">
                  <div className="appointment-wrap appointment-grid-wrap">
                    <ul>
                      <li>
                        <div className="appointment-grid-head">
                          <div className="patinet-information">
                            <Link to={apt.detailsUrl}>
                              <img
                                src={apt.petImg}
                                alt={t('doctorLegacy.petImage')}
                                onError={(e) => {
                                  e.currentTarget.onerror = null
                                  e.currentTarget.src = '/assets/img/doctors-dashboard/profile-01.jpg'
                                }}
                              />
                            </Link>
                            <div className="patient-info">
                              <p>{apt.id}</p>
                              <h6><Link to={apt.detailsUrl}>{apt.patientName}</Link></h6>
                            </div>
                          </div>
                          <div className="grid-user-msg">
                            <span className="video-icon"><a href="#"><i className="isax isax-video5"></i></a></span>
                          </div>
                        </div>
                      </li>
                      <li className="appointment-info">
                        <p><i className="isax isax-clock5"></i>{apt.dateTime}</p>
                        <ul className="d-flex apponitment-types">
                          <li>{apt.visitType}</li>
                        </ul>
                      </li>
                      <li className="appointment-action">
                        <ul>
                          <li>
                            <Link to={apt.detailsUrl}><i className="isax isax-eye4"></i></Link>
                          </li>
                          <li>
                            <button
                              type="button"
                              className="veterinary-action-btn appointment-chat-action"
                              onClick={() => handleOpenChat(apt)}
                              disabled={isOpening(apt._id || apt.appointmentId)}
                              title={t('doctorLegacy.chatAction')}
                            >
                              {isOpening(apt._id || apt.appointmentId) ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="isax isax-messages-25"></i>}
                            </button>
                          </li>
                        </ul>
                        <div className="appointment-start">
                          <Link to={apt.detailsUrl} className="start-link">{t('doctorLegacy.view')}</Link>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              ))
            )}

            {/* More appointment grids would continue here... */}
            <div className="col-md-12">
              <div className="loader-item text-center">
                <a href="javascript:void(0);" className="btn btn-load">{t('doctorLegacy.loadMore')}</a>
              </div>
            </div>
          </div>
        </div>
        <div className="tab-pane fade" id="pills-cancel" role="tabpanel" aria-labelledby="pills-cancel-tab">
          <div className="row">
            {cancelledAppointments.length > 0 ? (
              cancelledAppointments.map((apt) => (
                <div key={apt._id} className="col-xl-4 col-lg-6 col-md-12 d-flex">
                  <div className="appointment-wrap appointment-grid-wrap">
                    <ul>
                      <li>
                        <div className="appointment-grid-head">
                          <div className="patinet-information">
                            <Link to={apt.detailsUrl}>
                              <img
                                src={apt.petImg}
                                alt={t('doctorLegacy.petImage')}
                                onError={(e) => {
                                  e.currentTarget.onerror = null
                                  e.currentTarget.src = '/assets/img/doctors-dashboard/profile-01.jpg'
                                }}
                              />
                            </Link>
                            <div className="patient-info">
                              <p>{apt.id}</p>
                              <h6><Link to={apt.detailsUrl}>{apt.patientName}</Link></h6>
                            </div>
                          </div>
                          <div className="grid-user-msg">
                            <span className="video-icon"><a href="#"><i className="isax isax-video5"></i></a></span>
                          </div>
                        </div>
                      </li>
                      <li className="appointment-info">
                        <p><i className="isax isax-clock5"></i>{apt.dateTime}</p>
                        <ul className="d-flex apponitment-types">
                          <li>{apt.visitType}</li>
                        </ul>
                      </li>
                      <li className="appointment-detail-btn">
                        <Link to={apt.detailsUrl} className="start-link w-100">{t('doctorLegacy.viewDetails')}</Link>
                      </li>
                    </ul>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-md-12 text-center py-4">
                <p className="text-muted">{t('doctorLegacy.noCancelled')}</p>
              </div>
            )}
          </div>
        </div>
        <div className="tab-pane fade" id="pills-complete" role="tabpanel" aria-labelledby="pills-complete-tab">
          <div className="row">
            {completedAppointments.length > 0 ? (
              completedAppointments.map((apt) => (
                <div key={apt._id} className="col-xl-4 col-lg-6 col-md-12 d-flex">
                  <div className="appointment-wrap appointment-grid-wrap">
                    <ul>
                      <li>
                        <div className="appointment-grid-head">
                          <div className="patinet-information">
                            <Link to={apt.detailsUrl}>
                              <img
                                src={apt.petImg}
                                alt={t('doctorLegacy.petImage')}
                                onError={(e) => {
                                  e.currentTarget.onerror = null
                                  e.currentTarget.src = '/assets/img/doctors-dashboard/profile-01.jpg'
                                }}
                              />
                            </Link>
                            <div className="patient-info">
                              <p>{apt.id}</p>
                              <h6><Link to={apt.detailsUrl}>{apt.patientName}</Link></h6>
                            </div>
                          </div>
                          <div className="grid-user-msg">
                            <span className="video-icon"><a href="#"><i className="isax isax-video5"></i></a></span>
                          </div>
                        </div>
                      </li>
                      <li className="appointment-info">
                        <p><i className="isax isax-clock5"></i>{apt.dateTime}</p>
                        <ul className="d-flex apponitment-types">
                          <li>{apt.visitType}</li>
                        </ul>
                      </li>
                      <li className="appointment-detail-btn">
                        <Link to={apt.detailsUrl} className="start-link w-100">{t('doctorLegacy.viewDetails')}</Link>
                      </li>
                    </ul>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-md-12 text-center py-4">
                <p className="text-muted">{t('doctorLegacy.noCompleted')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

export default DoctorAppointmentsGrid

