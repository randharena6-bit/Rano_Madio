/**
 * Types JSDoc pour le modèle Place (spécification D2)
 */

/**
 * Catégories de lieux
 * @typedef {'borne_fontaine' | 'puits' | 'forage' | 'canal' | 'pont' | 'école' | 'marché' | 'ruelle'} Categorie
 */

/**
 * Statuts de fonctionnement
 * @typedef {'fonctionnel' | 'dégradé' | 'en_panne' | 'non_vérifié'} Statut
 */

/**
 * Niveaux d'urgence
 * @typedef {'aucune' | 'normale' | 'élevée' | 'critique'} Urgence
 */

/**
 * Fiabilité d'un lieu
 * @typedef {Object} Fiabilite
 * @property {number} score - Score de fiabilité de 0 à 5
 * @property {string} niveau - Niveau : 'faible' | 'moyen' | 'élevé'
 * @property {string} [justification] - Justification optionnelle
 */

/**
 * Entrée d'historique
 * @typedef {Object} HistoriqueEntry
 * @property {string} date - Date ISO 2024-01-01T10:00:00Z
 * @property {Statut} statut - Statut à cette date
 * @property {Urgence} [urgence] - Urgence à cette date (optionnel)
 * @property {string} [commentaire] - Commentaire optionnel
 * @property {string} [source] - Source de l'information
 */

/**
 * Représentation d'un lieu d'eau/infrastructure
 * @typedef {Object} Lieu
 * @property {string} id - Identifiant unique
 * @property {string} nom - Nom du lieu
 * @property {Categorie} categorie - Catégorie du lieu
 * @property {Statut} statut - Statut actuel
 * @property {Urgence} urgence - Niveau d'urgence actuel
 * @property {Fiabilite} fiabilite - Informations de fiabilité
 * @property {[number, number]} coords - Coordonnées [lat, lng]
 * @property {string} commune - Commune
 * @property {string} fokontany - Fokontany
 * @property {string} [adresse] - Adresse précise (optionnelle)
 * @property {string} derniereVerification - Date/temps relatif ou ISO
 * @property {string} [description] - Description (optionnelle)
 * @property {string[]} [identifiantsAlternatifs] - Identifiants alternatifs
 * @property {HistoriqueEntry[]} [historique] - Historique des statuts
 */
