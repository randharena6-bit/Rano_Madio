import { Map, LayoutDashboard, Megaphone } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Carte', Icon: Map, end: true },
  { to: '/signaler', label: 'Signaler', Icon: Megaphone },
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
]

export default function Sidebar() {
  return (
    <nav className="sidebar" aria-label="Navigation principale">
      <div className="brand">RanoMadio</div>
      <ul>
        {links.map(({ to, label, Icon, end }) => (
          <li key={to}>
            <NavLink to={to} end={end}>
              <Icon size={18} style={{ marginRight: 10, verticalAlign: 'text-bottom' }} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
