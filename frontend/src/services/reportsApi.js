import { CATEGORIES, URGENCES } from '../utils/placeConfig'
import { LIMITES, STATUT_INITIAL, SOURCE_SIGNALEMENT, STORAGE_KEYS } from '../utils/reportConfig'

/**
 * Mock API des signalements (Phase 3)
 * Persistance localStorage + latence simulée pour reproduire un backend.
 * Mode panne : hors-ligne ou ?simuler-panne=1 → les écritures échouent,
 * le brouillon (saveDraft) reste local.
 */

export class NetworkError extends Error {
  constructor(message = 'Réseau indisponible — réessayez plus tard') {
    super(message)
    this.name = 'NetworkError'
  }
}

export class ValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ValidationError'
  }
}

const simulateLatency = (min = 200, max = 600) => {
  const ms = Math.round(min + Math.random() * (max - min))
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const isNetworkDown = () => {
  const simulate =
    typeof location !== 'undefined' &&
    new URLSearchParams(location.search).has('simuler-panne')
  return simulate || (typeof navigator !== 'undefined' && navigator.onLine === false)
}

const VALID_TYPES = CATEGORIES.map((c) => c.cle)
const VALID_URGENCES = URGENCES.map((u) => u.cle)

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SIGNALEMENTS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeStore(items) {
  try {
    localStorage.setItem(STORAGE_KEYS.SIGNALEMENTS, JSON.stringify(items))
    return { ok: true }
  } catch (err) {
    if (err && err.name === 'QuotaExceededError') {
      return { ok: false, raison: 'quota' }
    }
    throw err
  }
}

function nextId(items) {
  const max = items.reduce((acc, item) => {
    const match = /^SG-(\d+)$/.exec(item?.id || '')
    return match ? Math.max(acc, Number(match[1])) : acc
  }, 0)
  return `SG-${String(max + 1).padStart(4, '0')}`
}

function validate(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Signalement invalide')
  }
  if (!VALID_TYPES.includes(payload.type)) {
    throw new ValidationError('Type de signalement manquant ou inconnu')
  }
  if (!VALID_URGENCES.includes(payload.urgence)) {
    throw new ValidationError('Niveau d’urgence manquant ou inconnu')
  }
  const description = (payload.description || '').trim()
  if (description.length < LIMITES.DESC_MIN) {
    throw new ValidationError(`Description trop courte (${LIMITES.DESC_MIN} caractères minimum)`)
  }
  if (description.length > LIMITES.DESC_MAX) {
    throw new ValidationError(`Description trop longue (${LIMITES.DESC_MAX} caractères maximum)`)
  }
  const localisation = payload.localisation
  if (!localisation || typeof localisation.source !== 'string') {
    throw new ValidationError('Localisation requise')
  }
  if (['gps', 'carte'].includes(localisation.source)) {
    const [lat, lng] = localisation.coords || []
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new ValidationError('Coordonnées manquantes pour cette source')
    }
  }
}

export async function listReports() {
  await simulateLatency()
  if (isNetworkDown()) throw new NetworkError()
  return readStore().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}

export async function createReport(payload) {
  validate(payload)
  await simulateLatency()
  if (isNetworkDown()) throw new NetworkError()

  const items = readStore()
  const report = {
    id: nextId(items),
    type: payload.type,
    urgence: payload.urgence,
    description: payload.description.trim(),
    photo: payload.photo || undefined,
    localisation: {
      source: payload.localisation.source,
      precision: payload.localisation.precision || 'approximative',
      coords: payload.localisation.coords || null,
      fokontany: payload.localisation.fokontany || undefined,
      commune: payload.localisation.commune || undefined,
      adresse: payload.localisation.adresse || undefined,
    },
    identite: {
      visibilite: payload.identite?.visibilite === 'publique' ? 'publique' : 'anonyme',
      nom: payload.identite?.visibilite === 'publique' ? payload.identite?.nom || undefined : undefined,
      telephone:
        payload.identite?.visibilite === 'publique' ? payload.identite?.telephone || undefined : undefined,
    },
    statut: STATUT_INITIAL,
    source: SOURCE_SIGNALEMENT,
    createdAt: new Date().toISOString(),
    auteurId:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `local-${Date.now()}`,
  }

  const result = writeStore([...items, report])
  if (!result.ok) {
    throw new ValidationError('Stockage local saturé — retirez la photo et réessayez')
  }
  return report
}

export async function getDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BROUILLON)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

export async function saveDraft(draft) {
  try {
    localStorage.setItem(STORAGE_KEYS.BROUILLON, JSON.stringify(draft))
    return { ok: true }
  } catch (err) {
    if (err && err.name === 'QuotaExceededError') {
      return { ok: false, raison: 'quota' }
    }
    return { ok: false, raison: 'stockage' }
  }
}

export async function clearDraft() {
  try {
    localStorage.removeItem(STORAGE_KEYS.BROUILLON)
  } catch {
    // stockage indisponible : rien à effacer
  }
}
