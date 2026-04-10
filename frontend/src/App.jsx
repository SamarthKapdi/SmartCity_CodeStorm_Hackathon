import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import Layout from './components/Layout/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Traffic from './pages/Traffic'
import Waste from './pages/Waste'
import Water from './pages/Water'
import Lighting from './pages/Lighting'
import IoTDevices from './pages/IoTDevices'
import Incidents from './pages/Incidents'
import Alerts from './pages/Alerts'
import Logs from './pages/Logs'
import Complaints from './pages/Complaints'
import CitizenAssistant from './pages/CitizenAssistant'
import Announcements from './pages/Announcements'
import CitizenAnnouncements from './pages/CitizenAnnouncements'
import './index.css'

const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (roles.length > 0 && !roles.includes(user.role))
    return <Navigate to="/complaints" replace />
  return children
}

const AppRoutes = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Public Landing Page */}
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" replace /> : <Landing />}
      />
      <Route path="/welcome" element={<Navigate to="/" replace />} />

      {/* Auth */}
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      {/* Protected App Layout */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />

        {/* City modules — admin + operator only */}
        <Route
          path="traffic"
          element={
            <ProtectedRoute roles={['admin', 'operator']}>
              <Traffic />
            </ProtectedRoute>
          }
        />
        <Route
          path="waste"
          element={
            <ProtectedRoute roles={['admin', 'operator']}>
              <Waste />
            </ProtectedRoute>
          }
        />
        <Route
          path="water"
          element={
            <ProtectedRoute roles={['admin', 'operator']}>
              <Water />
            </ProtectedRoute>
          }
        />
        <Route
          path="lighting"
          element={
            <ProtectedRoute roles={['admin', 'operator']}>
              <Lighting />
            </ProtectedRoute>
          }
        />
        <Route
          path="iot"
          element={
            <ProtectedRoute roles={['admin', 'operator']}>
              <IoTDevices />
            </ProtectedRoute>
          }
        />
        <Route
          path="incidents"
          element={
            <ProtectedRoute roles={['admin', 'operator']}>
              <Incidents />
            </ProtectedRoute>
          }
        />
        <Route
          path="alerts"
          element={
            <ProtectedRoute roles={['admin', 'operator']}>
              <Alerts />
            </ProtectedRoute>
          }
        />

        {/* Complaints — all roles */}
        <Route path="complaints" element={<Complaints />} />

        {/* Citizen only */}
        <Route
          path="assistant"
          element={
            <ProtectedRoute roles={['user']}>
              <CitizenAssistant />
            </ProtectedRoute>
          }
        />
        <Route
          path="announcements"
          element={
            <ProtectedRoute roles={['user']}>
              <CitizenAnnouncements />
            </ProtectedRoute>
          }
        />

        {/* Admin only */}
        <Route
          path="admin/announcements"
          element={
            <ProtectedRoute roles={['admin']}>
              <Announcements />
            </ProtectedRoute>
          }
        />
        <Route
          path="logs"
          element={
            <ProtectedRoute roles={['admin']}>
              <Logs />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all */}
      <Route
        path="*"
        element={<Navigate to={user ? '/dashboard' : '/'} replace />}
      />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
