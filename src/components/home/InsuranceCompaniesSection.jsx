import { useMemo } from 'react'
import Owlcarousel from 'react-owl-carousel'
import { useActiveInsuranceCompanies } from '../../queries/insuranceQueries'
import { getImageUrl } from '../../utils/apiConfig'

const InsuranceCompaniesSection = () => {
  const { data: res, isLoading } = useActiveInsuranceCompanies({
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  })

  const companies = useMemo(() => {
    const payload = res?.data ?? res
    return Array.isArray(payload) ? payload : []
  }, [res])

  const options = useMemo(() => {
    const canLoop = companies.length > 5
    return {
      loop: canLoop,
      margin: 24,
      dots: false,
      nav: companies.length > 1,
      smartSpeed: 2000,
      navText: ['<i class="fa-solid fa-caret-left"></i>', '<i class="fa-solid fa-caret-right"></i>'],
      responsive: {
        0: { items: 2 },
        575: { items: 3 },
        768: { items: 4 },
        1000: { items: 5 },
      },
    }
  }, [companies.length])

  if (isLoading) return null
  if (companies.length === 0) return null

  return (
    <section className="insurance-companies-section" style={{ padding: '60px 0' }}>
      <div className="container">
        <div className="section-header-fourteen service-inner-fourteen text-center">
          <div className="service-inner-fourteen">
            <div className="service-inner-fourteen-two">
              <h3>INSURANCE PARTNERS</h3>
            </div>
          </div>
          <h2>Accepted Insurance Companies</h2>
          <p>We work with leading providers to make care accessible</p>
        </div>

        <Owlcarousel className="owl-theme" {...options}>
          {companies.map((ins) => {
            const id = ins?._id || ins?.id
            const logoUrl = getImageUrl(ins?.logo)
            const name = ins?.name || 'Insurance'

            return (
              <div key={String(id || name)} className="text-center">
                <div
                  style={{
                    height: 110,
                    borderRadius: 14,
                    border: '1px solid #eef1f6',
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 16,
                  }}
                >
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={name}
                      style={{ maxWidth: '100%', maxHeight: 70, objectFit: 'contain' }}
                      onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <i className="fa-solid fa-shield-halved text-muted" style={{ fontSize: 26 }}></i>
                  )}
                </div>
                <div style={{ marginTop: 10, fontWeight: 600, fontSize: 13, color: '#666' }}>{name}</div>
              </div>
            )
          })}
        </Owlcarousel>
      </div>
    </section>
  )
}

export default InsuranceCompaniesSection
