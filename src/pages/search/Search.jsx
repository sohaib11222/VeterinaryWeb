import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../../contexts/AuthContext'
import { useVeterinarians } from '../../queries/veterinarianQueries'
import { usePetSitters } from '../../queries/petSitterQueries'
import { useSpecializations } from '../../queries/specializationQueries'
import { useFavorites } from '../../queries/favoriteQueries'
import { useAddFavorite, useRemoveFavorite } from '../../mutations/favoriteMutations'
import { getImageUrl } from '../../utils/apiConfig'
import { toSpecializationOption } from '../../utils/specialization'
import Breadcrumb from '../../components/common/Breadcrumb'
import { useLanguage } from '../../contexts/LanguageContext'

const PROVIDERS = { VETERINARIANS: 'veterinarians', PET_SITTERS: 'petSitters' }

const isPetSitterSearch = (value) => {
  const normalized = String(value || '').trim().toLowerCase().replace(/[._-]+/g, ' ')
  return /\bpet\s*sitters?\b/.test(normalized) || normalized === 'petsitter' || normalized === 'petsitters'
}

const unwrap = (response) => response?.data ?? response ?? {}

const label = (value) => String(value || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())

const Search = () => {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [urlSearchParams, setUrlSearchParams] = useSearchParams()
  const [providerType, setProviderType] = useState(PROVIDERS.VETERINARIANS)
  const [searchTerm, setSearchTerm] = useState('')
  const [location, setLocation] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [province, setProvince] = useState('')
  const [region, setRegion] = useState('')
  const [selectedSpecialization, setSelectedSpecialization] = useState('')
  const [showAvailability, setShowAvailability] = useState(false)
  const [page, setPage] = useState(1)
  const limit = 12
  const [favoriteOverrides, setFavoriteOverrides] = useState({})
  const [favoriteIdOverrides, setFavoriteIdOverrides] = useState({})

  const urlSearch = urlSearchParams.get('search') || ''
  const urlLocation = urlSearchParams.get('location') || urlSearchParams.get('city') || ''
  const urlPostalCode = urlSearchParams.get('postalCode') || urlSearchParams.get('zip') || ''
  const urlProvince = urlSearchParams.get('province') || ''
  const urlRegion = urlSearchParams.get('region') || ''
  const urlSpecialization = urlSearchParams.get('specialization') || ''
  const urlAvailability = urlSearchParams.get('isAvailableOnline') === 'true'
  const urlPage = Number(urlSearchParams.get('page') || 1) || 1
  const requestedType = urlSearchParams.get('type') || urlSearchParams.get('provider') || ''
  const urlType = /^(pet[-_ ]?sitter|pet[-_ ]?sitters|sitter)s?$/i.test(requestedType) || isPetSitterSearch(urlSearch)
    ? PROVIDERS.PET_SITTERS
    : PROVIDERS.VETERINARIANS

  const queryParams = useMemo(() => {
    const params = { page, limit }
    if (searchTerm.trim()) params.search = searchTerm.trim()
    if (location.trim()) params.location = location.trim()
    if (postalCode.trim()) params.postalCode = postalCode.trim()
    if (province.trim()) params.province = province.trim()
    if (region.trim()) params.region = region.trim()
    if (providerType === PROVIDERS.VETERINARIANS) {
      if (selectedSpecialization) params.specialization = selectedSpecialization
      if (showAvailability) params.isAvailableOnline = true
    }
    return params
  }, [page, limit, searchTerm, location, postalCode, province, region, providerType, selectedSpecialization, showAvailability])

  const userId = user?.id || user?._id
  const vetQuery = useVeterinarians(queryParams, { enabled: providerType === PROVIDERS.VETERINARIANS })
  const sitterQuery = usePetSitters(queryParams, { enabled: providerType === PROVIDERS.PET_SITTERS })
  const { data: specsData } = useSpecializations({ enabled: providerType === PROVIDERS.VETERINARIANS })
  const { data: favoritesData } = useFavorites(userId, { limit: 500 })
  const addFavorite = useAddFavorite()
  const removeFavorite = useRemoveFavorite()
  const activeQuery = providerType === PROVIDERS.VETERINARIANS ? vetQuery : sitterQuery
  const { isLoading, error } = activeQuery

  useEffect(() => {
    setProviderType(urlType)
    setSearchTerm(urlType === PROVIDERS.PET_SITTERS && isPetSitterSearch(urlSearch) ? '' : urlSearch)
    setLocation(urlLocation)
    setPostalCode(urlPostalCode)
    setProvince(urlProvince)
    setRegion(urlRegion)
    setSelectedSpecialization(urlSpecialization)
    setShowAvailability(urlAvailability)
    setPage(urlPage)
  }, [urlType, urlSearch, urlLocation, urlPostalCode, urlProvince, urlRegion, urlSpecialization, urlAvailability, urlPage])

  useEffect(() => {
    setFavoriteOverrides({})
    setFavoriteIdOverrides({})
  }, [favoritesData])

  const veterinarians = useMemo(() => unwrap(vetQuery.data).veterinarians || [], [vetQuery.data])
  const petSitters = useMemo(() => unwrap(sitterQuery.data).petSitters || [], [sitterQuery.data])
  const results = providerType === PROVIDERS.VETERINARIANS ? veterinarians : petSitters
  const pagination = useMemo(() => unwrap(activeQuery.data).pagination || { page, limit, total: 0, pages: 0 }, [activeQuery.data, page, limit])
  const specializationsList = useMemo(() => {
    const raw = specsData?.data?.data ?? specsData?.data ?? specsData
    return Array.isArray(raw) ? raw : []
  }, [specsData])
  const specializationOptions = useMemo(() => {
    const seen = new Set()
    return specializationsList.map(toSpecializationOption).filter((option) => option && !seen.has(option.code) && seen.add(option.code))
  }, [specializationsList])
  const specializationNameByCode = useMemo(() => Object.fromEntries(specializationOptions.map((option) => [String(option.code), option.name])), [specializationOptions])
  const favoriteVetIds = useMemo(() => {
    const list = favoritesData?.data?.favorites || []
    return new Set(list.map((favorite) => {
      const value = favorite.veterinarianId
      return value && (typeof value === 'object' ? value._id : value)
    }).filter(Boolean).map(String))
  }, [favoritesData])
  const favoriteIdByVetId = useMemo(() => {
    const list = favoritesData?.data?.favorites || []
    return Object.fromEntries(list.map((favorite) => {
      const value = favorite.veterinarianId
      const id = value && (typeof value === 'object' ? value._id : value)
      return id && favorite._id ? [String(id), favorite._id] : []
    }).filter((entry) => entry.length))
  }, [favoritesData])

  const handleFavoriteToggle = (event, vetUserId) => {
    event.preventDefault()
    if (!user || user.role !== 'PET_OWNER') return toast.info(t('patient.search.loginFavourite'))
    const id = String(vetUserId)
    const currentlyFavorite = favoriteOverrides[id] !== undefined ? favoriteOverrides[id] : favoriteVetIds.has(id)
    if (currentlyFavorite) {
      const favoriteId = favoriteIdOverrides[id] || favoriteIdByVetId[id]
      if (!favoriteId) return toast.error(t('patient.search.favoriteMissing'))
      setFavoriteOverrides((previous) => ({ ...previous, [id]: false }))
      removeFavorite.mutate(favoriteId, {
        onSuccess: () => toast.success(t('patient.search.favoriteRemoved')),
        onError: (errorValue) => { setFavoriteOverrides((previous) => ({ ...previous, [id]: true })); toast.error(errorValue?.message || t('patient.search.favoriteRemoveFailed')) },
      })
      return
    }
    setFavoriteOverrides((previous) => ({ ...previous, [id]: true }))
    addFavorite.mutate(vetUserId, {
      onSuccess: (response) => { const favoriteId = response?.data?.data?._id; if (favoriteId) setFavoriteIdOverrides((previous) => ({ ...previous, [id]: favoriteId })); toast.success(t('patient.search.favoriteAdded')) },
      onError: (errorValue) => { setFavoriteOverrides((previous) => ({ ...previous, [id]: false })); toast.error(errorValue?.message || t('patient.search.favoriteAddFailed')) },
    })
  }

  const getVetName = (vet) => vet?.userId?.fullName || vet?.userId?.name || t('patient.search.veterinarian')
  const getVetImage = (vet) => getImageUrl(vet?.userId?.profileImage) || '/assets/img/doctors/doctor-01.jpg'
  const getSpecialty = (vet) => {
    const first = Array.isArray(vet?.specializations) ? vet.specializations[0] : null
    if (!first) return t('patient.search.veterinary')
    if (typeof first === 'object') return specializationNameByCode[String(first.type || first.name)] || first.name || t('patient.search.veterinary')
    return specializationNameByCode[String(first)] || first
  }
  const getVetLocation = (vet) => {
    const clinic = Array.isArray(vet?.clinics) ? vet.clinics[0] : null
    return [clinic?.city, clinic?.state, clinic?.country].filter(Boolean).join(', ') || '—'
  }
  const getClinicImages = (vet) => {
    const images = Array.isArray(vet?.clinics) ? vet.clinics[0]?.images : []
    return Array.isArray(images) ? images.slice(0, 4).map((image) => getImageUrl(image) || image) : []
  }
  const getSitterLocation = (sitter) => [sitter?.address?.city, sitter?.address?.state, sitter?.address?.country, sitter?.address?.zip].filter(Boolean).join(', ')
  const getRating = (vet) => vet?.ratingAvg ?? 0
  const renderStars = (rating) => Array.from({ length: 5 }, (_, index) => <i key={index} className={`fas fa-star ${index + 1 <= Number(rating || 0) ? 'filled' : ''}`} />)

  const updateUrl = (nextType = providerType) => {
    const params = new URLSearchParams()
    params.set('type', nextType)
    if (searchTerm.trim() && !isPetSitterSearch(searchTerm)) params.set('search', searchTerm.trim())
    if (location.trim()) params.set('location', location.trim())
    if (postalCode.trim()) params.set('postalCode', postalCode.trim())
    if (province.trim()) params.set('province', province.trim())
    if (region.trim()) params.set('region', region.trim())
    if (selectedSpecialization && nextType === PROVIDERS.VETERINARIANS) params.set('specialization', selectedSpecialization)
    if (showAvailability && nextType === PROVIDERS.VETERINARIANS) params.set('isAvailableOnline', 'true')
    params.set('page', '1')
    setUrlSearchParams(params)
  }
  const handleSearch = (event) => { event?.preventDefault?.(); const nextType = isPetSitterSearch(searchTerm) ? PROVIDERS.PET_SITTERS : providerType; setProviderType(nextType); updateUrl(nextType) }
  const handleProviderChange = (nextType) => { if (nextType === providerType) return; setProviderType(nextType); updateUrl(nextType) }
  const clearFilters = () => { setSearchTerm(''); setLocation(''); setPostalCode(''); setProvince(''); setRegion(''); setSelectedSpecialization(''); setShowAvailability(false); setProviderType(PROVIDERS.VETERINARIANS); setUrlSearchParams({ type: PROVIDERS.VETERINARIANS, page: '1' }) }

  return (
    <>
      <Breadcrumb title={t('patient.search.breadcrumb')} li2={t('patient.search.breadcrumb')} />
      <section className="search-page-header"><div className="container">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3"><h2 className="mb-0">{t('patient.search.heading')}</h2></div>
          <div className="btn-group mb-3" role="tablist" aria-label={t('common.searchProviders.providerType')}>
          <button type="button" role="tab" aria-selected={providerType === PROVIDERS.VETERINARIANS} className={`btn ${providerType === PROVIDERS.VETERINARIANS ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => handleProviderChange(PROVIDERS.VETERINARIANS)}>{t('common.searchProviders.veterinarians')}</button>
          <button type="button" role="tab" aria-selected={providerType === PROVIDERS.PET_SITTERS} className={`btn ${providerType === PROVIDERS.PET_SITTERS ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => handleProviderChange(PROVIDERS.PET_SITTERS)}>{t('common.searchProviders.petSitters')}</button>
        </div>
        <div className="doctors-search-box doctors-search-box-clean"><div className="search-box-one"><form onSubmit={handleSearch}>
          <div className="search-input search-line"><i className="isax isax-hospital5 bficon"></i><div className="mb-0"><input type="text" className="form-control" placeholder={t('patient.search.searchName')} value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></div></div>
          <div className="search-input search-map-line"><i className="isax isax-location5"></i><div className="mb-0"><input type="text" className="form-control" placeholder={t('common.searchProviders.cityOrLocation')} value={location} onChange={(event) => setLocation(event.target.value)} /></div></div>
          <div className="form-search-btn"><button className="btn btn-primary d-inline-flex align-items-center rounded-pill" type="submit"><i className="isax isax-search-normal-15 me-2"></i>{t('patient.search.search')}</button></div>
        </form></div></div>
      </div></section>

      <div className="content search-page-content"><div className="container"><div className="row">
        <div className="col-xl-3"><div className="card filter-lists"><div className="card-header"><div className="d-flex align-items-center filter-head justify-content-between"><h4>{t('patient.search.filters')}</h4><button type="button" className="btn btn-link p-0 text-secondary text-decoration-underline" onClick={clearFilters}>{t('patient.search.clearAll')}</button></div></div><div className="card-body p-0">
          <div className="accordion-item border-bottom"><div className="accordion-header"><div className="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#collapseLocation" type="button"><div className="d-flex align-items-center w-100"><h5>{t('common.searchProviders.locationFilters')}</h5><div className="ms-auto"><span><i className="fas fa-chevron-down"></i></span></div></div></div></div><div id="collapseLocation" className="accordion-collapse collapse show"><div className="accordion-body pt-3">
            <label className="form-label">{t('common.searchProviders.province')}</label><input className="form-control mb-2" value={province} placeholder={t('common.searchProviders.provincePlaceholder')} onChange={(event) => setProvince(event.target.value)} />
            <label className="form-label">{t('common.searchProviders.region')}</label><input className="form-control" value={region} placeholder={t('common.searchProviders.regionPlaceholder')} onChange={(event) => setRegion(event.target.value)} />
          </div></div></div>
          {providerType === PROVIDERS.VETERINARIANS && <><div className="accordion-item border-bottom"><div className="accordion-header"><div className="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#collapseSpec" type="button"><div className="d-flex align-items-center w-100"><h5>{t('patient.search.specializations')}</h5><div className="ms-auto"><span><i className="fas fa-chevron-down"></i></span></div></div></div></div><div id="collapseSpec" className="accordion-collapse collapse show"><div className="accordion-body pt-3"><select className="form-select form-control" value={selectedSpecialization} onChange={(event) => { setSelectedSpecialization(event.target.value); setPage(1) }}><option value="">{t('patient.search.allSpecializations')}</option>{specializationOptions.map((option) => <option key={option.code} value={option.code}>{option.name}</option>)}</select></div></div></div><div className="accordion-item border-bottom"><div className="accordion-header"><div className="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#collapseAvail" type="button"><div className="d-flex align-items-center w-100"><h5>{t('patient.search.availability')}</h5><div className="ms-auto"><span><i className="fas fa-chevron-down"></i></span></div></div></div></div><div id="collapseAvail" className="accordion-collapse collapse show"><div className="accordion-body pt-3"><div className="d-flex align-items-center justify-content-between"><span>{t('patient.search.onlineNow')}</span><div className="status-toggle status-tog"><input type="checkbox" id="status_online" className="check" checked={showAvailability} onChange={(event) => { setShowAvailability(event.target.checked); setPage(1) }} /><label htmlFor="status_online" className="checktoggle">{t('patient.search.onlineNow')}</label></div></div></div></div></div></>}
        </div></div></div>

        <div className="col-xl-9"><div className="row align-items-center"><div className="col-md-6"><div className="mb-4"><h3>{t('common.searchProviders.showing', { count: pagination.total, provider: providerType === PROVIDERS.PET_SITTERS ? t('common.searchProviders.petSitters').toLowerCase() : t('common.searchProviders.veterinarians').toLowerCase() })}</h3></div></div><div className="col-md-6"><div className="d-flex align-items-center justify-content-end mb-4"><Link to={`/search?type=${providerType}`} className="btn btn-sm head-icon active me-2" title={t('patient.search.listView')}><i className="isax isax-row-vertical"></i></Link></div></div></div>
          {error && <div className="alert alert-danger">{error?.message || t('patient.search.loadFailed')}</div>}
          {isLoading && <div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">{t('common.loading', 'Loading…')}</span></div></div>}
          {!isLoading && !error && results.length === 0 && <div className="text-center py-5 text-muted">{t('common.searchProviders.noResults', { provider: providerType === PROVIDERS.PET_SITTERS ? t('common.searchProviders.petSitters').toLowerCase() : t('common.searchProviders.veterinarians').toLowerCase() })}</div>}
          {!isLoading && !error && providerType === PROVIDERS.VETERINARIANS && veterinarians.length > 0 && <div className="row">{veterinarians.map((vet) => { const vetUserId = vet?.userId?._id; const id = vetUserId ? String(vetUserId) : ''; const isFavorite = !!vetUserId && (favoriteOverrides[id] !== undefined ? favoriteOverrides[id] : favoriteVetIds.has(id)); const profileLink = vetUserId ? `/doctor-profile/${vetUserId}` : '/doctor-profile'; const clinicImages = getClinicImages(vet); return <div key={vetUserId || vet._id} className="col-md-12 mb-3"><div className="card"><div className="card-body"><div className="doctor-widget"><div className="doc-info-left"><div className="doctor-img position-relative"><Link to={profileLink}><img src={getVetImage(vet)} className="img-fluid" alt={getVetName(vet)} /></Link></div><div className="doc-info-cont"><h4 className="doc-name"><Link to={profileLink}>{getVetName(vet)}</Link></h4><p className="doc-speciality">{getSpecialty(vet)}</p><div className="rating">{renderStars(getRating(vet))}<span className="d-inline-block average-rating">{vet?.ratingCount ?? 0}</span></div><p className="doc-location"><i className="fas fa-map-marker-alt"></i> {getVetLocation(vet)}</p>{clinicImages.length > 0 && <ul className="clinic-gallery">{clinicImages.slice(0, 3).map((image, index) => <li key={index}><span><img src={image} alt="" /></span></li>)}{clinicImages.length > 3 && <li><span>+{clinicImages.length - 3}</span></li>}</ul>}</div></div><div className="doc-info-right"><div className="d-flex justify-content-end mb-2"><button type="button" className={`fav-icon border-0 bg-transparent ${isFavorite ? 'favorited' : ''}`} onClick={(event) => handleFavoriteToggle(event, vetUserId)} aria-label={isFavorite ? t('patient.favourites.remove') : t('patient.favourites.find')}><i className={`fa ${isFavorite ? 'fa-solid' : 'fa-regular'} fa-heart`}></i></button></div><div className="clini-infos"><ul><li><i className="fas fa-map-marker-alt"></i> {getVetLocation(vet)}</li><li><i className="far fa-clock"></i> {vet?.isAvailableOnline !== false ? t('patient.search.available') : t('patient.search.unavailable')}</li><li><i className="fas fa-euro-sign"></i> €{vet?.consultationFees?.online ?? vet?.consultationFees?.clinic ?? 0} {t('patient.search.consultation')}</li></ul></div><div className="clinic-booking"><Link className="view-pro-btn" to={profileLink}>{t('patient.search.viewProfile')}</Link><Link className="btn btn-primary" to={vetUserId ? `/booking?vet=${vetUserId}` : '/booking'}>{t('patient.search.bookAppointment')}</Link></div></div></div></div></div></div> })}</div>}
          {!isLoading && !error && providerType === PROVIDERS.PET_SITTERS && petSitters.length > 0 && <div className="row">{petSitters.map((sitter) => { const profile = sitter?.profile || {}; const sitterId = sitter?.id || sitter?._id; const sitterLocation = getSitterLocation(sitter); return <div className="col-md-6 mb-3" key={sitterId}><div className="card h-100 shadow-sm"><img src={getImageUrl(sitter?.profileImage) || '/assets/img/doctors-dashboard/doctor-profile-img.jpg'} className="card-img-top" style={{ height: 210, objectFit: 'cover' }} alt={sitter?.name || t('common.searchProviders.petSitter')} /><div className="card-body d-flex flex-column"><h4>{sitter?.name || t('common.searchProviders.petSitter')}</h4><p className="text-muted mb-2"><i className="fa-solid fa-location-dot me-2"></i>{sitterLocation || t('common.searchProviders.locationUnavailable')}</p><p className="small text-muted">{t('common.searchProviders.yearsExperience', { count: profile.experienceYears || 0 })} · {profile.isAvailable ? t('patient.search.available') : t('patient.search.unavailable')}</p><div className="d-flex flex-wrap gap-1 mb-3">{(profile.petTypes || []).slice(0, 4).map((item) => <span className="badge bg-light text-dark" key={item}>{label(item)}</span>)}</div><Link className="btn btn-primary mt-auto" to={`/pet-sitters/${sitterId}`}>{t('patient.search.viewProfile')}</Link></div></div></div> })}</div>}
          {!isLoading && !error && pagination.pages > 1 && <div className="col-md-12 mt-4 text-center"><button type="button" className="btn btn-outline-primary me-2" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>{t('patient.previous')}</button><span className="mx-3">{t('patient.pageOf', { page: pagination.page, pages: pagination.pages })}</span><button type="button" className="btn btn-outline-primary" disabled={page >= pagination.pages} onClick={() => setPage((current) => current + 1)}>{t('patient.next')}</button></div>}
        </div>
      </div></div></div>
    </>
  )
}

export default Search
