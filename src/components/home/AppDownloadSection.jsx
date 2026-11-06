import { useLanguage } from '../../contexts/LanguageContext'
import { APP_DOWNLOAD_FILE_NAME, APP_DOWNLOAD_URL } from '../../constants/appDownload'

const AppDownloadSection = () => {
  const { t } = useLanguage()

  return (
    <section className="home-app-download" aria-labelledby="home-app-download-title">
      <div className="container">
        <div className="home-app-download__panel">
          <div className="home-app-download__copy">
            <span className="home-app-download__eyebrow">
              <i className="fa-solid fa-mobile-screen-button" aria-hidden="true" />
              {t('home.appDownloadEyebrow')}
            </span>
            <h2 id="home-app-download-title">{t('home.appDownloadTitle')}</h2>
            <p>{t('home.appDownloadDescription')}</p>
            <ul className="home-app-download__features">
              <li><i className="fa-solid fa-check" aria-hidden="true" />{t('home.appDownloadFeatureAppointments')}</li>
              <li><i className="fa-solid fa-check" aria-hidden="true" />{t('home.appDownloadFeatureRecords')}</li>
              <li><i className="fa-solid fa-check" aria-hidden="true" />{t('home.appDownloadFeatureUpdates')}</li>
            </ul>
            <a className="home-app-download__button" href={APP_DOWNLOAD_URL} download={APP_DOWNLOAD_FILE_NAME}>
              <i className="fa-brands fa-android" aria-hidden="true" />
              <span>
                <small>{t('home.appDownloadForAndroid')}</small>
                {t('home.appDownloadButton')}
              </span>
              <i className="fa-solid fa-arrow-down" aria-hidden="true" />
            </a>
          </div>

          <div className="home-app-download__visual" aria-hidden="true">
            <div className="home-app-download__orbit home-app-download__orbit--one" />
            <div className="home-app-download__orbit home-app-download__orbit--two" />
            <div className="home-app-download__phone">
              <div className="home-app-download__speaker" />
              <div className="home-app-download__screen">
                <div className="home-app-download__screen-header">
                  <span className="home-app-download__mark"><i className="fa-solid fa-paw" /></span>
                  <div><strong>MyPetPlus</strong><small>{t('home.appDownloadVisualGreeting')}</small></div>
                </div>
                <div className="home-app-download__pet-card">
                  <span><i className="fa-solid fa-heart-pulse" /></span>
                  <div><small>{t('home.appDownloadVisualNextVisit')}</small><strong>{t('home.appDownloadVisualCare')}</strong></div>
                </div>
                <div className="home-app-download__screen-actions">
                  <span><i className="fa-solid fa-calendar-check" /></span>
                  <span><i className="fa-solid fa-file-medical" /></span>
                  <span><i className="fa-solid fa-bell" /></span>
                </div>
              </div>
            </div>
            <div className="home-app-download__badge home-app-download__badge--care"><i className="fa-solid fa-heart" /></div>
            <div className="home-app-download__badge home-app-download__badge--notification"><i className="fa-solid fa-bell" /></div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AppDownloadSection
