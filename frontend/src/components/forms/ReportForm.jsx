import { useEffect, useMemo, useState } from 'react'
import {
  Bridge,
  Camera,
  CircleAlert,
  Droplet,
  Droplets,
  Eye,
  EyeOff,
  Info,
  LoaderCircle,
  Pickaxe,
  Route,
  School,
  Send,
  Store,
  UserRoundX,
  Waypoints,
  X,
} from 'lucide-react'
import Button from '../ui/Button'
import { usePlaces } from '../../hooks/usePlaces'
import { useReports } from '../../hooks/useReports'
import { clearDraft, getDraft, NetworkError, saveDraft } from '../../services/reportsApi'
import { compressImage, ImageCompressError } from '../../utils/compressImage'
import { findNearbyDoublon } from '../../utils/duplicates'
import {
  CATEGORIES,
  LIMITES,
  URGENCES_COULEURS,
  URGENCES_DETAILLEES,
} from '../../utils/reportConfig'
import DuplicateDialog from './DuplicateDialog'
import LocationPicker from './LocationPicker'
import './reportForm.css'

const CATEGORIE_ICONS = {
  borne_fontaine: Droplets,
  puits: Droplet,
  forage: Pickaxe,
  canal: Waypoints,
  pont: Bridge,
  'école': School,
  'marché': Store,
  ruelle: Route,
}

const EMPTY_FORM = {
  type: '',
  urgence: '',
  description: '',
  photo: null,
  localisation: null,
  identite: { visibilite: 'anonyme', nom: '', telephone: '' },
}

function normalizeDraft(draft) {
  return {
    type: typeof draft?.type === 'string' ? draft.type : '',
    urgence: typeof draft?.urgence === 'string' ? draft.urgence : '',
    description: typeof draft?.description === 'string' ? draft.description : '',
    photo: draft?.photo && typeof draft.photo === 'object' ? draft.photo : null,
    localisation:
      draft?.localisation && typeof draft.localisation === 'object'
        ? draft.localisation
        : null,
    identite: {
      visibilite: draft?.identite?.visibilite === 'publique' ? 'publique' : 'anonyme',
      nom: typeof draft?.identite?.nom === 'string' ? draft.identite.nom : '',
      telephone:
        typeof draft?.identite?.telephone === 'string' ? draft.identite.telephone : '',
    },
  }
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return ''
  if (bytes < 1024) return `${bytes} o`
  return `${Math.round(bytes / 1024)} Ko`
}

