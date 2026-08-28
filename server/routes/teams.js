import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Helper to format team with members and statements
function formatTeam(row) {
  if (!row) return null;
  let statements = [];
  try {
    statements = JSON.parse(row.registered_problem_statements || '[]');
  } catch {
    statements = [];
  }

  const members = db.prepare(`
    SELECT id, member_index, name, role, email, phone
    FROM team_members
    WHERE team_id = ?
    ORDER BY member_index ASC
  `).all(row.id);

  const scorecard = db.prepare(`
    SELECT id, faculty_id, faculty_name, total_score, gemini_sentiment, submitted_at
    FROM scorecards
    WHERE team_id = ?
  `).get(row.id);

  return {
    ...row,
    registered_problem_statements: statements,
    members,
    scorecard: scorecard || null
  };
}

// List all teams
router.get('/', (req, res) => {
  try {
    const teams = db.prepare(`
      SELECT t.*, s.total_score, s.faculty_name, s.gemini_sentiment
      FROM teams t
      LEFT JOIN scorecards s ON t.id = s.team_id
      ORDER BY CAST(SUBSTR(t.team_id, 6) AS INTEGER) ASC, t.team_id ASC
    `).all();

    const formattedTeams = teams.map(t => {
      let statements = [];
      try {
        statements = JSON.parse(t.registered_problem_statements || '[]');
      } catch {
        statements = [];
      }

      const members = db.prepare(`
        SELECT id, member_index, name, role, email, phone
        FROM team_members
        WHERE team_id = ?
        ORDER BY member_index ASC
      `).all(t.id);

      return {
        id: t.id,
        team_id: t.team_id,
        team_name: t.team_name,
        registered_problem_statements: statements,
        final_problem_statement: t.final_problem_statement,
        allocation_locked: !!t.allocation_locked,
        qr_code_token: t.qr_code_token,
        judged_status: t.judged_status,
        created_at: t.created_at,
        total_score: t.total_score,
        faculty_name: t.faculty_name,
        gemini_sentiment: t.gemini_sentiment,
        members
      };
    });

    res.json({ success: true, teams: formattedTeams });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Re-sync from Excel responses file
router.post('/import-excel', (req, res) => {
  try {
    const judgedCount = db.prepare('SELECT COUNT(*) as count FROM scorecards').get().count;
    if (judgedCount > 0) {
      return res.status(400).json({
        error: `Cannot re-import teams: Judging has already started (${judgedCount} scorecards recorded).`
      });
    }

    const excelPath = path.resolve(__dirname, '../../SIH Team Details  (Responses).xlsx');
    if (!fs.existsSync(excelPath)) {
      return res.status(404).json({ error: 'Excel responses file not found on server.' });
    }

    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet);

    const clearTx = db.transaction(() => {
      db.prepare('DELETE FROM scorecards').run();
      db.prepare('DELETE FROM team_members').run();
      db.prepare('DELETE FROM teams').run();

      const insertTeamStmt = db.prepare(`
        INSERT INTO teams (id, team_id, team_name, registered_problem_statements, qr_code_token, judged_status)
        VALUES (?, ?, ?, ?, ?, 'PENDING')
      `);

      const insertMemberStmt = db.prepare(`
        INSERT INTO team_members (id, team_id, member_index, name, role, email, phone)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      rows.forEach((row, index) => {
        const teamNum = String(index + 1).padStart(2, '0');
        const teamId = `TEAM-${teamNum}`;
        const teamName = String(row['Team Name'] || `Team ${teamNum}`).trim();
        const teamDbId = uuidv4();
        const qrToken = `SIH-${teamId}-${uuidv4().substring(0, 8)}`;

        const statements = [
          String(row['Problem Statement ID 01 with Title'] || '').replace(/[\t\r\n]+/g, ' ').trim(),
          String(row['Problem Statement ID 02 with Title'] || '').replace(/[\t\r\n]+/g, ' ').trim(),
          String(row['Problem Statement ID 03 with Title'] || '').replace(/[\t\r\n]+/g, ' ').trim(),
          String(row['Problem Statement ID 04 With Title'] || '').replace(/[\t\r\n]+/g, ' ').trim(),
          String(row['Problem Statement ID 05 with Title'] || '').replace(/[\t\r\n]+/g, ' ').trim(),
          String(row['Problem Statement ID 06 with Title'] || '').replace(/[\t\r\n]+/g, ' ').trim()
        ].filter(Boolean);

        insertTeamStmt.run(teamDbId, teamId, teamName, JSON.stringify(statements), qrToken);

        const members = [
          {
            name: String(row['Team Leader Name'] || '').trim() || 'Team Leader',
            role: 'Team Lead',
            regNo: String(row['Reg No'] || '').trim(),
            dept: String(row['Name of the Department (ex: II B.Sc  CT)'] || '').trim(),
            phone: String(row['Phone Number'] || '').trim()
          },
          {
            name: String(row['Member  1 Name'] || '').trim() || 'Member 2',
            role: 'Member',
            regNo: String(row['Reg No 2'] || '').trim(),
            dept: String(row['Name of the Department '] || '').trim(),
            phone: String(row['Phone '] || '').trim()
          },
          {
            name: String(row['Member 2 Name'] || '').trim() || 'Member 3',
            role: 'Member',
            regNo: String(row['Reg No 3'] || '').trim(),
            dept: String(row['Name of the Department  2'] || '').trim(),
            phone: String(row['Phone  2'] || '').trim()
          },
          {
            name: String(row['Member 3 Name'] || '').trim() || 'Member 4',
            role: 'Member',
            regNo: String(row['Reg No 4'] || '').trim(),
            dept: String(row['Name of the Department  3'] || '').trim(),
            phone: String(row['Phone  3'] || '').trim()
          },
          {
            name: String(row['Member  4 Name'] || '').trim() || 'Member 5',
            role: 'Member',
            regNo: String(row['Reg No 5'] || '').trim(),
            dept: String(row['Name of the Department  4'] || '').trim(),
            phone: String(row['Phone'] || '').trim()
          },
          {
            name: String(row['Member  5 Name '] || '').trim() || 'Member 6',
            role: 'Member',
            regNo: String(row['Reg No 6'] || '').trim(),
            dept: String(row['Name of the Department'] || '').trim(),
            phone: String(row['Phone 2'] || '').trim()
          }
        ];

        members.forEach((m, mIdx) => {
          const memberInfo = m.dept ? `${m.dept} (Reg: ${m.regNo})` : m.regNo ? `Reg: ${m.regNo}` : '';
          insertMemberStmt.run(
            uuidv4(),
            teamDbId,
            mIdx + 1,
            m.name,
            m.role,
            memberInfo,
            m.phone
          );
        });
      });
    });

    clearTx();

    res.json({
      success: true,
      message: `Successfully imported ${rows.length} real teams from Excel responses file.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get team by ID or QR token
router.get('/find/:identifier', async (req, res) => {
  const { identifier } = req.params;
  try {
    let team = db.prepare(`
      SELECT * FROM teams 
      WHERE id = ? OR team_id = ? OR qr_code_token = ?
    `).get(identifier, identifier, identifier);

    if (!team) {
      return res.status(404).json({ error: `Team not found for identifier "${identifier}".` });
    }

    const formatted = formatTeam(team);
    res.json({ success: true, team: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate QR Code image data URL for a team
router.get('/:id/qr-image', async (req, res) => {
  const { id } = req.params;
  try {
    const team = db.prepare('SELECT * FROM teams WHERE id = ? OR team_id = ?').get(id, id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    const payload = JSON.stringify({
      app: 'KuttySIH',
      token: team.qr_code_token,
      teamId: team.team_id,
      teamName: team.team_name
    });

    const qrDataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    res.json({
      success: true,
      teamId: team.team_id,
      teamName: team.team_name,
      token: team.qr_code_token,
      qrDataUrl
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new team
router.post('/', (req, res) => {
  const { teamId, teamName, members, problemStatements } = req.body;

  if (!teamId || !teamName) {
    return res.status(400).json({ error: 'Team ID and Team Name are required.' });
  }

  // Validate exactly 6 members
  if (!Array.isArray(members) || members.length !== 6) {
    return res.status(400).json({
      error: `Each team must have exactly 6 members. Provided: ${Array.isArray(members) ? members.length : 0} members.`
    });
  }

  for (let i = 0; i < 6; i++) {
    const m = members[i];
    if (!m || !m.name || m.name.trim() === '') {
      return res.status(400).json({ error: `Member ${i + 1} must have a valid name.` });
    }
  }

  // Validate exactly 6 registered problem statements
  if (!Array.isArray(problemStatements) || problemStatements.length !== 6) {
    return res.status(400).json({
      error: `Each team must register exactly 6 problem statements. Provided: ${Array.isArray(problemStatements) ? problemStatements.length : 0}.`
    });
  }

  const cleanedStatements = problemStatements.map(s => (typeof s === 'string' ? s.trim() : '')).filter(Boolean);
  if (cleanedStatements.length !== 6) {
    return res.status(400).json({ error: 'All 6 problem statement slots must be non-empty strings.' });
  }

  try {
    const existing = db.prepare('SELECT id FROM teams WHERE team_id = ?').get(teamId.trim());
    if (existing) {
      return res.status(400).json({ error: `Team ID "${teamId}" is already registered.` });
    }

    const teamDbId = uuidv4();
    const qrToken = `SIH-${teamId.trim().toUpperCase()}-${uuidv4().substring(0, 8)}`;

    const insertTeam = db.transaction(() => {
      db.prepare(`
        INSERT INTO teams (id, team_id, team_name, registered_problem_statements, qr_code_token, judged_status)
        VALUES (?, ?, ?, ?, ?, 'PENDING')
      `).run(teamDbId, teamId.trim(), teamName.trim(), JSON.stringify(cleanedStatements), qrToken);

      const insertMemberStmt = db.prepare(`
        INSERT INTO team_members (id, team_id, member_index, name, role, email, phone)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      members.forEach((m, idx) => {
        insertMemberStmt.run(
          uuidv4(),
          teamDbId,
          idx + 1,
          m.name.trim(),
          m.role || (idx === 0 ? 'Team Lead' : 'Member'),
          m.email || '',
          m.phone || ''
        );
      });
    });

    insertTeam();

    const created = formatTeam(db.prepare('SELECT * FROM teams WHERE id = ?').get(teamDbId));
    res.status(201).json({ success: true, message: 'Team registered successfully.', team: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit team
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { teamId, teamName, members, problemStatements, finalProblemStatement } = req.body;

  try {
    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    if (teamId && teamId.trim() !== team.team_id) {
      const duplicate = db.prepare('SELECT id FROM teams WHERE team_id = ? AND id != ?').get(teamId.trim(), id);
      if (duplicate) {
        return res.status(400).json({ error: `Team ID "${teamId}" is already taken.` });
      }
    }

    const updatedTeamId = teamId ? teamId.trim() : team.team_id;
    const updatedTeamName = teamName ? teamName.trim() : team.team_name;

    let updatedStatements = team.registered_problem_statements;
    if (Array.isArray(problemStatements) && problemStatements.length === 6) {
      const cleaned = problemStatements.map(s => (typeof s === 'string' ? s.trim() : '')).filter(Boolean);
      if (cleaned.length === 6) {
        updatedStatements = JSON.stringify(cleaned);
      }
    }

    const updatedFinalStatement = finalProblemStatement !== undefined ? finalProblemStatement : team.final_problem_statement;

    const updateTx = db.transaction(() => {
      db.prepare(`
        UPDATE teams
        SET team_id = ?, team_name = ?, registered_problem_statements = ?, final_problem_statement = ?
        WHERE id = ?
      `).run(updatedTeamId, updatedTeamName, updatedStatements, updatedFinalStatement, id);

      if (Array.isArray(members) && members.length === 6) {
        db.prepare('DELETE FROM team_members WHERE team_id = ?').run(id);
        const insertMemberStmt = db.prepare(`
          INSERT INTO team_members (id, team_id, member_index, name, role, email, phone)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        members.forEach((m, idx) => {
          insertMemberStmt.run(
            uuidv4(),
            id,
            idx + 1,
            m.name.trim(),
            m.role || (idx === 0 ? 'Team Lead' : 'Member'),
            m.email || '',
            m.phone || ''
          );
        });
      }
    });

    updateTx();

    const formatted = formatTeam(db.prepare('SELECT * FROM teams WHERE id = ?').get(id));
    res.json({ success: true, message: 'Team updated successfully.', team: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete team
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  try {
    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    db.prepare('DELETE FROM teams WHERE id = ?').run(id);
    res.json({ success: true, message: `Team ${team.team_name} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
