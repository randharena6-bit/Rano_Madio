import { PILOT_CENTER } from '../config/place'
import { centroid, nearestPlace } from './geo'
import { SOURCE_SIGNALEMENT, STATUT_INITIAL } from './reportConfig'

/**
 * Transforme un Signalement en objet Lieu affichable sur la carte
 * (statut 'non_vérifié' — déjà géré par markerHtml/PlaceCard).
 *
 * Fallback de position (jamais de marqueur invisible) :
 * 1. coordonnées exactes du signalement
 * 2. centroïde des lieux du fokontany
 * 3. centroïde de toutes les données
 * 4. centre du pilote
 *
 * @param {Object} report - Signalement
 * @param {Array} places - Lieux pour l'inférence de zone
 * @returns {Object} Lieu-compatible
 */
export function reportToLieu(report, places = []) {
  const loc = report.localisation || {}
  let coords = Array.isArray(loc.coords) ? loc.coords : null
  let fokontany = loc.fokontany || undefined
  let commune = loc.commune || undefined

  if (!coords && fokontany) {
    const group = places.filter(
      (place) => place?.fokontany === fokontany && Array.isArray(place.coords),
    )
    coords = centroid(group.map((place) => place.coords))
  }

  if (coords && !fokontany) {
    const nearest = nearestPlace(coords, places)
    if (nearest && nearest.distance <= 3000) {
      fokontany = nearest.place.fokontany || undefined
      commune = nearest.place.commune || undefined
    }
  }

  if (!coords) {
    coords = centroid(places.map((place) => place?.coords).filter(Array.isArray))
  }
  if (!coords) {
    coords = PILOT_CENTER
  }

  const titre = (report.description || '').trim().split('\n')[0].slice(0, 60)

  return {
    id: report.id,
    nom: titre || `Signalement ${report.id}`,
    categorie: report.type,
    statut: STATUT_INITIAL,
    urgence: report.urgence,
    fiabilite: {
      score: 1,
      niveau: 'faible',
      justification: 'Signalement unique, non confirmé',
    },
    coords,
    commune,
    fokontany,
    adresse: loc.adresse,
    derniereVerification: 'à l’instant',
    description: report.description,
    source: SOURCE_SIGNALEMENT,
    createdAt: report.createdAt,
    auteurAnonyme: report.identite?.visibilite !== 'publique',
  }
}
