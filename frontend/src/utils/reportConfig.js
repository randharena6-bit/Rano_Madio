import { CATEGORIES, URGENCES } from './placeConfig'

// Seuil de détection de doublons (étape 7)
export const SEUIL_DOUBLON_M = 80

// Statut imposé à tout signalement créé
export const STATUT_INITIAL = 'non_vérifié'
export const SOURCE_SIGNALEMENT = 'signalement'

// Limites du formulaire court (< 1 min)
export const LIMITES = {
  DESC_MIN: 10,
  DESC_MAX: 500,
  PHOTO_MAX_BYTES: 500_000,
  PHOTO_MAX_WIDTH: 1280,
  NB_PHOTOS: 1,
}

// Clés localStorage (étape 2)
export const STORAGE_KEYS = {
  SIGNALEMENTS: 'ranomadio.signalements.v1',
  BROUILLON: 'ranomadio.brouillon.v1',
}

/**
 * Explication courte de chaque niveau d'urgence (affichée sous le radio)
 * Les clés sont dérivées d'URGENCES pour garantir ordre et cohérence
 */
export const URGENCES_EXPPLICATION = {
  aucune: 'Information simple, sans gêne ni danger.',
  normale: 'Gêne quotidienne, le service reste utilisable.',
  'élevée': 'Service interrompu ou fortement dégradé.',
  critique: 'Danger immédiat pour les personnes ou les biens.',
}

/**
 * Liste complète des urgences enrichie de leur explication
 * Suit l'ordre de URGENCES (croissant)
 */
export const URGENCES_DETAILLEES = URGENCES.map((urgence) => ({
  ...urgence,
  explication: URGENCES_EXPPLICATION[urgence.cle] || '',
}))

/**
 * Couleurs d'affichage par niveau d'urgence (radio du formulaire)
 */
export const URGENCES_COULEURS = {
  aucune: '#64748B',
  normale: '#16A34A',
  'élevée': '#EA580C',
  critique: '#DC2626',
}

// Ré-exports : point d'entrée unique pour le formulaire (étape 6)
export { CATEGORIES, URGENCES }
