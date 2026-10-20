import {
  Bell,
  Building,
  ChevronRight,
  Droplets,
  FileText,
  Map,
  MapPin,
  Plus,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const items = [
  {
    to: '/',
    title: 'Carte interactive',
    sub: "Points d'eau & alertes",
    Icon: Map,
    end: true,
  },
  {
    to: '/alertes',
    title: 'Alertes & Flux',
    sub: 'Confirmations citoyennes',
    Icon: Bell,
    badge: 2,
  },
  {
    to: '/suivi',
    title: 'Suivi des actions',
    sub: 'Preuves & résolutions',
    Icon: FileText,
  },
  {
    to: '/commune',
    title: 'Commune & Fokontany',
    sub: 'Tableau de bord CUA',
    Icon: Building,
  },
]

export default function Sidebar({ open = false, onClose }) {
  return (
    <>
      <nav className={`sidebar${open ? ' open' : ''}`} aria-label="Navigation principale">
        <div
          className="shrink-0 px-5 py-4"
          style={{ background: 'var(--brand-strong)' }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-white">
              <Droplets size={22} style={{ color: 'var(--brand-strong)' }} />
            </div>
            <div className="min-w-0">
              <div className="text-[18px] font-bold leading-tight text-white">
                RanoMadio Map
              </div>
              <div className="text-[12px] font-medium text-white">
                Signaler. Confirmer. Agir.
              </div>
            </div>
          </div>

          <div
            className="mt-3 flex h-9 items-center gap-2 rounded-[8px] px-2.5"
            style={{
              background: 'rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
            }}
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-green-400" />
            <span className="truncate text-[12px] font-medium text-white">
              Pilote : Anosizato &amp; Ankasina
            </span>
            <span
              className="ml-auto shrink-0 rounded-md bg-white px-1.5 py-0.5 text-[11px] font-bold"
              style={{ color: 'var(--brand-strong)' }}
            >
              CUA
            </span>
          </div>
        </div>

        <div className="shrink-0 px-4 py-4">
          <NavLink
            to="/signaler"
            onClick={onClose}
            className="sidebar-report-cta group relative flex h-[54px] items-center justify-center gap-2.5 rounded-xl bg-[var(--brand-strong)] hover:bg-[var(--brand-hover)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
          >
            <span className="sidebar-report-icon flex h-7 w-7 items-center justify-center rounded-md bg-white/20">
              <Plus size={18} className="sidebar-report-plus text-white" />
            </span>
            <span className="text-[15px] font-semibold text-white">
              Signaler un problème
            </span>
          </NavLink>
        </div>

        <div className="sidebar-menu min-h-0 flex-1 overflow-y-auto pb-3">
          <div
            className="px-5 pb-2 text-[11px] font-bold uppercase"
            style={{ color: 'var(--text-label)', letterSpacing: '0.06em' }}
          >
            Menu
          </div>

          {items.map(({ to, title, sub, Icon, badge, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                isActive
                  ? 'mx-2.5 flex h-[58px] items-center gap-3 rounded-[10px] border px-3 active:scale-[0.98]'
                  : 'mx-0 flex h-[58px] items-center gap-3 border px-5 hover:bg-[var(--surface-alt)] active:scale-[0.98]'
              }
              style={({ isActive }) =>
                isActive
                  ? {
                      background: 'var(--brand-soft)',
                      borderColor: 'var(--brand-soft-border)',
                    }
                  : { borderColor: 'transparent' }
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={20}
                    className="shrink-0"
                    style={{ color: isActive ? 'var(--brand)' : '#64748B' }}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-[15px] leading-snug ${
                        isActive ? 'font-bold' : 'font-medium'
                      }`}
                      style={{ color: isActive ? 'var(--brand-text)' : 'var(--text-title)' }}
                    >
                      {title}
                    </span>
                    <span
                      className="block truncate text-[11px]"
                      style={{ color: isActive ? 'var(--text-title)' : 'var(--text-muted)' }}
                    >
                      {sub}
                    </span>
                  </span>
                  {badge && (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white bg-[var(--danger)]">
                      {badge}
                    </span>
                  )}
                  {isActive && (
                    <ChevronRight size={16} className="shrink-0" style={{ color: 'var(--brand)' }} />
                  )}
                </>
              )}
            </NavLink>
          ))}

          <div
            className="mx-2.5 mt-3 rounded-xl border p-4"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-alt)' }}
          >
            <div
              className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase"
              style={{ color: 'var(--text-title)' }}
            >
              <MapPin size={16} style={{ color: 'var(--brand)' }} />
              Filtre fokontany
            </div>
            <select
              aria-label="Filtre fokontany"
              defaultValue="all"
              className="h-11 w-full cursor-pointer rounded-lg border bg-white px-3 text-[13px] font-semibold outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(24,119,242,0.3)]"
              style={{ borderColor: 'var(--border)', color: 'var(--text-title)' }}
            >
              <option value="all">Tous les fokontany</option>
              <option value="anosizato">Anosizato</option>
              <option value="ankasina">Ankasina</option>
              <option value="ambohimanarina">Ambohimanarina</option>
            </select>
          </div>
        </div>

        <div
          className="shrink-0 border-t px-4 py-3"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-alt)' }}
        >
          {/* Bas de la sidebar supprimé selon demande */}
        </div>
      </nav>
      {open && <div className="nav-backdrop" onClick={onClose} aria-hidden="true" />}
    </>
  )
}
