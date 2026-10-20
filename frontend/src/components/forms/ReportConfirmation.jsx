import { Check, Eye, ImagePlus, MapPinPlus, UserRoundX } from 'lucide-react'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { CATEGORIES, URGENCES } from '../../utils/reportConfig'
import './reportForm.css'

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return ''
  if (bytes < 1024) return `${bytes} o`
  return `${Math.round(bytes / 1024)} Ko`
}

/**
 * Écran de confirmation de réception d'un signalement
 */
export default function ReportConfirmation({ report, onNew, onViewMap }) {
  const categorie = CATEGORIES.find((c) => c.cle === report.type)
  const urgence = URGENCES.find((u) => u.cle === report.urgence)
  const loc = report.localisation || {}
  const zone = [loc.fokontany, loc.commune].filter(Boolean).join(' · ')
  const publique = report.identite?.visibilite === 'publique'

  return (
    <div className="rf-success" role="status">
      <div className="rf-success__icon" aria-hidden="true">
        <Check size={22} />
      </div>
      <h2 className="rf-success__title">Signalement reçu</h2>
      <p className="rf-success__id">Référence {report.id}</p>
      <Badge tone="neutral">Non vérifié</Badge>

      <dl className="rf-success__recap">
        <div className="rf-success__row">
          <dt>Type</dt>
          <dd>{categorie?.labelFR || report.type}</dd>
        </div>
        <div className="rf-success__row">
          <dt>Urgence</dt>
          <dd>{urgence?.label || report.urgence}</dd>
        </div>
        <div className="rf-success__row">
          <dt>Lieu</dt>
          <dd>
            {zone || loc.adresse || 'Localisation enregistrée'}
            {loc.precision === 'approximative' && (
              <span className="rf-success__precision"> (approximatif)</span>
            )}
          </dd>
        </div>
        <div className="rf-success__row">
          <dt>Identité</dt>
          <dd className="rf-success__identite">
            {publique ? (
              <>
                <Eye size={14} aria-hidden="true" />
                Publique{report.identite?.nom ? ` · ${report.identite.nom}` : ''}
              </>
            ) : (
              <>
                <UserRoundX size={14} aria-hidden="true" />
                Anonyme
              </>
            )}
          </dd>
        </div>
        {report.photo && (
          <div className="rf-success__row">
            <dt>Photo</dt>
            <dd className="rf-success__identite">
              <ImagePlus size={14} aria-hidden="true" />
              Jointe ({formatBytes(report.photo.bytes)})
            </dd>
          </div>
        )}
      </dl>

      <p className="rf-success__text">
        Il apparaît sur la carte avec le statut « non vérifié ». Un habitant ou
        l’association pourra le confirmer.
      </p>

      <div className="rf-success__actions">
        <Button icon={<MapPinPlus size={16} />} onClick={onViewMap}>
          Voir sur la carte
        </Button>
        <Button variant="secondary" onClick={onNew}>
          Nouveau signalement
        </Button>
      </div>
    </div>
  )
}
