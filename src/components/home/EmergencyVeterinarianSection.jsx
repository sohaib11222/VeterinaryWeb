import { Link } from 'react-router-dom'

const EmergencyVeterinarianSection = () => (
  <section className="home-emergency-vet" aria-labelledby="emergency-vet-title">
    <div className="container">
      <div className="home-emergency-vet__grid">
        <div className="home-emergency-vet__media aos" data-aos="fade-right">
          <Link to="/search" aria-label="Find a veterinarian">
            <img
              src="/assets/img/pronto-soccorso-veterinario.jpeg"
              alt="Pronto Soccorso Veterinario H24"
            />
          </Link>
        </div>

        <div className="home-emergency-vet__content aos" data-aos="fade-left">
          <span className="home-emergency-vet__eyebrow">EMERGENCY VETERINARY CARE</span>
          <h2 id="emergency-vet-title">When your pet needs help, trusted care is close to you.</h2>
          <p>
            Find a qualified veterinarian for urgent support, advice, and the next available
            appointment. Search by service and location to find the right care for your pet.
          </p>
          <Link to="/search" className="btn home-emergency-vet__button">
            Find a Veterinarian
            <i className="fa-solid fa-arrow-right" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  </section>
)

export default EmergencyVeterinarianSection
