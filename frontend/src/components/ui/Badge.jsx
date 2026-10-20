import { AlertTriangle, CheckCircle2, CircleDot, Info, OctagonX } from 'lucide-react'
import './ui.css'

const TONES = ['brand', 'success', 'warning', 'danger', 'neutral']
const TONE_ICONS = {
  brand: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: OctagonX,
  neutral: CircleDot,
}

export default function Badge({ tone = 'neutral', icon, className = '', children }) {
  const safeTone = TONES.includes(tone) ? tone : 'neutral'
  const Icon = TONE_ICONS[safeTone]

  return (
    <span className={`ui-badge ui-badge--${safeTone} ${className}`.trim()}>
      <span className="ui-badge__icon" aria-hidden="true">
        {icon || <Icon size={14} strokeWidth={2} />}
      </span>
      <span>{children}</span>
    </span>
  )
}