import { useCallback, useEffect, useState } from 'react'
import { createReport, listReports } from '../services/reportsApi'

let sharedReports = null
let sharedLoading = true
let sharedError = null
let sharedPromise = null
const listeners = new Set()

const notify = () => {
  listeners.forEach((listener) => listener())
}

export function useReports() {
  const [reports, setReports] = useState(sharedReports)
  const [loading, setLoading] = useState(sharedLoading)
  const [error, setError] = useState(sharedError)

  const updateState = useCallback(() => {
    setReports(sharedReports)
    setLoading(sharedLoading)
    setError(sharedError)
  }, [])

  useEffect(() => {
    listeners.add(updateState)

    if (sharedReports === null && sharedPromise === null) {
      sharedLoading = true
      sharedError = null
      sharedPromise = listReports()
        .then((data) => {
          sharedReports = data
          sharedLoading = false
          sharedError = null
        })
        .catch((err) => {
          sharedLoading = false
          sharedError = err instanceof Error ? err : new Error('Erreur lors du chargement')
        })
        .finally(() => {
          sharedPromise = null
          notify()
        })
    } else if (sharedReports !== null) {
      sharedLoading = false
    }

    notify()

    return () => {
      listeners.delete(updateState)
    }
  }, [updateState])

  const refetch = useCallback(async () => {
    sharedReports = null
    sharedPromise = null
    sharedLoading = true
    sharedError = null
    notify()

    try {
      const data = await listReports()
      sharedReports = data
      sharedLoading = false
      sharedError = null
    } catch (err) {
      sharedLoading = false
      sharedError = err instanceof Error ? err : new Error('Erreur lors du chargement')
    } finally {
      sharedPromise = null
      notify()
    }
  }, [])

  /**
   * Crée un signalement via l'API et met à jour le cache partagé.
   * En cas d'échec réseau, l'erreur remonte à l'appelant (brouillon conservé ailleurs).
   */
  const addReport = useCallback(async (payload) => {
    const report = await createReport(payload)

    if (sharedReports !== null && !sharedReports.some((item) => item.id === report.id)) {
      sharedReports = [report, ...sharedReports]
      notify()
    }
    // Si le chargement initial est encore en cours, le listReports en cours
    // relira le store et inclura déjà ce signalement.

    return report
  }, [])

  return { reports, loading, error, addReport, refetch }
}
