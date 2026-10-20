import { Link, Outlet, useLocation } from 'react-router-dom'
import { Bell, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import SearchBar from './SearchBar'
import './layout.css'

export default function AppLayout() {
  const location = useLocation()
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    if (!navOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setNavOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navOpen])

  return (
    <div className="app-layout flex h-screen w-full bg-gray-50">
      <Sidebar
        currentPath={location.pathname}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />
      <div className="app-main flex flex-1 flex-col min-w-0">
        <header className="app-header flex items-center justify-between gap-4 border-b border-gray-200 px-4 py-3 md:px-6">
          <button
            type="button"
            className="nav-toggle"
            aria-label={navOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={navOpen}
            onClick={() => setNavOpen((isOpen) => !isOpen)}
          >
            {navOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex-1 flex items-center">
            <SearchBar />
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <Link
              to="/alertes"
              className="relative flex items-center justify-center w-11 h-11 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Voir les alertes"
            >
              <Bell size={20} className="text-gray-700" />
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full">
                2
              </span>
            </Link>
          </div>
        </header>
        <main className="app-content flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
