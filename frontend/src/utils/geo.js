export function haversine(coord1, coord2) {
  const [lat1, lng1] = coord1
  const [lat2, lng2] = coord2

  const R = 6371000
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180)
}

export function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  }
  const km = meters / 1000
  return `${km.toFixed(1).replace('.', ',')} km`
}

export function empriseParZone(coords) {
  if (!coords || coords.length === 0) return null

  let minLat = coords[0][0]
  let maxLat = coords[0][0]
  let minLng = coords[0][1]
  let maxLng = coords[0][1]

  for (let i = 1; i < coords.length; i++) {
    const [lat, lng] = coords[i]
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
  }

  return [
    [minLat, minLng],
    [maxLat, maxLng]
  ]
}

/**
 * Centroïde d'une liste de coordonnées [lat, lng]
 */
export function centroid(coordList) {
  if (!Array.isArray(coordList) || coordList.length === 0) return null

  let sumLat = 0
  let sumLng = 0
  let count = 0

  for (const [lat, lng] of coordList) {
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      sumLat += lat
      sumLng += lng
      count++
    }
  }

  if (count === 0) return null
  return [sumLat / count, sumLng / count]
}

/**
 * Lieu le plus proche d'un point
 * @returns {{place: Object, distance: number} | null}
 */
export function nearestPlace(coords, places = []) {
  const [lat, lng] = coords || []
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  let best = null
  for (const place of places) {
    const p = place?.coords
    if (!p || !Number.isFinite(p[0]) || !Number.isFinite(p[1])) continue
    const distance = haversine([lat, lng], p)
    if (!best || distance < best.distance) {
      best = { place, distance }
    }
  }
  return best
}

/**
 * Infère fokontany/commune à partir du lieu le plus proche
 * @returns {{fokontany?: string, commune?: string}}
 */
export function inferZone(coords, places = [], maxDistance = 3000) {
  const nearest = nearestPlace(coords, places)
  if (!nearest || nearest.distance > maxDistance) return {}
  const { fokontany, commune } = nearest.place
  return {
    ...(fokontany ? { fokontany } : {}),
    ...(commune ? { commune } : {}),
  }
}
