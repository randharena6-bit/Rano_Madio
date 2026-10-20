import { MapPin } from 'lucide-react'
import './ui.css'

export default function EmptyState({
  icon: Icon = MapPin,
  titleAs: Title = 'h2',
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div className={`ui-empty-state ${className}`.trim()} role="status">
      <span className="ui-empty-state__icon" aria-hidden="true">
        <Icon size={22} strokeWidth={1.8} />
      </span>
      {title && <Title className="ui-empty-state__title">{title}</Title>}
      {description && <p className="ui-empty-state__description">{description}</p>}
      {action && <div className="ui-empty-state__action">{action}</div>}
    </div>
  )
}