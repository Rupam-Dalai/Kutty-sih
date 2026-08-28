import React, { useEffect, useState } from 'react';
import {
  Award,
  Trophy,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  Bot,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

export default function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [closeScoreGroups, setCloseScoreGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeamDetails, setSelectedTeamDetails] = useState(null);

  const fetchLeaderboard = () => {
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLeaderboardData(data.leaderboard || []);
          setCloseScoreGroups(data.closeScoreGroups || []);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 12000);
    return () => clearInterval(interval);
  }, []);

  const filtered = leaderboardData.filter(t =>
    t.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.teamId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.problemStatement.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shadow-xs">
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-900 font-black text-xs flex items-center justify-center shadow-xs">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
          3
        </span>
      );
    }
    return (
      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center font-mono">
        {rank}
      </span>
    );
  };

  const getSentimentBadge = (sentiment) => {
    if (sentiment === 'Positive') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          Positive
        </span>
      );
    }
    if (sentiment === 'Negative') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
          Negative
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
        Neutral
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>SIH Live Leaderboard</span>
            </h1>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-900 text-[10px] font-mono font-bold rounded">
              Official Scores /80
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Rankings sorted by official faculty score. Gemini qualitative synthesis assists tiebreaker decisions.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <div className="flex items-center space-x-1 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Sync</span>
          </div>
        </div>
      </div>

      {/* Close-Score Tiebreaker & Gemini Analysis Assistant (If any ties/close scores exist) */}
      {closeScoreGroups.length > 0 && (
        <div className="bg-white border-2 border-indigo-200 rounded-lg p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                Gemini Qualitative Tiebreaker Assistant
              </h3>
            </div>
            <span className="text-[11px] text-slate-500">
              {closeScoreGroups.length} Close Score Cluster{closeScoreGroups.length > 1 ? 's' : ''} Detected (Score diff ≤ 2)
            </span>
          </div>

          <p className="text-xs text-slate-600">
            The following teams have approximately similar scores. Review Gemini’s qualitative analysis of faculty observations to evaluate depth, defense authenticity, and validation rigor without altering official points:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {closeScoreGroups.map((group, gIdx) => (
              <div key={gIdx} className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Cluster {gIdx + 1}: Score Range {group.scoreRange}/80
                  </span>
                  {group.isExactTie && (
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded">
                      Exact Tie
                    </span>
                  )}
                </div>

                <div className="space-y-2.5">
                  {group.teams.map((t, tIdx) => (
                    <div key={tIdx} className="bg-white p-2.5 rounded border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-900">
                          {t.teamName} <span className="font-mono text-slate-500 font-normal">({t.teamId})</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-900 font-mono">{t.score}/80</span>
                          {getSentimentBadge(t.sentiment)}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded border border-slate-100">
                        "{t.tiebreakerInsight}"
                      </div>

                      {t.strengths?.length > 0 && (
                        <div className="text-[10px] text-emerald-800 flex items-start space-x-1">
                          <span className="font-bold">Key Strength:</span>
                          <span>{t.strengths[0]}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search leaderboard by team, ID, or problem statement..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono">
          {filtered.filter(t => t.totalScore !== null).length} Judged Teams
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 text-center w-14">Rank</th>
                <th className="py-3.5 px-4">Team ID & Name</th>
                <th className="py-3.5 px-4">Allocated Problem Statement</th>
                <th className="py-3.5 px-4">Judge / Faculty</th>
                <th className="py-3.5 px-4 text-center">AI Sentiment</th>
                <th className="py-3.5 px-4 text-right">Score (/80)</th>
                <th className="py-3.5 px-4 text-center w-16">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 font-mono">
                    Loading standings...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No teams found matching search.
                  </td>
                </tr>
              ) : (
                filtered.map((team) => {
                  const isJudged = team.totalScore !== null && team.totalScore !== undefined;

                  return (
                    <tr
                      key={team.teamDbId}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !isJudged ? 'opacity-60 bg-slate-50/30' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3 px-4 text-center">
                        {isJudged ? getRankBadge(team.rank) : <span className="text-slate-300 font-mono">—</span>}
                      </td>

                      {/* Team Name & ID */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">
                            {team.teamId}
                          </span>
                          <span className="font-bold text-slate-900">{team.teamName}</span>
                        </div>
                      </td>

                      {/* Problem Statement */}
                      <td className="py-3 px-4 max-w-xs">
                        <span className="font-medium text-slate-800 line-clamp-1" title={team.problemStatement}>
                          {team.problemStatement}
                        </span>
                      </td>

                      {/* Faculty Judge */}
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {team.facultyName}
                      </td>

                      {/* AI Sentiment */}
                      <td className="py-3 px-4 text-center">
                        {isJudged ? getSentimentBadge(team.geminiSentiment) : <span className="text-slate-300">—</span>}
                      </td>

                      {/* Total Score */}
                      <td className="py-3 px-4 text-right">
                        {isJudged ? (
                          <div className="font-black text-sm text-slate-900 font-mono">
                            {team.totalScore}
                            <span className="text-[10px] font-normal text-slate-400">/80</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded">
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        {isJudged && (
                          <button
                            onClick={() => setSelectedTeamDetails(team)}
                            className="p-1 text-slate-400 hover:text-blue-700 hover:bg-slate-100 rounded"
                            title="View Scorecard & Comments"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Scorecard Modal */}
      {selectedTeamDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-2xl w-full p-6 relative my-8 max-h-[90vh] overflow-y-auto space-y-4">
            
            <button
              onClick={() => setSelectedTeamDetails(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-blue-900 text-white font-mono text-xs font-bold rounded">
                  {selectedTeamDetails.teamId}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedTeamDetails.teamName} — Evaluation Details
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluated by {selectedTeamDetails.facultyName} on {new Date(selectedTeamDetails.submittedAt).toLocaleString()}
              </p>
            </div>

            {/* Total Score Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 block">Total Score</span>
                <span className="text-2xl font-black text-blue-900 font-mono">
                  {selectedTeamDetails.totalScore} / 80
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 block text-right">Gemini Sentiment</span>
                {getSentimentBadge(selectedTeamDetails.geminiSentiment)}
              </div>
            </div>

            {/* Criteria Breakdown Grid */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">8 Criteria Breakdown</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between">
                  <span>1. Problem Understanding</span>
                  <span className="font-bold font-mono">{selectedTeamDetails.scoresBreakdown?.c1}/10</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between">
                  <span>2. Problem-Solving Mindset</span>
                  <span className="font-bold font-mono">{selectedTeamDetails.scoresBreakdown?.c2}/10</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between">
                  <span>3. Team Coordination</span>
                  <span className="font-bold font-mono">{selectedTeamDetails.scoresBreakdown?.c3}/10</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between">
                  <span>4. Individual Contribution</span>
                  <span className="font-bold font-mono">{selectedTeamDetails.scoresBreakdown?.c4}/10</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between">
                  <span>5. Research & Validation</span>
                  <span className="font-bold font-mono">{selectedTeamDetails.scoresBreakdown?.c5}/10</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between">
                  <span>6. Innovation & Creativity</span>
                  <span className="font-bold font-mono">{selectedTeamDetails.scoresBreakdown?.c6}/10</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between">
                  <span>7. Execution Thinking</span>
                  <span className="font-bold font-mono">{selectedTeamDetails.scoresBreakdown?.c7}/10</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between">
                  <span>8. Communication & Pitch</span>
                  <span className="font-bold font-mono">{selectedTeamDetails.scoresBreakdown?.c8}/10</span>
                </div>
              </div>
            </div>

            {/* Wrong Perspective Test & Observations */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-1.5 text-xs">
              <div className="font-bold text-slate-800">Wrong-Perspective Challenge Reaction:</div>
              <div className="text-slate-700">
                <span className="font-semibold">Team Reaction: </span>
                <span className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-medium">
                  {selectedTeamDetails.wrongPerspectiveReaction || 'N/A'}
                </span>
              </div>
              {selectedTeamDetails.wrongPerspectiveObservation && (
                <div className="text-slate-600 italic mt-1">
                  "{selectedTeamDetails.wrongPerspectiveObservation}"
                </div>
              )}
            </div>

            {/* Mandatory Written Comments */}
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded">
                <div className="font-bold text-slate-800">Team Coordination Comment (Mandatory):</div>
                <p className="text-slate-600 mt-1">{selectedTeamDetails.c3Comments}</p>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded">
                <div className="font-bold text-slate-800">
                  Individual Contribution Comment (Selected: {selectedTeamDetails.c4SelectedMember}):
                </div>
                <p className="text-slate-600 mt-1">{selectedTeamDetails.c4Comments}</p>
              </div>

              {selectedTeamDetails.overallComments && (
                <div className="p-3 bg-white border border-slate-200 rounded">
                  <div className="font-bold text-slate-800">Overall Comments:</div>
                  <p className="text-slate-600 mt-1">{selectedTeamDetails.overallComments}</p>
                </div>
              )}
            </div>

            {/* Gemini AI Synthesis */}
            {selectedTeamDetails.geminiAnalysis && (
              <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-lg space-y-2 text-xs">
                <div className="flex items-center space-x-1.5 text-indigo-900 font-bold">
                  <Bot className="w-3.5 h-3.5" />
                  <span>Gemini Qualitative Synthesis</span>
                </div>
                <p className="text-slate-700">{selectedTeamDetails.geminiAnalysis.summary}</p>
                {selectedTeamDetails.geminiAnalysis.tiebreakerInsight && (
                  <div className="text-indigo-950 font-medium italic">
                    Tiebreaker insight: "{selectedTeamDetails.geminiAnalysis.tiebreakerInsight}"
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedTeamDetails(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
