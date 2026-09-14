import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../../utils/api'
import { API_ROUTES } from '../../utils/apiConfig'
import { useMyPlatformServices } from '../../queries/platformServiceQueries'
import { useLanguage } from '../../contexts/LanguageContext'

const unwrap = (response) => response?.data ?? response ?? []

const ProviderServiceOfferings = () => {
  const { language } = useLanguage()
  const queryClient = useQueryClient()
  const query = useMyPlatformServices()
  const services = Array.isArray(unwrap(query.data)) ? unwrap(query.data) : []
  const [offerings, setOfferings] = useState([])
  const [saving, setSaving] = useState(false)
  useEffect(() => setOfferings(services.map((service) => ({ serviceId: service._id, isActive: service.offering?.isActive === true, description: service.offering?.description || '', priceFrom: service.offering?.priceFrom ?? '', deliveryModes: service.offering?.deliveryModes || [] }))), [query.data])
  const update = (id, field, value) => setOfferings((current) => current.map((offering) => offering.serviceId === id ? { ...offering, [field]: value } : offering))
  const save = async (event) => { event.preventDefault(); setSaving(true); try { await api.put(API_ROUTES.PLATFORM_SERVICES.MINE, { offerings }); await queryClient.invalidateQueries({ queryKey: ['platform-services'] }); toast.success(language === 'it' ? 'Servizi aggiornati correttamente.' : 'Service offerings updated successfully.') } catch (error) { toast.error(error?.message || (language === 'it' ? 'Impossibile aggiornare i servizi.' : 'Unable to update service offerings.')) } finally { setSaving(false) } }
  const title = language === 'it' ? 'Servizi che offro' : 'Services I offer'
  return <div className="content"><div className="container-fluid"><div className="mb-4"><h3 className="mb-1">{title}</h3><p className="text-muted mb-0">{language === 'it' ? 'Scegli i servizi che vuoi rendere visibili ai proprietari di animali.' : 'Choose the services you want to show to pet owners.'}</p></div>{query.isLoading ? <div className="text-center py-5"><div className="spinner-border text-primary" /></div> : <form onSubmit={save}><div className="row g-3">{services.map((service) => { const offering = offerings.find((item) => item.serviceId === service._id) || {}; return <div className="col-md-6 col-xl-4" key={service._id}><div className={`card h-100 ${offering.isActive ? 'border-primary' : ''}`}><div className="card-body"><div className="form-check form-switch d-flex justify-content-between align-items-start ps-0"><div><span className="service-offering-icon"><i className={`fa-solid ${service.icon || 'fa-paw'}`} /></span><h5 className="mt-2 mb-1">{language === 'it' ? service.nameIt : service.name}</h5><p className="small text-muted mb-3">{language === 'it' ? service.descriptionIt || service.description : service.description || service.descriptionIt}</p></div><input className="form-check-input ms-2" type="checkbox" checked={!!offering.isActive} onChange={(event) => update(service._id, 'isActive', event.target.checked)} /></div>{offering.isActive && <><label className="form-label small">{language === 'it' ? 'Descrizione per il cliente' : 'Customer-facing description'}</label><textarea className="form-control form-control-sm mb-2" rows="2" value={offering.description || ''} onChange={(event) => update(service._id, 'description', event.target.value)} /><label className="form-label small">{language === 'it' ? 'Prezzo da (€)' : 'Price from (€)'}</label><input type="number" min="0" step="0.01" className="form-control form-control-sm" value={offering.priceFrom ?? ''} onChange={(event) => update(service._id, 'priceFrom', event.target.value)} /></>}</div></div></div>})}</div>{!services.length && <div className="alert alert-info">{language === 'it' ? 'Al momento non ci sono servizi disponibili per il tuo ruolo.' : 'There are currently no services available for your role.'}</div>}<button className="btn btn-primary mt-4" disabled={saving}>{saving ? (language === 'it' ? 'Salvataggio…' : 'Saving…') : (language === 'it' ? 'Salva servizi' : 'Save services')}</button></form>}</div></div>
}

export default ProviderServiceOfferings
