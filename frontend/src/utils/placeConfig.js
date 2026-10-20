// Configuration des lieux selon spécification D2

/**
 * 8 catégories de lieux
 */
export const CATEGORIES = [
  {
    cle: 'borne_fontaine',
    labelFR: 'Borne-fontaine',
    icone: 'droplet'
  },
  {
    cle: 'puits',
    labelFR: 'Puits',
    icone: 'well'
  },
  {
    cle: 'forage',
    labelFR: 'Forage',
    icone: 'drill'
  },
  {
    cle: 'canal',
    labelFR: 'Canal',
    icone: 'waves'
  },
  {
    cle: 'pont',
    labelFR: 'Pont',
    icone: 'bridge'
  },
  {
    cle: 'école',
    labelFR: 'École',
    icone: 'school'
  },
  {
    cle: 'marché',
    labelFR: 'Marché',
    icone: 'store'
  },
  {
    cle: 'ruelle',
    labelFR: 'Ruelle',
    icone: 'path'
  }
]

/**
 * 4 statuts de fonctionnement
 */
export const STATUTS = [
  {
    cle: 'fonctionnel',
    label: 'Fonctionnel',
    couleur: '#16A34A',
    forme: 'cercle',
    icone: 'check-circle',
    slugURL: 'fonctionnel'
  },
  {
    cle: 'dégradé',
    label: 'Dégradé',
    couleur: '#EA580C',
    forme: 'triangle',
    icone: 'alert-triangle',
    slugURL: 'degrade'
  },
  {
    cle: 'en_panne',
    label: 'En panne',
    couleur: '#DC2626',
    forme: 'carre',
    icone: 'x-circle',
    slugURL: 'en-panne'
  },
  {
    cle: 'non_vérifié',
    label: 'Non vérifié',
    couleur: '#64748B',
    forme: 'losange',
    icone: 'help-circle',
    slugURL: 'non-verifie'
  }
]

/**
 * Rangs des urgences (ordre croissant)
 */
export const URGENCE_RANG = {
  aucune: 0,
  normale: 1,
  élevée: 2,
  critique: 3
}

/**
 * 4 niveaux d'urgence avec rangs
 */
export const URGENCES = [
  {
    cle: 'aucune',
    label: 'Aucune',
    rang: URGENCE_RANG.aucune,
    icone: 'info'
  },
  {
    cle: 'normale',
    label: 'Normale',
    rang: URGENCE_RANG.normale,
    icone: 'check'
  },
  {
    cle: 'élevée',
    label: 'Élevée',
    rang: URGENCE_RANG.elevée,
    icone: 'alert'
  },
  {
    cle: 'critique',
    label: 'Critique',
    rang: URGENCE_RANG.critique,
    icone: 'alert-octagon'
  }
]

/**
 * Seuils d'urgence
 * "Normale et plus" : rang >= normale (1)
 * "Haute et plus" : rang >= élevée (2)
 */
export const SEUILS_URGENCE = {
  NORMALE_ET_PLUS: URGENCE_RANG.normale,
  HAUTE_ET_PLUS: URGENCE_RANG.elevée
}

/**
 * Seuils de fiabilité
 * moyen ≥ 2, élevé ≥ 4
 */
export const SEUILS_FIABILITE = {
  MOYEN: 2,
  ELEVE: 4
}

/**
 * Seuils de mise à jour (en jours)
 * 24h / 7j / 30j
 */
export const SEUILS_MISE_A_JOUR = {
  HEURES_24: 1,
  JOURS_7: 7,
  JOURS_30: 30
}

// Raccourcis pratiques
export const getCategorieByKey = (key) => CATEGORIES.find(c => c.cle === key)
export const getStatutByKey = (key) => STATUTS.find(s => s.cle === key)
export const getUrgenceByKey = (key) => URGENCES.find(u => u.cle === key)
