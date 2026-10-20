import { useState } from 'react'
import { Info, ChevronDown, ChevronUp } from 'lucide-react'
import { CATEGORIES, STATUTS } from '../../config/place'
import { CATEGORIE_SVG } from './markerHtml'

export default function MapLegend() {
  const [open, setOpen] = useState(false)

  return (
    <div className="map-legend absolute bottom-4 left-4 z-[1000]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 h-11 rounded-full border border-gray-300 bg-white/95 backdrop-blur shadow-md hover:bg-gray-50 transition-colors"
        aria-expanded={open}
        aria-label="Afficher la légende de la carte"
      >
        <Info size={16} />
        <span className="text-sm font-medium">Légende</span>
        {open ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>

      {open && (
        <div className="mt-2 bg-white/98 backdrop-blur rounded-lg shadow-lg border border-gray-200 p-3 max-w-xs max-h-[60vh] overflow-auto">
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2">
                Statuts
              </h3>
              <div className="space-y-1.5">
                {STATUTS.map((statut) => (
                  <div key={statut.cle} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: statut.couleur }}
                    />
                    <span className="text-xs text-gray-700">{statut.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2">
                Catégories
              </h3>
              <div className="grid grid-cols-1 gap-1.5">
                {CATEGORIES.map((cat) => (
                  <div key={cat.cle} className="flex items-center gap-2">
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center text-gray-600"
                      aria-hidden="true"
                      dangerouslySetInnerHTML={{
                        __html: CATEGORIE_SVG[cat.cle] || '',
                      }}
                    />
                    <span className="text-xs text-gray-700">{cat.labelFR}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs text-gray-500 border-t border-gray-100 pt-2">
              Légende lisible en niveaux de gris (couleur + forme + icône)
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