export default function ReportForm({ onSuccess }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [draftFound, setDraftFound] = useState(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoError, setPhotoError] = useState(null)
  const [submitError, setSubmitError] = useState(null)
  const [sending, setSending] = useState(false)
  const [doublon, setDoublon] = useState(null)
  const { places } = usePlaces()
  const { reports, addReport } = useReports()

  // Détection d'un brouillon précédent au montage
  useEffect(() => {
    let cancelled = false
    getDraft().then((draft) => {
      if (!cancelled && draft && (draft.type || draft.description || draft.localisation)) {
        setDraftFound(draft)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Autosave du brouillon (debounce 500 ms) — échec réseau = brouillon conservé ici
  useEffect(() => {
    if (draftFound) return undefined
    const isEmpty =
      !form.type &&
      !form.urgence &&
      !form.description.trim() &&
      !form.localisation &&
      !form.photo
    if (isEmpty) return undefined

    const timer = window.setTimeout(async () => {
      const payload = { ...form, savedAt: new Date().toISOString() }
      const result = await saveDraft(payload)
      if (!result.ok && result.raison === 'quota' && form.photo) {
        setForm((current) => ({ ...current, photo: null }))
        setPhotoError('Photo retirée du brouillon : stockage local saturé.')
        await saveDraft({ ...payload, photo: null })
      }
    }, 500)
    return () => window.clearTimeout(timer)
  }, [form, draftFound])

  const manquants = useMemo(() => {
    const missing = []
    if (!form.type) missing.push('type de problème')
    if (!form.urgence) missing.push('niveau d’urgence')
    const description = form.description.trim()
    if (description.length < LIMITES.DESC_MIN) {
      missing.push(`description (${LIMITES.DESC_MIN} caractères minimum)`)
    } else if (description.length > LIMITES.DESC_MAX) {
      missing.push(`description trop longue (max ${LIMITES.DESC_MAX})`)
    }
    if (!form.localisation?.source) missing.push('localisation')
    return missing
  }, [form])

  const valide = manquants.length === 0

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleReprendre = () => {
    setForm(normalizeDraft(draftFound))
    setDraftFound(null)
  }

  const handleEffacerDraft = async () => {
    await clearDraft()
    setDraftFound(null)
  }

  const handlePhoto = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setPhotoBusy(true)
    setPhotoError(null)
    try {
      const photo = await compressImage(file)
      updateField('photo', photo)
    } catch (err) {
      setPhotoError(
        err instanceof ImageCompressError
          ? err.message
          : 'Photo impossible à traiter.',
      )
    } finally {
      setPhotoBusy(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!valide || sending) return

    // Détection de doublons avant envoi (étape 7)
    const doublon = findNearbyDoublon({
      type: form.type,
      coords: form.localisation?.coords || null,
      reports: reports || [],
      places: places || [],
    })
    if (doublon) {
      setDoublon(doublon)
      return
    }

    await createReport()
  }

  const createReport = async () => {
    setSending(true)
    setSubmitError(null)
    try {
      const report = await addReport({
        type: form.type,
        urgence: form.urgence,
        description: form.description.trim(),
        photo: form.photo || undefined,
        localisation: form.localisation,
        identite: {
          visibilite: form.identite.visibilite,
          nom: form.identite.visibilite === 'publique' ? form.identite.nom.trim() : undefined,
          telephone:
            form.identite.visibilite === 'publique'
              ? form.identite.telephone.trim()
              : undefined,
        },
      })
      await clearDraft()
      setDoublon(null)
      setForm(EMPTY_FORM)
      onSuccess?.(report)
    } catch (err) {
      setSubmitError(
        err instanceof NetworkError
          ? 'Envoi échoué — brouillon conservé. Vérifiez votre connexion puis réessayez.'
          : err?.message || 'Envoi échoué — brouillon conservé.',
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <form className="rf-form" onSubmit={handleSubmit} noValidate>
      {draftFound && (
        <div className="rf-draft" role="status">
          <Info size={16} aria-hidden="true" />
          <span className="rf-draft__text">Un brouillon a été retrouvé.</span>
          <div className="rf-draft__actions">
            <Button size="sm" variant="secondary" onClick={handleReprendre}>
              Reprendre
            </Button>
            <Button size="sm" variant="ghost" onClick={handleEffacerDraft}>
              Effacer
            </Button>
          </div>
        </div>
      )}

      <fieldset className="rf-fieldset">
        <legend className="rf-legend">
          1. Quel problème signalez-vous ? <span className="rf-required">*</span>
        </legend>
        <div className="rf-chips" role="group" aria-label="Type de problème">
          {CATEGORIES.map((categorie) => {
            const Icon = CATEGORIE_ICONS[categorie.cle]
            const selected = form.type === categorie.cle
            return (
              <button
                key={categorie.cle}
                type="button"
                aria-pressed={selected}
                className={`rf-chip${selected ? ' rf-chip--active' : ''}`}
                onClick={() => updateField('type', categorie.cle)}
              >
                <span className="rf-chip__icon" data-categorie={categorie.cle} aria-hidden="true">
                  <Icon />
                </span>
                {categorie.labelFR}
              </button>
            )
          })}
        </div>

        <div className="rf-urgences" role="radiogroup" aria-label="Niveau d’urgence">
          {URGENCES_DETAILLEES.map((urgence) => {
            const selected = form.urgence === urgence.cle
            const couleur = URGENCES_COULEURS[urgence.cle] || '#64748B'
            return (
              <label
                key={urgence.cle}
                className={`rf-urgence${selected ? ' rf-urgence--active' : ''}`}
                style={selected ? { borderColor: couleur, background: `${couleur}0d` } : undefined}
              >
                <input
                  type="radio"
                  name="urgence"
                  value={urgence.cle}
                  checked={selected}
                  onChange={() => updateField('urgence', urgence.cle)}
                  className="rf-urgence__radio"
                />
                <span className="rf-urgence__dot" style={{ background: couleur }} aria-hidden="true" />
                <span className="rf-urgence__body">
                  <span className="rf-urgence__label">{urgence.label}</span>
                  <span className="rf-urgence__explication">{urgence.explication}</span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <LocationPicker
        value={form.localisation}
        onChange={(next) => updateField('localisation', next)}
        places={places || []}
      />

      <fieldset className="rf-fieldset">
        <legend className="rf-legend">
          3. Détails <span className="rf-required">*</span>
        </legend>

        <label className="rf-label" htmlFor="rf-description">
          Description
        </label>
        <textarea
          id="rf-description"
          className="rf-input rf-textarea"
          rows={4}
          maxLength={LIMITES.DESC_MAX}
          placeholder="Ex. : la borne-fontaine est en panne depuis ce matin, plus d’eau dans tout le quartier."
          value={form.description}
          onChange={(event) => updateField('description', event.target.value)}
          aria-describedby="rf-description-compteur"
        />
        <div id="rf-description-compteur" className="rf-compteur">
          {form.description.trim().length}/{LIMITES.DESC_MAX}
        </div>

        <div className="rf-photo">
          <label className="rf-photo__button" htmlFor="rf-photo-input">
            {photoBusy ? (
              <LoaderCircle size={18} className="lp-spin" aria-hidden="true" />
            ) : (
              <Camera size={18} aria-hidden="true" />
            )}
            {photoBusy ? 'Compression…' : form.photo ? 'Changer la photo' : 'Ajouter une photo (facultatif)'}
          </label>
          <input
            id="rf-photo-input"
            type="file"
            accept="image/*"
            capture="environment"
            className="rf-visually-hidden"
            onChange={handlePhoto}
            disabled={photoBusy}
          />
          {form.photo && (
            <div className="rf-photo__preview">
              <img src={form.photo.dataUrl} alt="Aperçu de la photo jointe" />
              <div className="rf-photo__meta">
                <span>{formatBytes(form.photo.bytes)}</span>
                <button
                  type="button"
                  className="rf-photo__remove"
                  onClick={() => updateField('photo', null)}
                  aria-label="Retirer la photo"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
          {photoError && (
            <p className="rf-error" role="alert">
              <CircleAlert size={14} aria-hidden="true" /> {photoError}
            </p>
          )}
        </div>

        <div className="rf-identite" role="radiogroup" aria-label="Identité affichée">
          <button
            type="button"
            role="radio"
            aria-checked={form.identite.visibilite === 'publique'}
            className={`rf-identite__choice${form.identite.visibilite === 'publique' ? ' rf-identite__choice--active' : ''}`}
            onClick={() =>
              setForm((current) => ({
                ...current,
                identite: { ...current.identite, visibilite: 'publique' },
              }))
            }
          >
            <Eye size={16} aria-hidden="true" />
            Identité publique
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={form.identite.visibilite === 'anonyme'}
            className={`rf-identite__choice${form.identite.visibilite === 'anonyme' ? ' rf-identite__choice--active' : ''}`}
            onClick={() =>
              setForm((current) => ({
                ...current,
                identite: { ...current.identite, visibilite: 'anonyme' },
              }))
            }
          >
            <UserRoundX size={16} aria-hidden="true" />
            Anonyme
          </button>
        </div>

        {form.identite.visibilite === 'publique' ? (
          <div className="rf-identite__fields">
            <label className="rf-label" htmlFor="rf-nom">
              Nom ou surnom (optionnel)
            </label>
            <input
              id="rf-nom"
              type="text"
              className="rf-input"
              maxLength={60}
              placeholder="Ex. : Rasoa"
              value={form.identite.nom}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  identite: { ...current.identite, nom: event.target.value },
                }))
              }
            />
            <label className="rf-label" htmlFor="rf-telephone">
              Téléphone (optionnel)
            </label>
            <input
              id="rf-telephone"
              type="tel"
              className="rf-input"
              maxLength={20}
              placeholder="Ex. : 034 12 345 67"
              value={form.identite.telephone}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  identite: { ...current.identite, telephone: event.target.value },
                }))
              }
            />
            <p className="rf-hint">
              <Eye size={14} aria-hidden="true" />
              Votre nom sera visible sur la fiche du signalement.
            </p>
          </div>
        ) : (
          <p className="rf-hint">
            <EyeOff size={14} aria-hidden="true" />
            Signalement anonyme : aucune information personnelle ne sera affichée.
          </p>
        )}
      </fieldset>

      {submitError && (
        <div className="rf-submit-error" role="alert">
          <CircleAlert size={16} aria-hidden="true" />
          <span>{submitError}</span>
        </div>
      )}

      <div className="rf-footer">
        {!valide && (
          <p className="rf-footer__hint">
            À compléter : {manquants.join(', ')}
          </p>
        )}
        <Button
          type="submit"
          className="rf-submit"
          disabled={!valide || sending}
          icon={sending ? <LoaderCircle size={16} className="lp-spin" /> : <Send size={16} />}
        >
          {sending ? 'Envoi en cours…' : 'Envoyer le signalement'}
        </Button>
        <p className="rf-footer__note">Environ 1 minute · même sans GPS</p>
      </div>

      <DuplicateDialog
        doublon={doublon}
        busy={sending}
        onConfirm={() => {
          setDoublon(null)
          createReport()
        }}
        onCancel={() => setDoublon(null)}
      />
    </form>
  )
}
