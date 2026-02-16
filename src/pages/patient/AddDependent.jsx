import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import { useCreatePetWithUpload } from '../../mutations'

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

const AddDependent = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [name, setName] = useState('')
  const [species, setSpecies] = useState('DOG')
  const [breed, setBreed] = useState('')
  const [gender, setGender] = useState('UNKNOWN')
  const [ageMonths, setAgeMonths] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [microchipNumber, setMicrochipNumber] = useState('')
  const [photoFile, setPhotoFile] = useState(null)

  const createPet = useCreatePetWithUpload()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Please enter pet name')
      return
    }
    if (!species) {
      toast.error('Please select species')
      return
    }

    const payload = {
      name: name.trim(),
      species,
      ...(breed.trim() ? { breed: breed.trim() } : {}),
      ...(gender ? { gender } : {}),
      ...(ageMonths !== '' ? { age: Number(ageMonths) } : {}),
      ...(weightKg !== '' ? { weight: Number(weightKg) } : {}),
      ...(microchipNumber.trim() ? { microchipNumber: microchipNumber.trim() } : {}),
      ...(photoFile ? { file: photoFile } : {}),
    }

    try {
      await createPet.mutateAsync(payload)
      toast.success('Pet created')
      navigate('/dependent')
    } catch (err) {
      toast.error(err?.message || 'Failed to create pet')
    }
  }

  return (
    <>
      <div className="content doctor-content">
        <div className="container">
          <div className="row">
            <div className="col-lg-4 col-xl-3 theiaStickySidebar">
              {/* PatientSidebar component would go here */}
            </div>
            <div className="col-lg-12 col-xl-12">
              <div className="dashboard-header">
                <h3>Add Pet</h3>
              </div>
              <div className="card">
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="mb-2">Name</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter Pet Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="mb-2">Species</label>
                          <select
                            className="select form-control"
                            value={species}
                            onChange={(e) => setSpecies(e.target.value)}
                          >
                            {PET_SPECIES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="mb-2">Breed</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter Breed"
                            value={breed}
                            onChange={(e) => setBreed(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="mb-2">Gender</label>
                          <select
                            className="select form-control"
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
                          <label className="mb-2">Age (months)</label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="e.g. 12"
                            min="0"
                            value={ageMonths}
                            onChange={(e) => setAgeMonths(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="mb-2">Weight (kg)</label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="e.g. 5"
                            min="0"
                            step="0.1"
                            value={weightKg}
                            onChange={(e) => setWeightKg(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="mb-2">Microchip Number</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Optional"
                            value={microchipNumber}
                            onChange={(e) => setMicrochipNumber(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="mb-2">Pet Photo</label>
                          <div className="upload-pic">
                            <img src="/assets/img/icons/up-img-1.svg" alt="img" id="blah" />
                            <h6>{photoFile ? photoFile.name : 'Upload Photo'}</h6>
                            <div className="upload-pics">
                              <button
                                type="button"
                                className="btn-profile"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <img src="/assets/img/icons/edit.svg" alt="edit-icon" />
                              </button>
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                                style={{ display: 'none' }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-12 d-flex justify-content-end gap-2">
                        <Link to="/dependent" className="btn btn-secondary">Cancel</Link>
                        <button type="submit" className="btn btn-primary" disabled={createPet.isPending}>
                          {createPet.isPending ? 'Saving...' : 'Add Pet'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AddDependent

