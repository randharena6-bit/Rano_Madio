import './ui.css'

export default function Card({
  as: Element = 'div',
  interactive = false,
  className = '',
  children,
  ...props
}) {
  return (
    <Element
      className={`ui-card${interactive ? ' ui-card--interactive' : ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </Element>
  )
}