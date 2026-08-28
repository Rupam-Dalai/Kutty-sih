import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import FacultyMgmt from './pages/admin/FacultyMgmt';
import TeamMgmt from './pages/admin/TeamMgmt';
import Allocation from './pages/admin/Allocation';
import QRManager from './pages/admin/QRManager';
import HelpDesk from './pages/admin/HelpDesk';
import Leaderboard from './pages/admin/Leaderboard';

import FacultyHome from './pages/faculty/FacultyHome';
import TeamDetails from './pages/faculty/TeamDetails';
import ScoreCard from './pages/faculty/ScoreCard';

import QRPrintSheet from './components/QRPrintSheet';

// Protected Route Guard
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-xs text-slate-400 font-mono">
        Verifying authorization...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/faculty'} replace />;
  }

  return children;
}

// Main App Layout
function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const isPrintView = location.pathname.startsWith('/print');

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      {user && !isPrintView && <Navbar />}
      <main className="flex-1">
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'ADMIN' ? '/admin' : '/faculty'} replace />} />

          {/* Root Redirect */}
          <Route
            path="/"
            element={
              user ? (
                <Navigate to={user.role === 'ADMIN' ? '/admin' : '/faculty'} replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/faculty"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <FacultyMgmt />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/teams"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <TeamMgmt />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/allocation"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Allocation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/qr"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <QRManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/help-desk"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <HelpDesk />
              </ProtectedRoute>
            }
          />

          {/* Faculty Routes */}
          <Route
            path="/faculty"
            element={
              <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
                <FacultyHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/team/:identifier"
            element={
              <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
                <TeamDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/scorecard/:teamId"
            element={
              <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
                <ScoreCard />
              </ProtectedRoute>
            }
          />

          {/* Shared Routes */}
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'FACULTY']}>
                <Leaderboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/print/qr-badges"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <QRPrintSheet />
              </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Minimal Footer */}
      {user && !isPrintView && (
        <footer className="bg-slate-900 border-t border-slate-800 py-3 text-center text-[11px] text-slate-500 font-mono no-print">
          Kutty SIH Hackathon Management & Judging System
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
