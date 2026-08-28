import React, { useEffect, useState } from 'react';
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Search,
  Key,
  Building
} from 'lucide-react';

export default function FacultyMgmt() {
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null); // null = Add mode
  const [name, setName] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchFaculty = () => {
    fetch('/api/faculty')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFacultyList(data.faculty || []);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const openAddModal = () => {
    setEditingFaculty(null);
    setName('');
    setFacultyId('');
    setPassword('');
    setDepartment('Computer Science & Engineering');
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (fac) => {
    setEditingFaculty(fac);
    setName(fac.name);
    setFacultyId(fac.faculty_id);
    setPassword(''); // leave blank if unchanged
    setDepartment(fac.department || 'Computer Science & Engineering');
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !facultyId.trim()) {
      setErrorMsg('Faculty Name and Faculty ID are required.');
      return;
    }
    if (!editingFaculty && !password.trim()) {
      setErrorMsg('Password is required for new faculty.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const url = editingFaculty ? `/api/faculty/${editingFaculty.id}` : '/api/faculty';
      const method = editingFaculty ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          facultyId: facultyId.trim(),
          password: password.trim(),
          department: department.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Operation failed');

      setSuccessMsg(editingFaculty ? 'Faculty details updated.' : 'Faculty added successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
      setModalOpen(false);
      fetchFaculty();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (fac) => {
    if (!window.confirm(`Are you sure you want to delete faculty ${fac.name} (${fac.faculty_id})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/faculty/${fac.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete faculty');

      setSuccessMsg('Faculty removed.');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchFaculty();
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = facultyList.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.faculty_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.department && f.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-blue-700" />
            <span>Faculty Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Register and manage faculty judging accounts and evaluation metrics.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Faculty</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
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
            placeholder="Search by faculty name, ID, or department..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Showing {filtered.length} of {facultyList.length} faculty
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Faculty ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Teams Judged</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-mono">
                    Loading faculty roster...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No faculty found matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((fac) => (
                  <tr key={fac.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-900">
                      {fac.faculty_id}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {fac.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {fac.department || 'General'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">
                        {fac.judged_count || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => openEditModal(fac)}
                        className="p-1 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded"
                        title="Edit Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(fac)}
                        className="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded"
                        title="Delete Faculty"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-5 relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold text-slate-900 mb-1">
              {editingFaculty ? 'Edit Faculty Details' : 'Add New Faculty Member'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Faculty will use their Faculty ID and password to log in and evaluate teams.
            </p>

            {errorMsg && (
              <div className="mb-3 p-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded flex items-center space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Faculty Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Kumar"
                  className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Faculty ID
                </label>
                <input
                  type="text"
                  required
                  value={facultyId}
                  onChange={(e) => setFacultyId(e.target.value)}
                  placeholder="e.g. FAC105"
                  className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 outline-none uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {editingFaculty ? 'New Password (leave blank to keep existing)' : 'Password'}
                </label>
                <input
                  type="password"
                  required={!editingFaculty}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingFaculty ? '••••••••' : 'Enter password'}
                  className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded border border-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingFaculty ? 'Update Faculty' : 'Add Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
