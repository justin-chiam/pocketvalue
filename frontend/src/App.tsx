import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import LandingDraft from './pages/LandingDraft'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/draft" element={<LandingDraft />} />
      </Routes>
    </BrowserRouter>
  )
}
