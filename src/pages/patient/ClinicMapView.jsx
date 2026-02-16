import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import { useClinicsWithCoordinates } from '../../queries'

const ClinicMapView = () => {
  const navigate = useNavigate()
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const tileLayerRef = useRef(null)

  const [userLocation, setUserLocation] = useState(null)
  const [selectedClinic, setSelectedClinic] = useState(null)
  const [showClinicModal, setShowClinicModal] = useState(false)
  const [locationPermission, setLocationPermission] = useState(false)
  const [radius, setRadius] = useState(10)
  const [mapLoaded, setMapLoaded] = useState(false)
  const leafletAssetsLoadedRef = useRef(false)
  const tileFallbackTriedRef = useRef(false)

  // Get user's location
  useEffect(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.')
      setUserLocation({ lat: 40.7128, lng: -74.006 })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setUserLocation(coords)
        setLocationPermission(true)
      },
      () => {
        setLocationPermission(false)
        toast.error('Location permission denied. Using default location.')
        setUserLocation({ lat: 40.7128, lng: -74.006 })
      }
    )
  }, [])

  // Fetch clinics (all with coordinates)
  const {
    data: clinicsWithCoordsData,
    isLoading: isLoadingClinics,
    error: clinicsError,
    refetch,
  } = useClinicsWithCoordinates()

  const nearbyClinics = useMemo(() => {
    const data = clinicsWithCoordsData?.data ?? clinicsWithCoordsData
    const clinics = Array.isArray(data) ? data : []

    return clinics.filter((clinic) => {
      const lat = clinic.coordinates?.lat ?? clinic.lat
      const lng = clinic.coordinates?.lng ?? clinic.lng
      const latNum = lat != null && lat !== '' ? Number(lat) : NaN
      const lngNum = lng != null && lng !== '' ? Number(lng) : NaN
      return Number.isFinite(latNum) && Number.isFinite(lngNum)
    })
  }, [clinicsWithCoordsData])

  // Initialize Leaflet map (script + css)
  useEffect(() => {
    if (!mapRef.current || mapLoaded) return
    if (leafletAssetsLoadedRef.current) return
    leafletAssetsLoadedRef.current = true

    const existingCss = document.getElementById('leaflet-css')
    if (!existingCss) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
      link.crossOrigin = ''
      document.head.appendChild(link)
    }

    const initMap = () => {
      const L = window.L
      if (!L || !mapRef.current || mapInstanceRef.current) return

      const center = { lat: 40.7128, lng: -74.006 }
      const map = L.map(mapRef.current).setView([center.lat, center.lng], 10)

      const addTileLayer = (url, attribution) => {
        if (tileLayerRef.current) {
          try {
            map.removeLayer(tileLayerRef.current)
          } catch {
            // ignore
          }
          tileLayerRef.current = null
        }

        const layer = L.tileLayer(url, {
          attribution,
          maxZoom: 19,
          crossOrigin: true,
        })

        layer.on('tileerror', () => {
          if (!tileFallbackTriedRef.current) {
            tileFallbackTriedRef.current = true
            toast.error('Map tiles failed to load. Switching map provider...')
            addTileLayer(
              'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
              '© OpenStreetMap contributors © CARTO'
            )
          } else {
            toast.error('Map tiles failed to load. Please check your internet connection.')
          }
        })

        layer.addTo(map)
        tileLayerRef.current = layer
      }

      // Primary provider
      addTileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', '© OpenStreetMap contributors')

      mapInstanceRef.current = map
      setMapLoaded(true)

      try {
        map.whenReady(() => {
          setTimeout(() => {
            try {
              map.invalidateSize()
            } catch {
              // ignore
            }
          }, 50)
        })
      } catch {
        // ignore
      }
    }

    if (window.L) {
      initMap()
    } else {
      const existingScript = document.getElementById('leaflet-js')
      if (existingScript) {
        existingScript.addEventListener('load', initMap, { once: true })
      } else {
        const script = document.createElement('script')
        script.id = 'leaflet-js'
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
        script.crossOrigin = ''
        script.onload = initMap
        document.body.appendChild(script)
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          if (tileLayerRef.current) {
            try {
              mapInstanceRef.current.removeLayer(tileLayerRef.current)
            } catch {
              // ignore
            }
            tileLayerRef.current = null
          }
          markersRef.current.forEach((m) => {
            try {
              mapInstanceRef.current.removeLayer(m)
            } catch {
              // ignore
            }
          })
          markersRef.current = []
        } catch {
          // ignore
        }
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [mapLoaded])

  // Recenter map to user location only when there are no clinic markers.
  // When clinics exist we fit bounds to clinic markers so markers appear at their real coordinates.
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return
    if (!userLocation?.lat || !userLocation?.lng) return
    if (nearbyClinics.length > 0) return

    try {
      mapInstanceRef.current.setView([Number(userLocation.lat), Number(userLocation.lng)], 12)
    } catch {
      // ignore
    }
  }, [mapLoaded, userLocation, nearbyClinics.length])

  // Update markers
  useEffect(() => {
    if (!mapLoaded || isLoadingClinics) return
    if (!mapInstanceRef.current || !window.L) return

    const L = window.L
    const map = mapInstanceRef.current

    const renderMarkers = () => {
      try {
        map.invalidateSize()
      } catch {
        // ignore
      }

      // clear
      markersRef.current.forEach((m) => {
        try {
          map.removeLayer(m)
        } catch {
          // ignore
        }
      })
      markersRef.current = []

      const clinicMarkers = []

      // user marker
      if (userLocation?.lat != null && userLocation?.lng != null) {
        const userLat = Number(userLocation.lat)
        const userLng = Number(userLocation.lng)

        if (Number.isFinite(userLat) && Number.isFinite(userLng)) {
          const userIcon = L.divIcon({
            className: 'custom-user-marker',
            html: '<div style="background-color:#4285F4;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          })

          const userMarker = L.marker([userLat, userLng], { icon: userIcon })
            .addTo(map)
            .bindPopup('Your Location')

          markersRef.current.push(userMarker)
        }
      }

      // clinic markers
      nearbyClinics.forEach((clinic) => {
        const latRaw = clinic.coordinates?.lat ?? clinic.lat
        const lngRaw = clinic.coordinates?.lng ?? clinic.lng
        const lat = latRaw != null && latRaw !== '' ? Number(latRaw) : NaN
        const lng = lngRaw != null && lngRaw !== '' ? Number(lngRaw) : NaN
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

        const clinicIcon = L.divIcon({
          className: 'custom-clinic-marker',
          html: `
            <div style="
              background-color:#0d6efd;
              width:40px;
              height:40px;
              border-radius:50%;
              border:3px solid white;
              box-shadow:0 2px 4px rgba(0,0,0,0.3);
              display:flex;
              align-items:center;
              justify-content:center;
              color:white;
              font-size:20px;
            ">🏥</div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        })

        const marker = L.marker([lat, lng], { icon: clinicIcon })
          .addTo(map)
          .bindPopup(`
            <div style="min-width: 200px;">
              <h6 style="margin: 0 0 5px 0; font-weight: 600;">${clinic.clinicName || clinic.name || 'Clinic'}</h6>
              <p style="margin: 0; font-size: 13px; color: #666;">${clinic.veterinarianName || clinic.doctorName || ''}</p>
              <p style="margin: 5px 0; font-size: 13px; color: #666;">${clinic.address || ''}, ${clinic.city || ''}</p>
            </div>
          `)

        marker.on('click', () => {
          setSelectedClinic(clinic)
          setShowClinicModal(true)
          try {
            map.setView([lat, lng], 14)
          } catch {
            // ignore
          }
        })

        markersRef.current.push(marker)
        clinicMarkers.push(marker)
      })

      // fit bounds (prefer clinic markers only)
      const boundsMarkers = clinicMarkers.length > 0 ? clinicMarkers : markersRef.current
      if (boundsMarkers.length > 0) {
        try {
          const group = new L.FeatureGroup(boundsMarkers)
          map.fitBounds(group.getBounds().pad(0.1))
        } catch {
          // ignore
        }
      }
    }

    if (typeof map.whenReady === 'function') {
      map.whenReady(renderMarkers)
    } else {
      renderMarkers()
    }
  }, [nearbyClinics, userLocation, isLoadingClinics, mapLoaded])

  const handleRefreshLocation = () => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setUserLocation(coords)
        toast.success('Location updated. Nearby clinics refreshed.')
      },
      () => toast.error('Could not update location.')
    )
  }

  const handleBookAppointment = (clinic) => {
    setShowClinicModal(false)
    const vetId = clinic?.veterinarianId || clinic?.doctorId
    if (!vetId) {
      toast.error('Veterinarian information not available')
      return
    }
    navigate(`/booking?vet=${vetId}`)
  }

  const handleViewVet = (clinic) => {
    setShowClinicModal(false)
    const vetId = clinic?.veterinarianId || clinic?.doctorId
    if (!vetId) {
      toast.error('Veterinarian information not available')
      return
    }
    navigate(`/doctor-profile/${vetId}`)
  }

  return (
    <div className="content">
      <div className="container-fluid p-0">
        <div className="row g-0">
          <div className="col-lg-8">
            <div style={{ position: 'relative', height: '100vh', minHeight: '600px' }}>
              <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  zIndex: 1000,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <button
                  className="btn btn-light shadow-sm"
                  onClick={handleRefreshLocation}
                  style={{ width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Refresh Location"
                >
                  <i className="fe fe-refresh-cw"></i>
                </button>
                <button
                  className="btn btn-light shadow-sm"
                  onClick={() => {
                    if (userLocation && mapInstanceRef.current) {
                      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 12)
                    }
                  }}
                  style={{ width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Center on My Location"
                >
                  <i className="fe fe-navigation"></i>
                </button>
              </div>

              <div
                style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  right: '16px',
                  zIndex: 1000,
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              >
                <label className="form-label mb-2" style={{ fontSize: '12px', fontWeight: '600' }}>
                  Search Radius: {radius} km
                </label>
                <div className="d-flex gap-2">
                  {[5, 10, 15, 20, 25].map((r) => (
                    <button
                      key={r}
                      className={`btn btn-sm ${radius === r ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setRadius(r)}
                      style={{ flex: 1 }}
                    >
                      {r}km
                    </button>
                  ))}
                </div>
              </div>

              {isLoadingClinics && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 500,
                  }}
                >
                  <div className="text-center">
                    <div className="spinner-border text-primary mb-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-muted mb-0">Finding nearby clinics...</p>
                  </div>
                </div>
              )}

              {clinicsError && (
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    right: '16px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <i className="fe fe-alert-circle text-danger"></i>
                  <span className="flex-grow-1 text-danger">Failed to load clinics</span>
                  <button className="btn btn-sm btn-primary" onClick={() => refetch()}>
                    Retry
                  </button>
                </div>
              )}

              {!mapLoaded && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(248, 249, 250, 0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 600,
                  }}
                >
                  <div className="text-center">
                    <div className="spinner-border text-primary mb-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-muted mb-0">Loading map...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="col-lg-4" style={{ height: '100vh', overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
            <div className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                  <span className="text-primary">{nearbyClinics.length}</span> Nearby Clinics
                </h5>
                {!locationPermission && (
                  <span className="badge bg-warning text-dark">
                    <i className="fe fe-alert-circle me-1"></i>
                    Location disabled
                  </span>
                )}
              </div>

              <div className="d-flex align-items-center justify-content-between mb-3">
                <Link to="/search" className="btn btn-sm btn-outline-secondary">
                  <i className="fe fe-arrow-left me-1"></i> Back
                </Link>
                <Link to="/map-grid" className="btn btn-sm btn-outline-primary">
                  <i className="fe fe-grid me-1"></i> Search Map
                </Link>
              </div>

              {isLoadingClinics ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary mb-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-muted mb-0">Loading clinics...</p>
                </div>
              ) : nearbyClinics.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fe fe-map-pin" style={{ fontSize: '48px', color: '#6c757d' }}></i>
                  <p className="mt-3 mb-1 fw-semibold">No clinics found nearby</p>
                  <p className="text-muted small">Try increasing the search radius</p>
                </div>
              ) : (
                <div className="list-group">
                  {nearbyClinics.map((clinic) => (
                    <div
                      key={clinic.clinicId || clinic._id}
                      className="list-group-item list-group-item-action mb-2 border rounded"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedClinic(clinic)
                        setShowClinicModal(true)
                        const latRaw = clinic.coordinates?.lat ?? clinic.lat
                        const lngRaw = clinic.coordinates?.lng ?? clinic.lng
                        const lat = latRaw != null && latRaw !== '' ? Number(latRaw) : NaN
                        const lng = lngRaw != null && lngRaw !== '' ? Number(lngRaw) : NaN
                        if (Number.isFinite(lat) && Number.isFinite(lng) && mapInstanceRef.current) {
                          mapInstanceRef.current.setView([lat, lng], 14)
                        }
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h6 className="mb-1 fw-semibold">{clinic.clinicName || clinic.name}</h6>
                          <p className="text-muted small mb-1">{clinic.veterinarianName || clinic.doctorName}</p>
                          <div className="d-flex align-items-center mb-1">
                            <i className="fe fe-map-pin me-1" style={{ fontSize: '12px', color: '#6c757d' }}></i>
                            <span className="text-muted small">
                              {clinic.address}, {clinic.city}
                            </span>
                          </div>
                          {clinic.distance && (
                            <div className="d-flex align-items-center">
                              <i className="fe fe-navigation me-1" style={{ fontSize: '12px', color: '#0d6efd' }}></i>
                              <span className="text-primary small fw-semibold">{Number(clinic.distance).toFixed(1)} km away</span>
                            </div>
                          )}
                        </div>
                        <i className="fe fe-chevron-right text-muted"></i>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showClinicModal && selectedClinic && (
        <div
          className="modal fade show"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowClinicModal(false)}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selectedClinic.clinicName || selectedClinic.name}</h5>
                <button type="button" className="btn-close" onClick={() => setShowClinicModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small text-muted text-uppercase">Veterinarian</label>
                  <p className="mb-0">{selectedClinic.veterinarianName || selectedClinic.doctorName || '—'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label small text-muted text-uppercase">Address</label>
                  <p className="mb-0">
                    {selectedClinic.address || '—'}{selectedClinic.city ? `, ${selectedClinic.city}` : ''}
                  </p>
                </div>
                {selectedClinic.phone && (
                  <div className="mb-3">
                    <label className="form-label small text-muted text-uppercase">Phone</label>
                    <p className="mb-0">
                      <a href={`tel:${selectedClinic.phone}`}>{selectedClinic.phone}</a>
                    </p>
                  </div>
                )}
                {selectedClinic.distance && (
                  <div className="mb-3">
                    <label className="form-label small text-muted text-uppercase">Distance</label>
                    <p className="mb-0">{Number(selectedClinic.distance).toFixed(1)} km away</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-primary" onClick={() => handleViewVet(selectedClinic)}>
                  <i className="fe fe-user me-2"></i>
                  View Veterinarian
                </button>
                <button type="button" className="btn btn-primary" onClick={() => handleBookAppointment(selectedClinic)}>
                  <i className="fe fe-calendar me-2"></i>
                  Book Appointment
                </button>
                <Link
                  to="/clinic-navigation"
                  state={{
                    clinic: {
                      name: selectedClinic.clinicName || selectedClinic.name,
                      address: `${selectedClinic.address || ''}${selectedClinic.city ? `, ${selectedClinic.city}` : ''}`,
                      phone: selectedClinic.phone,
                      lat: selectedClinic.coordinates?.lat ?? selectedClinic.lat,
                      lng: selectedClinic.coordinates?.lng ?? selectedClinic.lng,
                    },
                  }}
                  className="btn btn-outline-secondary"
                  onClick={() => setShowClinicModal(false)}
                >
                  <i className="fe fe-navigation me-2"></i>
                  Navigate
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClinicMapView
