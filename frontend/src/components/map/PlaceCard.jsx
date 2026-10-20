import { MapPin, Navigation, Share2 } from 'lucide-react'
import { CATEGORIES, STATUTS, URGENCE_RANG } from '../../config/place'
import FiabiliteJauge from './FiabiliteJauge'
import AlternativesList from './AlternativesList'
import { haversine, formatDistance } from '../../utils/geo'
import { relativeTime, dateExactePourTitle } from '../../utils/placeDates'

export default function PlaceCard({ place, places, titleRef, onSelectPlace, isMobile }) {
  if (!place) return null

  const categorie = CATEGORIES.find((c) => c.cle === place.categorie) || CATEGORIES[0]
  const statut = STATUTS.find((s) => s.cle === place.statut) || STATUTS[0]
  const urgenceRang = URGENCE_RANG[place.urgence] || 0
  const isUrgent = urgenceRang >= URGENCE_RANG.elevée

  const handleItineraire = () => {
    const [lat, lng] = place.coords
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handlePartager = async () => {
    const shareData = {
      title: place.nom,
      text: `${place.nom} - ${statut.label}`,
      url: window.location.href
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        if (err.name !== 'AbortError') {
          navigator.clipboard.writeText(shareData.url)
        }
      }
    } else {
      navigator.clipboard.writeText(shareData.url)
    }
  }

  const isRepliNeeded = place.statut === 'dégradé' || place.statut === 'en_panne'

  return (
    <div className="place-card">
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h2 ref={titleRef} tabIndex={-1} className="text-lg font-semibold text-gray-900 focus:outline-none">
              {place.nom}
            </h2>
            <p className="text-sm text-gray-600 mt-0.5">{categorie.labelFR}</p>
            <p className="text-sm text-gray-500">
              {place.fokontany}
              {place.commune && ` · ${place.commune}`}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 flex items-center gap-3 bg-gray-50">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-full"
          style={{ backgroundColor: statut.couleur, color: 'white' }}
          aria-hidden="true"
        >
          <span className="text-lg font-bold">
            {statut.cle === 'fonctionnel' ? '✓' : statut.cle === 'dégradé' ? '⚠' : statut.cle === 'en_panne' ? '✕' : '?'}
          </span>
        </div>
        <div>
          <p className="font-medium text-gray-900">{statut.label}</p>
          {isUrgent && (
            <p className="text-sm font-medium text-red-700 flex items-center gap-1 mt-0.5">
              <span className="inline-block w-2 h-2 bg-red-600 rounded-full animate-pulse" />
              Urgence {place.urgence}
            </p>
          )}
        </div>
      </div>

      <div className="px-4 py-3 border-t border-gray-100">
        <p className="text-sm text-gray-600" title={dateExactePourTitle(place.derniereVerification)}>
          <MapPin size={14} className="inline mr-1" />
          Vérifié {relativeTime(place.derniereVerification)} par l'association
        </p>
      </div>

      <div className="px-4 py-3 border-t border-gray-100">
        <FiabiliteJauge fiabilite={place.fiabilite} />
      </div>

      {isRepliNeeded && place.identifiantsAlternatifs && (
        <div className="px-4 py-3 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Lieux de repli à proximité
          </h3>
          <AlternativesList
            place={place}
            places={places}
            onSelectPlace={onSelectPlace}
          />
        </div>
      )}

      <div className="px-4 py-3 border-t border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Informations pratiques</h3>
        <div className="space-y-1 text-sm text-gray-600">
          {place.horaires && (
            <p>Horaires : {place.horaires}</p>
          )}
          {place.accessibilite && (
            <p>Accès : {place.accessibilite}</p>
          )}
        </div>
      </div>

      <div className="px-4 py-3 border-t border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Actions</h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleItineraire}
            className="flex items-center gap-2 px-3 h-11 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Navigation size={16} />
            Itinéraire
          </button>
          <button
            type="button"
            onClick={handlePartager}
            className="flex items-center gap-2 px-3 h-11 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
          >
            <Share2 size={16} />
            Partager
          </button>
        </div>
      </div>

      {place.identifiantsAlternatifs && place.identifiantsAlternatifs.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Identifiants alternatifs</h3>
          <div className="flex flex-wrap gap-2">
            {place.identifiantsAlternatifs.map((alt, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono"
              >
                {alt}
              </span>
            ))}
          </div>
        </div>
      )}

      {place.historique && place.historique.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Historique des vérifications</h3>
          <div className="space-y-2">
            {place.historique.map((entry, index) => {
              const statutEntry = STATUTS.find((s) => s.cle === entry.statut)
              return (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: statutEntry?.couleur || '#999' }}
                  />
                  <div>
                    <p className="text-gray-900">
                      {new Date(entry.date).toLocaleDateString('fr-FR')}
                      {' — '}
                      {statutEntry?.label || entry.statut}
                    </p>
                    {entry.commentaire && (
                      <p className="text-gray-600 text-xs mt-0.5">{entry.commentaire}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
