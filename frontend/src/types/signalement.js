/**
 * Types JSDoc pour le modèle Signalement (Phase 3 — Voix du quartier)
 * Réutilise la clé `Categorie` définie dans types/place.js
 */

/**
 * Source de la localisation choisie par l'auteur
 * @typedef {'gps' | 'carte' | 'fokontany' | 'repere' | 'texte'} SourceLocalisation
 */

/**
 * Précision de la localisation
 * 'exacte' : coordonnées GPS ou clic sur la carte
 * 'approximative' : centroïde de fokontany / repère / description texte
 * @typedef {'exacte' | 'approximative'} PrecisionLocalisation
 */

/**
 * Localisation d'un signalement
 * @typedef {Object} Localisation
 * @property {[number, number] | null} coords - [lat, lng] si disponible
 * @property {SourceLocalisation} source - Mode de saisie utilisé
 * @property {PrecisionLocalisation} precision - Exactitude des coordonnées
 * @property {string} [fokontany] - Fokontany (optionnel)
 * @property {string} [commune] - Commune (optionnel)
 * @property {string} [adresse] - Description texte / repère (optionnel)
 */

/**
 * Identité de l'auteur
 * @typedef {Object} Identite
 * @property {'publique' | 'anonyme'} visibilite - Affichage public ou anonymat
 * @property {string} [nom] - Nom (si publique)
 * @property {string} [telephone] - Téléphone (si publique)
 */

/**
 * Photo compressée côté client
 * @typedef {Object} PhotoSignalement
 * @property {string} dataUrl - JPEG en data URL
 * @property {number} bytes - Taille en octets (≤ PHOTO_MAX_BYTES)
 * @property {number} width - Largeur après redimensionnement
 * @property {number} height - Hauteur après redimensionnement
 */

/**
 * Signalement créé par un habitant
 * @typedef {Object} Signalement
 * @property {string} id - Identifiant unique ('SG-0001')
 * @property {string} type - Clé d'une catégorie de lieu (CATEGORIES)
 * @property {string} urgence - Clé d'une urgence (URGENCES)
 * @property {string} description - Description (≤ LIMITES.DESC_MAX)
 * @property {PhotoSignalement} [photo] - Photo facultative compressée
 * @property {Localisation} localisation - Localisation multiple
 * @property {Identite} identite - Choix publique/anonyme
 * @property {'non_vérifié'} statut - Statut initial imposé
 * @property {'signalement'} source - Origine du point
 * @property {string} createdAt - Date ISO 8601
 * @property {string} auteurId - UUID local de l'auteur (Phase 4: auth)
 */
