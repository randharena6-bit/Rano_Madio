import { useMemo } from 'react'
import { MapPin } from 'lucide-react'
import { STATUTS } from '../../config/place'
import { haversine, formatDistance } from '../../utils/geo'

export default function AlternativesList({ place, places, onSelectPlace }) {
  const alternatives = useMemo(() => {
    if (!place || !places || places.length === 0) return []

    const nearby = places
      .filter((p) => p.id !== place.id)
      .map((p) => ({
        ...p,
        distance: haversine(place.coords, p.coords)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)

    return nearby
  }, [place, places])

  if (alternatives.length === 0) return null

  return (
    <div className="alternatives-list space-y-2">
      {alternatives.map((alt) => {
        const statut = STATUTS.find((s) => s.cle === alt.statut) || STATUTS[0]
        
        return (
          <button
            key={alt.id}
            type="button"
            onClick={() => onSelectPlace(alt.id)}
            className="w-full flex items-center gap-3 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left"
            aria-label={`Voir ${alt.nom}, ${statut.label}, à ${formatDistance(alt.distance)}`}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: statut.couleur, color: 'white' }}
            >
              <span className="text-sm font-bold">
                {statut.cle === 'fonctionnel' ? '✓' : statut.cle === 'dégradé' ? '⚠' : statut.cle === 'en_panne' ? '✕' : '?'}
              </span>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{alt.nom}</p>
              <p className="text-xs text-gray-600 flex items-center gap-1">
                <MapPin size={12} />
                {formatDistance(alt.distance)} · {statut.label}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
