import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import { analyzeScorecardComments } from '../services/geminiService.js';

const router = express.Router();

// Get random member from a team on the backend for Criterion 4
router.get('/random-member/:teamId', (req, res) => {
  const { teamId } = req.params;
  try {
    const team = db.prepare('SELECT id, team_id, team_name FROM teams WHERE id = ? OR team_id = ? OR qr_code_token = ?').get(teamId, teamId, teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    const members = db.prepare(`
      SELECT id, member_index, name, role, email, phone
      FROM team_members
      WHERE team_id = ?
      ORDER BY member_index ASC
    `).all(team.id);

    if (members.length === 0) {
      return res.status(400).json({ error: 'No members registered for this team.' });
    }

    // Backend picks 1 random member
    const randomIndex = Math.floor(Math.random() * members.length);
    const selectedMember = members[randomIndex];

    res.json({
      success: true,
      teamId: team.team_id,
      teamName: team.team_name,
      totalMembers: members.length,
      selectedMember: {
        id: selectedMember.id,
        memberIndex: selectedMember.member_index,
        name: selectedMember.name,
        role: selectedMember.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get existing scorecard for a team
router.get('/team/:teamId', (req, res) => {
  const { teamId } = req.params;
  try {
    const team = db.prepare('SELECT * FROM teams WHERE id = ? OR team_id = ? OR qr_code_token = ?').get(teamId, teamId, teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    const scorecard = db.prepare('SELECT * FROM scorecards WHERE team_id = ?').get(team.id);

    let parsedGemini = null;
    if (scorecard && scorecard.gemini_analysis) {
      try {
        parsedGemini = JSON.parse(scorecard.gemini_analysis);
      } catch {
        parsedGemini = null;
      }
    }

    res.json({
      success: true,
      hasScorecard: !!scorecard,
      scorecard: scorecard ? { ...scorecard, gemini_analysis: parsedGemini } : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit scorecard
router.post('/submit', async (req, res) => {
  try {
    const {
      teamId, // can be team db id, team_id, or qr_code_token
      facultyId,
      facultyName,
      c1_score,
      c1_comments,
      c2_score,
      c2_comments,
      c3_score,
      c3_comments,
      c4_general_score,
      c4_selected_member,
      c4_random_member_score,
      c4_comments,
      c5_score,
      c5_comments,
      c6_score,
      c6_comments,
      c7_score,
      c7_comments,
      c8_score,
      c8_comments,
      wrong_perspective_reaction,
      wrong_perspective_observation,
      overall_comments
    } = req.body;

    // Validate Team
    const team = db.prepare('SELECT * FROM teams WHERE id = ? OR team_id = ? OR qr_code_token = ?').get(teamId, teamId, teamId);
    if (!team) {
      return res.status(404).json({ error: 'Invalid team reference.' });
    }

    if (!team.final_problem_statement) {
      return res.status(400).json({ error: 'Cannot evaluate team: Problem statement has not been allocated to this team yet.' });
    }

    // Validate Criteria Scores
    const num = (v, min, max, name) => {
      const val = parseFloat(v);
      if (isNaN(val) || val < min || val > max) {
        throw new Error(`${name} score must be a number between ${min} and ${max}. Received: ${v}`);
      }
      return Math.round(val * 10) / 10;
    };

    const s1 = num(c1_score, 0, 10, '1. Problem Understanding');
    const s2 = num(c2_score, 0, 10, '2. Problem-Solving Mindset');
    const s3 = num(c3_score, 0, 10, '3. Team Coordination');
    
    // Criterion 4: Part A /8 + Part B /2 = Max 10
    const s4_a = num(c4_general_score, 0, 8, '4. General Team Contribution');
    const s4_b = num(c4_random_member_score, 0, 2, '4. Random Member Verification');
    const s4_total = Math.min(10, Math.round((s4_a + s4_b) * 10) / 10);

    const s5 = num(c5_score, 0, 10, '5. Research & Validation');
    const s6 = num(c6_score, 0, 10, '6. Innovation & Creativity');
    const s7 = num(c7_score, 0, 10, '7. Execution Thinking');
    const s8 = num(c8_score, 0, 10, '8. Communication & Pitch');

    // Total Score calculation (/80)
    const totalScore = Math.round((s1 + s2 + s3 + s4_total + s5 + s6 + s7 + s8) * 10) / 10;

    // Validate Mandatory Comments
    if (!c3_comments || c3_comments.trim().length === 0) {
      return res.status(400).json({ error: 'Criterion 3 (Team Coordination) comments are mandatory.' });
    }

    if (!c4_comments || c4_comments.trim().length === 0) {
      return res.status(400).json({ error: 'Criterion 4 (Individual Contribution) comments are mandatory.' });
    }

    if (!c4_selected_member || c4_selected_member.trim().length === 0) {
      return res.status(400).json({ error: 'Selected member name for random verification is required.' });
    }

    // Build scorecard object for Gemini evaluation
    const scorecardPayload = {
      team_id: team.id,
      faculty_id: facultyId || 'FAC-UNKNOWN',
      faculty_name: facultyName || 'Faculty Judge',
      c1_score: s1,
      c1_comments: c1_comments || '',
      c2_score: s2,
      c2_comments: c2_comments || '',
      c3_score: s3,
      c3_comments: c3_comments.trim(),
      c4_general_score: s4_a,
      c4_selected_member: c4_selected_member.trim(),
      c4_random_member_score: s4_b,
      c4_total_score: s4_total,
      c4_comments: c4_comments.trim(),
      c5_score: s5,
      c5_comments: c5_comments || '',
      c6_score: s6,
      c6_comments: c6_comments || '',
      c7_score: s7,
      c7_comments: c7_comments || '',
      c8_score: s8,
      c8_comments: c8_comments || '',
      total_score: totalScore,
      wrong_perspective_reaction: wrong_perspective_reaction || 'Not Tested',
      wrong_perspective_observation: wrong_perspective_observation || '',
      overall_comments: overall_comments || ''
    };

    // Run Gemini evaluation on comments
    const geminiResult = await analyzeScorecardComments(scorecardPayload);

    // Save to Database
    const existingScorecard = db.prepare('SELECT id FROM scorecards WHERE team_id = ?').get(team.id);

    const scorecardId = existingScorecard ? existingScorecard.id : uuidv4();

    const saveScorecardTx = db.transaction(() => {
      if (existingScorecard) {
        db.prepare(`
          UPDATE scorecards SET
            faculty_id = ?,
            faculty_name = ?,
            c1_score = ?, c1_comments = ?,
            c2_score = ?, c2_comments = ?,
            c3_score = ?, c3_comments = ?,
            c4_general_score = ?, c4_selected_member = ?, c4_random_member_score = ?, c4_total_score = ?, c4_comments = ?,
            c5_score = ?, c5_comments = ?,
            c6_score = ?, c6_comments = ?,
            c7_score = ?, c7_comments = ?,
            c8_score = ?, c8_comments = ?,
            total_score = ?,
            wrong_perspective_reaction = ?,
            wrong_perspective_observation = ?,
            overall_comments = ?,
            gemini_sentiment = ?,
            gemini_analysis = ?,
            gemini_processed_at = CURRENT_TIMESTAMP,
            submitted_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(
          scorecardPayload.faculty_id,
          scorecardPayload.faculty_name,
          scorecardPayload.c1_score, scorecardPayload.c1_comments,
          scorecardPayload.c2_score, scorecardPayload.c2_comments,
          scorecardPayload.c3_score, scorecardPayload.c3_comments,
          scorecardPayload.c4_general_score, scorecardPayload.c4_selected_member, scorecardPayload.c4_random_member_score, scorecardPayload.c4_total_score, scorecardPayload.c4_comments,
          scorecardPayload.c5_score, scorecardPayload.c5_comments,
          scorecardPayload.c6_score, scorecardPayload.c6_comments,
          scorecardPayload.c7_score, scorecardPayload.c7_comments,
          scorecardPayload.c8_score, scorecardPayload.c8_comments,
          scorecardPayload.total_score,
          scorecardPayload.wrong_perspective_reaction,
          scorecardPayload.wrong_perspective_observation,
          scorecardPayload.overall_comments,
          geminiResult.sentiment,
          JSON.stringify(geminiResult.analysis),
          scorecardId
        );
      } else {
        db.prepare(`
          INSERT INTO scorecards (
            id, team_id, faculty_id, faculty_name,
            c1_score, c1_comments,
            c2_score, c2_comments,
            c3_score, c3_comments,
            c4_general_score, c4_selected_member, c4_random_member_score, c4_total_score, c4_comments,
            c5_score, c5_comments,
            c6_score, c6_comments,
            c7_score, c7_comments,
            c8_score, c8_comments,
            total_score,
            wrong_perspective_reaction,
            wrong_perspective_observation,
            overall_comments,
            gemini_sentiment,
            gemini_analysis,
            gemini_processed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(
          scorecardId,
          team.id,
          scorecardPayload.faculty_id,
          scorecardPayload.faculty_name,
          scorecardPayload.c1_score, scorecardPayload.c1_comments,
          scorecardPayload.c2_score, scorecardPayload.c2_comments,
          scorecardPayload.c3_score, scorecardPayload.c3_comments,
          scorecardPayload.c4_general_score, scorecardPayload.c4_selected_member, scorecardPayload.c4_random_member_score, scorecardPayload.c4_total_score, scorecardPayload.c4_comments,
          scorecardPayload.c5_score, scorecardPayload.c5_comments,
          scorecardPayload.c6_score, scorecardPayload.c6_comments,
          scorecardPayload.c7_score, scorecardPayload.c7_comments,
          scorecardPayload.c8_score, scorecardPayload.c8_comments,
          scorecardPayload.total_score,
          scorecardPayload.wrong_perspective_reaction,
          scorecardPayload.wrong_perspective_observation,
          scorecardPayload.overall_comments,
          geminiResult.sentiment,
          JSON.stringify(geminiResult.analysis)
        );
      }

      // Update team judged status and lock allocation
      db.prepare(`
        UPDATE teams
        SET judged_status = 'JUDGED', allocation_locked = 1
        WHERE id = ?
      `).run(team.id);
    });

    saveScorecardTx();

    res.json({
      success: true,
      message: `Scorecard for ${team.team_name} submitted successfully.`,
      scorecardId,
      totalScore,
      geminiSentiment: geminiResult.sentiment,
      geminiAnalysis: geminiResult.analysis
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
