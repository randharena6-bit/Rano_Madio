import { MapPin } from 'lucide-react'
import { useGeolocation } from '../../hooks/useGeolocation'

export default function LocateButton({ onLocate = () => {} }) {
  const { request, loading, error, coords } = useGeolocation()

  const handleClick = () => {
    request()
  }

  if (coords && onLocate) {
    onLocate(coords)
  }

  return (
    <div className="locate-fixed absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2">
      {error && (
        <div className="bg-white/98 backdrop-blur rounded-lg shadow-lg border border-red-200 px-3 py-2 max-w-xs">
          <p className="text-xs text-red-700">{error.message}</p>
        </div>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`flex items-center justify-center w-11 h-11 rounded-full border border-gray-300 bg-white/95 backdrop-blur shadow-lg hover:bg-gray-50 transition-colors ${
          loading ? 'opacity-60 cursor-not-allowed' : ''
        }`}
        aria-label="Me localiser"
        title="Me localiser"
      >
        <MapPin size={20} className={loading ? 'animate-pulse' : ''} />
      </button>
    </div>
  )
}
