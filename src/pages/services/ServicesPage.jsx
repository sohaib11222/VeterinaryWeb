import { Link } from 'react-router-dom'
import Breadcrumb from '../../components/common/Breadcrumb'
import { usePlatformServices } from '../../queries/platformServiceQueries'
import { useLanguage } from '../../contexts/LanguageContext'

const unwrap = (response) => response?.data ?? response ?? []

const ServicesPage = () => {
  const { language } = useLanguage()
  const query = usePlatformServices()
  const services = Array.isArray(unwrap(query.data)) ? unwrap(query.data) : []
  const label = (service) => language === 'it' ? service.nameIt : service.name
  const description = (service) => language === 'it' ? service.descriptionIt || service.description : service.description || service.descriptionIt

  const heading = language === 'it' ? 'Trova il servizio giusto per il tuo Pet' : 'Find the right service for your pet'
  return <><Breadcrumb title={heading} li2={language === 'it' ? 'Servizi' : 'Services'} /><section className="platform-services-page"><div className="container py-5"><div className="text-center mx-auto mb-5 platform-services-page__intro" style={{ maxWidth: 720 }}><span className="platform-services-page__eyebrow">MyPetPlus</span><h1>{heading}</h1><p className="text-muted mb-0">{language === 'it' ? 'Esplora i servizi disponibili e trova professionisti e attività approvati vicino a te.' : 'Explore available services and find approved professionals and businesses near you.'}</p></div>{query.isLoading ? <div className="text-center py-5"><div className="spinner-border text-primary" /></div> : query.isError ? <div className="alert alert-danger">{language === 'it' ? 'Impossibile caricare i servizi.' : 'Unable to load services.'}</div> : <div className="row g-4">{services.map((service) => <div className="col-sm-6 col-lg-4 col-xl-3" key={service._id}><Link className="platform-service-card h-100" to={`/services/${service.slug}`}><div className="platform-service-card__icon"><i className={`fa-solid ${service.icon || 'fa-paw'}`} /></div><div><span className="platform-service-card__kind">{service.kind === 'COMMERCE' ? (language === 'it' ? 'Acquisti' : 'Shopping') : (language === 'it' ? 'Professionisti' : 'Professionals')}</span><h2>{label(service)}</h2><p>{description(service) || (language === 'it' ? 'Scopri i fornitori disponibili per questo servizio.' : 'Discover available providers for this service.')}</p></div><span className="platform-service-card__cta">{language === 'it' ? 'Esplora' : 'Explore'} <i className="fa-solid fa-arrow-right" /></span></Link></div>)}</div>}</div></section></>
}

export default ServicesPage
