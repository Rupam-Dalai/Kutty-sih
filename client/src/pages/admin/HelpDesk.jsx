import React, { useEffect, useState } from 'react';
import {
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UserCheck,
  Users,
  MessageSquare
} from 'lucide-react';

export default function HelpDesk() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchRequests = () => {
    fetch('/api/help')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRequests(data.requests || []);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/help/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');
      fetchRequests();
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = requests.filter(r => {
    if (statusFilter === 'ALL') return true;
    return r.status === statusFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-blue-700" />
            <span>Faculty Assistance Help Desk</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time incoming support alerts and inquiries from judging booths.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchRequests}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center space-x-1 border border-slate-300"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 text-xs">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-3 py-1.5 rounded font-bold transition-colors ${
            statusFilter === 'ALL'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Requests ({requests.length})
        </button>
        <button
          onClick={() => setStatusFilter('PENDING')}
          className={`px-3 py-1.5 rounded font-bold transition-colors ${
            statusFilter === 'PENDING'
              ? 'bg-amber-600 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Pending ({requests.filter(r => r.status === 'PENDING').length})
        </button>
        <button
          onClick={() => setStatusFilter('RESOLVED')}
          className={`px-3 py-1.5 rounded font-bold transition-colors ${
            statusFilter === 'RESOLVED'
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Resolved ({requests.filter(r => r.status === 'RESOLVED').length})
        </button>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white p-8 rounded-lg border border-slate-200 text-center text-xs text-slate-400 font-mono">
            Checking assistance queue...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-8 rounded-lg border border-slate-200 text-center text-xs text-slate-500">
            No help requests currently matching this filter.
          </div>
        ) : (
          filtered.map((req) => (
            <div
              key={req.id}
              className={`bg-white border rounded-lg p-4 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-colors ${
                req.status === 'PENDING' ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
              }`}
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      req.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : req.status === 'IN_PROGRESS'
                        ? 'bg-blue-100 text-blue-900 border border-blue-300'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}
                  >
                    {req.status}
                  </span>

                  <span className="text-xs font-bold text-slate-900 flex items-center space-x-1">
                    <UserCheck className="w-3.5 h-3.5 text-blue-700" />
                    <span>{req.faculty_name} ({req.faculty_id})</span>
                  </span>

                  <span className="text-xs text-slate-500 flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Team: {req.team_name} ({req.team_id})</span>
                  </span>

                  <span className="text-[11px] text-slate-400 font-mono flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(req.created_at).toLocaleTimeString()}</span>
                  </span>
                </div>

                <div className="text-xs text-slate-800 bg-slate-50 p-2.5 rounded border border-slate-200 flex items-start space-x-2">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span className="font-medium">{req.message}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 self-end md:self-auto">
                {req.status === 'PENDING' && (
                  <button
                    onClick={() => updateStatus(req.id, 'IN_PROGRESS')}
                    className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-xs"
                  >
                    Mark In-Progress
                  </button>
                )}

                {req.status !== 'RESOLVED' && (
                  <button
                    onClick={() => updateStatus(req.id, 'RESOLVED')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs flex items-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Resolve</span>
                  </button>
                )}

                {req.status === 'RESOLVED' && (
                  <span className="text-xs font-semibold text-emerald-700 flex items-center space-x-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Resolved</span>
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
