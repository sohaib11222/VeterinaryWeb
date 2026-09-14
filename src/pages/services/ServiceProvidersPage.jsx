import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Breadcrumb from '../../components/common/Breadcrumb'
import { useLanguage } from '../../contexts/LanguageContext'
import { usePlatformServices, useServiceProviders } from '../../queries/platformServiceQueries'
import { getImageUrl } from '../../utils/apiConfig'

const unwrap = (response) => response?.data ?? response ?? {}
const roleLabel = (role, language) => ({
  VETERINARIAN: language === 'it' ? 'Veterinario' : 'Veterinarian',
  PET_SITTER: 'Pet sitter',
  PET_STORE: language === 'it' ? 'Farmacia' : 'Pharmacy',
  PARAPHARMACY: language === 'it' ? 'Parafarmacia' : 'Parapharmacy',
}[role] || role)

const ServiceProvidersPage = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { language } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState({ search: '', city: '', postalCode: '', province: '', role: '' })
  const [page, setPage] = useState(1)
  const servicesQuery = usePlatformServices()
  const serviceQuery = useServiceProviders(slug, { ...filters, page, limit: 12 })
  const payload = unwrap(serviceQuery.data)
  const service = payload.service
  const providers = Array.isArray(payload.providers) ? payload.providers : []
  const pagination = payload.pagination || { page, pages: 0, total: 0 }
  const services = useMemo(() => {
    const value = unwrap(servicesQuery.data)
    return Array.isArray(value) ? value : []
  }, [servicesQuery.data])

  useEffect(() => {
    setFilters({
      search: searchParams.get('search') || '',
      city: searchParams.get('city') || '',
      postalCode: searchParams.get('postalCode') || '',
      province: searchParams.get('province') || '',
      role: searchParams.get('role') || '',
    })
    setPage(Number(searchParams.get('page') || 1) || 1)
  }, [slug, searchParams])

  const update = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }))
    setPage(1)
  }
  const toQuery = (next = filters, nextPage = page) => {
    const params = new URLSearchParams()
    Object.entries(next).forEach(([key, value]) => { if (String(value || '').trim()) params.set(key, String(value).trim()) })
    if (nextPage > 1) params.set('page', String(nextPage))
    return params
  }
  const submitSearch = (event) => {
    event.preventDefault()
    setPage(1)
    setSearchParams(toQuery(filters, 1))
  }
  const clearFilters = () => {
    const empty = { search: '', city: '', postalCode: '', province: '', role: '' }
    setFilters(empty)
    setPage(1)
    setSearchParams({})
  }
  const changeService = (nextSlug) => {
    if (!nextSlug || nextSlug === slug) return
    navigate({ pathname: `/services/${nextSlug}`, search: toQuery(filters, 1).toString() })
  }
  const profileLink = (provider) => provider.role === 'VETERINARIAN'
    ? `/doctor-profile/${provider.id}`
    : provider.role === 'PET_SITTER'
      ? `/pet-sitters/${provider.id}`
      : `/pharmacy-details?id=${provider.storeId}`
  const action = (provider) => provider.role === 'VETERINARIAN'
    ? (language === 'it' ? 'Vedi profilo' : 'View profile')
    : provider.role === 'PET_SITTER'
      ? (language === 'it' ? 'Contatta' : 'Contact')
      : (language === 'it' ? 'Visita negozio' : 'View store')
  const serviceName = service ? (language === 'it' ? service.nameIt : service.name) : (language === 'it' ? 'Servizi' : 'Services')

  return <>
    <Breadcrumb title={serviceName} li2={serviceName} />
    <section className="search-page-header platform-service-search-header"><div className="container">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div><span className="platform-services-page__eyebrow">{language === 'it' ? 'Fornitori di servizi' : 'Service providers'}</span><h2 className="mb-0">{serviceName}</h2></div>
        <Link className="btn btn-outline-primary" to="/services"><i className="fa-solid fa-grid-2 me-2" />{language === 'it' ? 'Tutti i servizi' : 'All services'}</Link>
      </div>
      <div className="doctors-search-box doctors-search-box-clean"><div className="search-box-one"><form onSubmit={submitSearch}>
        <div className="search-input search-line"><i className="isax isax-search-normal-15 bficon" /><div className="mb-0"><input className="form-control" value={filters.search} placeholder={language === 'it' ? 'Cerca fornitore o attività' : 'Search provider or business'} onChange={(event) => update('search', event.target.value)} /></div></div>
        <div className="search-input search-map-line"><i className="isax isax-location5" /><div className="mb-0"><input className="form-control" value={filters.city} placeholder={language === 'it' ? 'Città' : 'City'} onChange={(event) => update('city', event.target.value)} /></div></div>
        <div className="search-input search-map-line"><i className="isax isax-location5" /><div className="mb-0"><input className="form-control" value={filters.postalCode} placeholder={language === 'it' ? 'CAP' : 'Postal code'} onChange={(event) => update('postalCode', event.target.value)} /></div></div>
        <div className="form-search-btn"><button className="btn btn-primary d-inline-flex align-items-center rounded-pill" type="submit"><i className="isax isax-search-normal-15 me-2" />{language === 'it' ? 'Cerca' : 'Search'}</button></div>
      </form></div></div>
    </div></section>

    <div className="content search-page-content"><div className="container"><div className="row">
      <aside className="col-xl-3"><div className="card filter-lists"><div className="card-header"><div className="d-flex align-items-center filter-head justify-content-between"><h4>{language === 'it' ? 'Filtri' : 'Filters'}</h4><button type="button" className="btn btn-link p-0 text-secondary text-decoration-underline" onClick={clearFilters}>{language === 'it' ? 'Cancella tutto' : 'Clear all'}</button></div></div><div className="card-body p-0">
        <div className="accordion-item border-bottom"><div className="accordion-header"><div className="accordion-button" type="button"><div className="d-flex align-items-center w-100"><h5>{language === 'it' ? 'Servizi' : 'Services'}</h5></div></div></div><div className="accordion-body pt-3"><select className="form-select form-control" value={slug} onChange={(event) => changeService(event.target.value)}><option value="">{language === 'it' ? 'Seleziona un servizio' : 'Select a service'}</option>{services.map((item) => <option value={item.slug} key={item._id}>{language === 'it' ? item.nameIt : item.name}</option>)}</select></div></div>
        <div className="accordion-item border-bottom"><div className="accordion-header"><div className="accordion-button" type="button"><div className="d-flex align-items-center w-100"><h5>{language === 'it' ? 'Tipo di fornitore' : 'Provider type'}</h5></div></div></div><div className="accordion-body pt-3"><select className="form-select form-control" value={filters.role} onChange={(event) => update('role', event.target.value)}><option value="">{language === 'it' ? 'Tutti i fornitori' : 'All providers'}</option>{['VETERINARIAN', 'PET_SITTER', 'PET_STORE', 'PARAPHARMACY'].map((role) => <option value={role} key={role}>{roleLabel(role, language)}</option>)}</select></div></div>
        <div className="accordion-item border-bottom"><div className="accordion-header"><div className="accordion-button" type="button"><div className="d-flex align-items-center w-100"><h5>{language === 'it' ? 'Posizione' : 'Location'}</h5></div></div></div><div className="accordion-body pt-3"><label className="form-label">{language === 'it' ? 'Provincia' : 'Province'}</label><input className="form-control" value={filters.province} placeholder={language === 'it' ? 'Cerca per provincia' : 'Search by province'} onChange={(event) => update('province', event.target.value)} /></div></div>
      </div></div></aside>
      <main className="col-xl-9"><div className="row align-items-center"><div className="col-md-6"><div className="mb-4"><h3>{pagination.total} {language === 'it' ? 'fornitori trovati' : 'providers found'}</h3></div></div></div>
        {serviceQuery.isLoading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}
        {serviceQuery.isError && <div className="alert alert-danger">{language === 'it' ? 'Impossibile caricare i fornitori.' : 'Unable to load providers.'}</div>}
        {!serviceQuery.isLoading && !serviceQuery.isError && !providers.length && <div className="text-center py-5 text-muted">{language === 'it' ? 'Nessun fornitore corrisponde ai filtri selezionati.' : 'No providers match the selected filters.'}</div>}
        {!serviceQuery.isLoading && !serviceQuery.isError && providers.map((provider) => <div key={provider.id} className="card mb-3"><div className="card-body"><div className="doctor-widget"><div className="doc-info-left"><div className="doctor-img position-relative"><Link to={profileLink(provider)}><img src={getImageUrl(provider.profileImage) || '/assets/img/doctors-dashboard/doctor-profile-img.jpg'} className="img-fluid" alt={provider.name} /></Link></div><div className="doc-info-cont"><h4 className="doc-name"><Link to={profileLink(provider)}>{provider.name}</Link></h4><p className="doc-speciality">{roleLabel(provider.role, language)} · {serviceName}</p><p className="doc-location"><i className="fas fa-map-marker-alt" /> {[provider.address?.city, provider.address?.state, provider.address?.zip].filter(Boolean).join(', ') || (language === 'it' ? 'Posizione non disponibile' : 'Location unavailable')}</p>{provider.offering?.description && <p className="mb-0">{provider.offering.description}</p>}</div></div><div className="doc-info-right"><div className="clini-infos"><ul>{provider.profile?.experienceYears != null && <li><i className="far fa-clock" /> {provider.profile.experienceYears} {language === 'it' ? 'anni di esperienza' : 'years experience'}</li>}{provider.offering?.priceFrom != null && <li><i className="fas fa-euro-sign" /> {language === 'it' ? 'Da' : 'From'} €{provider.offering.priceFrom}</li>}</ul></div><div className="clinic-booking"><Link className="btn btn-primary" to={profileLink(provider)}>{action(provider)}</Link></div></div></div></div></div>)}
        {!serviceQuery.isLoading && pagination.pages > 1 && <div className="text-center mt-4"><button type="button" className="btn btn-outline-primary me-2" disabled={page <= 1} onClick={() => { const next = Math.max(1, page - 1); setPage(next); setSearchParams(toQuery(filters, next)) }}>{language === 'it' ? 'Precedente' : 'Previous'}</button><span className="mx-3">{language === 'it' ? `Pagina ${pagination.page} di ${pagination.pages}` : `Page ${pagination.page} of ${pagination.pages}`}</span><button type="button" className="btn btn-outline-primary" disabled={page >= pagination.pages} onClick={() => { const next = page + 1; setPage(next); setSearchParams(toQuery(filters, next)) }}>{language === 'it' ? 'Successiva' : 'Next'}</button></div>}
      </main>
    </div></div></div>
  </>
}

export default ServiceProvidersPage
