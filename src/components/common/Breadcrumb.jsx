import { Link } from 'react-router-dom'

const Breadcrumb = ({ title, li1, li2 }) => {
  return (
    <div className="breadcrumb-bar breadcrumb-bar-clean">
      <div className="container">
        <div className="row align-items-center inner-banner">
          <div className="col-md-12 col-12 text-center">
            {li2 && <h2 className="breadcrumb-title">{li2}</h2>}
            <nav aria-label="breadcrumb" className="page-breadcrumb">
              <ol className="breadcrumb justify-content-center">
                <li className="breadcrumb-item">
                  <Link to="/">Home</Link>
                </li>
                {(title || li1) && (
                  <li className="breadcrumb-item active" aria-current="page">
                    {li1 || title}
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

