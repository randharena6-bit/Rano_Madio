import { CircleAlert, TriangleAlert } from 'lucide-react'
import Modal from '../ui/Modal'
import { getStatutByKey } from '../../utils/placeConfig'
import './reportForm.css'

function doublonTitle(doublon) {
  const { source, item } = doublon
  if (source === 'lieu') return item.nom || 'Lieu similaire'
  const firstLine = (item.description || '').split('\n')[0].trim()
  return firstLine.length > 70 ? `${firstLine.slice(0, 70)}…` : firstLine || 'Signalement similaire'
}

function doublonZone(doublon) {
  const { source, item } = doublon
  if (source === 'lieu') {
    return [item.fokontany, item.commune].filter(Boolean).join(' · ')
  }
  return [item.localisation?.fokontany, item.localisation?.commune].filter(Boolean).join(' · ')
}

function doublonMeta(doublon) {
  const { source, item } = doublon
  if (source === 'lieu') {
    const statut = getStatutByKey(item.statut)
    return statut ? `Lieu déjà signalé : ${statut.label.toLowerCase()}` : 'Lieu déjà répertorié'
  }
  const date = item.createdAt ? new Date(item.createdAt) : null
  const when = date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('fr-FR') : null
  return when ? `Signalé le ${when}` : 'Signalement récent'
}

/**
 * Modale « un problème similaire existe à X m, le confirmer ? »
 */
export default function DuplicateDialog({ doublon, onConfirm, onCancel, busy = false }) {
  if (!doublon) return null

  return (
    <Modal
      open
      onClose={onCancel}
      title={`Un problème similaire existe à ${Math.max(1, Math.round(doublon.distance))} m`}
      titleId="duplicate-dialog-title"
      closeOnBackdrop={!busy}
      footer={(
        <>
          <button type="button" className="ui-button ui-button--secondary ui-button--md" onClick={onCancel} disabled={busy}>
            Annuler
          </button>
          <button type="button" className="ui-button ui-button--primary ui-button--md" onClick={onConfirm} disabled={busy}>
            Confirmer quand même
          </button>
        </>
      )}
    >
      <div className="dd-body">
        <p className="dd-lead">
          <TriangleAlert size={16} aria-hidden="true" />
          Le confirmer évite la dispersion des alertes. Vous pouvez aussi annuler
          et consulter la carte.
        </p>
        <div className="dd-item">
          <span className="dd-item__icon" aria-hidden="true">
            <CircleAlert size={18} />
          </span>
          <div className="dd-item__body">
            <p className="dd-item__titre">{doublonTitle(doublon)}</p>
            <p className="dd-item__meta">
              {doublonMeta(doublon)}
              {doublonZone(doublon) ? ` · ${doublonZone(doublon)}` : ''}
            </p>
            <p className="dd-item__distance">À environ {Math.max(1, Math.round(doublon.distance))} m de votre position</p>
          </div>
        </div>
      </div>
    </Modal>
  )
}
