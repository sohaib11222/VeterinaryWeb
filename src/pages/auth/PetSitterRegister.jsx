import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import { registerPetSitter, resendEmailVerification, verifyEmail } from '../../api/auth'
import { useAuth } from '../../contexts/AuthContext'
import InternationalPhoneInput, { isE164Phone } from '../../components/common/InternationalPhoneInput'
import { useUpdatePetSitterProfile } from '../../mutations/petSitterMutations'
import { api } from '../../utils/api'
import { API_ROUTES } from '../../utils/apiConfig'

const PET_TYPES = ['DOG', 'CAT', 'BIRD', 'RABBIT', 'SMALL_PETS', 'REPTILE', 'FISH', 'OTHER']
const SERVICES = ['DOG_SITTING', 'CAT_SITTING', 'HOME_BOARDING', 'HOME_VISITS', 'DOG_WALKING', 'MEDICATION_ADMINISTRATION', 'PET_TAXI', 'OTHER']
const label = (value) => value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())

const initialBasic = {
  fullName: '', email: '', phone: '', dob: '', gender: '', address: '', city: '', province: '', postalCode: '', region: '', password: '', confirmPassword: '',
}

const initialDetails = {
  experienceYears: '', bio: '', petSittingExperience: '', availability: '', certifications: '', isAvailable: true,
}

const errorMessage = (error, fallback) => {
  if (error?.status === 0) return 'Unable to reach the server. Please check that MyPetPlus is online and try again.'
  return error?.message || fallback
}

