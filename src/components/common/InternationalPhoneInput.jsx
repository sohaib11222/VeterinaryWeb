import { useEffect, useMemo, useState } from 'react'

// Kept local so registration does not depend on a third-party widget or its
// global styling. Values emitted by this component are always E.164 strings.
const COUNTRIES = [
  ['IT', 'Italy', '+39'], ['AL', 'Albania', '+355'], ['AT', 'Austria', '+43'],
  ['BE', 'Belgium', '+32'], ['BG', 'Bulgaria', '+359'], ['BR', 'Brazil', '+55'],
  ['CA', 'Canada', '+1'], ['CN', 'China', '+86'], ['HR', 'Croatia', '+385'],
  ['CY', 'Cyprus', '+357'], ['CZ', 'Czechia', '+420'], ['DK', 'Denmark', '+45'],
  ['EG', 'Egypt', '+20'], ['FI', 'Finland', '+358'], ['FR', 'France', '+33'],
  ['DE', 'Germany', '+49'], ['GR', 'Greece', '+30'], ['HU', 'Hungary', '+36'],
  ['IN', 'India', '+91'], ['IE', 'Ireland', '+353'], ['LU', 'Luxembourg', '+352'],
  ['MT', 'Malta', '+356'], ['MX', 'Mexico', '+52'], ['NL', 'Netherlands', '+31'],
  ['NO', 'Norway', '+47'], ['PK', 'Pakistan', '+92'], ['PL', 'Poland', '+48'],
  ['PT', 'Portugal', '+351'], ['RO', 'Romania', '+40'], ['SA', 'Saudi Arabia', '+966'],
  ['RS', 'Serbia', '+381'], ['ES', 'Spain', '+34'], ['SE', 'Sweden', '+46'],
  ['CH', 'Switzerland', '+41'], ['TR', 'Türkiye', '+90'], ['AE', 'United Arab Emirates', '+971'],
  ['GB', 'United Kingdom', '+44'], ['US', 'United States', '+1'],
].map(([iso, name, dialCode]) => ({ iso, name, dialCode }))

const digits = (value) => String(value || '').replace(/\D/g, '')
const flag = (iso) => String.fromCodePoint(...[...iso.toUpperCase()].map((char) => 127397 + char.charCodeAt(0)))

const countryForValue = (value, fallback = 'IT') => {
  const input = String(value || '').trim()
  const matched = [...COUNTRIES]
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find((country) => input.startsWith(country.dialCode))
  return matched || COUNTRIES.find((country) => country.iso === fallback) || COUNTRIES[0]
}

const nationalNumber = (value, country) => {
  const raw = String(value || '').trim()
  const countryDigits = digits(country?.dialCode)
  let valueDigits = digits(raw)
  if (raw.startsWith('+') && valueDigits.startsWith(countryDigits)) valueDigits = valueDigits.slice(countryDigits.length)
  if (raw.startsWith('00') && valueDigits.startsWith(`00${countryDigits}`)) valueDigits = valueDigits.slice(2 + countryDigits.length)
  return valueDigits
}

const formatE164 = (country, value) => {
  const selected = country || COUNTRIES[0]
  const code = digits(selected.dialCode)
  const raw = String(value || '').trim()
  let national = digits(raw)
  if (raw.startsWith('+') && national.startsWith(code)) national = national.slice(code.length)
  else if (raw.startsWith('00') && national.startsWith(`00${code}`)) national = national.slice(2 + code.length)
  return national ? `${selected.dialCode}${national}` : ''
}

export const isE164Phone = (value) => /^\+[1-9]\d{6,14}$/.test(String(value || '').trim())

const InternationalPhoneInput = ({ value, onChange, defaultCountry = 'IT', id = 'phone', disabled = false, invalid = false }) => {
  const initialCountry = useMemo(() => countryForValue(value, defaultCountry), [defaultCountry])
  const [countryIso, setCountryIso] = useState(initialCountry.iso)
  const selectedCountry = COUNTRIES.find((country) => country.iso === countryIso) || initialCountry

  useEffect(() => {
    const nextCountry = countryForValue(value, defaultCountry)
    setCountryIso(nextCountry.iso)
  }, [value, defaultCountry])

  const updateValue = (country, nextValue) => {
    onChange?.(formatE164(country, nextValue))
  }

  const handleCountryChange = (event) => {
    const nextCountry = COUNTRIES.find((country) => country.iso === event.target.value) || COUNTRIES[0]
    const currentNationalNumber = nationalNumber(value, selectedCountry)
    setCountryIso(nextCountry.iso)
    updateValue(nextCountry, currentNationalNumber)
  }

  return (
    <div className={`input-group international-phone-input${invalid ? ' is-invalid' : ''}`}>
      <select
        className="form-select"
        aria-label="Country calling code"
        value={selectedCountry.iso}
        onChange={handleCountryChange}
        disabled={disabled}
        style={{ maxWidth: 190 }}
      >
        {COUNTRIES.map((country) => (
          <option key={country.iso} value={country.iso}>{flag(country.iso)} {country.name} ({country.dialCode})</option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        className={`form-control${invalid ? ' is-invalid' : ''}`}
        value={nationalNumber(value, selectedCountry)}
        onChange={(event) => updateValue(selectedCountry, event.target.value)}
        placeholder="Phone number"
        inputMode="tel"
        autoComplete="tel-national"
        disabled={disabled}
      />
    </div>
  )
}

export default InternationalPhoneInput
