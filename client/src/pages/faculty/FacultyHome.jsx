import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import QRScannerModal from '../../components/QRScannerModal';
import FacultyHelpModal from '../../components/FacultyHelpModal';
import {
  ScanLine,
  Users,
  CheckCircle2,
  Clock,
  Search,
  ArrowRight,
  ShieldAlert,
  Layers
} from 'lucide-react';

export default function FacultyHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);

  const fetchTeams = () => {
    fetch('/api/teams')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTeams(data.teams || []);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleScanSuccess = (identifier) => {
    // Navigate directly to team details view
    navigate(`/faculty/team/${identifier}`);
  };

  const filtered = teams.filter(t =>
    t.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.team_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.final_problem_statement && t.final_problem_statement.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Floating help button */}
      <FacultyHelpModal />

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* Top Banner & Scanner Action */}
      <div className="bg-slate-900 text-white rounded-lg p-6 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-mono font-bold rounded">
              {user?.facultyId || 'FACULTY'}
            </span>
            <span className="text-xs text-slate-300 font-medium">Official Judging Portal</span>
          </div>
          <h1 className="text-xl font-bold text-white">
            Welcome, {user?.name || 'Faculty Judge'}
          </h1>
          <p className="text-xs text-slate-300">
            Scan a team's physical QR badge or select their booth from the directory below to initiate scorecard evaluation.
          </p>
        </div>

        <button
          onClick={() => setScannerOpen(true)}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all active:scale-98 shrink-0"
        >
          <ScanLine className="w-5 h-5" />
          <span>Scan Team QR Code</span>
        </button>
      </div>

      {/* Search & Directory Header */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search teams by ID, name, or allocated statement..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono">
          {teams.filter(t => t.judged_status === 'JUDGED').length} / {teams.length} Teams Evaluated
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-xs text-slate-400 font-mono">
            Loading hackathon teams directory...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-xs text-slate-400">
            No teams found matching search.
          </div>
        ) : (
          filtered.map((team) => (
            <div
              key={team.id}
              className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-blue-900 text-white font-mono text-[10px] font-bold rounded">
                    {team.team_id}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      team.judged_status === 'JUDGED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {team.judged_status === 'JUDGED' ? 'Judged' : 'Pending'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-2">{team.team_name}</h3>

                {/* Problem Statement */}
                <div className="mt-2.5 bg-slate-50 border border-slate-200 rounded p-2 text-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                    Assigned Problem Statement
                  </div>
                  <div className="text-slate-800 font-semibold line-clamp-2">
                    {team.final_problem_statement || (
                      <span className="italic text-slate-400 font-normal">Pending allocation by admin</span>
                    )}
                  </div>
                </div>

                {/* 6 Members list preview */}
                <div className="mt-2.5 text-[11px] text-slate-500 flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>6 Members ({team.members?.[0]?.name ? `Lead: ${team.members[0].name}` : 'Registered'})</span>
                </div>
              </div>

              {/* Action */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                {team.total_score !== undefined && team.total_score !== null ? (
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    Score: {team.total_score}/80
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">Ready for evaluation</span>
                )}

                <button
                  onClick={() => navigate(`/faculty/team/${team.team_id}`)}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold flex items-center space-x-1 transition-colors"
                >
                  <span>{team.judged_status === 'JUDGED' ? 'View Details' : 'Open Details'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
