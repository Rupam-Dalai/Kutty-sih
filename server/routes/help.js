import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';

const router = express.Router();

// List all help requests (Admin view)
router.get('/', (req, res) => {
  try {
    const requests = db.prepare(`
      SELECT * FROM help_requests
      ORDER BY 
        CASE WHEN status = 'PENDING' THEN 0 WHEN status = 'IN_PROGRESS' THEN 1 ELSE 2 END,
        created_at DESC
    `).all();

    const pendingCount = db.prepare("SELECT COUNT(*) as count FROM help_requests WHERE status = 'PENDING'").get().count;

    res.json({
      success: true,
      pendingCount,
      requests
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Faculty submits a help request
router.post('/', (req, res) => {
  const { facultyId, facultyName, teamId, teamName, message } = req.body;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: 'Please enter a description of the help required.' });
  }

  try {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO help_requests (id, faculty_id, faculty_name, team_id, team_name, message, status)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
    `).run(
      id,
      facultyId || 'FAC-UNKNOWN',
      facultyName || 'Faculty Member',
      teamId || 'N/A',
      teamName || 'General Query',
      message.trim()
    );

    res.status(201).json({
      success: true,
      message: 'Help request sent to administrators.',
      requestId: id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin updates help request status (IN_PROGRESS / RESOLVED)
router.patch('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const request = db.prepare('SELECT * FROM help_requests WHERE id = ?').get(id);
    if (!request) {
      return res.status(404).json({ error: 'Help request not found.' });
    }

    if (status === 'RESOLVED') {
      db.prepare('UPDATE help_requests SET status = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
    } else {
      db.prepare('UPDATE help_requests SET status = ? WHERE id = ?').run(status, id);
    }

    res.json({ success: true, message: `Help request marked as ${status}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
