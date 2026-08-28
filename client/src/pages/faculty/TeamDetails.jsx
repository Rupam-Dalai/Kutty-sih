import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import FacultyHelpModal from '../../components/FacultyHelpModal';
import {
  Users,
  Award,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  ShieldCheck
} from 'lucide-react';

export default function TeamDetails() {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch(`/api/teams/find/${encodeURIComponent(identifier)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.team) {
          setTeam(data.team);
        } else {
          setErrorMsg(data.error || 'Team not found for this identifier.');
        }
      })
      .catch(err => setErrorMsg(err.message))
      .finally(() => setLoading(false));
  }, [identifier]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-xs text-slate-400 font-mono">
        Verifying team identifier...
      </div>
    );
  }

  if (errorMsg || !team) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Team Lookup Failed</h2>
        <p className="text-xs text-slate-500">{errorMsg || 'Could not find the requested team.'}</p>
        <Link
          to="/faculty"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-700 hover:text-blue-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Faculty Portal</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Floating help button */}
      <FacultyHelpModal currentTeam={team} />

      {/* Back button */}
      <div>
        <Link
          to="/faculty"
          className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Scanner & Directory</span>
        </Link>
      </div>

      {/* Team Header Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 bg-blue-900 text-white font-mono text-xs font-bold rounded">
              {team.team_id}
            </span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                team.judged_status === 'JUDGED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {team.judged_status === 'JUDGED' ? 'Status: Evaluated' : 'Status: Ready for Judging'}
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 mt-2 tracking-tight">
            {team.team_name}
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            QR Token: {team.qr_code_token}
          </p>
        </div>

        <div>
          <button
            onClick={() => navigate(`/faculty/scorecard/${team.team_id}`)}
            className="w-full md:w-auto px-5 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-2 shadow-xs transition-colors"
          >
            <span>{team.judged_status === 'JUDGED' ? 'Edit / Review Scorecard' : 'Start Score Card'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Problem Statement Card */}
      <div className="bg-white border-2 border-blue-200 rounded-lg p-5 shadow-xs space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-blue-800 flex items-center space-x-1.5">
          <FileText className="w-4 h-4 text-blue-700" />
          <span>Final Assigned Problem Statement</span>
        </div>

        {team.final_problem_statement ? (
          <div className="text-sm font-bold text-slate-900 leading-relaxed bg-blue-50/60 p-3.5 rounded border border-blue-100">
            {team.final_problem_statement}
          </div>
        ) : (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
            Problem statement has not been locked by the admin committee yet.
          </div>
        )}
      </div>

      {/* 6 Team Members Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-slate-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Team Members (All 6 Members)
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Total: 6 Students</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {(team.members || []).map((m, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  Member #{idx + 1}
                </span>
                {m.role === 'Team Lead' ? (
                  <span className="px-1.5 py-0.2 bg-blue-100 text-blue-900 text-[10px] font-bold rounded">
                    Team Lead
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium">Member</span>
                )}
              </div>

              <div className="font-bold text-xs text-slate-900">{m.name}</div>
              {m.email && <div className="text-[11px] text-slate-500 truncate">{m.email}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Start Score Card Bottom Action */}
      <div className="pt-2 flex justify-end">
        <button
          onClick={() => navigate(`/faculty/scorecard/${team.team_id}`)}
          className="w-full sm:w-auto px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-2 shadow-xs transition-colors"
        >
          <span>{team.judged_status === 'JUDGED' ? 'Open Existing Score Card' : 'Proceed to Start Score Card'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
