import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import FacultyHelpModal from '../../components/FacultyHelpModal';
import {
  Award,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Dice5,
  Send,
  Sparkles,
  Bot,
  UserCheck,
  Info,
  Layers,
  CheckSquare
} from 'lucide-react';

export default function ScoreCard() {
  const { teamId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  // Criteria Scores & Comments state (Initial score 0 for new evaluation)
  const [c1Score, setC1Score] = useState(0);
  const [c1Comments, setC1Comments] = useState('');

  const [c2Score, setC2Score] = useState(0);
  const [c2Comments, setC2Comments] = useState('');

  const [c3Score, setC3Score] = useState(0);
  const [c3Comments, setC3Comments] = useState('');

  // Criterion 4: Part A (/8) + Part B (/2) = Max 10
  const [c4GeneralScore, setC4GeneralScore] = useState(0);
  const [c4SelectedMember, setC4SelectedMember] = useState('');
  const [c4RandomMemberScore, setC4RandomMemberScore] = useState(0);
  const [c4Comments, setC4Comments] = useState('');
  const [randomMemberLoading, setRandomMemberLoading] = useState(false);

  const [c5Score, setC5Score] = useState(0);
  const [c5Comments, setC5Comments] = useState('');

  const [c6Score, setC6Score] = useState(0);
  const [c6Comments, setC6Comments] = useState('');

  const [c7Score, setC7Score] = useState(0);
  const [c7Comments, setC7Comments] = useState('');

  const [c8Score, setC8Score] = useState(0);
  const [c8Comments, setC8Comments] = useState('');

  // Wrong-Perspective Test
  const [wrongPerspectiveReaction, setWrongPerspectiveReaction] = useState('Disagreed');
  const [wrongPerspectiveObservation, setWrongPerspectiveObservation] = useState('');

  // Overall Comment
  const [overallComments, setOverallComments] = useState('');

  // Fetch Team & Existing Scorecard / Pick Random Member
  useEffect(() => {
    async function loadData() {
      try {
        const teamRes = await fetch(`/api/teams/find/${encodeURIComponent(teamId)}`);
        const teamData = await teamRes.json();
        if (!teamData.success || !teamData.team) {
          throw new Error(teamData.error || 'Team not found.');
        }
        setTeam(teamData.team);

        // Check if existing scorecard exists
        const cardRes = await fetch(`/api/scorecard/team/${encodeURIComponent(teamData.team.id)}`);
        const cardData = await cardRes.json();

        if (cardData.success && cardData.hasScorecard && cardData.scorecard) {
          const sc = cardData.scorecard;
          setC1Score(sc.c1_score);
          setC1Comments(sc.c1_comments || '');
          setC2Score(sc.c2_score);
          setC2Comments(sc.c2_comments || '');
          setC3Score(sc.c3_score);
          setC3Comments(sc.c3_comments || '');
          setC4GeneralScore(sc.c4_general_score);
          setC4SelectedMember(sc.c4_selected_member || '');
          setC4RandomMemberScore(sc.c4_random_member_score);
          setC4Comments(sc.c4_comments || '');
          setC5Score(sc.c5_score);
          setC5Comments(sc.c5_comments || '');
          setC6Score(sc.c6_score);
          setC6Comments(sc.c6_comments || '');
          setC7Score(sc.c7_score);
          setC7Comments(sc.c7_comments || '');
          setC8Score(sc.c8_score);
          setC8Comments(sc.c8_comments || '');
          setWrongPerspectiveReaction(sc.wrong_perspective_reaction || 'Disagreed');
          setWrongPerspectiveObservation(sc.wrong_perspective_observation || '');
          setOverallComments(sc.overall_comments || '');
        } else {
          // If no existing scorecard, pick random member from backend for Criterion 4
          fetchRandomMember(teamData.team.id);
        }
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [teamId]);

  const fetchRandomMember = async (tId) => {
    setRandomMemberLoading(true);
    try {
      const res = await fetch(`/api/scorecard/random-member/${encodeURIComponent(tId || team?.id || teamId)}`);
      const data = await res.json();
      if (data.success && data.selectedMember) {
        setC4SelectedMember(data.selectedMember.name);
      }
    } catch (err) {
      console.warn('Error fetching random member:', err);
    } finally {
      setRandomMemberLoading(false);
    }
  };

  // Calculated C4 Individual Contribution Total (Part A + Part B, capped at 10)
  const c4CalculatedTotal = Math.min(
    10,
    Math.round(((parseFloat(c4GeneralScore) || 0) + (parseFloat(c4RandomMemberScore) || 0)) * 10) / 10
  );

  // Live Auto-Calculated Total Score (/80)
  const calculatedTotalScore = Math.round(
    ((parseFloat(c1Score) || 0) +
      (parseFloat(c2Score) || 0) +
      (parseFloat(c3Score) || 0) +
      c4CalculatedTotal +
      (parseFloat(c5Score) || 0) +
      (parseFloat(c6Score) || 0) +
      (parseFloat(c7Score) || 0) +
      (parseFloat(c8Score) || 0)) * 10
  ) / 10;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Validate mandatory comments
    if (!c3Comments.trim()) {
      setErrorMsg('Criterion 3 (Team Coordination) comments are mandatory. Please provide observations on team dynamics.');
      window.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }

    if (!c4Comments.trim()) {
      setErrorMsg(`Criterion 4 (Individual Contribution) comments are mandatory. Please mention observations regarding ${c4SelectedMember || 'the selected member'}.`);
      window.scrollTo({ top: 600, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        teamId: team?.id || teamId,
        facultyId: user?.facultyId || user?.id || 'FAC101',
        facultyName: user?.name || 'Faculty Judge',
        c1_score: parseFloat(c1Score),
        c1_comments: c1Comments,
        c2_score: parseFloat(c2Score),
        c2_comments: c2Comments,
        c3_score: parseFloat(c3Score),
        c3_comments: c3Comments,
        c4_general_score: parseFloat(c4GeneralScore),
        c4_selected_member: c4SelectedMember,
        c4_random_member_score: parseFloat(c4RandomMemberScore),
        c4_comments: c4Comments,
        c5_score: parseFloat(c5Score),
        c5_comments: c5Comments,
        c6_score: parseFloat(c6Score),
        c6_comments: c6Comments,
        c7_score: parseFloat(c7Score),
        c7_comments: c7Comments,
        c8_score: parseFloat(c8Score),
        c8_comments: c8Comments,
        wrong_perspective_reaction: wrongPerspectiveReaction,
        wrong_perspective_observation: wrongPerspectiveObservation,
        overall_comments: overallComments
      };

      const res = await fetch('/api/scorecard/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit scorecard');

      setSuccessResult(data);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-xs text-slate-400 font-mono">
        Loading judging scorecard...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Floating Help Modal */}
      <FacultyHelpModal currentTeam={team} />

      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <Link
          to={`/faculty/team/${team?.team_id || teamId}`}
          className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Team Details</span>
        </Link>
        <div className="text-xs text-slate-400 font-mono">
          Judge: {user?.name} ({user?.facultyId})
        </div>
      </div>

      {/* Success View */}
      {successResult ? (
        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-xs text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Scorecard Submitted Successfully</h2>
            <p className="text-xs text-slate-500 mt-1">
              Evaluation for <span className="font-semibold text-slate-900">{team?.team_name}</span> ({team?.team_id}) has been locked and recorded into the official leaderboard.
            </p>
          </div>

          {/* Score & AI Sentiment Pill */}
          <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-around">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Score</span>
              <span className="text-3xl font-black text-slate-900 font-mono">
                {successResult.totalScore} <span className="text-xs text-slate-400 font-normal">/ 80</span>
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Gemini Sentiment</span>
              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                successResult.geminiSentiment === 'Positive'
                  ? 'bg-emerald-100 text-emerald-800'
                  : successResult.geminiSentiment === 'Negative'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-slate-200 text-slate-800'
              }`}>
                {successResult.geminiSentiment}
              </span>
            </div>
          </div>

          {/* Gemini AI Summary Card */}
          {successResult.geminiAnalysis && (
            <div className="max-w-lg mx-auto bg-indigo-50/50 border border-indigo-200 rounded-lg p-4 text-left space-y-2 text-xs">
              <div className="flex items-center space-x-1.5 text-indigo-900 font-bold">
                <Bot className="w-4 h-4 text-indigo-700" />
                <span>Gemini Qualitative Synthesis</span>
              </div>
              <p className="text-slate-700">{successResult.geminiAnalysis.summary}</p>
              {successResult.geminiAnalysis.tiebreakerInsight && (
                <p className="text-indigo-950 italic font-medium">
                  "{successResult.geminiAnalysis.tiebreakerInsight}"
                </p>
              )}
            </div>
          )}

          <div className="flex justify-center space-x-3 pt-2">
            <Link
              to="/faculty"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold"
            >
              Evaluate Next Team
            </Link>
            <Link
              to="/leaderboard"
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded text-xs font-bold"
            >
              View Live Leaderboard
            </Link>
          </div>
        </div>
      ) : (
        /* Judging Form */
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Team Context Banner */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 sticky top-16 z-30 backdrop-blur-md bg-white/95">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-blue-900 text-white font-mono text-[10px] font-bold rounded">
                  {team?.team_id}
                </span>
                <h2 className="text-base font-bold text-slate-900">{team?.team_name}</h2>
              </div>
              <p className="text-xs text-slate-600 font-medium line-clamp-1 mt-0.5">
                PS: {team?.final_problem_statement || 'Pending Allocation'}
              </p>
            </div>

            {/* Live Total Score Sticky Widget */}
            <div className="flex items-center space-x-3 bg-slate-900 text-white px-4 py-2 rounded-lg shadow-xs">
              <div className="text-right">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Live Total</span>
                <span className="text-xl font-black font-mono leading-none">{calculatedTotalScore}</span>
              </div>
              <span className="text-xs font-bold text-slate-400">/80</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* CRITERIA SECTION */}
          <div className="space-y-5">
            
            {/* 1. Problem Understanding */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">1. Problem Understanding</h3>
                  <p className="text-xs text-slate-500 italic mt-0.5">
                    "Do they genuinely understand the problem, user and root cause?"
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-700">Score:</span>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    required
                    value={c1Score}
                    onChange={(e) => setC1Score(e.target.value)}
                    className="w-16 px-2 py-1 text-xs font-bold text-center border border-slate-300 rounded font-mono focus:ring-1 focus:ring-blue-600 outline-none"
                  />
                  <span className="text-xs font-bold text-slate-400">/10</span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Comments (Optional)
                </label>
                <textarea
                  rows={2}
                  value={c1Comments}
                  onChange={(e) => setC1Comments(e.target.value)}
                  placeholder="Notes on depth of problem analysis, root causes identified..."
                  className="w-full text-xs border border-slate-200 rounded p-2 focus:ring-1 focus:ring-blue-600 outline-none resize-none"
                />
              </div>
            </div>

            {/* 2. Problem-Solving Mindset */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">2. Problem-Solving Mindset</h3>
                  <p className="text-xs text-slate-500 italic mt-0.5">
                    "How they respond when challenged, questioned or given constraints."
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-700">Score:</span>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    required
                    value={c2Score}
                    onChange={(e) => setC2Score(e.target.value)}
                    className="w-16 px-2 py-1 text-xs font-bold text-center border border-slate-300 rounded font-mono focus:ring-1 focus:ring-blue-600 outline-none"
                  />
                  <span className="text-xs font-bold text-slate-400">/10</span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Comments (Optional)
                </label>
                <textarea
                  rows={2}
                  value={c2Comments}
                  onChange={(e) => setC2Comments(e.target.value)}
                  placeholder="Notes on adaptability, response to edge-cases..."
                  className="w-full text-xs border border-slate-200 rounded p-2 focus:ring-1 focus:ring-blue-600 outline-none resize-none"
                />
              </div>
            </div>

            {/* 3. Team Coordination (MANDATORY COMMENTS & CHECKLIST) */}
            <div className="bg-white border-2 border-blue-300 rounded-lg p-5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-slate-900">3. Team Coordination</h3>
                    <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 text-[10px] font-bold rounded">
                      Comment Mandatory
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 italic mt-0.5">
                    "Communication, listening, collaboration and whether they build on each other's ideas."
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-700">Score:</span>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    required
                    value={c3Score}
                    onChange={(e) => setC3Score(e.target.value)}
                    className="w-16 px-2 py-1 text-xs font-bold text-center border border-slate-300 rounded font-mono focus:ring-1 focus:ring-blue-600 outline-none"
                  />
                  <span className="text-xs font-bold text-slate-400">/10</span>
                </div>
              </div>

              {/* Faculty Coordination Guideline Box */}
              <div className="bg-blue-50/70 border border-blue-200 rounded p-3 text-xs text-slate-700 space-y-1.5">
                <div className="font-bold text-blue-900 flex items-center space-x-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-700" />
                  <span>Important Faculty Checklist & Instruction:</span>
                </div>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600">
                  <li>Ask a different person about the project instead of only asking the person who initially explained the idea.</li>
                  <li>Check whether every member knows the project plan and understands the solution.</li>
                  <li>Check whether different members can explain the project or if only one person is explaining everything.</li>
                  <li>Check whether members build on each other's ideas collaboratively.</li>
                </ul>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  Faculty Coordination Comments <span className="text-rose-600">* (Required)</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={c3Comments}
                  onChange={(e) => setC3Comments(e.target.value)}
                  placeholder="Mandatory: Record observations on whether all members contributed, if one person dominated, or if members complemented each other..."
                  className="w-full text-xs border border-slate-300 rounded p-2 focus:ring-1 focus:ring-blue-600 outline-none resize-none"
                />
              </div>
            </div>

            {/* 4. INDIVIDUAL CONTRIBUTION (10 MARKS TOTAL: PART A /8 + PART B /2) */}
            <div className="bg-white border-2 border-indigo-300 rounded-lg p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      4. Individual Contribution — /10 Total
                    </h3>
                    <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 text-[10px] font-bold rounded">
                      Comment Mandatory
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 italic mt-0.5">
                    "Does every member understand the project and contribute meaningfully?"
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-indigo-950 font-mono">
                    Total: {c4CalculatedTotal}/10
                  </div>
                  <div className="text-[10px] text-slate-400">Part A + Part B</div>
                </div>
              </div>

              {/* Part A: General Team Contribution (/8) */}
              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800">
                      Part A — General Team Member Contribution (/8)
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Evaluate the general understanding and contribution of the overall team.
                    </p>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="number"
                      min="0"
                      max="8"
                      step="0.5"
                      required
                      value={c4GeneralScore}
                      onChange={(e) => setC4GeneralScore(e.target.value)}
                      className="w-14 px-2 py-1 text-xs font-bold text-center border border-slate-300 rounded font-mono focus:ring-1 focus:ring-blue-600 outline-none"
                    />
                    <span className="text-xs font-bold text-slate-400">/8</span>
                  </div>
                </div>
              </div>

              {/* Part B: Random Member Verification (/2) */}
              <div className="bg-indigo-50/60 p-4 rounded-lg border border-indigo-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-2">
                  <div className="flex items-center space-x-2">
                    <Dice5 className="w-4 h-4 text-indigo-700" />
                    <div>
                      <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                        Part B — Random Member Verification (/2)
                      </h4>
                      <p className="text-[11px] text-slate-600">
                        Selected at random from the 6 registered members on the backend.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-700">Verification Score:</span>
                    <input
                      type="number"
                      min="0"
                      max="2"
                      step="0.5"
                      required
                      value={c4RandomMemberScore}
                      onChange={(e) => setC4RandomMemberScore(e.target.value)}
                      className="w-14 px-2 py-1 text-xs font-bold text-center border border-slate-300 rounded font-mono focus:ring-1 focus:ring-blue-600 outline-none"
                    />
                    <span className="text-xs font-bold text-slate-400">/2</span>
                  </div>
                </div>

                {/* Selected Student Banner */}
                <div className="bg-white p-3 rounded border border-indigo-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                      Target Student for Verification Question
                    </span>
                    <div className="text-sm font-extrabold text-slate-900 flex items-center space-x-2 mt-0.5">
                      <UserCheck className="w-4 h-4 text-indigo-600" />
                      <span>Selected Member: {c4SelectedMember || 'Selecting...'}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => fetchRandomMember(team?.id)}
                    disabled={randomMemberLoading}
                    className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50 border border-indigo-300 rounded flex items-center space-x-1 self-start sm:self-auto"
                    title="Reselect Random Member"
                  >
                    <Dice5 className="w-3.5 h-3.5" />
                    <span>Reshuffle Pick</span>
                  </button>
                </div>

                <div className="text-[11px] text-indigo-900 font-medium">
                  Faculty Instruction: Ask <span className="font-bold underline">{c4SelectedMember || 'the selected student'}</span> a specific question about the project architecture, implementation, or their individual contribution.
                </div>
              </div>

              {/* Criterion 4 Mandatory Comment */}
              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  Individual Contribution Observation <span className="text-rose-600">* (Required)</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={c4Comments}
                  onChange={(e) => setC4Comments(e.target.value)}
                  placeholder={`Mandatory: Mention ${c4SelectedMember || 'the student name'} in comments (e.g., "${c4SelectedMember || 'Arun'} was able to clearly explain the backend architecture" or "${c4SelectedMember || 'Priya'} could not explain her assigned contribution")`}
                  className="w-full text-xs border border-slate-300 rounded p-2 focus:ring-1 focus:ring-blue-600 outline-none resize-none"
                />
              </div>
            </div>

            {/* 5. Research & Validation */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">5. Research & Validation</h3>
                  <p className="text-xs text-slate-500 italic mt-0.5">
                    "Evidence, existing solutions, user needs and assumptions."
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-700">Score:</span>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    required
                    value={c5Score}
                    onChange={(e) => setC5Score(e.target.value)}
                    className="w-16 px-2 py-1 text-xs font-bold text-center border border-slate-300 rounded font-mono focus:ring-1 focus:ring-blue-600 outline-none"
                  />
                  <span className="text-xs font-bold text-slate-400">/10</span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Comments (Optional)
                </label>
                <textarea
                  rows={2}
                  value={c5Comments}
                  onChange={(e) => setC5Comments(e.target.value)}
                  placeholder="Notes on user surveys, dataset credibility, competitive study..."
                  className="w-full text-xs border border-slate-200 rounded p-2 focus:ring-1 focus:ring-blue-600 outline-none resize-none"
                />
              </div>
            </div>

            {/* 6. Innovation & Creativity */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">6. Innovation & Creativity</h3>
                  <p className="text-xs text-slate-500 italic mt-0.5">
                    "Originality, thinking beyond obvious solutions and adaptability."
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-700">Score:</span>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    required
                    value={c6Score}
                    onChange={(e) => setC6Score(e.target.value)}
                    className="w-16 px-2 py-1 text-xs font-bold text-center border border-slate-300 rounded font-mono focus:ring-1 focus:ring-blue-600 outline-none"
                  />
                  <span className="text-xs font-bold text-slate-400">/10</span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Comments (Optional)
                </label>
                <textarea
                  rows={2}
                  value={c6Comments}
                  onChange={(e) => setC6Comments(e.target.value)}
                  placeholder="Notes on uniqueness of approach, novelty of tech stack..."
                  className="w-full text-xs border border-slate-200 rounded p-2 focus:ring-1 focus:ring-blue-600 outline-none resize-none"
                />
              </div>
            </div>

            {/* 7. Execution Thinking */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">7. Execution Thinking</h3>
                  <p className="text-xs text-slate-500 italic mt-0.5">
                    "Can they realistically convert the idea into an MVP?"
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-700">Score:</span>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    required
                    value={c7Score}
                    onChange={(e) => setC7Score(e.target.value)}
                    className="w-16 px-2 py-1 text-xs font-bold text-center border border-slate-300 rounded font-mono focus:ring-1 focus:ring-blue-600 outline-none"
                  />
                  <span className="text-xs font-bold text-slate-400">/10</span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Comments (Optional)
                </label>
                <textarea
                  rows={2}
                  value={c7Comments}
                  onChange={(e) => setC7Comments(e.target.value)}
                  placeholder="Notes on architecture scalability, realistic milestones..."
                  className="w-full text-xs border border-slate-200 rounded p-2 focus:ring-1 focus:ring-blue-600 outline-none resize-none"
                />
              </div>
            </div>

            {/* 8. Communication & Pitch */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">8. Communication & Pitch</h3>
                  <p className="text-xs text-slate-500 italic mt-0.5">
                    "Clarity, confidence, storytelling and ability to defend the idea."
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-700">Score:</span>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    required
                    value={c8Score}
                    onChange={(e) => setC8Score(e.target.value)}
                    className="w-16 px-2 py-1 text-xs font-bold text-center border border-slate-300 rounded font-mono focus:ring-1 focus:ring-blue-600 outline-none"
                  />
                  <span className="text-xs font-bold text-slate-400">/10</span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Comments (Optional)
                </label>
                <textarea
                  rows={2}
                  value={c8Comments}
                  onChange={(e) => setC8Comments(e.target.value)}
                  placeholder="Notes on presentation clarity, pitch flow..."
                  className="w-full text-xs border border-slate-200 rounded p-2 focus:ring-1 focus:ring-blue-600 outline-none resize-none"
                />
              </div>
            </div>

            {/* WRONG-PERSPECTIVE TEST */}
            <div className="bg-white border-2 border-slate-800 rounded-lg p-5 shadow-xs space-y-3">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900">Wrong-Perspective Challenge Test</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Deliberately give the team <span className="font-semibold">one intentionally wrong perspective or incorrect assumption</span> about their project (e.g. <span className="italic">"I don't think this problem actually needs your proposed solution"</span> or <span className="italic">"Why not just use a simple spreadsheet?"</span>) to see whether they critically analyze and defend their solution or blindly agree.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Team Reaction
                  </label>
                  <select
                    value={wrongPerspectiveReaction}
                    onChange={(e) => setWrongPerspectiveReaction(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded p-2 focus:ring-1 focus:ring-blue-600 outline-none bg-white font-medium"
                  >
                    <option value="Agreed">Agreed (Blindly accepted incorrect premise)</option>
                    <option value="Disagreed">Disagreed (Stood by their domain analysis)</option>
                    <option value="Partially agreed">Partially agreed</option>
                    <option value="Corrected the faculty">Corrected the faculty (Provided sound evidence)</option>
                    <option value="Could not defend their idea">Could not defend their idea</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Faculty Observation Notes
                  </label>
                  <textarea
                    rows={2}
                    value={wrongPerspectiveObservation}
                    onChange={(e) => setWrongPerspectiveObservation(e.target.value)}
                    placeholder="Describe how the team reacted to your challenge..."
                    className="w-full text-xs border border-slate-200 rounded p-2 focus:ring-1 focus:ring-blue-600 outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* OVERALL COMMENT */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-2">
              <h3 className="text-sm font-bold text-slate-900">Overall Comments (Optional)</h3>
              <p className="text-xs text-slate-500">
                General synthesis, final impression, or key suggestions for the grand finale.
              </p>
              <textarea
                rows={3}
                value={overallComments}
                onChange={(e) => setOverallComments(e.target.value)}
                placeholder="Overall qualitative impressions..."
                className="w-full text-xs border border-slate-200 rounded p-2.5 focus:ring-1 focus:ring-blue-600 outline-none resize-none"
              />
            </div>

          </div>

          {/* TOTAL SCORE SUMMARY & SUBMIT */}
          <div className="bg-slate-900 text-white rounded-lg p-6 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Final Official Total Score
              </span>
              <div className="text-3xl font-black font-mono">
                {calculatedTotalScore} <span className="text-sm font-normal text-slate-400">/ 80</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-2 shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <span>Submitting & Analyzing with Gemini...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Final Scorecard</span>
                </>
              )}
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
