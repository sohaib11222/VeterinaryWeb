import { Link, useLocation } from 'react-router-dom'
import '../styles/auth-shell.css'

const getAuthContext = (pathname) => {
  const path = String(pathname || '').toLowerCase()
  if (path.includes('doctor')) {
    return {
      eyebrow: 'Veterinary professional portal',
      title: 'Care teams, connected.',
      description: 'A secure workspace for trusted veterinary care, appointments, and follow-up.',
      icon: 'fa-stethoscope',
    }
  }
  if (path.includes('pharmacy') || path.includes('pet-store')) {
    return {
      eyebrow: 'Veterinary pharmacy portal',
      title: 'Support every stage of care.',
      description: 'Join the connected network that keeps pet care, products, and professionals together.',
      icon: 'fa-briefcase-medical',
    }
  }
  if (path.includes('register')) {
    return {
      eyebrow: 'MyPetPlus care network',
      title: 'Better care starts here.',
      description: 'Create one secure space for your pet’s health, care team, and appointments.',
      icon: 'fa-heart-pulse',
    }
  }
  return {
    eyebrow: 'MyPetPlus care network',
    title: 'Care that stays connected.',
    description: 'Everything your pet needs, in one secure and simple place.',
    icon: 'fa-shield-heart',
  }
}

const AuthLayout = ({ children }) => {
  const location = useLocation()
  const context = getAuthContext(location.pathname)

  return (
    <main className="auth-shell">
      <aside className="auth-shell__aside" aria-label="MyPetPlus care network">
        <div className="auth-shell__aside-image" aria-hidden="true" />
        <div className="auth-shell__aside-content">
          <Link to="/" className="auth-shell__brand" aria-label="Go to MyPetPlus home">
            <span className="auth-shell__brand-mark"><i className="fa-solid fa-heart-pulse" /></span>
            <span>MyPet<span>Plus</span></span>
          </Link>
          <div className="auth-shell__hero">
            <div className="auth-shell__eyebrow"><i className={`fa-solid ${context.icon}`} /> {context.eyebrow}</div>
            <h1>{context.title}</h1>
            <p>{context.description}</p>
          </div>
          <div className="auth-shell__assurances" aria-label="Platform features">
            <span><i className="fa-solid fa-shield-halved" /> Secure by design</span>
            <span><i className="fa-solid fa-calendar-check" /> Care, on your schedule</span>
          </div>
        </div>
      </aside>
      <section className="auth-shell__main">
        <div className="auth-shell__mobile-brand">
          <Link to="/" aria-label="Go to MyPetPlus home">
            <span className="auth-shell__brand-mark"><i className="fa-solid fa-heart-pulse" /></span>
            <span>MyPet<span>Plus</span></span>
          </Link>
        </div>
        <div className="auth-shell__surface">{children}</div>
      </section>
    </main>
  )
}

export default AuthLayout

