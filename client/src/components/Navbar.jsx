import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Award,
  QrCode,
  Shuffle,
  HelpCircle,
  LogOut,
  ScanLine,
  UserCheck,
  Menu,
  X
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingHelpCount, setPendingHelpCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      const fetchHelpCount = () => {
        fetch('/api/help')
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setPendingHelpCount(data.pendingCount || 0);
            }
          })
          .catch(() => {});
      };
      fetchHelpCount();
      const interval = setInterval(fetchHelpCount, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <Link to={user?.role === 'ADMIN' ? '/admin' : '/faculty'} className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded bg-blue-600 flex items-center justify-center font-bold text-white tracking-wider text-sm border border-blue-500 shadow-sm">
                SIH
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-white block leading-tight">
                  Kutty SIH
                </span>
                <span className="text-[11px] text-slate-400 font-medium block leading-tight">
                  Event Judging Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {user?.role === 'ADMIN' && (
              <>
                <Link
                  to="/admin"
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                    isActive('/admin') ? 'bg-blue-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/admin/teams"
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                    isActive('/admin/teams') ? 'bg-blue-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Teams</span>
                </Link>

                <Link
                  to="/admin/faculty"
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                    isActive('/admin/faculty') ? 'bg-blue-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Faculty</span>
                </Link>

                <Link
                  to="/admin/allocation"
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                    isActive('/admin/allocation') ? 'bg-blue-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Allocation</span>
                </Link>

                <Link
                  to="/admin/qr"
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                    isActive('/admin/qr') ? 'bg-blue-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QR Badges</span>
                </Link>

                <Link
                  to="/leaderboard"
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                    isActive('/leaderboard') ? 'bg-blue-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Leaderboard</span>
                </Link>

                <Link
                  to="/admin/help-desk"
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors relative ${
                    isActive('/admin/help-desk') ? 'bg-blue-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Help Desk</span>
                  {pendingHelpCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[10px] font-extrabold rounded-full animate-pulse">
                      {pendingHelpCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            {user?.role === 'FACULTY' && (
              <>
                <Link
                  to="/faculty"
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                    isActive('/faculty') ? 'bg-blue-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <ScanLine className="w-3.5 h-3.5" />
                  <span>Scan & Evaluate</span>
                </Link>

                <Link
                  to="/leaderboard"
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                    isActive('/leaderboard') ? 'bg-blue-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Leaderboard</span>
                </Link>
              </>
            )}
          </nav>

          {/* User Profile & Logout */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="text-right">
              <div className="text-xs font-semibold text-white leading-tight">
                {user?.name || user?.username || 'User'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono leading-tight">
                {user?.role === 'ADMIN' ? 'Admin / Convener' : `Faculty ID: ${user?.facultyId}`}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800 px-4 pt-2 pb-4 space-y-1">
          {user?.role === 'ADMIN' ? (
            <>
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded">Dashboard</Link>
              <Link to="/admin/teams" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded">Teams</Link>
              <Link to="/admin/faculty" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded">Faculty</Link>
              <Link to="/admin/allocation" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded">Allocation</Link>
              <Link to="/admin/qr" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded">QR Badges</Link>
              <Link to="/leaderboard" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded">Leaderboard</Link>
              <Link to="/admin/help-desk" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded">Help Desk ({pendingHelpCount})</Link>
            </>
          ) : (
            <>
              <Link to="/faculty" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded">Scan & Evaluate</Link>
              <Link to="/leaderboard" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded">Leaderboard</Link>
            </>
          )}

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-300">{user?.name} ({user?.role})</div>
            <button onClick={handleLogout} className="text-xs text-rose-400 font-semibold flex items-center space-x-1">
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
