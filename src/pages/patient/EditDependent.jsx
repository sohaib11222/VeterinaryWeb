import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { usePet } from '../../queries'
import { useUpdatePetWithUpload } from '../../mutations'
import { getImageUrl } from '../../utils/apiConfig'

const PET_SPECIES = [
  'DOG',
  'CAT',
  'BIRD',
  'RABBIT',
  'REPTILE',
  'FISH',
  'HAMSTER',
  'GUINEA_PIG',
  'FERRET',
  'HORSE',
  'OTHER',
]

const PET_GENDER = ['MALE', 'FEMALE', 'NEUTERED', 'SPAYED', 'UNKNOWN']

const EditDependent = () => {
  const { petId } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const { data: petResponse, isLoading } = usePet(petId)
  const pet = useMemo(() => petResponse?.data ?? petResponse ?? null, [petResponse])

  const [name, setName] = useState('')
  const [species, setSpecies] = useState('DOG')
  const [breed, setBreed] = useState('')
  const [gender, setGender] = useState('UNKNOWN')
  const [ageMonths, setAgeMonths] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [microchipNumber, setMicrochipNumber] = useState('')
  const [photoFile, setPhotoFile] = useState(null)

  const updatePet = useUpdatePetWithUpload()

  useEffect(() => {
    if (!pet) return
    setName(pet?.name || '')
    setSpecies(pet?.species || 'DOG')
    setBreed(pet?.breed || '')
    setGender(pet?.gender || 'UNKNOWN')
    setAgeMonths(pet?.age === null || pet?.age === undefined ? '' : String(pet.age))
    const weightValue = pet?.weight?.value
    setWeightKg(weightValue === null || weightValue === undefined ? '' : String(weightValue))
    setMicrochipNumber(pet?.microchipNumber || '')
  }, [pet])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!petId) {
      toast.error('Missing pet id')
      return
    }
    if (!name.trim()) {
      toast.error('Please enter pet name')
      return
    }
    if (!species) {
      toast.error('Please select species')
      return
    }

    const data = {
      name: name.trim(),
      species,
      ...(breed.trim() ? { breed: breed.trim() } : { breed: null }),
      ...(gender ? { gender } : {}),
      ...(ageMonths !== '' ? { age: Number(ageMonths) } : { age: null }),
      ...(weightKg !== '' ? { weight: Number(weightKg) } : {}),
      ...(microchipNumber.trim() ? { microchipNumber: microchipNumber.trim() } : {}),
    }

    try {
      await updatePet.mutateAsync({
        petId,
        ...(photoFile ? { file: photoFile } : {}),
        data,
      })
      toast.success('Pet updated')
      navigate('/dependent')
    } catch (err) {
      toast.error(err?.message || 'Failed to update pet')
    }
  }

  const currentPhoto = getImageUrl(pet?.photo) || '/assets/img/dependent/dependent-01.jpg'

  return (
    <div className="content doctor-content">
      <div className="container">
        <div className="row">
          <div className="col-lg-4 col-xl-3 theiaStickySidebar"></div>
          <div className="col-lg-12 col-xl-12">
            <div className="dashboard-header">
              <h3>Edit Pet</h3>
            </div>

            {isLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : !pet ? (
              <div className="alert alert-warning">Pet not found</div>
            ) : (
              <div className="card">
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-md-12 mb-3">
                        <img
                          src={currentPhoto}
                          alt="Pet"
                          style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 12 }}
                        />
                      </div>

                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Name <span className="text-danger">*</span></label>
                          <input
                            type="text"
                            className="form-control"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Species <span className="text-danger">*</span></label>
                          <select
                            className="form-control select"
                            value={species}
                            onChange={(e) => setSpecies(e.target.value)}
                            required
                          >
                            {PET_SPECIES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Breed</label>
                          <input
                            type="text"
                            className="form-control"
                            value={breed}
                            onChange={(e) => setBreed(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Gender</label>
                          <select
                            className="form-control select"
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                          >
                            {PET_GENDER.map((g) => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Age (months)</label>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            value={ageMonths}
                            onChange={(e) => setAgeMonths(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Weight (kg)</label>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            step="0.1"
                            value={weightKg}
                            onChange={(e) => setWeightKg(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Microchip Number</label>
                          <input
                            type="text"
                            className="form-control"
                            value={microchipNumber}
                            onChange={(e) => setMicrochipNumber(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Pet Photo</label>
                          <div className="d-flex gap-2 align-items-center">
                            <button
                              type="button"
                              className="btn btn-outline-primary"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              Choose File
                            </button>
                            <span className="form-text">
                              {photoFile ? photoFile.name : 'No new file selected'}
                            </span>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                            style={{ display: 'none' }}
                          />
                        </div>
                      </div>

                      <div className="col-md-12">
                        <div className="submit-section">
                          <button type="submit" className="btn btn-primary prime-btn me-2" disabled={updatePet.isPending}>
                            {updatePet.isPending ? 'Saving...' : 'Update Pet'}
                          </button>
                          <Link to="/dependent" className="btn btn-secondary">Cancel</Link>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditDependent

