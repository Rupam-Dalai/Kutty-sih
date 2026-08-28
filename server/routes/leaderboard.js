import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// Get full leaderboard with tied/close score detection & Gemini insights
router.get('/', (req, res) => {
  try {
    const teams = db.prepare(`
      SELECT 
        t.id as team_db_id,
        t.team_id,
        t.team_name,
        t.final_problem_statement,
        t.judged_status,
        s.id as scorecard_id,
        s.faculty_id,
        s.faculty_name,
        s.total_score,
        s.c1_score, s.c2_score, s.c3_score, s.c4_total_score, s.c5_score, s.c6_score, s.c7_score, s.c8_score,
        s.wrong_perspective_reaction,
        s.wrong_perspective_observation,
        s.overall_comments,
        s.c3_comments,
        s.c4_comments,
        s.c4_selected_member,
        s.gemini_sentiment,
        s.gemini_analysis,
        s.submitted_at
      FROM teams t
      LEFT JOIN scorecards s ON t.id = s.team_id
      ORDER BY 
        CASE WHEN s.total_score IS NOT NULL THEN 0 ELSE 1 END,
        s.total_score DESC,
        t.team_id ASC
    `).all();

    // Calculate ranks and find closely matched/tied teams (diff <= 2 marks)
    let currentRank = 1;
    const rankedTeams = teams.map((team, index) => {
      let parsedGemini = null;
      if (team.gemini_analysis) {
        try {
          parsedGemini = JSON.parse(team.gemini_analysis);
        } catch {
          parsedGemini = null;
        }
      }

      const hasScore = team.total_score !== null && team.total_score !== undefined;
      const rank = hasScore ? currentRank++ : null;

      return {
        rank,
        teamDbId: team.team_db_id,
        teamId: team.team_id,
        teamName: team.team_name,
        problemStatement: team.final_problem_statement || 'Pending Allocation',
        judgedStatus: team.judged_status,
        facultyName: team.faculty_name || 'Unassigned',
        totalScore: hasScore ? team.total_score : null,
        scoresBreakdown: hasScore ? {
          c1: team.c1_score,
          c2: team.c2_score,
          c3: team.c3_score,
          c4: team.c4_total_score,
          c5: team.c5_score,
          c6: team.c6_score,
          c7: team.c7_score,
          c8: team.c8_score
        } : null,
        wrongPerspectiveReaction: team.wrong_perspective_reaction,
        wrongPerspectiveObservation: team.wrong_perspective_observation,
        overallComments: team.overall_comments,
        c3Comments: team.c3_comments,
        c4Comments: team.c4_comments,
        c4SelectedMember: team.c4_selected_member,
        geminiSentiment: team.gemini_sentiment || 'Neutral',
        geminiAnalysis: parsedGemini,
        submittedAt: team.submitted_at
      };
    });

    // Detect close-score clusters for qualitative tiebreaker review
    const judgedTeams = rankedTeams.filter(t => t.totalScore !== null);
    const closeScoreGroups = [];

    for (let i = 0; i < judgedTeams.length; i++) {
      const current = judgedTeams[i];
      const cluster = [current];

      for (let j = i + 1; j < judgedTeams.length; j++) {
        const next = judgedTeams[j];
        if (Math.abs(current.totalScore - next.totalScore) <= 2) {
          cluster.push(next);
        }
      }

      if (cluster.length > 1) {
        const groupKey = cluster.map(c => c.teamId).sort().join('-');
        if (!closeScoreGroups.some(g => g.key === groupKey)) {
          closeScoreGroups.push({
            key: groupKey,
            scoreRange: `${cluster[cluster.length - 1].totalScore} - ${cluster[0].totalScore}`,
            isExactTie: cluster.every(c => c.totalScore === cluster[0].totalScore),
            teams: cluster.map(c => ({
              teamId: c.teamId,
              teamName: c.teamName,
              score: c.totalScore,
              sentiment: c.geminiSentiment,
              strengths: c.geminiAnalysis?.strengths || [],
              concerns: c.geminiAnalysis?.concerns || [],
              tiebreakerInsight: c.geminiAnalysis?.tiebreakerInsight || 'Review comments for qualitative differentiation.'
            }))
          });
        }
      }
    }

    res.json({
      success: true,
      totalTeams: rankedTeams.length,
      judgedCount: judgedTeams.length,
      pendingCount: rankedTeams.length - judgedTeams.length,
      leaderboard: rankedTeams,
      closeScoreGroups
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Dashboard Analytics Overview
router.get('/analytics', (req, res) => {
  try {
    const totalTeams = db.prepare('SELECT COUNT(*) as count FROM teams').get().count;
    const totalFaculty = db.prepare('SELECT COUNT(*) as count FROM faculty').get().count;
    const totalScorecards = db.prepare('SELECT COUNT(*) as count FROM scorecards').get().count;
    const allocatedTeams = db.prepare('SELECT COUNT(*) as count FROM teams WHERE final_problem_statement IS NOT NULL').get().count;

    const scores = db.prepare('SELECT total_score FROM scorecards ORDER BY total_score ASC').all().map(s => s.total_score);

    let avgScore = 0;
    let minScore = 0;
    let maxScore = 0;

    if (scores.length > 0) {
      const sum = scores.reduce((a, b) => a + b, 0);
      avgScore = Math.round((sum / scores.length) * 10) / 10;
      minScore = scores[0];
      maxScore = scores[scores.length - 1];
    }

    // Score brackets distribution
    const brackets = {
      '70-80 (Outstanding)': scores.filter(s => s >= 70).length,
      '60-69 (Strong)': scores.filter(s => s >= 60 && s < 70).length,
      '50-59 (Moderate)': scores.filter(s => s >= 50 && s < 60).length,
      'Below 50 (Developing)': scores.filter(s => s < 50).length
    };

    // Sentiment distribution
    const sentimentCounts = db.prepare(`
      SELECT gemini_sentiment, COUNT(*) as count
      FROM scorecards
      GROUP BY gemini_sentiment
    `).all();

    res.json({
      success: true,
      stats: {
        totalTeams,
        totalParticipants: totalTeams * 6,
        totalFaculty,
        teamsJudged: totalScorecards,
        teamsPending: Math.max(0, totalTeams - totalScorecards),
        allocatedTeams,
        judgingProgressPercent: totalTeams > 0 ? Math.round((totalScorecards / totalTeams) * 100) : 0,
        averageScore: avgScore,
        highestScore: maxScore,
        lowestScore: minScore,
        scoreBrackets: brackets,
        sentiments: sentimentCounts
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
