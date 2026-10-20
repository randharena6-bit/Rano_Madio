import { haversine } from './geo'
import { SEUIL_DOUBLON_M } from './reportConfig'

/**
 * Statuts de lieux qui constituent déjà un problème connu
 * (un lieu fonctionnel n'est pas un doublon)
 */
const STATUTS_DEJA_CONNUS = ['en_panne', 'dégradé', 'non_vérifié']

function candidateCoords(item) {
  if (Array.isArray(item?.coords)) return item.coords
  const coords = item?.localisation?.coords
  return Array.isArray(coords) ? coords : null
}

/**
 * Cherche le doublon le plus proche (< seuil) pour un type donné.
 * Compare aux signalements existants (même type) ET aux lieux
 * (même catégorie, déjà connus en problème).
 *
 * @param {Object} params
 * @param {string} params.type - Clé de catégorie
 * @param {[number, number] | null} params.coords - Point du nouveau signalement
 * @param {Array} params.reports - Signalements existants
 * @param {Array} params.places - Lieux (places.json)
 * @param {number} [params.seuil] - Seuil en mètres (défaut 80)
 * @returns {{source: 'signalement'|'lieu', item: Object, distance: number} | null}
 */
export function findNearbyDoublon({
  type,
  coords,
  reports = [],
  places = [],
  seuil = SEUIL_DOUBLON_M,
}) {
  const [lat, lng] = coords || []
  if (!type || !Number.isFinite(lat) || !Number.isFinite(lng)) return null

  const distanceFrom = (other) => haversine([lat, lng], other)
  let best = null

  const consider = (item, source) => {
    const other = candidateCoords(item)
    if (!other) return
    const distance = distanceFrom(other)
    if (distance > seuil) return
    if (!best || distance < best.distance) {
      best = { source, item, distance }
    }
  }

  for (const report of reports) {
    if (!report || report.type !== type) continue
    consider(report, 'signalement')
  }

  for (const place of places) {
    if (!place || place.categorie !== type) continue
    if (!STATUTS_DEJA_CONNUS.includes(place.statut)) continue
    consider(place, 'lieu')
  }

  return best
}
