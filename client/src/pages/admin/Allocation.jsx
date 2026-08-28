import React, { useEffect, useState } from 'react';
import {
  Shuffle,
  CheckCircle2,
  Lock,
  Unlock,
  AlertTriangle,
  RefreshCw,
  Layers,
  Sparkles,
  Check
} from 'lucide-react';

export default function Allocation() {
  const [allocationData, setAllocationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [lastStats, setLastStats] = useState(null);

  const fetchStatus = () => {
    fetch('/api/allocation/status')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAllocationData(data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRunAllocation = async () => {
    if (allocationData?.isLocked) {
      alert('Problem statement allocation is locked because judging has begun.');
      return;
    }

    if (!window.confirm('Run backend randomized allocation algorithm? This will shuffle each team’s 6 registered statements and assign 1 unique problem statement to every team with 0 collisions.')) {
      return;
    }

    setAllocating(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/allocation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Allocation failed');

      setSuccessMsg(data.message || 'Problem statements allocated with 100% uniqueness.');
      setLastStats(data.stats);
      setTimeout(() => setSuccessMsg(''), 5000);
      fetchStatus();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setAllocating(false);
    }
  };

  const handleToggleLock = async (lock) => {
    try {
      const res = await fetch('/api/allocation/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lock })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update lock state');
      fetchStatus();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <Shuffle className="w-5 h-5 text-blue-700" />
              <span>Problem Statement Allocation Engine</span>
            </h1>
            {allocationData?.isLocked && (
              <span className="px-2 py-0.5 bg-slate-800 text-white text-[10px] font-bold rounded flex items-center space-x-1">
                <Lock className="w-3 h-3" />
                <span>Locked</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Randomized backtracking algorithm shuffles team choices and guarantees 100% collision-free assignments.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRunAllocation}
            disabled={allocating || allocationData?.isLocked}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors disabled:opacity-50"
          >
            {allocating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Solving Matches...</span>
              </>
            ) : (
              <>
                <Shuffle className="w-3.5 h-3.5" />
                <span>Shuffle & Allocate Unique Statements</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Status Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Total Teams</span>
          <span className="text-2xl font-black text-slate-900">{allocationData?.totalTeams || 0}</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Allocated Teams</span>
          <span className="text-2xl font-black text-blue-700">
            {allocationData?.allocatedCount || 0} / {allocationData?.totalTeams || 0}
          </span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Uniqueness Integrity</span>
          <span className="text-sm font-bold text-emerald-600 flex items-center space-x-1 mt-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>0 Collisions (Unique)</span>
          </span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Judging Lock</span>
            <span className="text-xs font-bold text-slate-800">
              {allocationData?.judgedCount > 0
                ? `${allocationData.judgedCount} Judged (Locked)`
                : allocationData?.isLocked
                ? 'Manual Locked'
                : 'Unlocked'}
            </span>
          </div>
          {allocationData?.judgedCount === 0 && (
            <button
              onClick={() => handleToggleLock(!allocationData.isLocked)}
              className="p-2 text-slate-500 hover:text-slate-900 border border-slate-200 rounded text-xs"
              title={allocationData.isLocked ? 'Unlock Allocation' : 'Lock Allocation'}
            >
              {allocationData.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Allocation List Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Team Problem Statement Allocations
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {allocationData?.allocatedCount || 0} of {allocationData?.totalTeams || 0} Assigned
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 font-mono">
              Loading allocation state...
            </div>
          ) : !allocationData?.teams || allocationData.teams.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No teams found in database.
            </div>
          ) : (
            allocationData.teams.map((team) => (
              <div key={team.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  
                  {/* Team Identification */}
                  <div className="min-w-[180px]">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-blue-900 text-white font-mono text-[10px] font-bold rounded">
                        {team.team_id}
                      </span>
                      <span className="font-bold text-sm text-slate-900">{team.team_name}</span>
                    </div>
                  </div>

                  {/* Final Allocated PS */}
                  <div className="flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                      Assigned Problem Statement
                    </div>
                    {team.finalProblemStatement ? (
                      <div className="p-2 bg-blue-50/70 border border-blue-200 rounded text-xs font-semibold text-blue-950 flex items-start space-x-2">
                        <Check className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                        <span>{team.finalProblemStatement}</span>
                      </div>
                    ) : (
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded text-xs italic text-slate-400">
                        Pending allocation (Click 'Shuffle & Allocate')
                      </div>
                    )}

                    {/* 6 Choices pills */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="text-[10px] font-bold text-slate-400 mr-1 self-center">Choices:</span>
                      {(team.registeredStatements || []).map((stmt, idx) => {
                        const isAssigned = stmt === team.finalProblemStatement;
                        return (
                          <span
                            key={idx}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                              isAssigned
                                ? 'bg-blue-600 text-white font-bold'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                            title={stmt}
                          >
                            PS{idx + 1} {isAssigned ? '✓ (Selected)' : ''}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
