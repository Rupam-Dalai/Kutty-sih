import React, { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Search,
  FileSpreadsheet,
  RefreshCw,
  User,
  Hash,
  Layers,
  GraduationCap,
  Phone
} from 'lucide-react';

export default function TeamMgmt() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [importing, setImporting] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [teamId, setTeamId] = useState('');
  const [teamName, setTeamName] = useState('');

  // 6 Members array
  const [members, setMembers] = useState([
    { name: '', role: 'Team Lead', email: '', phone: '' },
    { name: '', role: 'Member', email: '', phone: '' },
    { name: '', role: 'Member', email: '', phone: '' },
    { name: '', role: 'Member', email: '', phone: '' },
    { name: '', role: 'Member', email: '', phone: '' },
    { name: '', role: 'Member', email: '', phone: '' }
  ]);

  // 6 Problem Statements array
  const [problemStatements, setProblemStatements] = useState(['', '', '', '', '', '']);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

  const handleImportExcel = async () => {
    if (!window.confirm('Re-import all real team details and problem statements from "SIH Team Details (Responses).xlsx"?')) {
      return;
    }
    setImporting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/teams/import-excel', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to import Excel responses');
      setSuccessMsg(data.message);
      setTimeout(() => setSuccessMsg(''), 5000);
      fetchTeams();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setImporting(false);
    }
  };

  const openAddModal = () => {
    setEditingTeam(null);
    setTeamId(`TEAM-${String(teams.length + 1).padStart(2, '0')}`);
    setTeamName('');
    setMembers([
      { name: '', role: 'Team Lead', email: '', phone: '' },
      { name: '', role: 'Member', email: '', phone: '' },
      { name: '', role: 'Member', email: '', phone: '' },
      { name: '', role: 'Member', email: '', phone: '' },
      { name: '', role: 'Member', email: '', phone: '' },
      { name: '', role: 'Member', email: '', phone: '' }
    ]);
    setProblemStatements(['', '', '', '', '', '']);
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (t) => {
    setEditingTeam(t);
    setTeamId(t.team_id);
    setTeamName(t.team_name);

    const curMembers = (t.members || []).map((m, i) => ({
      name: m.name || '',
      role: m.role || (i === 0 ? 'Team Lead' : 'Member'),
      email: m.email || '',
      phone: m.phone || ''
    }));
    while (curMembers.length < 6) {
      curMembers.push({ name: '', role: 'Member', email: '', phone: '' });
    }
    setMembers(curMembers.slice(0, 6));

    const curPS = Array.isArray(t.registered_problem_statements) ? [...t.registered_problem_statements] : [];
    while (curPS.length < 6) {
      curPS.push('');
    }
    setProblemStatements(curPS.slice(0, 6));

    setErrorMsg('');
    setModalOpen(true);
  };

  const handleMemberChange = (index, field, value) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
  };

  const handlePSChange = (index, value) => {
    const updated = [...problemStatements];
    updated[index] = value;
    setProblemStatements(updated);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!teamId.trim() || !teamName.trim()) {
      setErrorMsg('Team ID and Team Name are required.');
      return;
    }

    for (let i = 0; i < 6; i++) {
      if (!members[i].name.trim()) {
        setErrorMsg(`Please provide a name for Member ${i + 1}. Exactly 6 members are required.`);
        return;
      }
    }

    for (let i = 0; i < 6; i++) {
      if (!problemStatements[i].trim()) {
        setErrorMsg(`Please provide Problem Statement ${i + 1}. Exactly 6 registered statements are required.`);
        return;
      }
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const url = editingTeam ? `/api/teams/${editingTeam.id}` : '/api/teams';
      const method = editingTeam ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: teamId.trim(),
          teamName: teamName.trim(),
          members,
          problemStatements
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save team');

      setSuccessMsg(editingTeam ? 'Team details updated.' : 'Team created with 6 members & 6 statements.');
      setTimeout(() => setSuccessMsg(''), 3000);
      setModalOpen(false);
      fetchTeams();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`Are you sure you want to delete ${t.team_name} (${t.team_id})?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/teams/${t.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete team');

      setSuccessMsg('Team deleted.');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchTeams();
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = teams.filter(t =>
    t.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.team_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.final_problem_statement && t.final_problem_statement.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-700" />
            <span>Team Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Loaded with real SIH responses: {teams.length} teams with 6 registered members and 6 statements each.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={handleImportExcel}
            disabled={importing}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors disabled:opacity-50"
            title="Re-sync data directly from SIH Team Details (Responses).xlsx"
          >
            {importing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Importing Excel...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Re-sync from Excel</span>
              </>
            )}
          </button>

          <button
            onClick={openAddModal}
            className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Team</span>
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
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search & Filter */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between gap-4">
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
          Showing {filtered.length} of {teams.length} teams
        </div>
      </div>

      {/* Teams Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-xs text-slate-400 font-mono">
            Loading team roster...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-400">
            No teams found matching search query.
          </div>
        ) : (
          filtered.map((team) => (
            <div
              key={team.id}
              className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
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
                        {team.judged_status === 'JUDGED' ? 'Judged' : 'Pending Judging'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{team.team_name}</h3>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(team)}
                      className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-slate-100 rounded"
                      title="Edit Team"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(team)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded"
                      title="Delete Team"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Final Assigned PS */}
                <div className="mt-3 bg-slate-50 border border-slate-200 rounded p-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Allocated Problem Statement
                  </div>
                  <div className="text-xs font-semibold text-blue-950 mt-0.5">
                    {team.final_problem_statement || (
                      <span className="italic text-slate-400 font-normal">Pending randomized allocation</span>
                    )}
                  </div>
                </div>

                {/* 6 Members list */}
                <div className="mt-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
                    <span>Registered Members (6)</span>
                    <span className="font-mono text-[9px] text-slate-400">Total: 6</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    {(team.members || []).map((m, idx) => (
                      <div key={idx} className="bg-slate-50/70 p-1.5 rounded border border-slate-100 truncate text-slate-700">
                        <div className="flex items-center space-x-1">
                          <span className="text-[9px] font-mono text-slate-400 w-3">{idx + 1}.</span>
                          <span className="font-bold text-slate-900 truncate">{m.name}</span>
                          {m.role === 'Team Lead' && (
                            <span className="text-[8px] bg-blue-100 text-blue-800 font-bold px-1 rounded">Lead</span>
                          )}
                        </div>
                        {m.email && (
                          <div className="text-[10px] text-slate-500 truncate pl-4">
                            {m.email}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer info */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>6 Registered Candidate PS</span>
                {team.total_score !== undefined && team.total_score !== null && (
                  <span className="font-bold text-slate-900 font-mono">
                    Score: {team.total_score}/80
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Team Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-3xl w-full p-6 relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              {editingTeam ? 'Edit Team Details' : 'Register New Hackathon Team'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter Team Identification, all 6 team members, and the 6 candidate problem statements.
            </p>

            {errorMsg && (
              <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Team ID</label>
                  <input
                    type="text"
                    required
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    placeholder="e.g. TEAM-01"
                    className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 outline-none uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Team Name</label>
                  <input
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Odyssey"
                    className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              {/* 6 Members Section */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-blue-700" />
                    <span>Exactly 6 Team Members</span>
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">1 Lead + 5 Members</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {members.map((m, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded border border-slate-200 space-y-1.5 shadow-xs">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold">
                        <span>Member #{idx + 1} {idx === 0 ? '(Team Lead)' : ''}</span>
                      </div>
                      <input
                        type="text"
                        required
                        value={m.name}
                        onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                        placeholder={`Member ${idx + 1} Full Name`}
                        className="w-full text-xs border border-slate-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-600 outline-none"
                      />
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          value={m.email}
                          onChange={(e) => handleMemberChange(idx, 'email', e.target.value)}
                          placeholder="Dept / Reg No"
                          className="w-full text-[11px] border border-slate-200 rounded px-2 py-0.5 focus:ring-1 focus:ring-blue-600 outline-none text-slate-600"
                        />
                        <input
                          type="text"
                          value={m.phone}
                          onChange={(e) => handleMemberChange(idx, 'phone', e.target.value)}
                          placeholder="Phone Number"
                          className="w-full text-[11px] border border-slate-200 rounded px-2 py-0.5 focus:ring-1 focus:ring-blue-600 outline-none text-slate-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6 Problem Statements Section */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-700" />
                    <span>6 Registered Problem Statements</span>
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">1 will be uniquely allocated</span>
                </div>

                <div className="space-y-2">
                  {problemStatements.map((ps, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-slate-400 w-6 text-right">
                        PS{idx + 1}:
                      </span>
                      <input
                        type="text"
                        required
                        value={ps}
                        onChange={(e) => handlePSChange(idx, e.target.value)}
                        placeholder={`Problem Statement ${idx + 1} ID and Title`}
                        className="flex-1 text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded border border-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingTeam ? 'Update Team' : 'Register Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
