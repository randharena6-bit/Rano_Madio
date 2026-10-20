import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import './ui.css'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Modale générique (aria-modal, Échap, piège de focus, restauration du focus)
 */
export default function Modal({
  open,
  onClose,
  title,
  titleId = 'ui-modal-title',
  children,
  footer,
  closeOnBackdrop = true,
}) {
  const dialogRef = useRef(null)
  const closeButtonRef = useRef(null)
  const previouslyFocusedRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return undefined

    previouslyFocusedRef.current = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const keepFocusInDialog = (event) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target)) {
        closeButtonRef.current?.focus()
      }
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = [
        ...(dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) || []),
      ].filter((element) => element.getClientRects().length > 0)
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

    document.addEventListener('focusin', keepFocusInDialog)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('focusin', keepFocusInDialog)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      const previous = previouslyFocusedRef.current
      if (previous?.isConnected && typeof previous.focus === 'function') {
        previous.focus()
      }
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="ui-modal-backdrop" role="presentation">
      <button
        type="button"
        className="ui-modal__scrim"
        aria-label="Fermer la modale"
        tabIndex={-1}
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="ui-modal"
        tabIndex={-1}
      >
        <header className="ui-modal__header">
          <h2 id={titleId} className="ui-modal__title">
            {title}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            className="ui-modal__close"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className="ui-modal__body">{children}</div>
        {footer && <footer className="ui-modal__footer">{footer}</footer>}
      </div>
    </div>,
    document.body,
  )
}
