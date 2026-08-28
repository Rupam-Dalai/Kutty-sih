import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  CheckCircle2,
  Clock,
  Award,
  Shuffle,
  BarChart3,
  QrCode,
  ArrowRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = () => {
    fetch('/api/leaderboard/analytics')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(data.stats);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 font-mono">
        Loading event analytics...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider rounded">
              Live Hackathon
            </span>
            <span className="text-xs text-slate-400 font-mono">SIH Internal Edition</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Convener Control Panel
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time judging progress, team allocation, and score distributions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/allocation"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Problem Allocation</span>
          </Link>
          <Link
            to="/admin/qr"
            className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Print QR Badges</span>
          </Link>
          <Link
            to="/leaderboard"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold flex items-center space-x-1.5 border border-slate-300 transition-colors"
          >
            <Award className="w-3.5 h-3.5" />
            <span>View Leaderboard</span>
          </Link>
        </div>
      </div>

      {/* 6 Key Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Teams */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Teams</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats?.totalTeams || 0}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Registered for judging</div>
        </div>

        {/* Total Participants */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Participants</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats?.totalParticipants || 0}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">6 per team fixed</div>
        </div>

        {/* Faculty Count */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Faculty</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats?.totalFaculty || 0}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Evaluators assigned</div>
        </div>

        {/* Teams Judged */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Judged</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{stats?.teamsJudged || 0}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Scorecards submitted</div>
        </div>

        {/* Teams Pending */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{stats?.teamsPending || 0}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Awaiting evaluation</div>
        </div>

        {/* Average Score */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Score</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats?.averageScore || 0}<span className="text-xs font-normal text-slate-400">/80</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Overall cohort avg</div>
        </div>
      </div>

      {/* Judging Progress Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800">Judging Completion Progress</span>
          <span className="font-mono font-bold text-blue-700">{stats?.judgingProgressPercent || 0}% Complete</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
          <div
            className="bg-blue-600 h-full transition-all duration-500 rounded-full"
            style={{ width: `${stats?.judgingProgressPercent || 0}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span>{stats?.teamsJudged || 0} of {stats?.totalTeams || 0} teams evaluated</span>
          <span>{stats?.allocatedTeams || 0} problem statements allocated</span>
        </div>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Score Distribution Brackets */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Score Distribution Brackets (/80)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              High: {stats?.highestScore || 0} | Low: {stats?.lowestScore || 0}
            </span>
          </div>

          <div className="space-y-3">
            {stats?.scoreBrackets && Object.entries(stats.scoreBrackets).map(([bracket, count]) => {
              const percent = stats.teamsJudged > 0 ? Math.round((count / stats.teamsJudged) * 100) : 0;
              return (
                <div key={bracket} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">{bracket}</span>
                    <span className="font-mono font-bold text-slate-900">{count} team{count !== 1 ? 's' : ''} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions & Overview */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
            <TrendingUp className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Event Management Checklist
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <Link
              to="/admin/allocation"
              className="p-3 rounded border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-between transition-colors group"
            >
              <div>
                <div className="font-bold text-slate-900 group-hover:text-blue-700">1. Problem Statement Allocation</div>
                <div className="text-slate-500 text-[11px]">
                  {stats?.allocatedTeams === stats?.totalTeams && stats?.totalTeams > 0
                    ? 'All teams allocated unique problem statements'
                    : 'Allocation pending for some or all teams'}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              to="/admin/qr"
              className="p-3 rounded border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-between transition-colors group"
            >
              <div>
                <div className="font-bold text-slate-900 group-hover:text-blue-700">2. Generate & Print Team QR Badges</div>
                <div className="text-slate-500 text-[11px]">Distribute official badges with scannable QR tokens to booths</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              to="/admin/faculty"
              className="p-3 rounded border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-between transition-colors group"
            >
              <div>
                <div className="font-bold text-slate-900 group-hover:text-blue-700">3. Faculty Credentials & Roster</div>
                <div className="text-slate-500 text-[11px]">{stats?.totalFaculty || 0} evaluators registered in system</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              to="/leaderboard"
              className="p-3 rounded border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-between transition-colors group"
            >
              <div>
                <div className="font-bold text-slate-900 group-hover:text-blue-700">4. Live Leaderboard & Gemini Tiebreakers</div>
                <div className="text-slate-500 text-[11px]">Inspect real-time scores, ranks, and AI qualitative sentiment</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
