import { useState, useEffect, useMemo, useCallback } from 'react'
import { matchScore, groupSuggestions } from '../utils/search'
import { addRecentSearch, getRecentSearches } from '../utils/recentSearches'

export function usePlaceSearch(places = [], options = {}) {
  const { debounceMs = 150, minLength = 2 } = options

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, debounceMs])

  const rawSuggestions = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < minLength) {
      return []
    }

    const results = []
    const seen = new Set()

    for (const place of places) {
      const candidates = []

      if (place.nom) candidates.push({ text: place.nom, type: 'lieu' })
      if (place.fokontany) candidates.push({ text: place.fokontany, type: 'fokontany' })
      if (place.commune) candidates.push({ text: place.commune, type: 'quartier' })
      if (place.categorie === 'marché' && place.nom) {
        candidates.push({ text: place.nom, type: 'marche' })
      }
      if (place.categorie === 'école' && place.nom) {
        candidates.push({ text: place.nom, type: 'ecole' })
      }
      if (place.identifiantsAlternatifs) {
        for (const alt of place.identifiantsAlternatifs) {
          candidates.push({ text: alt, type: 'lieu' })
        }
      }

      for (const candidate of candidates) {
        const score = matchScore(candidate.text, debouncedQuery)
        if (score > 0) {
          const key = `${candidate.type}-${candidate.text}-${place.id}`
          if (!seen.has(key)) {
            seen.add(key)
            results.push({
              type: candidate.type,
              value: candidate.text,
              place,
              score
            })
          }
        }
      }
    }

    results.sort((a, b) => b.score - a.score)
    return results.slice(0, 20)
  }, [places, debouncedQuery, minLength])

  useEffect(() => {
    setSuggestions(rawSuggestions)
  }, [rawSuggestions])

  const groupedSuggestions = useMemo(() => {
    return groupSuggestions(suggestions)
  }, [suggestions])

  const search = useCallback((q) => {
    const trimmed = q.trim()
    if (trimmed.length > 0) {
      addRecentSearch(trimmed)
    }
    setQuery(trimmed)
  }, [])

  const clearSearch = useCallback(() => {
    setQuery('')
    setDebouncedQuery('')
    setSuggestions([])
  }, [])

  return {
    query,
    debouncedQuery,
    suggestions,
    groupedSuggestions,
    search,
    setQuery,
    clearSearch,
    recentSearches: getRecentSearches()
  }
}
