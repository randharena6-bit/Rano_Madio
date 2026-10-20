import { useState, useEffect, useCallback } from 'react'
import { getPlaces } from '../services/api'

let sharedPlaces = null
let sharedLoading = true
let sharedError = null
let sharedPromise = null
const listeners = new Set()

export function usePlaces() {
  const [places, setPlaces] = useState(sharedPlaces)
  const [loading, setLoading] = useState(sharedLoading)
  const [error, setError] = useState(sharedError)

  const updateState = useCallback(() => {
    setPlaces(sharedPlaces)
    setLoading(sharedLoading)
    setError(sharedError)
  }, [])

  useEffect(() => {
    listeners.add(updateState)

    if (sharedPlaces === null && sharedPromise === null) {
      sharedLoading = true
      sharedError = null
      sharedPromise = getPlaces()
        .then((data) => {
          sharedPlaces = data
          sharedLoading = false
          sharedError = null
        })
        .catch((err) => {
          sharedLoading = false
          sharedError = err instanceof Error ? err : new Error('Erreur lors du chargement')
        })
        .finally(() => {
          sharedPromise = null
          listeners.forEach((listener) => listener())
        })
    } else if (sharedPlaces !== null) {
      sharedLoading = false
    }

    listeners.forEach((listener) => listener())

    return () => {
      listeners.delete(updateState)
    }
  }, [updateState])

  const refetch = useCallback(async () => {
    sharedPlaces = null
    sharedPromise = null
    sharedLoading = true
    sharedError = null
    listeners.forEach((listener) => listener())

    try {
      const data = await getPlaces()
      sharedPlaces = data
      sharedLoading = false
      sharedError = null
    } catch (err) {
      sharedLoading = false
      sharedError = err instanceof Error ? err : new Error('Erreur lors du chargement')
    } finally {
      sharedPromise = null
      listeners.forEach((listener) => listener())
    }
  }, [])

  return { places, loading, error, refetch }
}
