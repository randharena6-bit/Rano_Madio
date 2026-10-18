import { Outlet } from 'react-router-dom'
import SearchBar from './SearchBar'
import Sidebar from './Sidebar'
import './layout.css'

export default function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <header className="topbar">
        <SearchBar />
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