const PetSitterRegister = () => {
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const updateProfile = useUpdatePetSitterProfile()
  const [step, setStep] = useState(1)
  const [basic, setBasic] = useState(initialBasic)
  const [details, setDetails] = useState(initialDetails)
  const [petTypes, setPetTypes] = useState([])
  const [servicesOffered, setServicesOffered] = useState([])
  const [photo, setPhoto] = useState(null)
  const [documents, setDocuments] = useState([])
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const updateBasic = (key, value) => setBasic((current) => ({ ...current, [key]: value }))
  const updateDetails = (key, value) => setDetails((current) => ({ ...current, [key]: value }))
  const toggle = (setter, value) => setter((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value])

  const submitBasicDetails = async (event) => {
    event.preventDefault()
    if (!photo) return toast.error('Please upload a profile photo')
    if (!isE164Phone(basic.phone)) return toast.error('Please select your country and enter a valid phone number')
    if (basic.password.length < 8) return toast.error('Password must be at least 8 characters')
    if (basic.password !== basic.confirmPassword) return toast.error('Passwords do not match')

    setLoading(true)
    try {
      const body = new FormData()
      Object.entries(basic).forEach(([key, value]) => { if (key !== 'confirmPassword') body.append(key, value || '') })
      body.append('name', basic.fullName)
      body.append('petTypes', JSON.stringify([]))
      body.append('servicesOffered', JSON.stringify([]))
      body.append('availability', JSON.stringify([]))
      body.append('certifications', JSON.stringify([]))
      body.append('file', photo)

      const response = await registerPetSitter(body)
      const email = response?.email || response?.user?.email || basic.email.trim().toLowerCase()
      setRegisteredEmail(email)
      setStep(2)
      toast.success('Verification code sent to your email')
    } catch (error) {
      toast.error(errorMessage(error, 'Unable to create Pet Sitter account'))
    } finally {
      setLoading(false)
    }
  }

  const verifyRegistrationEmail = async (event) => {
    event.preventDefault()
    const email = registeredEmail.trim().toLowerCase()
    if (!/^\d{6}$/.test(verificationCode.trim())) return toast.error('Enter the 6-digit verification code from your email')

    setLoading(true)
    try {
      const response = await verifyEmail(email, verificationCode.trim())
      setSession(response)
      setStep(3)
      toast.success('Email verified. Now complete your Pet Sitter profile.')
    } catch (error) {
      toast.error(errorMessage(error, 'The verification code is invalid or expired'))
    } finally {
      setLoading(false)
    }
  }

  const resendCode = async () => {
    if (!registeredEmail) return toast.error('Registration email is missing')
    setResending(true)
    try {
      await resendEmailVerification(registeredEmail)
      toast.success('A new verification code has been sent')
    } catch (error) {
      toast.error(errorMessage(error, 'Unable to send a new verification code'))
    } finally {
      setResending(false)
    }
  }

  const completeProfile = async (event) => {
    event.preventDefault()
    if (!petTypes.length || !servicesOffered.length) return toast.error('Select at least one pet type and one service')

    setLoading(true)
    try {
      const availability = details.availability.trim()
        ? [{ day: 'GENERAL', isAvailable: true, startTime: details.availability.trim(), endTime: null }]
        : []
      const certifications = details.certifications.split(',').map((item) => item.trim()).filter(Boolean)

      await updateProfile.mutateAsync({
        fullName: basic.fullName,
        phone: basic.phone,
        dob: basic.dob || null,
        gender: basic.gender || null,
        address: { line1: basic.address || null, city: basic.city || null, state: basic.province || null, zip: basic.postalCode || null, country: basic.region || null },
        bio: details.bio,
        petSittingExperience: details.petSittingExperience,
        experienceYears: Number(details.experienceYears || 0),
        isAvailable: details.isAvailable,
        petTypes,
        servicesOffered,
        availability,
        certifications,
      })

      if (documents.length) {
        const documentBody = new FormData()
        documents.forEach((file) => documentBody.append('petSitterDocs', file))
        await api.upload(API_ROUTES.PET_SITTERS.UPLOAD_DOCUMENTS, documentBody)
      }

      toast.success('Your Pet Sitter profile is ready')
      navigate('/pet-sitter/dashboard', { replace: true })
    } catch (error) {
      toast.error(errorMessage(error, 'Unable to save your Pet Sitter profile'))
    } finally {
      setLoading(false)
    }
  }

  const stepTitle = step === 1 ? 'Basic details' : step === 2 ? 'Verify your email' : step === 3 ? 'Experience and preferences' : 'Pets and services'

  return (
    <div className="content veterinary-dashboard">
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-xl-9 col-lg-10">
            <div className="card shadow-sm border-0">
              <div className="card-body p-3 p-md-4 p-lg-5">
                <div className="text-center mb-4">
                  <span className="badge bg-primary-subtle text-primary mb-2">Pet Sitter registration</span>
                  <h2 className="mb-1">{stepTitle}</h2>
                  <p className="text-muted mb-0">{step === 1 ? 'Create your account to start helping Pet Owners.' : step === 2 ? `We sent a 6-digit code to ${registeredEmail}.` : step === 3 ? 'Add the information Pet Owners need before contacting you.' : 'Choose the pets you handle and the services you offer.'}</p>
                </div>

                <div className="d-flex align-items-center justify-content-center gap-2 gap-md-4 mb-4" aria-label="Registration progress">
                  {[['1', 'Basic'], ['2', 'Verify'], ['3', 'Experience'], ['4', 'Services']].map(([number, name]) => (
                    <div className={`d-flex align-items-center gap-2 ${Number(number) === step ? 'text-primary fw-semibold' : Number(number) < step ? 'text-success' : 'text-muted'}`} key={number}>
                      <span className="rounded-circle d-inline-flex align-items-center justify-content-center border" style={{ width: 30, height: 30 }}>{Number(number) < step ? '✓' : number}</span>
                      <span className="d-none d-sm-inline">{name}</span>
                    </div>
                  ))}
                </div>

                {step === 1 && (
                  <form onSubmit={submitBasicDetails}>
                    <div className="row g-3">
                      <div className="col-md-6"><label className="form-label">Full name *</label><input className="form-control" required value={basic.fullName} onChange={(event) => updateBasic('fullName', event.target.value)} /></div>
                      <div className="col-md-6"><label className="form-label">Profile photo *</label><input className="form-control" type="file" accept="image/jpeg,image/png,image/webp" required onChange={(event) => setPhoto(event.target.files?.[0] || null)} /></div>
                      <div className="col-md-6"><label className="form-label">Email address *</label><input className="form-control" type="email" autoComplete="email" required value={basic.email} onChange={(event) => updateBasic('email', event.target.value)} /></div>
                      <div className="col-md-6"><label className="form-label">Phone number *</label><InternationalPhoneInput value={basic.phone} onChange={(phone) => updateBasic('phone', phone)} invalid={Boolean(basic.phone) && !isE164Phone(basic.phone)} /><small className="text-muted d-block mt-1">Select the country code before entering the number.</small></div>
                      <div className="col-md-4"><label className="form-label">Date of birth</label><input className="form-control" type="date" value={basic.dob} onChange={(event) => updateBasic('dob', event.target.value)} /></div>
                      <div className="col-md-4"><label className="form-label">Gender</label><select className="form-select" value={basic.gender} onChange={(event) => updateBasic('gender', event.target.value)}><option value="">Select gender</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></div>
                      <div className="col-md-4"><label className="form-label">City</label><input className="form-control" value={basic.city} onChange={(event) => updateBasic('city', event.target.value)} /></div>
                      <div className="col-md-4"><label className="form-label">Province</label><input className="form-control" value={basic.province} onChange={(event) => updateBasic('province', event.target.value)} /></div>
                      <div className="col-md-4"><label className="form-label">CAP / Postal code</label><input className="form-control" value={basic.postalCode} onChange={(event) => updateBasic('postalCode', event.target.value)} /></div>
                      <div className="col-md-4"><label className="form-label">Region / country</label><input className="form-control" value={basic.region} onChange={(event) => updateBasic('region', event.target.value)} /></div>
                      <div className="col-12"><label className="form-label">Address</label><input className="form-control" value={basic.address} onChange={(event) => updateBasic('address', event.target.value)} /></div>
                      <div className="col-md-6"><label className="form-label">Password *</label><input className="form-control" type="password" autoComplete="new-password" minLength="8" required value={basic.password} onChange={(event) => updateBasic('password', event.target.value)} /></div>
                      <div className="col-md-6"><label className="form-label">Confirm password *</label><input className="form-control" type="password" autoComplete="new-password" minLength="8" required value={basic.confirmPassword} onChange={(event) => updateBasic('confirmPassword', event.target.value)} /></div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-4"><Link to="/register" className="btn btn-outline-secondary">Back</Link><button className="btn btn-primary px-4" disabled={loading}>{loading ? 'Creating account…' : 'Continue to verification'} <i className="fa-solid fa-arrow-right ms-2" /></button></div>
                  </form>
                )}

                {step === 2 && (
                  <form onSubmit={verifyRegistrationEmail} className="mx-auto" style={{ maxWidth: 520 }}>
                    <div className="text-center mb-4"><i className="fa-solid fa-envelope-circle-check text-primary" style={{ fontSize: 48 }} /><p className="small text-muted mt-3 mb-0">Check your inbox and enter the code to activate your account. The code expires after 10 minutes.</p></div>
                    <label className="form-label">Verification code</label>
                    <input className="form-control form-control-lg text-center letter-spacing-2" inputMode="numeric" autoComplete="one-time-code" maxLength="6" value={verificationCode} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" required />
                    <div className="d-flex justify-content-between align-items-center mt-4"><button type="button" className="btn btn-link px-0" onClick={() => setStep(1)}>Back</button><button className="btn btn-primary px-4" disabled={loading}>{loading ? 'Verifying…' : 'Verify and continue'} <i className="fa-solid fa-arrow-right ms-2" /></button></div>
                    <button type="button" className="btn btn-link w-100 mt-3" onClick={resendCode} disabled={resending || loading}>{resending ? 'Sending…' : 'Resend verification code'}</button>
                  </form>
                )}

                {step === 3 && (
                  <form onSubmit={(event) => { event.preventDefault(); setStep(4) }}>
                    <div className="row g-3">
                      <div className="col-md-4"><label className="form-label">Experience (years)</label><input className="form-control" type="number" min="0" max="80" value={details.experienceYears} onChange={(event) => updateDetails('experienceYears', event.target.value)} /></div>
                      <div className="col-md-8"><label className="form-label">Availability</label><input className="form-control" placeholder="For example: weekdays, 09:00–18:00" value={details.availability} onChange={(event) => updateDetails('availability', event.target.value)} /></div>
                      <div className="col-md-6"><label className="form-label">Short bio</label><textarea className="form-control" rows="4" value={details.bio} onChange={(event) => updateDetails('bio', event.target.value)} /></div>
                      <div className="col-md-6"><label className="form-label">Pet sitting experience</label><textarea className="form-control" rows="4" value={details.petSittingExperience} onChange={(event) => updateDetails('petSittingExperience', event.target.value)} /></div>
                      <div className="col-md-6"><label className="form-label">Certifications</label><input className="form-control" placeholder="Separate multiple certifications with commas" value={details.certifications} onChange={(event) => updateDetails('certifications', event.target.value)} /></div>
                      <div className="col-md-6"><label className="form-label">Related documents</label><input className="form-control" type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => setDocuments(Array.from(event.target.files || []).slice(0, 5))} /><small className="text-muted">Optional, up to 5 files.</small></div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-4"><button type="button" className="btn btn-outline-secondary" onClick={() => setStep(2)}>Back</button><button className="btn btn-primary px-4">Continue to services <i className="fa-solid fa-arrow-right ms-2" /></button></div>
                  </form>
                )}

                {step === 4 && (
                  <form onSubmit={completeProfile}>
                    <div className="row g-3">
                      <div className="col-12"><label className="form-label">Pets / animals I can handle *</label><div className="row g-2">{PET_TYPES.map((item) => <label className={`col-6 col-md-3 border rounded p-2 d-flex gap-2 align-items-center ${petTypes.includes(item) ? 'border-primary bg-light' : ''}`} key={item}><input type="checkbox" checked={petTypes.includes(item)} onChange={() => toggle(setPetTypes, item)} />{label(item)}</label>)}</div></div>
                      <div className="col-12"><label className="form-label">Services offered *</label><div className="row g-2">{SERVICES.map((item) => <label className={`col-6 col-md-3 border rounded p-2 d-flex gap-2 align-items-center ${servicesOffered.includes(item) ? 'border-primary bg-light' : ''}`} key={item}><input type="checkbox" checked={servicesOffered.includes(item)} onChange={() => toggle(setServicesOffered, item)} />{label(item)}</label>)}</div></div>
                      <div className="col-12"><label className="form-check"><input className="form-check-input" type="checkbox" checked={details.isAvailable} onChange={(event) => updateDetails('isAvailable', event.target.checked)} /> <span className="form-check-label">I am currently available to receive Pet Owner requests</span></label></div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-4"><button type="button" className="btn btn-outline-secondary" onClick={() => setStep(3)}>Back</button><button className="btn btn-primary px-4" disabled={loading || updateProfile.isPending}>{loading ? 'Saving profile…' : 'Finish registration'} <i className="fa-solid fa-check ms-2" /></button></div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PetSitterRegister
