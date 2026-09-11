import Breadcrumb from '../../components/common/Breadcrumb'
import { useLanguage } from '../../contexts/LanguageContext'

const PaymentSuccess = () => {
  const { t } = useLanguage()
  return (
    <>
      <Breadcrumb title={t('shop.pharmacy')} li1={t('booking.payment')} li2={t('booking.payment')} />
      <div className="content success-page-cont">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <div className="card success-card">
                <div className="card-body">
                  <div className="success-cont">
                    <i className="fas fa-check"></i>
                    <h3>{t('shop.paymentSuccess')}</h3>
                    <p className="mb-0">{t('shop.product')} ID: 245468</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default PaymentSuccess

