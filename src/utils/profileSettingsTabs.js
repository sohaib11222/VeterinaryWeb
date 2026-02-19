/**
 * Profile Settings Tab Order
 * Defines the sequence of tabs for doctor profile completion flow
 */
export const PROFILE_SETTINGS_TABS = [
  {
    path: '/doctor-profile-settings',
    name: 'Basic Details',
    key: 'basic',
  },
  {
    path: '/doctor-specialities',
    name: 'Specialties & Services',
    key: 'specialties',
  },
  {
    path: '/doctor-experience-settings',
    name: 'Experience',
    key: 'experience',
  },
  {
    path: '/doctor-education-settings',
    name: 'Education',
    key: 'education',
  },
  {
    path: '/doctor-awards-settings',
    name: 'Awards',
    key: 'awards',
  },
  {
    path: '/doctor-insurance-settings',
    name: 'Insurances',
    key: 'insurance',
  },
  {
    path: '/doctor-clinics-settings',
    name: 'Clinics',
    key: 'clinics',
  },
  {
    path: '/doctor-business-settings',
    name: 'Business Hours',
    key: 'business',
  },
  {
    path: '/social-media',
    name: 'Social Media',
    key: 'social',
  },
]

export const getNextTabPath = (currentPath) => {
  const currentIndex = PROFILE_SETTINGS_TABS.findIndex((tab) => tab.path === currentPath)
  if (currentIndex === -1 || currentIndex === PROFILE_SETTINGS_TABS.length - 1) {
    return null
  }
  return PROFILE_SETTINGS_TABS[currentIndex + 1].path
}

export const getCurrentTabIndex = (currentPath) => {
  return PROFILE_SETTINGS_TABS.findIndex((tab) => tab.path === currentPath)
}
