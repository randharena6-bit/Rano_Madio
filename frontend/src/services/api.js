import placesData from '../data/places.json'

let placesCache = null

const simulateLatency = (ms = 80) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getPlaces() {
  if (placesCache !== null) {
    return placesCache
  }

  await simulateLatency(80)
  placesCache = placesData
  return placesCache
}

export async function getPlace(id) {
  const places = await getPlaces()
  const place = places.find((p) => p.id === id)
  return place || null
}

export function clearPlacesCache() {
  placesCache = null
}
