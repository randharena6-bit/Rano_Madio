import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, X, Clock, MapPin, Building2, Store, GraduationCap } from 'lucide-react'
import { usePlaces } from '../../hooks/usePlaces'
import { matchScore, normalize } from '../../utils/search'
import { getRecentSearches, addRecentSearch } from '../../utils/recentSearches'

const GROUP_ICONS = {
  Lieux: MapPin,
  'Fokontany & Quartiers': Building2,
  'Marchés': Store,
  'Écoles': GraduationCap,
}

export default function SearchBar() {
  const { places } = usePlaces()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inputRef = useRef(null)
  const isTypingRef = useRef(false)

  const urlQ = searchParams.get('q') || ''

  const [query, setQuery] = useState(urlQ)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [debouncedQuery, setDebouncedQuery] = useState(urlQ)
  const [recentSearches, setRecentSearches] = useState(getRecentSearches)

  useEffect(() => {
    if (!isTypingRef.current && urlQ !== query) {
      setQuery(urlQ)
      setDebouncedQuery(urlQ)
    }
  }, [urlQ])

  useEffect(() => {
    if (!isTypingRef.current) return
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
      const params = new URLSearchParams(searchParams)
      if (query) params.set('q', query)
      else params.delete('q')
      navigate(`/?${params.toString()}`, { replace: true })
      isTypingRef.current = false
    }, 150)
    return () => clearTimeout(timer)
  }, [query])

  const suggestions = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) return []
    const nq = normalize(debouncedQuery)
    const results = []
    const seenFokontany = new Set()
    const seenQuartier = new Set()
    const seenLieu = new Set()

    for (const place of places || []) {
      if (place.nom && matchScore(place.nom, nq) > 0) {
        const key = `lieu-${place.nom}`
        if (!seenLieu.has(key)) {
          seenLieu.add(key)
          results.push({ group: 'Lieux', label: place.nom, place, type: 'lieu' })
        }
      }
      if (place.fokontany && matchScore(place.fokontany, nq) > 0) {
        const key = `fok-${place.fokontany}`
        if (!seenFokontany.has(key)) {
          seenFokontany.add(key)
          results.push({ group: 'Fokontany & Quartiers', label: place.fokontany, place, type: 'fokontany' })
        }
      }
      if (place.commune && matchScore(place.commune, nq) > 0) {
        const key = `qtr-${place.commune}`
        if (!seenQuartier.has(key)) {
          seenQuartier.add(key)
          results.push({ group: 'Fokontany & Quartiers', label: place.commune, place, type: 'quartier' })
        }
      }
      if (place.categorie === 'marché' && place.nom && matchScore(place.nom, nq) > 0) {
        results.push({ group: 'Marchés', label: place.nom, place, type: 'lieu' })
      }
      if (place.categorie === 'école' && place.nom && matchScore(place.nom, nq) > 0) {
        results.push({ group: 'Écoles', label: place.nom, place, type: 'lieu' })
      }
    }
    return results.slice(0, 20)
  }, [places, debouncedQuery])

  const grouped = useMemo(() => {
    const map = {}
    for (const s of suggestions) {
      if (!map[s.group]) map[s.group] = []
      map[s.group].push(s)
    }
    return map
  }, [suggestions])

  const flatSuggestions = useMemo(() => Object.values(grouped).flat(), [grouped])

  const showHistory = isOpen && query.length < 2 && recentSearches.length > 0
  const showSuggestions = isOpen && query.length >= 2 && suggestions.length > 0
  const showDropdown = showHistory || showSuggestions

  const handleSelect = useCallback((item) => {
    addRecentSearch(item.label)
    setRecentSearches(getRecentSearches())
    setIsOpen(false)
    setActiveIndex(-1)
    setQuery(item.label)
    setDebouncedQuery(item.label)
    isTypingRef.current = false

    const params = new URLSearchParams(searchParams)
    params.set('q', item.label)
    params.delete('zone')

    if (item.type === 'lieu') {
      params.set('focus', item.place.id)
      navigate(`/?${params.toString()}`, { replace: true })
    } else {
      params.delete('focus')
      params.set('zone', item.label)
      navigate(`/?${params.toString()}`, { replace: true })
    }
  }, [searchParams, navigate])

  const items = useMemo(() => {
    if (showHistory) {
      return recentSearches.map((r) => ({ group: 'Historique', label: r, type: 'recent' }))
    }
    return flatSuggestions
  }, [showHistory, recentSearches, flatSuggestions])

  const handleKeyDown = useCallback((e) => {
    if (!showDropdown) {
      if (e.key === 'Escape') setIsOpen(false)
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((prev) => (prev + 1) % items.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((prev) => (prev <= 0 ? items.length - 1 : prev - 1))
        break
      case 'Enter': {
        e.preventDefault()
        const item = items[activeIndex]
        if (!item) break
        if (item.type === 'recent') {
          setQuery(item.label)
          setDebouncedQuery(item.label)
          isTypingRef.current = false
          setIsOpen(false)
          setActiveIndex(-1)
          const params = new URLSearchParams(searchParams)
          params.set('q', item.label)
          navigate(`/?${params.toString()}`, { replace: true })
        } else {
          handleSelect(item)
        }
        break
      }
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setActiveIndex(-1)
        break
      default:
        break
    }
  }, [showDropdown, items, activeIndex, handleSelect, searchParams, navigate])

  const handleInputChange = useCallback((e) => {
    isTypingRef.current = true
    setQuery(e.target.value)
    setIsOpen(true)
    setActiveIndex(-1)
  }, [])

  const handleClear = useCallback(() => {
    isTypingRef.current = false
    setQuery('')
    setDebouncedQuery('')
    setIsOpen(false)
    setActiveIndex(-1)
    inputRef.current?.focus()
    const params = new URLSearchParams(searchParams)
    params.delete('q')
    params.delete('focus')
    params.delete('zone')
    navigate(`/?${params.toString()}`, { replace: true })
  }, [searchParams, navigate])

  const handleBlur = useCallback((e) => {
    if (listboxRef.current?.contains(e.relatedTarget)) return
    setTimeout(() => setIsOpen(false), 150)
  }, [])

  const listboxRef = useRef(null)

  let optionIndex = -1

  return (
    <div className="search-bar relative w-full md:w-[420px] lg:w-[520px]">
      <div className="relative flex items-center">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
          size={20}
        />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={showDropdown ? 'search-listbox' : undefined}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `search-option-${activeIndex}` : undefined}
          placeholder="Rechercher un lieu, fokontany, quartier..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="w-full h-[48px] pl-11 pr-12 bg-white border border-[var(--border)] rounded-[24px] shadow-[var(--shadow-xs)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
          aria-label="Rechercher un lieu, fokontany, quartier..."
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-1 flex h-11 w-11 items-center justify-center rounded-full hover:bg-[var(--surface-alt)] text-[var(--text-muted)]"
            aria-label="Effacer la recherche"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          ref={listboxRef}
          id="search-listbox"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] max-h-80 overflow-y-auto z-50"
        >
          {showHistory && (
            <div className="p-2" role="group" aria-labelledby="search-history-label">
              <p
                id="search-history-label"
                role="presentation"
                className="px-2 py-1 text-xs font-semibold text-[var(--text-label)] uppercase"
              >
                Recherches récentes
              </p>
              {recentSearches.map((r, i) => {
                optionIndex = i
                return (
                  <button
                    key={r}
                    type="button"
                    role="option"
                    id={`search-option-${i}`}
                    aria-selected={activeIndex === i}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setQuery(r)
                      setDebouncedQuery(r)
                      isTypingRef.current = false
                      setIsOpen(false)
                      setActiveIndex(-1)
                      const params = new URLSearchParams(searchParams)
                      params.set('q', r)
                      navigate(`/?${params.toString()}`, { replace: true })
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-3 rounded-lg text-sm text-left ${
                      activeIndex === i ? 'bg-[var(--brand-soft)] text-[var(--brand-text)]' : 'text-[var(--text-title)] hover:bg-[var(--surface-alt)]'
                    }`}
                  >
                    <Clock size={14} className="text-gray-500 flex-shrink-0" />
                    {r}
                  </button>
                )
              })}
            </div>
          )}

          {showSuggestions && (
            <div className="p-2">
              {Object.entries(grouped).map(([group, groupItems], groupIdx) => {
                const Icon = GROUP_ICONS[group] || MapPin
                return (
                  <div
                    key={group}
                    className="mb-2 last:mb-0"
                    role="group"
                    aria-labelledby={`search-group-${groupIdx}`}
                  >
                    <p
                      id={`search-group-${groupIdx}`}
                      role="presentation"
                      className="px-2 py-1 text-xs font-semibold text-[var(--text-label)] uppercase flex items-center gap-1.5"
                    >
                      <Icon size={12} />
                      {group}
                    </p>
                    {groupItems.map((item) => {
                      optionIndex += 1
                      const idx = optionIndex
                      return (
                        <button
                          key={`${group}-${item.label}-${item.place?.id}`}
                          type="button"
                          role="option"
                          id={`search-option-${idx}`}
                          aria-selected={activeIndex === idx}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={`w-full flex items-center gap-2 px-3 py-3 rounded-lg text-sm text-left ${
                            activeIndex === idx ? 'bg-[var(--brand-soft)] text-[var(--brand-text)]' : 'text-[var(--text-title)] hover:bg-[var(--surface-alt)]'
                          }`}
                        >
                          <Icon size={14} className="text-gray-500 flex-shrink-0" />
                          <span className="truncate">{item.label}</span>
                          {item.place?.fokontany && (
                            <span className="ml-auto text-xs text-gray-500 flex-shrink-0">{item.place.fokontany}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
