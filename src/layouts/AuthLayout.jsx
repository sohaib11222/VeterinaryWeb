import { Link, useLocation } from 'react-router-dom'
import '../styles/auth-shell.css'
import { useLanguage } from '../contexts/LanguageContext'
import LanguageToggle from '../components/common/LanguageToggle'

const getAuthContext = (pathname) => {
  const path = String(pathname || '').toLowerCase()
  if (path.includes('doctor')) {
    return {
      eyebrow: 'auth.authLayout.veterinaryEyebrow',
      title: 'auth.authLayout.veterinaryTitle',
      description: 'auth.authLayout.veterinaryDescription',
      icon: 'fa-stethoscope',
    }
  }
  if (path.includes('pharmacy') || path.includes('pet-store')) {
    return {
      eyebrow: 'auth.authLayout.pharmacyEyebrow',
      title: 'auth.authLayout.pharmacyTitle',
      description: 'auth.authLayout.pharmacyDescription',
      icon: 'fa-briefcase-medical',
    }
  }
  if (path.includes('register')) {
    return {
      eyebrow: 'auth.authLayout.registerEyebrow',
      title: 'auth.authLayout.registerTitle',
      description: 'auth.authLayout.registerDescription',
      icon: 'fa-heart-pulse',
    }
  }
  return {
    eyebrow: 'auth.authLayout.defaultEyebrow',
    title: 'auth.authLayout.defaultTitle',
    description: 'auth.authLayout.defaultDescription',
    icon: 'fa-shield-heart',
  }
}

const AuthLayout = ({ children }) => {
  const location = useLocation()
  const { t } = useLanguage()
  const context = getAuthContext(location.pathname)

  return (
    <main className="auth-shell">
      <aside className="auth-shell__aside" aria-label={t('auth.authLayout.careNetworkAria')}>
        <div className="auth-shell__aside-image" aria-hidden="true" />
        <div className="auth-shell__aside-content">
          <Link to="/" className="auth-shell__brand" aria-label={t('auth.authLayout.homeAria')}>
            <span className="auth-shell__brand-mark"><i className="fa-solid fa-heart-pulse" /></span>
            <span>MyPet<span>Plus</span></span>
          </Link>
          <div className="auth-shell__hero">
            <div className="auth-shell__eyebrow"><i className={`fa-solid ${context.icon}`} /> {t(context.eyebrow)}</div>
            <h1>{t(context.title)}</h1>
            <p>{t(context.description)}</p>
          </div>
          <div className="auth-shell__assurances" aria-label={t('auth.authLayout.featuresAria')}>
            <span><i className="fa-solid fa-shield-halved" /> {t('auth.secureByDesign')}</span>
            <span><i className="fa-solid fa-calendar-check" /> {t('auth.careOnSchedule')}</span>
          </div>
        </div>
      </aside>
      <section className="auth-shell__main">
        <div className="auth-shell__mobile-brand">
          <Link to="/" aria-label={t('auth.authLayout.homeAria')}>
            <span className="auth-shell__brand-mark"><i className="fa-solid fa-heart-pulse" /></span>
            <span>MyPet<span>Plus</span></span>
          </Link>
        </div>
        <LanguageToggle className="auth-shell__language-toggle" />
        <div className="auth-shell__surface">{children}</div>
      </section>
    </main>
  )
}

export default AuthLayout

