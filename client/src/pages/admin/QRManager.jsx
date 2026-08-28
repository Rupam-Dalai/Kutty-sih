import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Printer,
  Download,
  Search,
  ExternalLink,
  Users
} from 'lucide-react';

export default function QRManager() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleDownloadQR = (teamId, teamName) => {
    const svg = document.getElementById(`qr-svg-${teamId}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, 400);
      ctx.drawImage(img, 20, 20, 360, 360);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_${teamId}_${teamName.replace(/\s+/g, '_')}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const filtered = teams.filter(t =>
    t.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.team_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-blue-700" />
            <span>QR Code Manager</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate and export official QR identifier badges for team tables and faculty scanning.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/print/qr-badges"
            target="_blank"
            className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Open Print-Ready Sheet (A4)</span>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search teams by ID or name..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono">
          {filtered.length} of {teams.length} badges ready
        </div>
      </div>

      {/* QR Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-xs text-slate-400 font-mono">
            Loading team QR tokens...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-slate-400">
            No teams found.
          </div>
        ) : (
          filtered.map((team) => {
            const qrPayload = JSON.stringify({
              app: 'KuttySIH',
              token: team.qr_code_token,
              teamId: team.team_id,
              teamName: team.team_name
            });

            return (
              <div
                key={team.id}
                className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 bg-blue-900 text-white font-mono text-[10px] font-bold rounded">
                        {team.team_id}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{team.team_name}</h3>
                    </div>

                    <button
                      onClick={() => handleDownloadQR(team.team_id, team.team_name)}
                      className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-slate-100 rounded"
                      title="Download PNG QR Code"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

                  {/* QR Image Canvas */}
                  <div className="my-4 flex justify-center p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <QRCodeSVG
                      id={`qr-svg-${team.team_id}`}
                      value={qrPayload}
                      size={150}
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  {/* Allocated Problem Statement */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Allocated Statement
                    </span>
                    <p className="text-xs font-semibold text-blue-950 line-clamp-2">
                      {team.final_problem_statement || (
                        <span className="italic text-slate-400 font-normal">Pending allocation</span>
                      )}
                    </p>
                  </div>

                  {/* Members count */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                    <span className="flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>6 Members</span>
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {team.qr_code_token?.substring(0, 14)}...
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleDownloadQR(team.team_id, team.team_name)}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PNG</span>
                  </button>

                  <Link
                    to={`/faculty/team/${team.team_id}`}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center space-x-1"
                  >
                    <span>View Card</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
