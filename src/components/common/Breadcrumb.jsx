import { Link } from 'react-router-dom'

const formatPetTerminology = (value) => {
  if (typeof value !== 'string') return value
  return value
    .replace(/\bMy Patients\b/g, 'My Pets')
    .replace(/\bPatients\b/g, 'My Pets')
    .replace(/\bPatient\b/g, 'My Pet')
    .replace(/\bpatients\b/g, 'pets')
    .replace(/\bpatient\b/g, 'pet')
}

const Breadcrumb = ({ title, li1, li2 }) => {
  const displayTitle = formatPetTerminology(title)
  const displayLi1 = formatPetTerminology(li1)
  const displayLi2 = formatPetTerminology(li2)

  return (
    <div className="breadcrumb-bar breadcrumb-bar-clean">
      <div className="container">
        <div className="row align-items-center inner-banner">
          <div className="col-md-12 col-12 text-center">
            {displayLi2 && <h2 className="breadcrumb-title">{displayLi2}</h2>}
            <nav aria-label="breadcrumb" className="page-breadcrumb">
              <ol className="breadcrumb justify-content-center">
                <li className="breadcrumb-item">
                  <Link to="/">Home</Link>
                </li>
                {(displayTitle || displayLi1) && (
                  <li className="breadcrumb-item active" aria-current="page">
                    {displayLi1 || displayTitle}
                  </li>
                )}
              </ol>
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Breadcrumb

