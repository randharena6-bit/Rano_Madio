import './ui.css'

const VARIANTS = ['primary', 'secondary', 'ghost']
const SIZES = ['sm', 'md']

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'start',
  className = '',
  type = 'button',
  children,
  ...props
}) {
  const safeVariant = VARIANTS.includes(variant) ? variant : 'primary'
  const safeSize = SIZES.includes(size) ? size : 'md'

  return (
    <button
      type={type}
      className={`ui-button ui-button--${safeVariant} ui-button--${safeSize} ${className}`.trim()}
      {...props}
    >
      {icon && iconPosition === 'start' && (
        <span className="ui-button__icon" aria-hidden="true">{icon}</span>
      )}
      {children}
      {icon && iconPosition === 'end' && (
        <span className="ui-button__icon" aria-hidden="true">{icon}</span>
      )}
    </button>
  )
}