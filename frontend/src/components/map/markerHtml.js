import { CATEGORIES, STATUTS, URGENCE_RANG } from '../../config/place'

const STATUT_CONFIG = {
  fonctionnel: {
    label: 'fonctionnelle',
    pastilleIcon: 'check',
    pastilleForme: 'cercle'
  },
  'dégradé': {
    label: 'dégradée',
    pastilleIcon: 'triangle-alert',
    pastilleForme: 'triangle'
  },
  en_panne: {
    label: 'hors service',
    pastilleIcon: 'x',
    pastilleForme: 'carre'
  },
  'non_vérifié': {
    label: 'non vérifiée',
    pastilleIcon: 'circle-question-mark',
    pastilleForme: 'losange'
  }
}

const PASTILLE_SVG = {
  check: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>',
  'triangle-alert': '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
  x: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
  'circle-question-mark': '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
}

export const CATEGORIE_SVG = {
  borne_fontaine: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"></path></svg>',
  puits: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path></svg>',
  forage: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="1"></circle><path d="M12 6v6m0 0 4 4m-4-4-4 4"></path><circle cx="12" cy="12" r="10"></circle></svg>',
  canal: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12h20M12 2v20"></path></svg>',
  pont: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M5 12c0-4 4-7 7-7s7 3 7 7M5 12c0 4 4 7 7 7s7-3 7-7"></path></svg>',
  'école': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path></svg>',
  'marché': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
  ruelle: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>'
}

export function markerHtml({ place, selected = false }) {
  const statut = STATUTS.find(s => s.cle === place.statut) || STATUTS[0]
  const urgenceRang = place.urgence ? URGENCE_RANG[place.urgence] || 0 : 0
  const isCritique = urgenceRang >= URGENCE_RANG.critique
  const statutConfig = STATUT_CONFIG[place.statut] || STATUT_CONFIG['non_vérifié']

  const pinForme = getPinForme(statut.forme)
  const pastilleForme = getPastilleForme(statutConfig.pastilleForme)
  const pastilleIcon = PASTILLE_SVG[statutConfig.pastilleIcon] || ''
  const categorieIcon = CATEGORIE_SVG[place.categorie] || ''
  const ariaLabel = buildAriaLabel(place, statutConfig.label)

  const haloClass = isCritique ? 'marker-halo marker-halo--critique' : ''
  const selectedClass = selected ? 'marker--selected' : ''

  return `
    <div class="marker ${haloClass} ${selectedClass}" 
         role="button" 
         tabindex="0" 
         aria-label="${escapeHtml(ariaLabel)}"
         data-id="${escapeHtml(place.id)}"
         style="--marker-color: ${statut.couleur};">
      <div class="marker-pin ${pinForme}" style="background: ${statut.couleur};">
        <div class="marker-categorie">
          ${categorieIcon}
        </div>
      </div>
      <div class="marker-pastille ${pastilleForme}" style="background: ${statut.couleur}; border: 2px solid white;">
        ${pastilleIcon}
      </div>
    </div>
  `
}

function getPinForme(forme) {
  switch (forme) {
    case 'triangle': return 'marker-pin--triangle'
    case 'carre': return 'marker-pin--carre'
    case 'losange': return 'marker-pin--losange'
    case 'cercle':
    default: return 'marker-pin--cercle'
  }
}

function getPastilleForme(forme) {
  switch (forme) {
    case 'triangle': return 'marker-pastille--triangle'
    case 'carre': return 'marker-pastille--carre'
    case 'losange': return 'marker-pastille--losange'
    case 'cercle':
    default: return 'marker-pastille--cercle'
  }
}

function buildAriaLabel(place, statutLabel) {
  const categorieLabel = CATEGORIES.find(c => c.cle === place.categorie)?.labelFR || place.categorie
  const base = `${categorieLabel} ${place.nom || ''}, ${statutLabel}`
  const verification = place.derniereVerification ? `, vérifié ${place.derniereVerification.toLowerCase()}` : ''
  return `${base}${verification}`.replace(/\s+,/g, ',').replace(/\s+/g, ' ').trim()
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

export function getMarkerStyles() {
  return `
    <style>
      .marker {
        width: 44px;
        height: 44px;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 2px;
        cursor: pointer;
        transform-origin: center;
        transition: transform 0.2s ease;
      }
      .marker:focus-visible {
        outline: 2px solid var(--brand, #2563eb);
        outline-offset: 2px;
        border-radius: 50%;
      }
      .marker--selected {
        transform: scale(1.15);
        z-index: 1000;
      }
      .marker--selected::after {
        content: '';
        position: absolute;
        width: 48px;
        height: 48px;
        border: 3px solid var(--brand, #2563eb);
        border-radius: 50%;
        pointer-events: none;
      }
      .marker-pin {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        position: relative;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      }
      .marker-pin--cercle { border-radius: 50%; }
      .marker-pin--carre { border-radius: 4px; }
      .marker-pin--triangle { clip-path: polygon(50% 0%, 0% 100%, 100% 100%); }
      .marker-pin--losange { transform: rotate(45deg); }
      .marker-pin--losange .marker-categorie { transform: rotate(-45deg); }
      .marker-categorie { display: flex; align-items: center; justify-content: center; color: white; }
      .marker-pastille {
        position: absolute;
        bottom: -2px;
        right: -2px;
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        border-radius: 50%;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
        z-index: 1;
      }
      .marker-pastille--triangle { clip-path: polygon(50% 0%, 0% 100%, 100% 100%); width: 18px; height: 16px; }
      .marker-pastille--carre { border-radius: 2px; }
      .marker-pastille--losange { transform: rotate(45deg); width: 14px; height: 14px; }
      .marker-pastille--losange svg { transform: rotate(-45deg); }
      .marker-halo--critique::before {
        content: '';
        position: absolute;
        width: 56px;
        height: 56px;
        border: 2px solid #DC2626;
        border-radius: 50%;
        animation: marker-pulse 1.5s ease-out infinite;
        pointer-events: none;
        z-index: 0;
      }
      @keyframes marker-pulse {
        0% { transform: scale(0.8); opacity: 1; }
        70% { transform: scale(1.3); opacity: 0.4; }
        100% { transform: scale(1.4); opacity: 0; }
      }
      @media (prefers-reduced-motion: reduce) {
        .marker-halo--critique::before { animation: none; }
        .marker { transition: none; }
      }
    </style>
  `
}
