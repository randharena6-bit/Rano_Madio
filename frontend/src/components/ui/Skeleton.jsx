import './ui.css'

export default function Skeleton({
  variant = 'line',
  lines = 1,
  className = '',
  style,
  ...props
}) {
  if (lines <= 1) {
    return (
      <span
        aria-hidden="true"
        className={`ui-skeleton ui-skeleton--${variant} ${className}`.trim()}
        style={style}
        {...props}
      />
    )
  }

  return (
    <span className={`ui-skeleton-list ${className}`.trim()} aria-hidden="true" {...props}>
      {Array.from({ length: lines }, (_, index) => (
        <span
          key={index}
          className={`ui-skeleton ui-skeleton--${variant}`}
          style={index === 0 ? style : undefined}
        />
      ))}
    </span>
  )
}