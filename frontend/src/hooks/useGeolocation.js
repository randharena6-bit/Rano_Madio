import { useState, useCallback } from 'react'

export function useGeolocation() {
  const [coords, setCoords] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setError(new Error("La géolocalisation n'est pas supportée par ce navigateur"))
      return
    }

    setLoading(true)
    setError(null)
    setCoords(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        })
        setLoading(false)
      },
      (err) => {
        let message = 'Erreur lors de la géolocalisation'
        switch (err.code) {
          case err.PERMISSION_DENIED:
            message = 'Permission de géolocalisation refusée'
            break
          case err.POSITION_UNAVAILABLE:
            message = 'Position non disponible'
            break
          case err.TIMEOUT:
            message = 'Délai de géolocalisation dépassé'
            break
        }
        setError(new Error(message))
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }, [])

  const clear = useCallback(() => {
    setCoords(null)
    setLoading(false)
    setError(null)
  }, [])

  return { coords, loading, error, request, clear }
}
