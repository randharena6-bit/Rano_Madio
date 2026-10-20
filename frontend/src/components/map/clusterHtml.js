import { STATUTS } from '../../config/place'

function getWorstStatut(markers) {
  let worst = 'fonctionnel'
  const priority = {
    en_panne: 3,
    'dégradé': 2,
    'non_vérifié': 1,
    fonctionnel: 0
  }

  for (const marker of markers) {
    const place = marker.options?.place || marker.place
    if (!place) continue
    const statut = place.statut
    if (priority[statut] > priority[worst]) {
      worst = statut
      if (worst === 'en_panne') break
    }
  }
  return worst
}

export function clusterHtml(count, markers) {
  const worst = getWorstStatut(markers)
  const statut = STATUTS.find(s => s.cle === worst) || STATUTS[0]
  
  let borderColor = statut.couleur
  if (worst === 'en_panne') {
    borderColor = '#DC2626'
  }

  return `
    <div class="cluster-badge"
         role="button"
         tabindex="0"
         aria-label="Grouper ${count} lieux, activer pour zoomer"
         style="--cluster-bg: ${statut.couleur}33; --cluster-border: ${borderColor}; --cluster-color: ${worst === 'fonctionnel' ? '#166534' : worst === 'non_vérifié' ? '#475569' : '#991B1B'};">
      <span class="cluster-badge__count" aria-hidden="true">${count}</span>
    </div>
  `
}

export function getClusterStyles() {
  return `
    <style>
      .cluster-badge {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: var(--cluster-bg);
        border: 3px solid var(--cluster-border);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--cluster-color);
        font-weight: 700;
        font-size: 14px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        cursor: pointer;
      }
      .cluster-badge:focus-visible {
        outline: 2px solid #1877f2;
        outline-offset: 2px;
      }
      .leaflet-cluster-anim .leaflet-marker-icon {
        transition: transform 0.3s ease-out;
      }
      @media (prefers-reduced-motion: reduce) {
        .leaflet-cluster-anim .leaflet-marker-icon {
          transition: none;
        }
      }
    </style>
  `
}
