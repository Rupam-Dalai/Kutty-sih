import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, Key, User, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login() {
  const [role, setRole] = useState('FACULTY'); // 'FACULTY' or 'ADMIN'
  
  // Admin inputs
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Faculty inputs
  const [facultyId, setFacultyId] = useState('');
  const [facultyPassword, setFacultyPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { loginAdmin, loginFaculty } = useAuth();
  const navigate = useNavigate();

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      await loginAdmin(adminUsername, adminPassword);
      navigate('/admin');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFacultySubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      await loginFaculty(facultyId, facultyPassword);
      navigate('/faculty');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-blue-600 border border-blue-500 shadow-md mb-3 text-white font-black text-xl tracking-wider">
          SIH
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Kutty SIH Portal
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Smart India Hackathon Team Judging & Allocation System
        </p>
      </div>

      {/* Main Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-6 px-5 sm:px-8 rounded-lg shadow-xl border border-slate-200">
          
          {/* Role Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-md mb-6 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setRole('FACULTY');
                setErrorMsg('');
              }}
              className={`py-2 text-xs font-bold rounded flex items-center justify-center space-x-1.5 transition-all ${
                role === 'FACULTY'
                  ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Faculty Login</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole('ADMIN');
                setErrorMsg('');
              }}
              className={`py-2 text-xs font-bold rounded flex items-center justify-center space-x-1.5 transition-all ${
                role === 'ADMIN'
                  ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Faculty Form */}
          {role === 'FACULTY' && (
            <form onSubmit={handleFacultySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Faculty ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={facultyId}
                    onChange={(e) => setFacultyId(e.target.value)}
                    placeholder="e.g. FAC101"
                    className="block w-full pl-9 pr-3 py-2 text-xs font-medium border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none uppercase font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={facultyPassword}
                    onChange={(e) => setFacultyPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-9 pr-3 py-2 text-xs font-medium border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded shadow-xs flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Enter Judging Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Admin Form */}
          {role === 'ADMIN' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Admin Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="admin"
                    className="block w-full pl-9 pr-3 py-2 text-xs font-medium border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Admin Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-9 pr-3 py-2 text-xs font-medium border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded shadow-xs flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Access Admin Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
