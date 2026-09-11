import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../../contexts/AuthContext'
import { useVeterinarianPublicProfile } from '../../queries/veterinarianQueries'
import { useReviewsByVeterinarian } from '../../queries/reviewQueries'
import { useFavorites } from '../../queries/favoriteQueries'
import { useAddFavorite, useRemoveFavorite } from '../../mutations/favoriteMutations'
import { getImageUrl } from '../../utils/apiConfig'
import { useLanguage } from '../../contexts/LanguageContext'

const PUBLIC_SOCIAL_LINKS = [
  { key: 'facebook', label: 'Facebook', icon: 'fa-facebook-f' },
  { key: 'instagram', label: 'Instagram', icon: 'fa-instagram' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'fa-linkedin-in' },
  { key: 'twitter', label: 'X / Twitter', icon: 'fa-x-twitter' },
  { key: 'website', label: 'Website', icon: 'fa-globe', style: 'fa-solid' },
]

const toSafePublicUrl = (value) => {
  const trimmed = String(value || '').trim()
  if (!trimmed) return null
  try {
    const parsed = new URL(/^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`)
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : null
  } catch {
    return null
  }
}

const DoctorProfile = () => {
  const { userId } = useParams()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { t } = useLanguage()

  const veterinarianId = userId || searchParams.get('id')

  const { data: profileResponse, isLoading: profileLoading, error: profileError } =
    useVeterinarianPublicProfile(veterinarianId)

  const profile = useMemo(() => {
    return profileResponse?.data ?? profileResponse ?? null
  }, [profileResponse])

  const { data: reviewsResponse } = useReviewsByVeterinarian(veterinarianId, { page: 1, limit: 10 })
  const reviewsPayload = useMemo(() => {
    return reviewsResponse?.data ?? reviewsResponse ?? null
  }, [reviewsResponse])
  const reviews = reviewsPayload?.reviews || []
  const reviewCount = reviewsPayload?.pagination?.total ?? profile?.ratingCount ?? 0

  const currentUserId = user?.id || user?._id
  const { data: favoritesData } = useFavorites(currentUserId, { limit: 1000 })
  const addFavorite = useAddFavorite()
  const removeFavorite = useRemoveFavorite()

  const favoriteVetIds = useMemo(() => {
    const raw = favoritesData?.data
    const list = raw?.favorites || []
    return new Set(
      list
        .map((f) => {
          const v = f.veterinarianId
          return v && (typeof v === 'object' ? v._id : v)
        })
        .filter(Boolean)
        .map(String)
    )
  }, [favoritesData])

  const favoriteIdByVetId = useMemo(() => {
    const raw = favoritesData?.data
    const list = raw?.favorites || []
    const map = {}
    list.forEach((f) => {
      const v = f.veterinarianId
      const vid = v && (typeof v === 'object' ? v._id : v)
      if (vid && f._id) map[String(vid)] = f._id
    })
    return map
  }, [favoritesData])

  const vetUserId = profile?.userId?._id || veterinarianId
  const isFavorited = vetUserId ? favoriteVetIds.has(String(vetUserId)) : false

  const handleFavoriteToggle = (e) => {
    e.preventDefault()
    if (!user || user.role !== 'PET_OWNER') {
      toast.info(t('patient.doctorProfile.favoriteLogin'))
      return
    }
    if (!vetUserId) {
      toast.error(t('patient.doctorProfile.notFound'))
      return
    }
    const idStr = String(vetUserId)
    if (isFavorited) {
      const favId = favoriteIdByVetId[idStr]
      if (!favId) {
        toast.error(t('patient.doctorProfile.notFoundFavorite'))
        return
      }
      removeFavorite.mutate(favId, {
        onSuccess: () => toast.success(t('patient.doctorProfile.favoriteRemoved')),
        onError: (err) => toast.error(err?.response?.data?.message || err?.message || t('patient.doctorProfile.favoriteRemoveFailed')),
      })
    } else {
      addFavorite.mutate(vetUserId, {
        onSuccess: () => toast.success(t('patient.doctorProfile.favoriteAdded')),
        onError: (err) => toast.error(err?.response?.data?.message || err?.message || t('patient.doctorProfile.favoriteAddFailed')),
      })
    }
  }

  const [activeSection, setActiveSection] = useState('doc_bio')
  useEffect(() => {
    setActiveSection('doc_bio')
  }, [veterinarianId])

  const hasBiography = !!profile?.biography
  const hasExperience = Array.isArray(profile?.experience) && profile.experience.length > 0
  const hasEducation = Array.isArray(profile?.education) && profile.education.length > 0
  const hasAwards = Array.isArray(profile?.awards) && profile.awards.length > 0
  const hasMemberships = Array.isArray(profile?.memberships) && profile.memberships.length > 0
  const hasServices = Array.isArray(profile?.services) && profile.services.length > 0
  const hasSpeciality = Array.isArray(profile?.specializations) && profile.specializations.length > 0
  const hasClinics = Array.isArray(profile?.clinics) && profile.clinics.length > 0
  const insuranceCompanies = Array.isArray(profile?.insuranceCompanies) ? profile.insuranceCompanies : []
  const hasInsurance = (profile?.convenzionato === true || profile?.acceptsInsurance === true) && insuranceCompanies.length > 0

  const doctorName = profile?.userId?.fullName || profile?.userId?.name || t('patient.doctorProfile.veterinarian')
  const doctorImage = getImageUrl(profile?.userId?.profileImage) || '/assets/img/doctors/doc-profile-02.jpg'
  const firstClinic = profile?.clinics?.[0]
  const locationText = firstClinic
    ? [firstClinic.address, firstClinic.city, firstClinic.state, firstClinic.country].filter(Boolean).join(', ') || '—'
    : '—'
  const specializationName =
    (profile?.specializations?.[0] && typeof profile.specializations[0] === 'object'
      ? profile.specializations[0].name
      : profile?.specializations?.[0]) || t('patient.doctorProfile.veterinarian')
  const rating = Number(profile?.ratingAvg || 0)
  const publicSocialLinks = useMemo(() => (
    PUBLIC_SOCIAL_LINKS
      .map((definition) => ({ ...definition, href: toSafePublicUrl(profile?.socialLinks?.[definition.key]) }))
      .filter((definition) => Boolean(definition.href))
  ), [profile?.socialLinks])

  const experienceYears = useMemo(() => {
    if (Number(profile?.experienceYears)) return Number(profile.experienceYears)
    if (!Array.isArray(profile?.experience) || profile.experience.length === 0) return 0
    const currentYear = new Date().getFullYear()
    const years = profile.experience
      .map((e) => {
        const from = e?.fromYear ? parseInt(e.fromYear) : NaN
        return from
      })
      .filter((y) => !Number.isNaN(y))
    if (years.length === 0) return 0
    return Math.max(0, currentYear - Math.min(...years))
  }, [profile])

  const recommendPercent = useMemo(() => {
    if (rating >= 4.5) return 94
    if (rating >= 4) return 85
    if (rating >= 3.5) return 75
    return 60
  }, [rating])

  const servicesPreview = useMemo(() => {
    if (!Array.isArray(profile?.services)) return []
    return profile.services.slice(0, 3)
  }, [profile])

  if (profileLoading) {
    return (
      <div className="content doctor-content">
        <div className="container">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">{t('common.loading', 'Loading…')}</span>
            </div>
            <p className="mt-3 text-muted">{t('patient.doctorProfile.loading')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (profileError || !profile) {
    return (
      <div className="content doctor-content">
        <div className="container">
          <div className="alert alert-danger">
            <h5>{t('patient.doctorProfile.notFound')}</h5>
            <p>{profileError?.message || t('patient.doctorProfile.notExist')}</p>
            <Link to="/search" className="btn btn-primary">{t('patient.doctorProfile.browse')}</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="content doctor-content" style={{ padding: '80px 0 28px' }}>
      <div className="container">
        <div
          className="card doc-profile-card"
          style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: 'none', overflow: 'hidden' }}
        >
          <div className="card-body" style={{ padding: '24px' }}>
            <div className="doctor-widget doctor-profile-two" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
              <div className="doc-info-left" style={{ flex: '2', display: 'flex', gap: '16px' }}>
                <div className="doctor-img" style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={doctorImage} className="img-fluid" alt={doctorName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <div className="doc-info-cont" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <span className="badge doc-avail-badge"><i className="fa-solid fa-circle"></i>{t('patient.doctorProfile.available')} </span>
                  </div>
                  <h4 className="doc-name">
                    {doctorName}
                    <img src="/assets/img/icons/badge-check.svg" alt="Img" style={{ marginLeft: '8px' }} />
                    <span className="badge doctor-role-badge"><i className="fa-solid fa-circle"></i>{specializationName}</span>
                  </h4>
            <p>{profile?.title || t('patient.doctorProfile.professionalFallback')}</p>
                  <p className="address-detail">
                    <span className="loc-icon"><i className="feather-map-pin"></i></span>
                    {locationText}
                  </p>
                  {profile?.userId?.email && (
                    <p className="mb-1">
                      <i className="fa-regular fa-envelope me-2"></i>
                      {profile.userId.email}
                    </p>
                  )}
                  {profile?.userId?.phone && (
                    <p className="mb-0">
                      <i className="fa-solid fa-phone me-2"></i>
                      {profile.userId.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="doc-info-right" style={{ flex: '1', paddingTop: '4px' }}>
                <div className="d-flex justify-content-between align-items-start" style={{ gap: '16px', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <h6 className="mb-2" style={{ fontWeight: 600 }}>{t('patient.doctorProfile.socialMedia')}</h6>
                    <div className="d-flex" style={{ gap: '10px', flexWrap: 'wrap' }}>
                      {publicSocialLinks.length > 0 ? publicSocialLinks.map(({ key, label, icon, style, href }) => (
                        <a
                          key={key}
                          href={href}
                          target="_blank"
                          rel="noreferrer noopener"
                          aria-label={`${doctorName} on ${t(`doctorRemaining.social.${key}`)}`}
                          title={t(`doctorRemaining.social.${key}`)}
                        >
                          <i className={`${style || 'fa-brands'} ${icon}`}></i>
                        </a>
                      )) : (
                        <span className="text-muted small">{t('patient.doctorProfile.noSocial')}</span>
                      )}
                    </div>
                  </div>

                  <a
                    href="#"
                    onClick={handleFavoriteToggle}
                    title={isFavorited ? t('patient.doctorProfile.removeFavorite') : t('patient.doctorProfile.addFavorite')}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: '#fff',
                      border: '1px solid rgba(0,0,0,0.08)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                      flexShrink: 0,
                    }}
                    aria-label={isFavorited ? t('patient.doctorProfile.removeFavorite') : t('patient.doctorProfile.addFavorite')}
                  >
                    <i className={`fa ${isFavorited ? 'fa-solid' : 'fa-regular'} fa-heart`} style={{ color: isFavorited ? '#e63b3b' : '#0E82FD' }}></i>
                  </a>
                </div>

                <ul className="doctors-activities" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li>
                    <div className="hospital-info">
                      <span className="list-icon"><img src="/assets/img/icons/thumb-icon.svg" alt="" /></span>
                      <p><b>{recommendPercent}% </b>{t('patient.doctorProfile.recommend')}</p>
                    </div>
                  </li>
                  <li>
                    <div className="hospital-info">
                      <span className="list-icon"><img src="/assets/img/icons/watch-icon.svg" alt="" /></span>
                      <p>{t('patient.doctorProfile.onlineConsultations')}</p>
                    </div>
                    <p className="text-muted" style={{ marginLeft: '52px', marginTop: '-6px' }}>
                      {t('patient.doctorProfile.consultationDescription')}
                    </p>
                  </li>
                </ul>

                
              </div>
            </div>

            <div className="row" style={{ marginTop: '22px' }}>
              <div className="col-lg-8">
                <div className="card" style={{ borderRadius: '14px', border: '1px solid #eef1f6' }}>
                  <div className="card-body">
                    <h5 className="mb-3">{t('patient.doctorProfile.shortBio')}</h5>
                    <p className="text-muted" style={{ marginBottom: '8px' }}>
                      {hasBiography ? profile.biography : t('patient.doctorProfile.noBiography')}
                    </p>
                    <a href="#" onClick={(e) => e.preventDefault()} style={{ textDecoration: 'none', fontWeight: 600 }}>{t('patient.doctorProfile.readMore')}</a>
                  </div>
                </div>

                <div className="card" style={{ borderRadius: '14px', border: '1px solid #eef1f6', marginTop: '16px' }}>
                  <div className="card-body">
                    <h5 className="mb-3">{t('patient.doctorProfile.servicesPrice')}</h5>
                    {servicesPreview.length === 0 ? (
                      <p className="text-muted mb-0">{t('patient.doctorProfile.noServices')}</p>
                    ) : (
                      <div className="table-responsive">
                        <table className="table mb-2" style={{ borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                          <tbody>
                            {servicesPreview.map((s, idx) => (
                              <tr key={idx} style={{ background: '#fff' }}>
                                <td style={{ borderTop: '1px solid #eef1f6', borderBottom: '1px solid #eef1f6' }}>
                                  {s?.name || t('patient.doctorProfile.service')}
                                </td>
                                <td className="text-end" style={{ borderTop: '1px solid #eef1f6', borderBottom: '1px solid #eef1f6', fontWeight: 700 }}>
                                  {s?.price != null ? `€${s.price}` : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('services') }} style={{ textDecoration: 'none', fontWeight: 600 }}>{t('patient.doctorProfile.readMore')}</a>
                  </div>
                </div>
              </div>

              <div className="col-lg-4">
                <div className="card" style={{ borderRadius: '14px', border: '1px solid #eef1f6' }}>
                  <div className="card-body">
                    <h5 className="mb-3">{t('patient.doctorProfile.about')}</h5>

                    <div className="d-flex" style={{ gap: '10px', marginBottom: '12px' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f5f8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fa-solid fa-briefcase" style={{ color: '#0E82FD' }}></i>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{t('patient.doctorProfile.yearsExperience', { count: experienceYears || 0 })}</div>
                        <div className="text-muted" style={{ fontSize: 13 }}>
                          {firstClinic?.name ? `${firstClinic.name}${firstClinic.city ? ` ${firstClinic.city}` : ''}` : t('patient.doctorProfile.experienceUnavailable')}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex" style={{ gap: '10px', marginBottom: '12px' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f5f8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fa-solid fa-thumbs-up" style={{ color: '#0E82FD' }}></i>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{recommendPercent}% {t('patient.doctorProfile.recommend')}</div>
                        <div className="text-muted" style={{ fontSize: 13 }}>
                          {reviewCount ? t('patient.doctorProfile.recommendationCount', { count: reviewCount }) : t('patient.doctorProfile.noRecommendations')}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex" style={{ gap: '10px', marginBottom: '18px' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f5f8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fa-solid fa-video" style={{ color: '#0E82FD' }}></i>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{t('patient.doctorProfile.onlineConsultations')}</div>
                        <div className="text-muted" style={{ fontSize: 13 }}>
                          {t('patient.doctorProfile.consultationDescription')}
                        </div>
                      </div>
                    </div>

                    <Link
                      to={vetUserId ? `/booking?vet=${vetUserId}` : '/booking'}
                      className="btn btn-primary w-100"
                      style={{ borderRadius: '10px', padding: '12px 16px', fontWeight: 600 }}
                    >
                      {t('patient.doctorProfile.bookAppointment')}
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="doc-profile-card-bottom"
              style={{ marginTop: '22px', paddingTop: '22px', borderTop: '1px solid #e0e0e0' }}
            >
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  gap: '16px',
                  flexWrap: 'wrap',
                  marginBottom: '18px',
                }}
              >
                <li
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '10px',
                    flex: '1',
                    minWidth: '200px',
                  }}
                >
                  <span
                    className="bg-blue"
                    style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <img src="/assets/img/icons/calendar3.svg" alt="" style={{ width: '20px', height: '20px' }} />
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>{reviewCount > 0 ? t('patient.doctorProfile.reviewSummary', { count: reviewCount }) : t('patient.doctorProfile.noReviewsSummary')}</span>
                </li>
                <li
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '10px',
                    flex: '1',
                    minWidth: '200px',
                  }}
                >
                  <span
                    className="bg-dark-blue"
                    style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <img src="/assets/img/icons/bullseye.svg" alt="" style={{ width: '20px', height: '20px' }} />
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>
                    {experienceYears > 0 ? t('patient.doctorProfile.practiceSummary', { count: experienceYears, unit: t(`patient.doctorProfile.${experienceYears === 1 ? 'year' : 'years'}`) }) : t('patient.doctorProfile.experienceUnavailableShort')}
                  </span>
                </li>
                <li
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '10px',
                    flex: '1',
                    minWidth: '200px',
                  }}
                >
                  <span
                    className="bg-green"
                    style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <img src="/assets/img/icons/bookmark-star.svg" alt="" style={{ width: '20px', height: '20px' }} />
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>{hasAwards ? t('patient.doctorProfile.awardsSummary', { count: profile.awards.length }) : t('patient.doctorProfile.noAwardsSummary')}</span>
                </li>
              </ul>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid #e0e0e0' }}>
                <p style={{ margin: 0, fontSize: '15px', color: '#666' }}>
                  <span style={{ fontWeight: '600', color: '#0d6efd' }}>
                    {t('patient.doctorProfile.price')} :
                    {profile?.consultationFees?.clinic && profile?.consultationFees?.online
                      ? ` €${profile.consultationFees.clinic} - €${profile.consultationFees.online}`
                      : profile?.consultationFees?.clinic
                      ? ` €${profile.consultationFees.clinic}`
                      : profile?.consultationFees?.online
                      ? ` €${profile.consultationFees.online}`
                      : ` ${t('patient.doctorProfile.contactPricing')}`}
                  </span>{' '}
                  {t('patient.doctorProfile.forSession')}
                </p>
                <div className="clinic-booking">
                  <Link
                    className="apt-btn"
                    to={vetUserId ? `/booking?vet=${vetUserId}` : '/booking'}
                    style={{ padding: '12px 32px', borderRadius: '10px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}
                  >
                    {t('patient.doctorProfile.bookAppointmentShort')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="doctors-detailed-info" style={{ padding: '0 15px' }}>
          <ul className="information-title-list">
            <li className={activeSection === 'doc_bio' ? 'active' : ''}>
              <a href="#doc_bio" onClick={(e) => { e.preventDefault(); setActiveSection('doc_bio') }}>{t('patient.doctorProfile.bio')}</a>
            </li>
            <li className={activeSection === 'experience' ? 'active' : ''}>
              <a href="#experience" onClick={(e) => { e.preventDefault(); setActiveSection('experience') }}>{t('patient.doctorProfile.experience')}</a>
            </li>
            <li className={activeSection === 'education' ? 'active' : ''}>
              <a href="#education" onClick={(e) => { e.preventDefault(); setActiveSection('education') }}>{t('patient.doctorProfile.education')}</a>
            </li>
            <li className={activeSection === 'awards' ? 'active' : ''}>
              <a href="#awards" onClick={(e) => { e.preventDefault(); setActiveSection('awards') }}>{t('patient.doctorProfile.awards')}</a>
            </li>
            <li className={activeSection === 'insurance' ? 'active' : ''}>
              <a href="#insurance" onClick={(e) => { e.preventDefault(); setActiveSection('insurance') }}>{t('patient.doctorProfile.insurances')}</a>
            </li>
            <li className={activeSection === 'services' ? 'active' : ''}>
              <a href="#services" onClick={(e) => { e.preventDefault(); setActiveSection('services') }}>{t('patient.doctorProfile.treatments')}</a>
            </li>
            <li className={activeSection === 'speciality' ? 'active' : ''}>
              <a href="#speciality" onClick={(e) => { e.preventDefault(); setActiveSection('speciality') }}>{t('patient.doctorProfile.speciality')}</a>
            </li>
            <li className={activeSection === 'availability' ? 'active' : ''}>
              <a href="#availability" onClick={(e) => { e.preventDefault(); setActiveSection('availability') }}>{t('patient.doctorProfile.availability')}</a>
            </li>
            <li className={activeSection === 'clinic' ? 'active' : ''}>
              <a href="#clinic" onClick={(e) => { e.preventDefault(); setActiveSection('clinic') }}>{t('patient.doctorProfile.clinics')}</a>
            </li>
            <li className={activeSection === 'membership' ? 'active' : ''}>
              <a href="#membership" onClick={(e) => { e.preventDefault(); setActiveSection('membership') }}>{t('patient.doctorProfile.memberships')}</a>
            </li>
            <li className={activeSection === 'bussiness_hour' ? 'active' : ''}>
              <a href="#bussiness_hour" onClick={(e) => { e.preventDefault(); setActiveSection('bussiness_hour') }}>{t('patient.doctorProfile.businessHours')}</a>
            </li>
            <li className={activeSection === 'review' ? 'active' : ''}>
              <a href="#review" onClick={(e) => { e.preventDefault(); setActiveSection('review') }}>{t('patient.doctorProfile.review')}</a>
            </li>
          </ul>

          <div className="doc-information-main" style={{ padding: '20px 0' }}>
            <div className={`doc-information-details bio-detail ${activeSection === 'doc_bio' ? '' : 'd-none'}`} id="doc_bio">
              <div className="detail-title"><h4>{t('patient.doctorProfile.bio')}</h4></div>
              <p>{hasBiography ? profile.biography : t('patient.doctorProfile.noBiography')}</p>
            </div>

            <div className={`doc-information-details ${activeSection === 'experience' ? '' : 'd-none'}`} id="experience">
              <div className="detail-title"><h4>{t('patient.doctorProfile.experience')}</h4></div>
              {hasExperience ? (
                <div className="experience-list">
                  {profile.experience.map((exp, index) => (
                    <div key={index} className="experience-item mb-3">
                      <h5>{exp.hospital || t('patient.doctorProfile.hospitalUnavailable')}</h5>
                      {exp.designation && <p className="text-muted mb-1">{exp.designation}</p>}
                      <p className="text-muted">
                        {exp.fromYear && exp.toYear
                          ? `${exp.fromYear} - ${exp.toYear}`
                          : exp.fromYear
                          ? t('patient.doctorProfile.since', { year: exp.fromYear })
                          : t('patient.doctorProfile.datesUnavailable')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">{t('patient.doctorProfile.unavailableExperience')}</p>
              )}
            </div>

            <div className={`doc-information-details ${activeSection === 'education' ? '' : 'd-none'}`} id="education">
              <div className="detail-title"><h4>{t('patient.doctorProfile.education')}</h4></div>
              {hasEducation ? (
                <div className="education-list">
                  {profile.education.map((edu, index) => (
                    <div key={index} className="education-item mb-3">
                      <h5>{edu.degree || t('patient.doctorProfile.degreeUnavailable')}</h5>
                      {edu.college && <p className="text-muted mb-1">{edu.college}</p>}
                      {edu.year && <p className="text-muted">{edu.year}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">{t('patient.doctorProfile.unavailableEducation')}</p>
              )}
            </div>

            <div className={`doc-information-details ${activeSection === 'awards' ? '' : 'd-none'}`} id="awards">
              <div className="detail-title"><h4>{t('patient.doctorProfile.awards')}</h4></div>
              {hasAwards ? (
                <div className="awards-list">
                  {profile.awards.map((award, index) => (
                    <div key={index} className="award-item mb-2">
                      <h5>{award.title || t('patient.doctorProfile.awardTitleUnavailable')}</h5>
                      {award.year && <p className="text-muted">{award.year}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">{t('patient.doctorProfile.unavailableAwards')}</p>
              )}
            </div>

            <div className={`doc-information-details ${activeSection === 'insurance' ? '' : 'd-none'}`} id="insurance">
              <div className="detail-title"><h4>{t('patient.doctorProfile.insurances')}</h4></div>
              {hasInsurance ? (
                <div className="row">
                  {insuranceCompanies.map((ins) => {
                    const id = ins?._id || ins?.id || ins
                    const name = typeof ins === 'object' && ins !== null ? (ins.name || t('patient.doctorProfile.insuranceName')) : t('patient.doctorProfile.insuranceName')
                    const logoUrl = typeof ins === 'object' && ins !== null ? getImageUrl(ins.logo) : null
                    return (
                      <div key={String(id)} className="col-6 col-md-4 col-lg-3 mb-3">
                        <div className="card" style={{ borderRadius: 12, border: '1px solid #eef1f6' }}>
                          <div className="card-body text-center" style={{ padding: 14 }}>
                            {logoUrl ? (
                              <img
                                src={logoUrl}
                                alt={name}
                                style={{ maxWidth: '100%', maxHeight: 60, objectFit: 'contain' }}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  const next = e.currentTarget.nextSibling
                                  if (next?.style) next.style.display = 'flex'
                                }}
                              />
                            ) : null}
                            <div
                              style={{
                                display: logoUrl ? 'none' : 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: 60,
                                background: '#f8f9fa',
                                borderRadius: 8,
                                marginBottom: 10,
                              }}
                            >
                              <i className="fa-solid fa-shield-halved text-muted" style={{ fontSize: 22 }}></i>
                            </div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{name}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-muted">{t('patient.doctorProfile.unavailableInsurance')}</p>
              )}
            </div>

            <div className={`doc-information-details ${activeSection === 'services' ? '' : 'd-none'}`} id="services">
              <div className="detail-title"><h4>{t('patient.doctorProfile.servicesPrice')}</h4></div>
              {hasServices ? (
                <div className="services-list">
                  <ul className="list-unstyled">
                    {profile.services.map((service, index) => (
                      <li key={index} className="mb-2">
                        <i className="fas fa-check-circle text-primary me-2"></i>
                        <strong>{service.name || t('patient.doctorProfile.serviceName')}</strong>
                        {service.price != null && <span className="text-muted ms-2">- €{service.price}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-muted">{t('patient.doctorProfile.noServices')}</p>
              )}
            </div>

            <div className={`doc-information-details ${activeSection === 'speciality' ? '' : 'd-none'}`} id="speciality">
              <div className="detail-title"><h4>{t('patient.doctorProfile.speciality')}</h4></div>
              {hasSpeciality ? (
                <div>
                  <ul className="list-unstyled mb-0">
                    {profile.specializations.map((s, idx) => (
                      <li key={idx} className="mb-2">{typeof s === 'object' ? (s.name || s.type) : s}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-muted">{t('patient.doctorProfile.unavailableSpecialty')}</p>
              )}
            </div>

            <div className={`doc-information-details ${activeSection === 'availability' ? '' : 'd-none'}`} id="availability">
              <div className="detail-title"><h4>{t('patient.doctorProfile.availability')}</h4></div>
              <p className="text-muted">{t('patient.doctorProfile.unavailableAvailability')}</p>
            </div>

            <div className={`doc-information-details ${activeSection === 'clinic' ? '' : 'd-none'}`} id="clinic">
              <div className="detail-title"><h4>{t('patient.doctorProfile.clinics')}</h4></div>
              {hasClinics ? (
                <div className="clinics-list">
                  {profile.clinics.map((clinic, index) => (
                    <div key={index} className="clinic-item mb-4 p-3 border rounded">
                      <h5>{clinic.name || t('patient.doctorProfile.clinicNameUnavailable')}</h5>
                      {(clinic.address || clinic.city || clinic.state || clinic.country) && (
                        <p className="mb-1">
                          <i className="fas fa-map-marker-alt text-primary me-2"></i>
                          {[clinic.address, clinic.city, clinic.state, clinic.country].filter(Boolean).join(', ') || '—'}
                        </p>
                      )}
                      {clinic.phone && (
                        <p className="mb-1">
                          <i className="fas fa-phone text-primary me-2"></i>
                          <a href={`tel:${clinic.phone}`}>{clinic.phone}</a>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">{t('patient.doctorProfile.unavailableClinics')}</p>
              )}
            </div>

            <div className={`doc-information-details ${activeSection === 'membership' ? '' : 'd-none'}`} id="membership">
              <div className="detail-title"><h4>{t('patient.doctorProfile.memberships')}</h4></div>
              {hasMemberships ? (
                <div className="memberships-list">
                  <ul className="list-unstyled">
                    {profile.memberships.map((m, index) => (
                      <li key={index} className="mb-2">
                        <i className="fas fa-certificate text-primary me-2"></i>
                        {m.name || t('patient.doctorProfile.membershipNameUnavailable')}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-muted">{t('patient.doctorProfile.unavailableMemberships')}</p>
              )}
            </div>

            <div className={`doc-information-details ${activeSection === 'bussiness_hour' ? '' : 'd-none'}`} id="bussiness_hour">
              <div className="detail-title"><h4>{t('patient.doctorProfile.businessHours')}</h4></div>
              <p className="text-muted">{t('patient.doctorProfile.unavailableHours')}</p>
            </div>

            <div className={`doc-information-details ${activeSection === 'review' ? '' : 'd-none'}`} id="review">
              <div className="detail-title"><h4>{t('patient.doctorProfile.review')}</h4></div>
              {reviews.length === 0 ? (
                <p className="text-muted">{t('patient.doctorProfile.noReviews')}</p>
              ) : (
                <div>
                  {reviews.map((r) => {
                    const reviewer = r?.petOwnerId
                    const reviewerName = reviewer?.fullName || reviewer?.name || t('patient.doctorProfile.petOwner')
                    const reviewerImage = getImageUrl(reviewer?.profileImage) || '/assets/img/doctors-dashboard/profile-06.jpg'
                    return (
                      <div key={r._id} className="card mb-3">
                        <div className="card-body">
                          <div className="d-flex">
                            <div style={{ width: 48, height: 48, marginRight: 12 }}>
                              <img src={reviewerImage} alt={reviewerName} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div className="d-flex justify-content-between">
                                <h6 className="mb-1">{reviewerName}</h6>
                                <div className="rating">
                                  <i className={`fas fa-star ${Number(r.rating) >= 1 ? 'filled' : ''}`}></i>
                                  <i className={`fas fa-star ${Number(r.rating) >= 2 ? 'filled' : ''}`}></i>
                                  <i className={`fas fa-star ${Number(r.rating) >= 3 ? 'filled' : ''}`}></i>
                                  <i className={`fas fa-star ${Number(r.rating) >= 4 ? 'filled' : ''}`}></i>
                                  <i className={`fas fa-star ${Number(r.rating) >= 5 ? 'filled' : ''}`}></i>
                                </div>
                              </div>
                              {r.reviewText && <p className="mb-0">{r.reviewText}</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorProfile

