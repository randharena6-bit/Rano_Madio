import {
  Bell,
  Building,
  ChevronRight,
  Droplets,
  FileText,
  Map,
  MapPin,
  Plus,
  Wifi,
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
          className="shrink-0 px-6 py-6"
          style={{ background: 'var(--brand)', minHeight: 155 }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-xl bg-white">
              <Droplets size={26} style={{ color: 'var(--brand)' }} />
            </div>
            <div className="min-w-0">
              <div className="text-[20px] font-extrabold leading-tight text-white">
                RanoMadio Map
              </div>
              <div className="text-[14px] font-semibold text-white">
                Signaler. Confirmer. Agir.
              </div>
            </div>
          </div>

          <div
            className="mt-3 flex h-10 items-center gap-2 rounded-[10px] px-3"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
            }}
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--success)]" />
            <span className="truncate text-[14px] font-semibold text-white">
              Pilote : Anosizato &amp; Ankasina
            </span>
            <span
              className="ml-auto shrink-0 rounded-md bg-white px-2 py-0.5 text-[12px] font-bold"
              style={{ color: 'var(--brand)' }}
            >
              CUA
            </span>
          </div>
        </div>

        <div className="shrink-0 px-5 py-5">
          <NavLink
            to="/signaler"
            onClick={onClose}
            className="flex h-[62px] items-center justify-center gap-3 rounded-2xl bg-[var(--brand)] transition-colors hover:bg-[var(--brand-hover)]"
            style={{ boxShadow: '0 8px 20px rgba(24, 119, 242, 0.30)' }}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
              <Plus size={18} className="text-white" />
            </span>
            <span className="text-[18px] font-bold text-white">Signaler un problème</span>
          </NavLink>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pb-4">
          <div
            className="px-[30px] pb-2 text-[13px] font-bold uppercase"
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
                  ? 'mx-[15px] flex h-[68px] items-center gap-4 rounded-[14px] border px-[15px]'
                  : 'mx-0 flex h-[68px] items-center gap-4 border px-[30px]'
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
                    size={24}
                    className="shrink-0"
                    style={{ color: isActive ? 'var(--brand)' : '#64748B' }}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-[18px] leading-snug ${
                        isActive ? 'font-bold' : 'font-medium'
                      }`}
                      style={{ color: isActive ? 'var(--brand)' : 'var(--text-title)' }}
                    >
                      {title}
                    </span>
                    <span
                      className="block truncate text-[12px]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {sub}
                    </span>
                  </span>
                  {badge && (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white bg-[var(--danger)]">
                      {badge}
                    </span>
                  )}
                  {isActive && (
                    <ChevronRight size={20} className="shrink-0" style={{ color: 'var(--brand)' }} />
                  )}
                </>
              )}
            </NavLink>
          ))}

          <div
            className="mx-[15px] mt-4 rounded-2xl border p-5"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-alt)' }}
          >
            <div
              className="mb-3 flex items-center gap-2 text-[13px] font-bold uppercase"
              style={{ color: 'var(--text-title)' }}
            >
              <MapPin size={16} style={{ color: 'var(--brand)' }} />
              Filtre fokontany
            </div>
            <select
              aria-label="Filtre fokontany"
              defaultValue="all"
              className="h-11 w-full cursor-pointer rounded-full border bg-white px-4 text-[15px] font-bold outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(24,119,242,0.3)]"
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
          className="shrink-0 border-t px-5 py-4"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-alt)' }}
        >
          <div className="flex items-center justify-between gap-3">
            <span
              className="flex items-center gap-2 text-[13px] font-semibold"
              style={{ color: 'var(--text-title)' }}
            >
              <Wifi size={16} style={{ color: 'var(--success)' }} />
              Connecté (Mode léger)
            </span>
            <span
              className="shrink-0 rounded-lg border bg-white px-2 py-1 text-[13px] font-bold"
              style={{ borderColor: 'var(--border)', color: 'var(--brand)' }}
            >
              v1.2 MVP
            </span>
          </div>
          <p
            className="mt-2 text-[12px]"
            style={{ color: '#64748B', lineHeight: 1.3 }}
          >
            Consultation 100% citoyenne sans création de compte requise. Antananarivo,
            Madagascar.
          </p>
        </div>
      </nav>
      {open && <div className="nav-backdrop" onClick={onClose} aria-hidden="true" />}
    </>
  )
}
