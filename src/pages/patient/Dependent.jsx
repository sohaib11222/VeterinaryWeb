import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import { usePets } from '../../queries'
import { useDeletePet } from '../../mutations'
import { getImageUrl } from '../../utils/apiConfig'

const Dependent = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const { data: petsResponse, isLoading } = usePets({ isActive: true, limit: 50 })
  const pets = useMemo(() => {
    const raw = petsResponse?.data ?? petsResponse
    return Array.isArray(raw) ? raw : []
  }, [petsResponse])

  const filteredPets = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return pets
    return pets.filter((p) => {
      const name = String(p?.name || '').toLowerCase()
      const breed = String(p?.breed || '').toLowerCase()
      const species = String(p?.species || '').toLowerCase()
      const microchip = String(p?.microchipNumber || '').toLowerCase()
      return (
        name.includes(q) ||
        breed.includes(q) ||
        species.includes(q) ||
        microchip.includes(q)
      )
    })
  }, [pets, search])

  const deletePet = useDeletePet()

  const handleDelete = async (pet) => {
    const ok = window.confirm(`Delete pet "${pet?.name || ''}"?`)
    if (!ok) return

    try {
      await deletePet.mutateAsync(pet._id)
      toast.success('Pet deleted')
    } catch (err) {
      toast.error(err?.message || 'Failed to delete pet')
    }
  }

  return (
    <div className="content doctor-content">
      <div className="container">
        <div className="row">
          <div className="col-lg-4 col-xl-3 theiaStickySidebar">
            {/* PatientSidebar will be rendered by DashboardLayout */}
          </div>
          <div className="col-lg-12 col-xl-12">
            <div className="dashboard-header">
              <h3>My Pets</h3>
            </div>

            <div className="dashboard-header border-0 m-0">
              <ul className="header-list-btns">
                <li>
                  <div className="input-block dash-search-input">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search pets"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <span className="search-icon"><i className="isax isax-search-normal"></i></span>
                  </div>
                </li>
              </ul>
              <button
                type="button"
                className="btn btn-md btn-primary-gradient rounded-pill"
                onClick={() => navigate('/add-dependent')}
              >
                Add Pet
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : filteredPets.length === 0 ? (
              <div className="text-center py-4">No pets found</div>
            ) : (
              filteredPets.map((pet) => {
                const img = getImageUrl(pet?.photo) || '/assets/img/dependent/dependent-01.jpg'
                const ageLabel =
                  pet?.age === null || pet?.age === undefined
                    ? '—'
                    : `${pet.age} months`

                return (
                  <div key={pet._id} className="dependent-wrap">
                    <div className="dependent-info">
                      <div className="patinet-information">
                        <Link to="#" onClick={(e) => e.preventDefault()}>
                          <img src={img} alt="Pet" />
                        </Link>
                        <div className="patient-info">
                          <h5>{pet?.name}</h5>
                          <ul>
                            <li>{pet?.species || '—'}</li>
                            <li>{pet?.gender || '—'}</li>
                            <li>{ageLabel}</li>
                          </ul>
                        </div>
                      </div>
                      <div className="blood-info">
                        <p>Breed</p>
                        <h6>{pet?.breed || '—'}</h6>
                      </div>
                    </div>
                    <div className="dependent-status">
                      <div className={`status-toggle ${pet?.isActive ? '' : 'checked'}`}>
                        <input
                          type="checkbox"
                          id={`status_${pet._id}`}
                          className="check"
                          defaultChecked={!!pet?.isActive}
                          disabled
                        />
                        <label htmlFor={`status_${pet._id}`} className="checktoggle">checkbox</label>
                      </div>
                      <button
                        type="button"
                        className="edit-icon me-2"
                        onClick={() => navigate(`/edit-dependent/${pet._id}`)}
                      >
                        <i className="isax isax-edit-2"></i>
                      </button>
                      <button
                        type="button"
                        className="edit-icon"
                        onClick={() => handleDelete(pet)}
                        disabled={deletePet.isPending}
                      >
                        <i className="isax isax-trash"></i>
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dependent

