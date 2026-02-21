import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ItineraryProvider } from './context/ItineraryContext'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Home from './pages/Home'
import Builder from './pages/Builder'
import Concierge from './pages/Concierge'
import Login from './pages/Login'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ItineraryProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/builder"
              element={
                <ProtectedRoute>
                  <Builder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/concierge"
              element={
                <ProtectedRoute>
                  <Concierge />
                </ProtectedRoute>
              }
            />
          </Routes>
        </ItineraryProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
