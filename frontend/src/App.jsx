import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import AlertesPage from './pages/AlertesPage'
import CommunePage from './pages/CommunePage'
import MapPage from './pages/MapPage'
import ReportFormPage from './pages/ReportFormPage'
import SuiviPage from './pages/SuiviPage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<MapPage />} />
          <Route path="/signaler" element={<ReportFormPage />} />
          <Route path="/alertes" element={<AlertesPage />} />
          <Route path="/suivi" element={<SuiviPage />} />
          <Route path="/commune" element={<CommunePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
