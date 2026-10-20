const STORAGE_KEY = 'ranomadio_recent_searches'
const MAX_RECENT = 5

export function getRecentSearches() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    const parsed = JSON.parse(data)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Erreur lors de la lecture des recherches récentes:', error)
    return []
  }
}

export function addRecentSearch(query) {
  if (!query || typeof query !== 'string') return
  const trimmed = query.trim()
  if (trimmed.length === 0) return

  try {
    const recent = getRecentSearches()
    const filtered = recent.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())
    filtered.unshift(trimmed)
    const limited = filtered.slice(0, MAX_RECENT)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited))
  } catch (error) {
    console.error("Erreur lors de l'enregistrement des recherches récentes:", error)
  }
}

export function clearRecentSearches() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Erreur lors de la suppression des recherches récentes:', error)
  }
}
