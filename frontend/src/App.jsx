import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Traffic from './pages/Traffic';
import Waste from './pages/Waste';
import Water from './pages/Water';
import Lighting from './pages/Lighting';
import Incidents from './pages/Incidents';
import Alerts from './pages/Alerts';
import Logs from './pages/Logs';
import Complaints from './pages/Complaints';
import CitizenAssistant from './pages/CitizenAssistant';
import Announcements from './pages/Announcements';
import CitizenAnnouncements from './pages/CitizenAnnouncements';
import './index.css';

const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  if (roles.length > 0 && !roles.includes(user.role)) return <Navigate to="/complaints" replace />;
  return children;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={
        <ProtectedRoute><Layout /></ProtectedRoute>
      }>
        {/* Dashboard — role-aware UI rendered inside dashboard page */}
        <Route index element={<Dashboard />} />

        {/* City modules — admin + operator only */}
        <Route path="traffic" element={
          <ProtectedRoute roles={['admin', 'operator']}><Traffic /></ProtectedRoute>
        } />
        <Route path="waste" element={
          <ProtectedRoute roles={['admin', 'operator']}><Waste /></ProtectedRoute>
        } />
        <Route path="water" element={
          <ProtectedRoute roles={['admin', 'operator']}><Water /></ProtectedRoute>
        } />
        <Route path="lighting" element={
          <ProtectedRoute roles={['admin', 'operator']}><Lighting /></ProtectedRoute>
        } />
        <Route path="incidents" element={
          <ProtectedRoute roles={['admin', 'operator']}><Incidents /></ProtectedRoute>
        } />
        <Route path="alerts" element={
          <ProtectedRoute roles={['admin', 'operator']}><Alerts /></ProtectedRoute>
        } />

        {/* Complaints — all roles */}
        <Route path="complaints" element={<Complaints />} />

        {/* Citizen assistant — user only */}
        <Route path="assistant" element={
          <ProtectedRoute roles={['user']}><CitizenAssistant /></ProtectedRoute>
        } />

        {/* Citizen announcements — user only */}
        <Route path="announcements" element={
          <ProtectedRoute roles={['user']}><CitizenAnnouncements /></ProtectedRoute>
        } />

        {/* Admin announcements management — admin only */}
        <Route path="admin/announcements" element={
          <ProtectedRoute roles={['admin']}><Announcements /></ProtectedRoute>
        } />

        {/* Admin only */}
        <Route path="logs" element={
          <ProtectedRoute roles={['admin']}><Logs /></ProtectedRoute>
        } />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
