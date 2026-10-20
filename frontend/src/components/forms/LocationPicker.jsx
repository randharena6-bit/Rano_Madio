import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  LocateFixed,
  LoaderCircle,
  MapPin,
  MapPinned,
  Search,
  Type,
  X,
} from 'lucide-react'
import { PILOT_BOUNDS, PILOT_CENTER, TILE_URL, ZOOM_INITIAL } from '../../config/place'
import { useGeolocation } from '../../hooks/useGeolocation'
import { centroid, inferZone } from '../../utils/geo'
import { matchScore } from '../../utils/search'
import './reportForm.css'

const MODES = [
  { cle: 'gps', label: 'Position actuelle', Icon: LocateFixed },
  { cle: 'carte', label: 'Sur la carte', Icon: MapPinned },
  { cle: 'fokontany', label: 'Fokontany', Icon: MapPin },
  { cle: 'repere', label: 'Repère connu', Icon: Search },
  { cle: 'texte', label: 'Description', Icon: Type },
]

const SOURCE_LABELS = {
  gps: 'Position actuelle (GPS)',
  carte: 'Clic sur la carte',
  fokontany: 'Fokontany',
  repere: 'Repère connu',
  texte: 'Description texte',
}

function formatCoords(coords) {
  if (!coords) return null
  const [lat, lng] = coords
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

export default function LocationPicker({ value, onChange, places = [] }) {
  const [mode, setMode] = useState(value?.source || null)
  const geo = useGeolocation()
  const { coords: gpsCoords, loading: gpsLoading, error: gpsError, request: requestGps, clear: clearGps } = geo
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const containerRef = useRef(null)
  const placesRef = useRef(places)
  const appliedGpsRef = useRef(null)
  const [repereQuery, setRepereQuery] = useState('')
  const [texte, setTexte] = useState(value?.source === 'texte' ? value.adresse || '' : '')

  useEffect(() => {
    placesRef.current = places
  }, [places])

  // GPS : relance la demande dès l'entrée en mode GPS
  useEffect(() => {
    if (mode === 'gps' && !gpsCoords && !gpsLoading && !gpsError) {
      requestGps()
    }
  }, [mode, gpsCoords, gpsLoading, gpsError, requestGps])

  // GPS : applique la position dès qu'elle arrive
  useEffect(() => {
    if (mode !== 'gps' || !gpsCoords) return
    const key = `${gpsCoords.latitude},${gpsCoords.longitude}`
    if (appliedGpsRef.current === key) return
    appliedGpsRef.current = key
    const coords = [gpsCoords.latitude, gpsCoords.longitude]
    onChange({
      source: 'gps',
      coords,
      precision: 'exacte',
      ...inferZone(coords, placesRef.current),
    })
  }, [mode, gpsCoords, onChange])

  // Carte : mini-carte avec marqueur cliquable/déplaçable
  useEffect(() => {
    if (mode !== 'carte' || !containerRef.current) return undefined

    const start = value?.coords || PILOT_CENTER
    const map = L.map(containerRef.current, {
      center: start,
      zoom: ZOOM_INITIAL,
      maxBounds: PILOT_BOUNDS,
      maxBoundsViscosity: 0.8,
      minZoom: 11,
      scrollWheelZoom: false,
    })
    L.tileLayer(TILE_URL, {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    const marker = L.marker(start, { draggable: true }).addTo(map)
    mapRef.current = map
    markerRef.current = marker

    const apply = (latlng) => {
      const coords = [latlng.lat, latlng.lng]
      onChange({
        source: 'carte',
        coords,
        precision: 'exacte',
        ...inferZone(coords, placesRef.current),
      })
    }

    const onClick = (event) => {
      marker.setLatLng(event.latlng)
      apply(event.latlng)
    }
    const onDragEnd = () => apply(marker.getLatLng())

    map.on('click', onClick)
    marker.on('dragend', onDragEnd)

    const resizeTimer = window.setTimeout(() => map.invalidateSize(), 150)

    return () => {
      window.clearTimeout(resizeTimer)
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const fokontanyList = useMemo(() => {
    const byName = new Map()
    for (const place of places) {
      if (!place?.fokontany) continue
      if (!byName.has(place.fokontany)) {
        byName.set(place.fokontany, {
          fokontany: place.fokontany,
          commune: place.commune,
          coords: [],
        })
      }
      const entry = byName.get(place.fokontany)
      if (place.commune && !entry.commune) entry.commune = place.commune
      if (Array.isArray(place.coords)) entry.coords.push(place.coords)
    }
    return [...byName.values()].sort((a, b) =>
      a.fokontany.localeCompare(b.fokontany, 'fr'),
    )
  }, [places])

  const repereResults = useMemo(() => {
    const q = repereQuery.trim()
    if (q.length < 2) return []
    return places
      .filter((place) => place?.nom)
      .map((place) => ({
        place,
        score: Math.max(
          matchScore(place.nom, q),
          matchScore(place.adresse || '', q),
          matchScore(place.fokontany || '', q),
        ),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
  }, [places, repereQuery])

  const handleMode = (cle) => {
    if (cle === mode) return
    setMode(cle)
    setRepereQuery('')
    appliedGpsRef.current = null
    if (value?.source !== cle) {
      clearGps()
      onChange(null)
    }
  }

  const handleClear = () => {
    setMode(null)
    setRepereQuery('')
    setTexte('')
    appliedGpsRef.current = null
    clearGps()
    onChange(null)
  }

  const handleFokontany = (event) => {
    const entry = fokontanyList.find((f) => f.fokontany === event.target.value)
    if (!entry) {
      onChange(null)
      return
    }
    onChange({
      source: 'fokontany',
      coords: centroid(entry.coords),
      precision: 'approximative',
      fokontany: entry.fokontany,
      commune: entry.commune,
    })
  }

  const handleRepere = (place) => {
    onChange({
      source: 'repere',
      coords: Array.isArray(place.coords) ? place.coords : null,
      precision: 'approximative',
      fokontany: place.fokontany,
      commune: place.commune,
      adresse: place.nom,
    })
    setRepereQuery(place.nom)
  }

  const handleTexte = (event) => {
    const next = event.target.value
    setTexte(next)
    if (next.trim().length === 0) {
      onChange(null)
      return
    }
    onChange({
      source: 'texte',
      coords: null,
      precision: 'approximative',
      adresse: next.trim(),
    })
  }

  const recapCoords = formatCoords(value?.coords)

  return (
    <fieldset className="rf-fieldset">
      <legend className="rf-legend">
        2. Où se situe le problème ? <span className="rf-required">*</span>
      </legend>

      <div className="lp-modes" role="tablist" aria-label="Mode de localisation">
        {MODES.map(({ cle, label, Icon }) => (
          <button
            key={cle}
            type="button"
            role="tab"
            aria-selected={mode === cle}
            className={`lp-mode${mode === cle ? ' lp-mode--active' : ''}`}
            onClick={() => handleMode(cle)}
          >
            <Icon size={15} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {mode === 'gps' && (
        <div className="lp-panel">
          {gpsLoading && (
            <p className="lp-status" role="status">
              <LoaderCircle size={16} className="lp-spin" aria-hidden="true" />
              Recherche de votre position…
            </p>
          )}
          {gpsError && (
            <div className="lp-status lp-status--error" role="alert">
              <p>{gpsError.message}</p>
              <button type="button" className="lp-retry" onClick={requestGps}>
                Réessayer
              </button>
            </div>
          )}
          {!gpsLoading && !gpsError && !gpsCoords && (
            <p className="lp-status">
              Autorisez la géolocalisation ou choisissez un autre mode.
            </p>
          )}
          {gpsCoords && (
            <p className="lp-status">
              Position trouvée (précision ±{Math.round(gpsCoords.accuracy || 0)} m).
            </p>
          )}
        </div>
      )}

      {mode === 'carte' && (
        <div className="lp-panel">
          <p className="lp-hint">Touchez la carte pour placer le signalement, puis déplacez le marqueur si besoin.</p>
          <div
            ref={containerRef}
            className="lp-map"
            role="application"
            aria-label="Carte de sélection de la position"
          />
        </div>
      )}

      {mode === 'fokontany' && (
        <div className="lp-panel">
          <label className="rf-label" htmlFor="lp-fokontany">
            Choisissez votre fokontany
          </label>
          <select
            id="lp-fokontany"
            className="rf-input"
            value={value?.source === 'fokontany' ? value.fokontany : ''}
            onChange={handleFokontany}
          >
            <option value="">— Sélectionner —</option>
            {fokontanyList.map((entry) => (
              <option key={entry.fokontany} value={entry.fokontany}>
                {entry.fokontany}
                {entry.commune ? ` (${entry.commune})` : ''}
              </option>
            ))}
          </select>
          <p className="lp-hint">Position approximative : centre du fokontany.</p>
        </div>
      )}

      {mode === 'repere' && (
        <div className="lp-panel">
          <label className="rf-label" htmlFor="lp-repere">
            Cherchez un lieu connu (borne-fontaine, marché, école…)
          </label>
          <input
            id="lp-repere"
            type="search"
            className="rf-input"
            placeholder="Ex. : borne-fontaine Anosizato"
            value={repereQuery}
            onChange={(event) => setRepereQuery(event.target.value)}
            autoComplete="off"
          />
          {repereResults.length > 0 && (
            <ul className="lp-results">
              {repereResults.map(({ place }) => (
                <li key={place.id}>
                  <button
                    type="button"
                    className="lp-result"
                    onClick={() => handleRepere(place)}
                  >
                    <span className="lp-result__nom">{place.nom}</span>
                    <span className="lp-result__meta">
                      {place.fokontany}
                      {place.commune ? ` · ${place.commune}` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {repereQuery.trim().length >= 2 && repereResults.length === 0 && (
            <p className="lp-hint">Aucun repère trouvé — précisez ou changez de mode.</p>
          )}
        </div>
      )}

      {mode === 'texte' && (
        <div className="lp-panel">
          <label className="rf-label" htmlFor="lp-texte">
            Décrivez l’emplacement avec des mots
          </label>
          <textarea
            id="lp-texte"
            className="rf-input rf-textarea"
            rows={2}
            placeholder="Ex. : ruelle derrière l’école, 3e maison en partant de la route nationale"
            value={texte}
            onChange={handleTexte}
          />
          <p className="lp-hint">Sans coordonnées précises : la zone sera située au fokontany le plus proche lors de l’affichage.</p>
        </div>
      )}

      {value && (
        <div className="lp-recap" role="status">
          <MapPin size={16} aria-hidden="true" />
          <div className="lp-recap__body">
            <strong>{SOURCE_LABELS[value.source] || 'Localisation'}</strong>
            <span className="lp-recap__precision">
              {value.precision === 'exacte' ? 'Position précise' : 'Position approximative'}
            </span>
            {recapCoords && <span className="lp-recap__coords">{recapCoords}</span>}
            <span className="lp-recap__zone">
              {[value.fokontany, value.commune].filter(Boolean).join(' · ')}
              {value.adresse && !value.fokontany ? value.adresse : ''}
            </span>
          </div>
          <button
            type="button"
            className="lp-recap__clear"
            onClick={handleClear}
            aria-label="Effacer la localisation"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}
    </fieldset>
  )
}
