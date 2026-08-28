import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function QRPrintSheet() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/teams')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTeams(data.teams || []);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500 font-mono">Loading printable badges...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 print:p-0 print:bg-white">
      {/* Control bar - Hidden on print */}
      <div className="max-w-5xl mx-auto mb-6 flex items-center justify-between no-print bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <Link
          to="/admin/qr"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center space-x-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to QR Manager</span>
        </Link>
        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-500">{teams.length} Team Badges Ready</span>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print All Badges (A4)</span>
          </button>
        </div>
      </div>

      {/* Grid of Team Cards */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4 print:max-w-none">
        {teams.map((team) => {
          const qrPayload = JSON.stringify({
            app: 'KuttySIH',
            token: team.qr_code_token,
            teamId: team.team_id,
            teamName: team.team_name
          });

          return (
            <div
              key={team.id}
              className="bg-white border-2 border-slate-800 rounded-lg p-5 flex flex-col justify-between shadow-xs print:shadow-none print:border-slate-800 break-inside-avoid"
            >
              {/* Badge Header */}
              <div className="border-b border-slate-200 pb-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-900 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                      {team.team_id}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      Kutty SIH
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{team.team_name}</h3>
                </div>

                <div className="p-1 bg-white border border-slate-300 rounded">
                  <QRCodeSVG
                    value={qrPayload}
                    size={76}
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>

              {/* Problem Statement */}
              <div className="py-2.5 border-b border-slate-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Assigned Problem Statement
                </div>
                <div className="text-xs font-semibold text-blue-950 mt-0.5 line-clamp-2">
                  {team.final_problem_statement || (
                    <span className="italic text-slate-400 font-normal">Pending final allocation</span>
                  )}
                </div>
              </div>

              {/* 6 Members List */}
              <div className="pt-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
                  <span>Registered Members (6)</span>
                  <span className="text-[9px] font-mono text-slate-400">{team.qr_code_token?.substring(0, 16)}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {(team.members || []).map((m, idx) => (
                    <div key={idx} className="text-[11px] text-slate-700 truncate flex items-center space-x-1">
                      <span className="font-mono text-[9px] text-slate-400 w-3">{idx + 1}.</span>
                      <span className="font-medium text-slate-800">{m.name}</span>
                      {m.role === 'Team Lead' && (
                        <span className="text-[9px] text-blue-700 font-bold bg-blue-50 px-1 rounded">Lead</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400">
                <span>Official Judging QR Tag</span>
                <span>Scan with Faculty App</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
