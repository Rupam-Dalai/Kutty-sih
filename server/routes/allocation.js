import express from 'express';
import db from '../config/database.js';
import { allocateUniqueProblemStatements } from '../services/allocationEngine.js';

const router = express.Router();

// Get current allocation status & distribution
router.get('/status', (req, res) => {
  try {
    const teams = db.prepare(`
      SELECT id, team_id, team_name, registered_problem_statements, final_problem_statement, allocation_locked
      FROM teams
      ORDER BY team_id ASC
    `).all();

    const judgedCount = db.prepare('SELECT COUNT(*) as count FROM scorecards').get().count;

    const formatted = teams.map(t => {
      let statements = [];
      try {
        statements = JSON.parse(t.registered_problem_statements || '[]');
      } catch {
        statements = [];
      }
      return {
        id: t.id,
        team_id: t.team_id,
        team_name: t.team_name,
        registeredStatements: statements,
        finalProblemStatement: t.final_problem_statement,
        isLocked: !!t.allocation_locked || judgedCount > 0
      };
    });

    const allocatedCount = formatted.filter(t => !!t.finalProblemStatement).length;
    const isFullyAllocated = formatted.length > 0 && allocatedCount === formatted.length;
    const isLocked = judgedCount > 0 || (formatted.length > 0 && formatted.every(t => t.isLocked));

    res.json({
      success: true,
      totalTeams: formatted.length,
      allocatedCount,
      isFullyAllocated,
      isLocked,
      judgedCount,
      teams: formatted
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Run backend randomized collision-free allocation
router.post('/run', (req, res) => {
  try {
    // Check if judging has already started
    const judgedCount = db.prepare('SELECT COUNT(*) as count FROM scorecards').get().count;
    if (judgedCount > 0) {
      return res.status(400).json({
        error: `Cannot re-allocate problem statements: Judging has already commenced (${judgedCount} scorecard(s) submitted). Problem allocations are permanently locked.`
      });
    }

    const teams = db.prepare('SELECT * FROM teams').all();
    if (teams.length === 0) {
      return res.status(400).json({ error: 'No teams registered in system.' });
    }

    // Run allocation engine
    const allocationResult = allocateUniqueProblemStatements(teams);

    if (!allocationResult.success) {
      return res.status(422).json({
        error: allocationResult.error || 'Failed to allocate unique problem statements.'
      });
    }

    // Save final selected problem statement to DB for every team
    const updateStmt = db.prepare(`
      UPDATE teams
      SET final_problem_statement = ?
      WHERE id = ?
    `);

    const saveTx = db.transaction(() => {
      for (const assignment of allocationResult.assignments) {
        updateStmt.run(assignment.assignedStatement, assignment.teamDbId);
      }
    });

    saveTx();

    res.json({
      success: true,
      message: `Successfully allocated unique problem statements for all ${allocationResult.assignments.length} teams with 0 collisions.`,
      assignments: allocationResult.assignments,
      stats: allocationResult.stats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lock/Unlock allocation manually (if no scorecards exist)
router.post('/lock', (req, res) => {
  const { lock } = req.body;
  try {
    const judgedCount = db.prepare('SELECT COUNT(*) as count FROM scorecards').get().count;
    if (judgedCount > 0 && !lock) {
      return res.status(400).json({
        error: 'Cannot unlock allocation: Judging is active.'
      });
    }

    db.prepare('UPDATE teams SET allocation_locked = ?').run(lock ? 1 : 0);
    res.json({ success: true, message: `Allocation ${lock ? 'locked' : 'unlocked'} successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
