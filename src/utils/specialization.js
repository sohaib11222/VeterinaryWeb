const CANONICAL_SPECIALIZATION_CODES = new Set([
  'SMALL_ANIMAL',
  'LARGE_ANIMAL',
  'EXOTIC_ANIMALS',
  'AVIAN',
  'REPTILE',
  'EMERGENCY',
  'SURGERY',
  'DERMATOLOGY',
  'CARDIOLOGY',
  'ONCOLOGY',
  'DENTISTRY',
  'OPHTHALMOLOGY',
  'BEHAVIOR',
  'NUTRITION',
  'INTERNAL_MEDICINE',
  'RADIOLOGY',
])

const SPECIALIZATION_ALIASES = {
  SMALL_ANIMAL: ['SMALL_ANIMAL', 'SMALL_ANIMALS', 'PICCOLI_ANIMALI'],
  LARGE_ANIMAL: ['LARGE_ANIMAL', 'LARGE_ANIMALS', 'GRANDI_ANIMALI'],
  EXOTIC_ANIMALS: ['EXOTIC_ANIMALS', 'ANIMALI_ESOTICI'],
  AVIAN: ['AVIAN', 'BIRDS', 'UCCELLI'],
  REPTILE: ['REPTILE', 'REPTILES', 'RETTILI'],
  EMERGENCY: ['EMERGENCY', 'EMERGENZA'],
  SURGERY: ['SURGERY', 'SURGICAL', 'SURGEON', 'CHIRURGIA', 'CHIRURGO'],
  DERMATOLOGY: ['DERMATOLOGY', 'DERMATOLOGIA'],
  CARDIOLOGY: ['CARDIOLOGY', 'CARDIOLOGIA'],
  ONCOLOGY: ['ONCOLOGY', 'ONCOLOGIA'],
  DENTISTRY: ['DENTISTRY', 'DENTAL', 'ODONTOIATRIA'],
  OPHTHALMOLOGY: ['OPHTHALMOLOGY', 'OFTALMOLOGIA'],
  BEHAVIOR: ['BEHAVIOR', 'BEHAVIOUR', 'COMPORTAMENTO'],
  NUTRITION: ['NUTRITION', 'NUTRIZIONE'],
  INTERNAL_MEDICINE: ['INTERNAL_MEDICINE', 'INTERNAL_MEDICINE_SMALL_ANIMALS', 'SMALL_ANIMAL_INTERNAL_MEDICINE', 'MEDICINA_INTERNA', 'MEDICINA_INTERNA_DEI_PICCOLI_ANIMALI'],
  RADIOLOGY: ['RADIOLOGY', 'RADIOLOGIA'],
}

export const normalizeSpecializationCode = (value) => String(value || '')
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '')

export const resolveSpecializationCode = (...values) => {
  const normalizedValues = values
    .flat()
    .map(normalizeSpecializationCode)
    .filter(Boolean)

  const directCode = normalizedValues.find((value) => CANONICAL_SPECIALIZATION_CODES.has(value))
  if (directCode) return directCode

  return Object.entries(SPECIALIZATION_ALIASES).find(([, aliases]) => (
    aliases.some((alias) => normalizedValues.includes(alias))
  ))?.[0] || normalizedValues[0] || ''
}

export const toSpecializationOption = (specialization) => {
  const code = resolveSpecializationCode(
    specialization?.type,
    specialization?.slug,
    specialization?.name,
    specialization?._id,
  )

  return code ? { code, name: specialization?.name || code } : null
}
