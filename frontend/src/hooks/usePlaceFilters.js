import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { haversine } from '../utils/geo'
import { SEUILS_FIABILITE, SEUILS_MISE_A_JOUR } from '../utils/placeConfig'

export function usePlaceFilters(places = []) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [nearCoords, setNearCoords] = useState(null)

  const filters = useMemo(() => {
    return {
      cat: searchParams.getAll('cat'),
      status: searchParams.getAll('status'),
      urg: searchParams.getAll('urg'),
      rel: searchParams.getAll('rel'),
      upd: searchParams.getAll('upd'),
      q: searchParams.get('q') || '',
      zone: searchParams.getAll('zone'),
      near: searchParams.get('near') || '',
      focus: searchParams.get('focus') || ''
    }
  }, [searchParams])

  useEffect(() => {
    if (filters.near) {
      const parts = filters.near.split(',')
      if (parts.length === 2) {
        const lat = parseFloat(parts[0])
        const lng = parseFloat(parts[1])
        if (!isNaN(lat) && !isNaN(lng)) {
          setNearCoords([lat, lng])
          return
        }
      }
    }
    setNearCoords(null)
  }, [filters.near])

  const filteredPlaces = useMemo(() => {
    let result = [...places]

    if (filters.cat.length > 0) {
      result = result.filter((p) => filters.cat.includes(p.categorie))
    }

    if (filters.status.length > 0) {
      result = result.filter((p) => filters.status.includes(p.statut))
    }

    if (filters.urg.length > 0) {
      result = result.filter((p) => filters.urg.includes(p.urgence))
    }

    if (filters.rel.length > 0) {
      result = result.filter((p) => {
        const score = p.fiabilite?.score || 0
        return filters.rel.some((r) => {
          if (r === 'faible') return score < SEUILS_FIABILITE.MOYEN
          if (r === 'moyen') return score >= SEUILS_FIABILITE.MOYEN
          if (r === 'eleve') return score >= SEUILS_FIABILITE.ELEVE
          return false
        })
      })
    }

    if (filters.upd.length > 0) {
      result = result.filter((p) => {
        const rel = p.derniereVerification?.toLowerCase() || ''
        return filters.upd.some((u) => {
          if (u === '24h') return rel.includes('h') && /il y a\s*\d+\s*h/.test(rel)
          if (u === '7j') return (rel.includes('j') && /il y a\s*\d+\s*j/.test(rel) && getDays(rel) <= SEUILS_MISE_A_JOUR.JOURS_7) || (rel.includes('h'))
          if (u === '30j') return /il y a\s*\d+\s*[hj]/.test(rel) && getDays(rel) <= SEUILS_MISE_A_JOUR.JOURS_30
          return false
        })
      })
    }

    if (filters.zone.length > 0) {
      result = result.filter((p) => {
        return filters.zone.some((z) => {
          const nz = normalizeString(z)
          const nf = normalizeString(p.fokontany)
          const nc = normalizeString(p.commune)
          return nf.includes(nz) || nc.includes(nz)
        })
      })
    }

    if (filters.q) {
      const nq = normalizeString(filters.q)
      result = result.filter((p) => {
        return (
          normalizeString(p.nom).includes(nq) ||
          normalizeString(p.fokontany).includes(nq) ||
          normalizeString(p.commune).includes(nq) ||
          (p.description && normalizeString(p.description).includes(nq))
        )
      })
    }

    if (nearCoords) {
      result = result.map((p) => ({
        ...p,
        _distance: haversine(p.coords, nearCoords)
      }))
      result.sort((a, b) => (a._distance || 0) - (b._distance || 0))
    }

    return result
  }, [places, filters, nearCoords])

  const applyFilters = useCallback((newFilters) => {
    const params = new URLSearchParams()

    if (newFilters.cat && Array.isArray(newFilters.cat)) {
      for (const c of newFilters.cat) params.append('cat', c)
    }
    if (newFilters.status && Array.isArray(newFilters.status)) {
      for (const s of newFilters.status) params.append('status', s)
    }
    if (newFilters.urg && Array.isArray(newFilters.urg)) {
      for (const u of newFilters.urg) params.append('urg', u)
    }
    if (newFilters.rel && Array.isArray(newFilters.rel)) {
      for (const r of newFilters.rel) params.append('rel', r)
    }
    if (newFilters.upd && Array.isArray(newFilters.upd)) {
      for (const up of newFilters.upd) params.append('upd', up)
    }
    if (newFilters.zone && Array.isArray(newFilters.zone)) {
      for (const z of newFilters.zone) params.append('zone', z)
    }
    if (newFilters.q) params.set('q', newFilters.q)
    if (newFilters.near) params.set('near', newFilters.near)
    if (newFilters.focus) params.set('focus', newFilters.focus)

    setSearchParams(params)
  }, [setSearchParams])

  const reset = useCallback(() => {
    setSearchParams(new URLSearchParams())
    setNearCoords(null)
  }, [setSearchParams])

  const activeCount = useMemo(() => {
    let count = 0
    if (filters.cat.length > 0) count += filters.cat.length
    if (filters.status.length > 0) count += filters.status.length
    if (filters.urg.length > 0) count += filters.urg.length
    if (filters.rel.length > 0) count += filters.rel.length
    if (filters.upd.length > 0) count += filters.upd.length
    if (filters.zone.length > 0) count += filters.zone.length
    if (filters.q) count += 1
    if (filters.near) count += 1
    if (filters.focus) count += 1
    return count
  }, [filters])

  return {
    filters,
    filteredPlaces,
    applyFilters,
    reset,
    activeCount,
    nearCoords
  }
}

function getDays(relStr) {
  const matchH = relStr.match(/il y a\s*(\d+)\s*h/)
  if (matchH) return parseInt(matchH[1]) / 24
  const matchJ = relStr.match(/il y a\s*(\d+)\s*j/)
  if (matchJ) return parseInt(matchJ[1])
  return 999
}

function normalizeString(str) {
  if (!str) return ''
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}
