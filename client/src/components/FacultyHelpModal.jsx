import React, { useState } from 'react';
import { HelpCircle, X, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function FacultyHelpModal({ currentTeam = null }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (user?.role !== 'FACULTY') {
    return null; // Only show for faculty
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMsg('Please describe what you need assistance with.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facultyId: user.facultyId || user.id,
          facultyName: user.name || 'Faculty Judge',
          teamId: currentTeam?.team_id || currentTeam?.teamId || 'N/A',
          teamName: currentTeam?.team_name || currentTeam?.teamName || 'General Desk',
          message: message.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit help request');

      setSubmittedSuccess(true);
      setMessage('');
      setTimeout(() => {
        setSubmittedSuccess(false);
        setIsOpen(false);
      }, 2500);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating unobtrusive button */}
      <div className="fixed bottom-6 right-6 z-50 no-print">
        <button
          onClick={() => setIsOpen(true)}
          className="w-11 h-11 rounded-full bg-slate-900 text-white hover:bg-blue-700 shadow-md border border-slate-700 flex items-center justify-center transition-all hover:scale-105 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Need Help? Contact Admin Desk"
        >
          <HelpCircle className="w-5 h-5 text-slate-300 group-hover:text-white" />
        </button>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-5 relative animate-in fade-in zoom-in-95 duration-150">
            
            {/* Close Button */}
            <button
              onClick={() => {
                setIsOpen(false);
                setErrorMsg('');
                setSubmittedSuccess(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2.5 mb-3">
              <div className="w-8 h-8 rounded bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Need Help?</h3>
                <p className="text-xs text-slate-500">Send an instant alert to the hackathon admin desk.</p>
              </div>
            </div>

            {submittedSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900">Request Dispatched!</h4>
                <p className="text-xs text-slate-600">
                  The admin desk has been notified. An organizer will attend to your booth shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {currentTeam && (
                  <div className="bg-slate-50 border border-slate-200 rounded p-2.5 text-xs text-slate-700 space-y-0.5">
                    <div>
                      <span className="font-semibold text-slate-900">Current Team: </span>
                      {currentTeam.team_name || currentTeam.teamName} ({currentTeam.team_id || currentTeam.teamId})
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Describe your request / issue
                  </label>
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g., Student absent during random check, problem statement clarification, network glitch..."
                    className="w-full text-xs rounded border border-slate-300 p-2.5 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none resize-none text-slate-800"
                    autoFocus
                  />
                </div>

                {errorMsg && (
                  <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Request</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
