import { useState } from 'react'
import { MapPin, AlertTriangle, Plus } from 'lucide-react'
import { usePlaceFilters } from '../../hooks/usePlaceFilters'
import { useGeolocation } from '../../hooks/useGeolocation'
import MapFilters from './MapFilters'

export default function QuickFilters({ placesCount = 0, filteredCount = 0 }) {
  const { filters, applyFilters } = usePlaceFilters([])
  const { request, coords, loading } = useGeolocation()
  const [nearActive, setNearActive] = useState(!!filters.near)

  const isFonctionnelActive = filters.status.includes('fonctionnel')
  const isUrgentActive =
    filters.urg.includes('élevée') || filters.urg.includes('critique')

  const toggleFonctionnel = () => {
    const newStatus = isFonctionnelActive
      ? filters.status.filter((s) => s !== 'fonctionnel')
      : [...filters.status, 'fonctionnel']
    applyFilters({ ...filters, status: newStatus })
  }

  const toggleUrgent = () => {
    const urgentValues = ['élevée', 'critique']
    const newUrg = isUrgentActive
      ? filters.urg.filter((u) => !urgentValues.includes(u))
      : Array.from(new Set([...filters.urg, 'élevée', 'critique']))
    applyFilters({ ...filters, urg: newUrg })
  }

  const handleNearMe = async () => {
    if (nearActive) {
      setNearActive(false)
      applyFilters({ ...filters, near: '' })
      return
    }

    request()
  }

  if (coords && !nearActive) {
    setNearActive(true)
    applyFilters({
      ...filters,
      near: `${coords.latitude},${coords.longitude}`,
    })
  }

  return (
    <div className="quick-filters sticky top-0 z-[1000] bg-white/95 border-b border-gray-200 px-4 py-2 flex items-center gap-2 overflow-x-auto md:overflow-x-visible shadow-sm">
      <MapFilters />

      <button
        type="button"
        onClick={toggleFonctionnel}
        className={`flex items-center gap-1.5 px-3 h-11 rounded-full border transition-colors whitespace-nowrap flex-shrink-0 ${
          isFonctionnelActive
            ? 'border-green-600 bg-green-50 text-green-700'
            : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
        }`}
        aria-pressed={isFonctionnelActive}
      >
        <span className="w-2 h-2 rounded-full bg-green-600" />
        <span className="text-sm">Fonctionnel</span>
      </button>

      <button
        type="button"
        onClick={handleNearMe}
        disabled={loading}
        className={`flex items-center gap-1.5 px-3 h-11 rounded-full border transition-colors whitespace-nowrap flex-shrink-0 ${
          nearActive
            ? 'border-blue-600 bg-blue-50 text-blue-700'
            : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
        } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
        aria-pressed={nearActive}
      >
        <MapPin size={16} />
        <span className="text-sm">{loading ? 'Localisation...' : 'Près de moi'}</span>
      </button>

      <button
        type="button"
        onClick={toggleUrgent}
        className={`flex items-center gap-1.5 px-3 h-11 rounded-full border transition-colors whitespace-nowrap flex-shrink-0 ${
          isUrgentActive
            ? 'border-red-600 bg-red-50 text-red-700'
            : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
        }`}
        aria-pressed={isUrgentActive}
      >
        <AlertTriangle size={16} />
        <span className="text-sm">Urgent</span>
      </button>

      <button
        type="button"
        disabled
        className="flex items-center gap-1.5 px-3 h-11 rounded-full border border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed whitespace-nowrap flex-shrink-0"
        aria-disabled="true"
      >
        <Plus size={16} />
        <span className="text-sm">Signaler</span>
      </button>

      <div className="ml-auto pl-2 flex-shrink-0 hidden sm:block">
        <span
          className="text-sm text-gray-600 whitespace-nowrap"
          aria-live="polite"
        >
          {filteredCount !== placesCount
            ? `${filteredCount} lieux affichés / ${placesCount}`
            : `${placesCount} lieu${placesCount > 1 ? 'x' : ''} affiché${placesCount > 1 ? 's' : ''}`}
        </span>
      </div>

      <div className="ml-auto pl-2 flex-shrink-0 sm:hidden">
        <span
          className="text-sm text-gray-600 whitespace-nowrap"
          aria-live="polite"
        >
          {filteredCount} / {placesCount}
        </span>
      </div>
    </div>
  )
}
