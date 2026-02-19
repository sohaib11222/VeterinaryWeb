import { useMemo, useState } from 'react'
import { useWeeklySchedule } from '../../queries/scheduleQueries'
import {
  useAddTimeSlot,
  useDeleteTimeSlot,
  useUpdateAppointmentDuration,
} from '../../mutations/scheduleMutations'
import { toast } from 'react-toastify'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const formatTime = (value) => value

const AvailableTimings = () => {
  const { data: schedule, isLoading } = useWeeklySchedule()
  const updateDurationMutation = useUpdateAppointmentDuration()
  const addSlotMutation = useAddTimeSlot()
  const deleteSlotMutation = useDeleteTimeSlot()

  const [modalDay, setModalDay] = useState('Monday')
  const [modalStart, setModalStart] = useState('09:00')
  const [modalEnd, setModalEnd] = useState('09:30')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [duration, setDuration] = useState(30)

  const getDaySchedule = (dayOfWeek) => {
    const days = schedule?.data?.days || schedule?.days || []
    return days.find((d) => d.dayOfWeek === dayOfWeek) || { dayOfWeek, timeSlots: [] }
  }

  const renderDaySlots = (dayOfWeek) => {
    const daySchedule = getDaySchedule(dayOfWeek)
    if (!daySchedule.timeSlots || daySchedule.timeSlots.length === 0) {
      return (
        <div className="no-slots veterinary-no-slots">
          <i className="fa-solid fa-calendar-xmark fa-2x text-muted mb-2"></i>
          <p>No Slots Available</p>
          <small className="text-muted">Click &quot;Add Slots&quot; to create time slots</small>
        </div>
      )
    }

    return (
      <ul className="veterinary-time-slots">
        {daySchedule.timeSlots.map((slot) => (
          <li key={slot._id}>
            <i className="fa-solid fa-clock"></i>
            <span>
              {slot.startTime} - {slot.endTime}
            </span>
            {!slot.isAvailable && (
              <span className="slot-type text-danger ms-2">Unavailable</span>
            )}
            <button
              type="button"
              className="btn btn-sm btn-link text-danger ms-3"
              onClick={() => handleDeleteSlot(dayOfWeek, slot._id)}
              disabled={deleteSlotMutation.isLoading}
            >
              <i className="fa-solid fa-trash me-1"></i>
              Delete
            </button>
          </li>
        ))}
      </ul>
    )
  }

  const openAddSlotModal = (dayOfWeek) => {
    setModalDay(dayOfWeek)
    setIsModalOpen(true)
  }

  const handleAddSlot = async () => {
    try {
      await addSlotMutation.mutateAsync({
        dayOfWeek: modalDay,
        payload: {
          startTime: formatTime(modalStart),
          endTime: formatTime(modalEnd),
          isAvailable: true,
        },
      })
      toast.success('Time slot added')
      setIsModalOpen(false)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add time slot')
    }
  }

  const handleDeleteSlot = async (dayOfWeek, slotId) => {
    try {
      await deleteSlotMutation.mutateAsync({ dayOfWeek, slotId })
      toast.success('Time slot deleted')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete time slot')
    }
  }

  const handleUpdateDuration = async () => {
    try {
      await updateDurationMutation.mutateAsync(Number(duration))
      toast.success('Appointment duration updated')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update duration')
    }
  }

  if (isLoading) {
    return (
      <div className="content veterinary-dashboard d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  const currentDuration = schedule?.data?.appointmentDuration ?? schedule?.appointmentDuration ?? duration

  return (
    <div className="content veterinary-dashboard">
      <div className="container-fluid">
        <div className="row">
          <div className="col-lg-3 col-xl-2 theiaStickySidebar">
            {/* Sidebar is handled by DashboardLayout */}
          </div>
          <div className="col-lg-12 col-xl-12">
            {/* Veterinary Clinic Hours Header */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="veterinary-dashboard-header">
                  <h2 className="dashboard-title">
                    <i className="fa-solid fa-calendar-day me-3"></i>
                    Clinic Hours
                  </h2>
                  <p className="dashboard-subtitle">Manage your veterinary clinic availability and appointment slots</p>
                </div>
              </div>
            </div>

            {/* Availability Tabs */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="dashboard-card veterinary-card">
                  <div className="appointment-tabs">
                    <ul className="nav available-nav">
                      <li className="nav-item" role="presentation">
                        <a className="nav-link veterinary-tab active" href="#" data-bs-toggle="tab" data-bs-target="#general-availability">
                          <i className="fa-solid fa-clock me-2"></i>General Availability
                        </a>
                      </li>
                      <li className="nav-item" role="presentation">
                        <a className="nav-link veterinary-tab" href="#" data-bs-toggle="tab" data-bs-target="#clinic-availability">
                          <i className="fa-solid fa-clinic-medical me-2"></i>Clinic Availability
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="tab-content pt-0 timing-content">
              {/* General Availability */}
              <div className="tab-pane fade show active" id="general-availability">
                <div className="dashboard-card veterinary-card">
                  <div className="dashboard-card-body">
                    <div className="card-header veterinary-card-header">
                      <h3>
                        <i className="fa-solid fa-calendar-check me-2"></i>
                        Select Available Slots
                      </h3>
                    </div>

                    <div className="available-tab">
                      <label className="form-label">
                        <i className="fa-solid fa-calendar-days me-2"></i>
                        Select Available Days
                      </label>
                      <ul className="nav veterinary-day-nav">
                        <li>
                          <a href="#" className="active" data-bs-toggle="tab" data-bs-target="#monday">
                            <i className="fa-solid fa-calendar me-1"></i>Monday
                          </a>
                        </li>
                        <li>
                          <a href="#" data-bs-toggle="tab" data-bs-target="#tuesday">
                            <i className="fa-solid fa-calendar me-1"></i>Tuesday
                          </a>
                        </li>
                        <li>
                          <a href="#" data-bs-toggle="tab" data-bs-target="#wednesday">
                            <i className="fa-solid fa-calendar me-1"></i>Wednesday
                          </a>
                        </li>
                        <li>
                          <a href="#" data-bs-toggle="tab" data-bs-target="#thursday">
                            <i className="fa-solid fa-calendar me-1"></i>Thursday
                          </a>
                        </li>
                        <li>
                          <a href="#" data-bs-toggle="tab" data-bs-target="#friday">
                            <i className="fa-solid fa-calendar me-1"></i>Friday
                          </a>
                        </li>
                        <li>
                          <a href="#" data-bs-toggle="tab" data-bs-target="#saturday">
                            <i className="fa-solid fa-calendar me-1"></i>Saturday
                          </a>
                        </li>
                        <li>
                          <a href="#" data-bs-toggle="tab" data-bs-target="#sunday">
                            <i className="fa-solid fa-calendar me-1"></i>Sunday
                          </a>
                        </li>
                      </ul>
                    </div>

                    <div className="tab-content pt-0">
                      {/* Monday Slots */}
                      <div className="tab-pane active show" id="monday">
                        <div className="slot-box veterinary-slot-box">
                          <div className="slot-header">
                            <h5>
                              <i className="fa-solid fa-calendar-day me-2"></i>
                              Monday
                            </h5>
                            <ul>
                              <li>
                                <a
                                  href="#"
                                  className="veterinary-action-btn add-slot"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    openAddSlotModal('Monday')
                                  }}
                                >
                                  <i className="fa-solid fa-plus"></i> Add Slots
                                </a>
                              </li>
                            </ul>
                          </div>
                          <div className="slot-body">{renderDaySlots('Monday')}</div>
                        </div>
                      </div>

                      {/* Tuesday Slots */}
                      <div className="tab-pane fade" id="tuesday">
                        <div className="slot-box veterinary-slot-box">
                          <div className="slot-header">
                            <h5>
                              <i className="fa-solid fa-calendar-day me-2"></i>
                              Tuesday
                            </h5>
                            <ul>
                              <li>
                                <a
                                  href="#"
                                  className="veterinary-action-btn add-slot"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    openAddSlotModal('Tuesday')
                                  }}
                                >
                                  <i className="fa-solid fa-plus"></i> Add Slots
                                </a>
                              </li>
                            </ul>
                          </div>
                          <div className="slot-body">{renderDaySlots('Tuesday')}</div>
                        </div>
                      </div>

                      {/* Wednesday Slots */}
                      <div className="tab-pane fade" id="wednesday">
                        <div className="slot-box veterinary-slot-box">
                          <div className="slot-header">
                            <h5>
                              <i className="fa-solid fa-calendar-day me-2"></i>
                              Wednesday
                            </h5>
                            <ul>
                              <li>
                                <a
                                  href="#"
                                  className="veterinary-action-btn add-slot"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    openAddSlotModal('Wednesday')
                                  }}
                                >
                                  <i className="fa-solid fa-plus"></i> Add Slots
                                </a>
                              </li>
                            </ul>
                          </div>
                          <div className="slot-body">{renderDaySlots('Wednesday')}</div>
                        </div>
                      </div>

                      {/* Thursday Slots */}
                      <div className="tab-pane fade" id="thursday">
                        <div className="slot-box veterinary-slot-box">
                          <div className="slot-header">
                            <h5>
                              <i className="fa-solid fa-calendar-day me-2"></i>
                              Thursday
                            </h5>
                            <ul>
                              <li>
                                <a
                                  href="#"
                                  className="veterinary-action-btn add-slot"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    openAddSlotModal('Thursday')
                                  }}
                                >
                                  <i className="fa-solid fa-plus"></i> Add Slots
                                </a>
                              </li>
                            </ul>
                          </div>
                          <div className="slot-body">{renderDaySlots('Thursday')}</div>
                        </div>
                      </div>

                      {/* Friday Slots */}
                      <div className="tab-pane fade" id="friday">
                        <div className="slot-box veterinary-slot-box">
                          <div className="slot-header">
                            <h5>
                              <i className="fa-solid fa-calendar-day me-2"></i>
                              Friday
                            </h5>
                            <ul>
                              <li>
                                <a
                                  href="#"
                                  className="veterinary-action-btn add-slot"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    openAddSlotModal('Friday')
                                  }}
                                >
                                  <i className="fa-solid fa-plus"></i> Add Slots
                                </a>
                              </li>
                            </ul>
                          </div>
                          <div className="slot-body">{renderDaySlots('Friday')}</div>
                        </div>
                      </div>

                      {/* Saturday Slots */}
                      <div className="tab-pane fade" id="saturday">
                        <div className="slot-box veterinary-slot-box">
                          <div className="slot-header">
                            <h5>
                              <i className="fa-solid fa-calendar-day me-2"></i>
                              Saturday
                            </h5>
                            <ul>
                              <li>
                                <a
                                  href="#"
                                  className="veterinary-action-btn add-slot"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    openAddSlotModal('Saturday')
                                  }}
                                >
                                  <i className="fa-solid fa-plus"></i> Add Slots
                                </a>
                              </li>
                            </ul>
                          </div>
                          <div className="slot-body">{renderDaySlots('Saturday')}</div>
                        </div>
                      </div>

                      {/* Sunday Slots */}
                      <div className="tab-pane fade" id="sunday">
                        <div className="slot-box veterinary-slot-box">
                          <div className="slot-header">
                            <h5>
                              <i className="fa-solid fa-calendar-day me-2"></i>
                              Sunday
                            </h5>
                            <ul>
                              <li>
                                <a
                                  href="#"
                                  className="veterinary-action-btn add-slot"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    openAddSlotModal('Sunday')
                                  }}
                                >
                                  <i className="fa-solid fa-plus"></i> Add Slots
                                </a>
                              </li>
                            </ul>
                          </div>
                          <div className="slot-body">{renderDaySlots('Sunday')}</div>
                        </div>
                      </div>
                    </div>

                    <div className="form-wrap veterinary-form-wrap">
                      <label className="col-form-label">
                        <i className="fa-solid fa-clock me-2"></i>
                        Appointment Duration (minutes)
                      </label>
                      <div className="d-flex align-items-center gap-3">
                        <select
                          className="form-select veterinary-input"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                        >
                          {[15, 30, 45, 60].map((d) => (
                            <option key={d} value={d}>
                              {d} minutes
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn veterinary-start-btn prime-btn"
                          onClick={handleUpdateDuration}
                          disabled={updateDurationMutation.isLoading}
                        >
                          <i className="fa-solid fa-save me-1"></i>Update Duration
                        </button>
                        <small className="text-muted">
                          Current: {currentDuration} minutes per appointment
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clinic Availability */}
              <div className="tab-pane fade" id="clinic-availability">
                <div className="dashboard-card veterinary-card">
                  <div className="dashboard-card-body">
                    <div className="clinic-wrap veterinary-clinic-wrap">
                      <h5>
                        <i className="fa-solid fa-clinic-medical me-2"></i>
                        Select Veterinary Clinic
                      </h5>
                      <div className="row">
                        <div className="col-md-6">
                          <select className="select-img veterinary-select">
                            <option data-image="assets/img/doctors-dashboard/clinic-01.jpg">🐾 MyPetPlus Veterinary Clinic</option>
                            <option data-image="assets/img/doctors-dashboard/clinic-02.jpg">🏥 Animal Medical Center</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="card-header veterinary-card-header">
                      <h3>
                        <i className="fa-solid fa-calendar-check me-2"></i>
                        Select Available Slots
                      </h3>
                    </div>

                    <div className="available-tab">
                      <label className="form-label">
                        <i className="fa-solid fa-calendar-days me-2"></i>
                        Select Available Days
                      </label>
                      <ul className="nav veterinary-day-nav">
                        <li>
                          <a href="#" className="active" data-bs-toggle="tab" data-bs-target="#monday-slot">
                            <i className="fa-solid fa-calendar me-1"></i>Monday
                          </a>
                        </li>
                        <li>
                          <a href="#" data-bs-toggle="tab" data-bs-target="#tuesday-slot">
                            <i className="fa-solid fa-calendar me-1"></i>Tuesday
                          </a>
                        </li>
                        <li>
                          <a href="#" data-bs-toggle="tab" data-bs-target="#wednesday-slot">
                            <i className="fa-solid fa-calendar me-1"></i>Wednesday
                          </a>
                        </li>
                        <li>
                          <a href="#" data-bs-toggle="tab" data-bs-target="#thursday-slot">
                            <i className="fa-solid fa-calendar me-1"></i>Thursday
                          </a>
                        </li>
                        <li>
                          <a href="#" data-bs-toggle="tab" data-bs-target="#friday-slot">
                            <i className="fa-solid fa-calendar me-1"></i>Friday
                          </a>
                        </li>
                        <li>
                          <a href="#" data-bs-toggle="tab" data-bs-target="#saturday-slot">
                            <i className="fa-solid fa-calendar me-1"></i>Saturday
                          </a>
                        </li>
                        <li>
                          <a href="#" data-bs-toggle="tab" data-bs-target="#sunday-slot">
                            <i className="fa-solid fa-calendar me-1"></i>Sunday
                          </a>
                        </li>
                      </ul>
                    </div>

                    <div className="tab-content pt-0">
                      {/* Monday Clinic Slots */}
                      <div className="tab-pane active show" id="monday-slot">
                        <div className="slot-box veterinary-slot-box">
                          <div className="slot-header">
                            <h5>
                              <i className="fa-solid fa-calendar-day me-2"></i>
                              Monday
                            </h5>
                            <ul>
                              <li>
                                <a
                                  href="#"
                                  className="veterinary-action-btn add-slot"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    openAddSlotModal('Monday')
                                  }}
                                >
                                  <i className="fa-solid fa-plus"></i> Add Slots
                                </a>
                              </li>
                            </ul>
                          </div>
                          <div className="slot-body">{renderDaySlots('Monday')}</div>
                        </div>
                      </div>

                      {/* Tuesday Clinic Slots */}
                      <div className="tab-pane fade" id="tuesday-slot">
                        <div className="slot-box veterinary-slot-box">
                          <div className="slot-header">
                            <h5>
                              <i className="fa-solid fa-calendar-day me-2"></i>
                              Tuesday
                            </h5>
                            <ul>
                              <li>
                                <a
                                  href="#"
                                  className="veterinary-action-btn add-slot"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    openAddSlotModal('Tuesday')
                                  }}
                                >
                                  <i className="fa-solid fa-plus"></i> Add Slots
                                </a>
                              </li>
                            </ul>
                          </div>
                          <div className="slot-body">{renderDaySlots('Tuesday')}</div>
                        </div>
                      </div>
                    </div>

                    {/* Clinic tab reuses same backend weekly schedule; no extra form fields to avoid dummy data */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Add Slot Modal (React-controlled, no Bootstrap JS needed) */}
      {isModalOpen && (
        <>
          <div className="modal fade show d-block" id="add_slot" tabIndex="-1" aria-hidden="false">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fa-solid fa-clock me-2"></i>
                    Add Time Slot - {modalDay}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setIsModalOpen(false)}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <label className="form-label">Start Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={modalStart}
                        onChange={(e) => setModalStart(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">End Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={modalEnd}
                        onChange={(e) => setModalEnd(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-gray veterinary-btn-secondary"
                    onClick={() => setIsModalOpen(false)}
                  >
                    <i className="fa-solid fa-times me-1"></i>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn veterinary-start-btn prime-btn"
                    onClick={handleAddSlot}
                    disabled={addSlotMutation.isLoading}
                  >
                    <i className="fa-solid fa-save me-1"></i>
                    Save Slot
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  )
}

export default AvailableTimings
