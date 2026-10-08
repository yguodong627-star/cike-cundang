import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import BottomNav from './components/BottomNav.tsx'
import SavePage from './pages/SavePage.tsx'
import TimelinePage from './pages/TimelinePage.tsx'
import GridPage from './pages/GridPage.tsx'
import SettingsPage from './pages/SettingsPage.tsx'

export default function App() {
  return (
    <BrowserRouter>
      <main className="min-h-dvh px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-24">
        <Routes>
          <Route path="/" element={<SavePage />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/grid" element={<GridPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </BrowserRouter>
  )
}
