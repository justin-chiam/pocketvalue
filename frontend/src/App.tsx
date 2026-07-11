import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import AppPage from './pages/AppPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<AppPage />} />
      </Routes>
    </BrowserRouter>
  )
}
