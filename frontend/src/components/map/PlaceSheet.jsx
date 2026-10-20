import { useCallback, useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'
import PlaceCard from './PlaceCard'

const CLOSE_ANIMATION_MS = 180
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function PlaceSheet({
  place,
  places,
  onClose,
  onSelectPlace,
  focusReturnRef,
}) {
  const [isVisible, setIsVisible] = useState(false)
  const dialogRef = useRef(null)
  const closeButtonRef = useRef(null)
  const closeTimeoutRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const openerId = focusReturnRef?.current
    const opener = openerId
      ? [...document.querySelectorAll('.marker[data-id]')].find(
          (marker) => marker.dataset.id === openerId,
        )
      : document.activeElement
    const enterTimeout = window.setTimeout(() => setIsVisible(true), 0)
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const keepFocusInDialog = (event) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target)) {
        closeButtonRef.current?.focus()
      }
    }
    document.addEventListener('focusin', keepFocusInDialog)

    return () => {
      window.clearTimeout(enterTimeout)
      document.removeEventListener('focusin', keepFocusInDialog)
      document.body.style.overflow = previousOverflow
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current)
      }
      window.setTimeout(() => {
        const currentOpener = openerId
          ? [...document.querySelectorAll('.marker[data-id]')].find(
              (marker) => marker.dataset.id === openerId,
            )
          : opener
        if (currentOpener?.isConnected && typeof currentOpener.focus === 'function') {
          currentOpener.focus()
        }
        if (focusReturnRef) focusReturnRef.current = null
      }, 0)
    }
  }, [focusReturnRef])

  const handleClose = useCallback(() => {
    if (closeTimeoutRef.current !== null) return

    setIsVisible(false)
    const reduceMotion = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches
    closeTimeoutRef.current = window.setTimeout(() => {
      closeTimeoutRef.current = null
      onCloseRef.current()
    }, reduceMotion ? 0 : CLOSE_ANIMATION_MS)
  }, [])

  const handleKeyDown = useCallback((event) => {
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
  }, [handleClose])

  return createPortal(
    <div
      className={`fixed inset-0 z-[1200] flex items-end justify-center transition-opacity duration-200 motion-reduce:transition-none sm:items-center sm:p-6 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/55 backdrop-blur-[2px]"
        onClick={handleClose}
        aria-label="Fermer la modale depuis l’arrière-plan"
        tabIndex={-1}
      />
      <section
        ref={dialogRef}
        className={`relative z-10 flex max-h-[92svh] w-full max-w-xl flex-col overflow-hidden rounded-t-[var(--radius-xl)] border border-b-0 border-gray-100 bg-white shadow-2xl transition-all duration-200 motion-reduce:transition-none sm:max-h-[88vh] sm:rounded-[var(--radius-xl)] sm:border ${
          isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-[0.98] opacity-0'
        }`}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-label={`Fiche de lieu : ${place.nom}`}
        tabIndex={-1}
      >
        <div
          className="flex shrink-0 justify-center pt-3 pb-1 sm:hidden"
          aria-hidden="true"
        >
          <span className="h-1.5 w-10 rounded-full bg-gray-300" />
        </div>

        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 py-3">
          <p className="min-w-0 truncate text-[11px] font-bold uppercase tracking-[0.06em] text-gray-500">
            Fiche de lieu
          </p>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            className="shrink-0 rounded-full p-2.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            aria-label="Fermer la fiche"
          >
            <X size={20} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)] sm:pb-0">
          <PlaceCard
            place={place}
            places={places}
            onSelectPlace={onSelectPlace}
            isMobile={false}
          />
        </div>
      </section>
    </div>,
    document.body,
  )
}
