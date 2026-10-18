import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import SearchBar from './SearchBar'
import Sidebar from './Sidebar'
import './layout.css'

export default function AppLayout() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="app-layout">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <header className="topbar">
        <button
          type="button"
          className="nav-toggle"
          aria-label={navOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={navOpen}
          onClick={() => setNavOpen((v) => !v)}
        >
          {navOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <SearchBar />
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
