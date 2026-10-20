import { useState, useEffect, useRef } from 'react'
import { Filter, X, RotateCcw } from 'lucide-react'
import { createPortal } from 'react-dom'
import { usePlaceFilters } from '../../hooks/usePlaceFilters'
import { CATEGORIES, STATUTS } from '../../config/place'

const CLOSE_ANIMATION_MS = 180
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const URGENCE_OPTIONS = [
  { value: '', label: 'Toutes' },
  { value: 'normale_et_plus', label: 'Normale et plus' },
  { value: 'haute_et_plus', label: 'Haute et plus' },
  { value: 'critique', label: 'Critique uniquement' }
]

const FIABILITE_OPTIONS = [
  { value: '', label: 'Toutes' },
  { value: 'moyen', label: 'Moyenne et plus' },
  { value: 'eleve', label: 'Élevée' }
]

const MAJ_OPTIONS = [
  { value: '', label: 'Toutes' },
  { value: '24h', label: '< 24h' },
  { value: '7j', label: '< 7j' },
  { value: '30j', label: '< 30j' }
]

export default function MapFilters() {
  const { filters, applyFilters, reset, activeCount } = usePlaceFilters([])
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const dialogRef = useRef(null)
  const triggerRef = useRef(null)
  const closeButtonRef = useRef(null)
  const closeTimeoutRef = useRef(null)

  const handleCategoryChange = (catKey, checked) => {
    const newCat = checked
      ? [...filters.cat, catKey]
      : filters.cat.filter((c) => c !== catKey)
    applyFilters({ ...filters, cat: newCat })
  }

  const handleStatusChange = (statusKey, checked) => {
    const newStatus = checked
      ? [...filters.status, statusKey]
      : filters.status.filter((s) => s !== statusKey)
    applyFilters({ ...filters, status: newStatus })
  }

  const handleUrgenceChange = (value) => {
    const newUrg =
      value === 'normale_et_plus'
        ? ['normale', 'élevée', 'critique']
        : value === 'haute_et_plus'
          ? ['élevée', 'critique']
          : value === 'critique'
            ? ['critique']
            : []
    applyFilters({ ...filters, urg: newUrg })
  }

  const handleFiabiliteChange = (value) => {
    const newRel =
      value === 'moyen' ? ['moyen', 'eleve'] : value === 'eleve' ? ['eleve'] : []
    applyFilters({ ...filters, rel: newRel })
  }

  const handleMajChange = (value) => {
    const newUpd = value ? [value] : []
    applyFilters({ ...filters, upd: newUpd })
  }

  const getUrgenceValue = () => {
    const urg = filters.urg
    if (urg.includes('critique') && urg.length === 1) return 'critique'
    if (urg.includes('élevée') && urg.includes('critique') && !urg.includes('normale')) return 'haute_et_plus'
    if (urg.includes('normale') || (urg.includes('élevée') && urg.includes('critique') && urg.includes('normale'))) {
      if (urg.length === 3) return 'normale_et_plus'
    }
    if (urg.length === 0) return ''
    if (urg.includes('élevée') && urg.includes('critique')) return 'haute_et_plus'
    if (urg.includes('normale') && urg.includes('élevée') && urg.includes('critique')) return 'normale_et_plus'
    return ''
  }

  const getFiabiliteValue = () => {
    if (filters.rel.includes('eleve') && filters.rel.length === 1) return 'eleve'
    if (filters.rel.includes('moyen') && filters.rel.includes('eleve')) return 'moyen'
    if (filters.rel.length === 0) return ''
    return ''
  }

  const getMajValue = () => {
    return filters.upd.length > 0 ? filters.upd[0] : ''
  }

  const handleClose = () => {
    if (closeTimeoutRef.current !== null) return

    setIsVisible(false)
    const reduceMotion = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches
    closeTimeoutRef.current = window.setTimeout(() => {
      closeTimeoutRef.current = null
      setIsOpen(false)
    }, reduceMotion ? 0 : CLOSE_ANIMATION_MS)
  }

  useEffect(() => {
    if (!isOpen) return undefined

    const previousOverflow = document.body.style.overflow
    const showTimeout = window.setTimeout(() => setIsVisible(true), 0)
    document.body.style.overflow = 'hidden'
    dialogRef.current?.querySelector('input')?.focus()

    const keepFocusInDialog = (event) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target)) {
        closeButtonRef.current?.focus()
      }
    }
    document.addEventListener('focusin', keepFocusInDialog)

    return () => {
      window.clearTimeout(showTimeout)
      document.removeEventListener('focusin', keepFocusInDialog)
      document.body.style.overflow = previousOverflow
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current)
      }
      window.setTimeout(() => triggerRef.current?.focus(), 0)
      setIsVisible(false)
    }
  }, [isOpen])

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      handleClose()
      return
    }
    if (event.key !== 'Tab') return

    const focusable = [...(dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) || [])]
      .filter((element) => element.getClientRects().length > 0)
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (!first) {
      event.preventDefault()
      dialogRef.current?.focus()
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const handleReset = () => {
    reset()
    handleClose()
  }

  return (
    <div>
      <button
        type="button"
        onClick={(event) => {
          triggerRef.current = event.currentTarget
          setIsOpen(true)
        }}
        className="flex items-center gap-1.5 px-3 h-11 rounded-full border border-gray-300 bg-white hover:bg-gray-50 transition-colors whitespace-nowrap flex-shrink-0 shadow-sm"
        aria-label="Ouvrir les filtres"
        aria-expanded={isOpen}
      >
        <Filter size={16} />
        <span className="text-sm font-medium">Filtres</span>
        {activeCount > 0 && (
          <span className="ml-0.5 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
            {activeCount}
          </span>
        )}
        <span className="text-xs text-gray-500">▾</span>
      </button>

      {isOpen && createPortal(
        <div
          className={`fixed inset-0 z-[1200] flex items-end justify-center transition-opacity duration-200 motion-reduce:transition-none sm:items-center sm:p-6 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-black/55 backdrop-blur-[2px]"
            onClick={handleClose}
            aria-label="Fermer les filtres depuis l’arrière-plan"
            tabIndex={-1}
          />
          <section
            ref={dialogRef}
            className={`relative z-10 flex max-h-[88svh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[var(--radius-xl)] border border-b-0 border-gray-100 bg-white shadow-2xl transition-all duration-200 motion-reduce:transition-none sm:max-h-[86svh] sm:rounded-[var(--radius-xl)] sm:border ${
              isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-[0.98] opacity-0'
            }`}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-labelledby="map-filters-title"
            tabIndex={-1}
          >
            <div
              className="flex shrink-0 justify-center pt-3 pb-1 sm:hidden"
              aria-hidden="true"
            >
              <span className="h-1.5 w-10 rounded-full bg-gray-300" />
            </div>

            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 py-3 sm:px-5 sm:py-4">
              <div className="min-w-0">
                <h2 id="map-filters-title" className="text-base font-semibold text-gray-900 sm:text-lg">
                  Filtres
                </h2>
                <p className="text-xs text-gray-500">Affiner l’affichage de la carte</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {activeCount > 0 && (
                  <span className="rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--brand-text)]">
                    {activeCount} actif{activeCount > 1 ? 's' : ''}
                  </span>
                )}
                <button
                  type="button"
                  ref={closeButtonRef}
                  onClick={handleClose}
                  className="rounded-full p-2.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                  aria-label="Fermer les filtres"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5">
              <div>
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.06em] text-gray-500">
                  Catégorie (8)
                </h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {CATEGORIES.map((cat) => (
                    <label
                      key={cat.cle}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-colors hover:border-gray-300 hover:bg-gray-50 has-[input:checked]:border-[var(--brand)] has-[input:checked]:bg-[var(--brand-soft)] has-[input:checked]:shadow-sm"
                    >
                      <input
                        type="checkbox"
                        checked={filters.cat.includes(cat.cle)}
                        onChange={(e) => handleCategoryChange(cat.cle, e.target.checked)}
                        className="h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">{cat.labelFR}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.06em] text-gray-500">
                  Statut (4)
                </h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {STATUTS.map((statut) => (
                    <label
                      key={statut.cle}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-colors hover:border-gray-300 hover:bg-gray-50 has-[input:checked]:border-[var(--brand)] has-[input:checked]:bg-[var(--brand-soft)] has-[input:checked]:shadow-sm"
                    >
                      <input
                        type="checkbox"
                        checked={filters.status.includes(statut.cle)}
                        onChange={(e) => handleStatusChange(statut.cle, e.target.checked)}
                        className="h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: statut.couleur }}
                        aria-hidden="true"
                      />
                      <span className="text-sm font-medium text-gray-700">{statut.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.06em] text-gray-500">
                  Urgence
                </h3>
                <div className="space-y-2">
                  {URGENCE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-colors hover:border-gray-300 hover:bg-gray-50 has-[input:checked]:border-[var(--brand)] has-[input:checked]:bg-[var(--brand-soft)] has-[input:checked]:shadow-sm"
                    >
                      <input
                        type="radio"
                        name="urgence"
                        value={opt.value}
                        checked={getUrgenceValue() === opt.value}
                        onChange={(e) => handleUrgenceChange(e.target.value)}
                        className="h-4 w-4 shrink-0 border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.06em] text-gray-500">
                  Fiabilité
                </h3>
                <div className="space-y-2">
                  {FIABILITE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-colors hover:border-gray-300 hover:bg-gray-50 has-[input:checked]:border-[var(--brand)] has-[input:checked]:bg-[var(--brand-soft)] has-[input:checked]:shadow-sm"
                    >
                      <input
                        type="radio"
                        name="fiabilite"
                        value={opt.value}
                        checked={getFiabiliteValue() === opt.value}
                        onChange={(e) => handleFiabiliteChange(e.target.value)}
                        className="h-4 w-4 shrink-0 border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.06em] text-gray-500">
                  Mise à jour
                </h3>
                <div className="space-y-2">
                  {MAJ_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-colors hover:border-gray-300 hover:bg-gray-50 has-[input:checked]:border-[var(--brand)] has-[input:checked]:bg-[var(--brand-soft)] has-[input:checked]:shadow-sm"
                    >
                      <input
                        type="radio"
                        name="maj"
                        value={opt.value}
                        checked={getMajValue() === opt.value}
                        onChange={(e) => handleMajChange(e.target.value)}
                        className="h-4 w-4 shrink-0 border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3 border-t border-gray-100 bg-gray-50/90 px-4 py-4 backdrop-blur sm:px-5">
              <button
                type="button"
                onClick={handleReset}
                className="flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-white hover:text-gray-900 sm:px-4"
              >
                <RotateCcw size={16} />
                <span className="hidden sm:inline">Réinitialiser</span>
                <span className="sm:hidden">Réinit.</span>
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="h-12 flex-1 rounded-xl bg-[var(--brand-strong)] text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-hover)] sm:min-w-[220px] sm:flex-none"
              >
                Voir {activeCount > 0 ? 'les résultats' : 'sur la carte'}
              </button>
            </div>
          </section>
        </div>,
        document.body,
      )}
    </div>
  )
}
