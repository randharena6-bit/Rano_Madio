import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { usePlaces } from '../hooks/usePlaces'
import { usePlaceFilters } from '../hooks/usePlaceFilters'
import MapView from '../components/map/MapView'
import QuickFilters from '../components/map/QuickFilters'
import MapLegend from '../components/map/MapLegend'
import LocateButton from '../components/map/LocateButton'
import PlaceSheet from '../components/map/PlaceSheet'
import { WifiOff } from 'lucide-react'

export default function MapPage() {
  const { places, loading, error } = usePlaces()
  const { filteredPlaces, applyFilters } = usePlaceFilters(places || [])
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [selectedId, setSelectedId] = useState(searchParams.get('focus') || null)
  const focusReturnRef = useRef(null)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const focus = searchParams.get('focus')
    if (focus !== selectedId) {
      setSelectedId(focus)
    }
  }, [searchParams, selectedId])

  const handleSelect = (id, triggerElement) => {
    if (triggerElement?.dataset.id) focusReturnRef.current = triggerElement.dataset.id
    setSelectedId(id)
    const newParams = new URLSearchParams(searchParams)
    newParams.set('focus', id)
    navigate(`/?${newParams.toString()}`, { replace: true })
  }

  const handleLocate = () => {}

  const handleResetFilters = () => {
    applyFilters({})
  }

  const showEmpty = !loading && !error && filteredPlaces.length === 0
  const selectedPlace = places?.find((p) => p.id === selectedId) || null

  return (
    <div className="map-page flex flex-col h-full w-full">
      {!isOnline && (
        <div
          className="offline-banner bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-2 text-amber-800"
          role="status"
        >
          <WifiOff size={16} />
          <span className="text-sm">
            Hors ligne — données potentiellement obsolètes
          </span>
        </div>
      )}

      <QuickFilters
        placesCount={places?.length || 0}
        filteredCount={filteredPlaces?.length || 0}
      />

      <div className="map-container relative flex-1 overflow-hidden">
        {loading && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur z-20"
            role="status"
          >
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Chargement des lieux...</p>
            </div>
          </div>
        )}

        {error && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-white/90 z-20 p-4"
            role="alert"
          >
            <div className="text-center max-w-md">
              <p className="text-red-600 mb-2">
                Erreur lors du chargement des lieux
              </p>
              <p className="text-sm text-gray-600">{error.message}</p>
            </div>
          </div>
        )}

        {showEmpty && (
          <div
            className="empty-state absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur z-20 p-4"
            role="status"
          >
            <div className="text-center max-w-sm">
              <p className="text-gray-900 font-medium mb-2">
                Aucun lieu ne correspond
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Élargissez vos filtres pour voir plus de résultats.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 h-11 inline-flex items-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </div>
        )}

        <MapView
          places={places}
          filteredPlaces={filteredPlaces}
          onSelect={handleSelect}
          selectedId={selectedId}
        />

        <MapLegend />
        <LocateButton onLocate={handleLocate} />

        {selectedPlace && (
          <PlaceSheet
            place={selectedPlace}
            places={places || []}
            focusReturnRef={focusReturnRef}
            onClose={() => {
              setSelectedId(null)
              const newParams = new URLSearchParams(searchParams)
              newParams.delete('focus')
              navigate(`/?${newParams.toString()}`, { replace: true })
            }}
            onSelectPlace={(id) => {
              setSelectedId(id)
              const newParams = new URLSearchParams(searchParams)
              newParams.set('focus', id)
              navigate(`/?${newParams.toString()}`, { replace: true })
            }}
          />
        )}
      </div>
    </div>
  )
}
