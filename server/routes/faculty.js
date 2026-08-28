import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';

const router = express.Router();

// List all faculty with judging metrics
router.get('/', (req, res) => {
  try {
    const facultyList = db.prepare(`
      SELECT f.id, f.faculty_id, f.name, f.department, f.created_at,
             COUNT(s.id) as judged_count
      FROM faculty f
      LEFT JOIN scorecards s ON f.faculty_id = s.faculty_id
      GROUP BY f.id
      ORDER BY f.name ASC
    `).all();

    res.json({ success: true, faculty: facultyList });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new faculty
router.post('/', (req, res) => {
  const { name, facultyId, password, department } = req.body;
  if (!name || !facultyId || !password) {
    return res.status(400).json({ error: 'Faculty Name, Faculty ID, and Password are required.' });
  }

  try {
    const existing = db.prepare('SELECT id FROM faculty WHERE faculty_id = ?').get(facultyId.trim());
    if (existing) {
      return res.status(400).json({ error: `Faculty ID "${facultyId}" is already registered.` });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = uuidv4();

    db.prepare(`
      INSERT INTO faculty (id, faculty_id, name, password, department)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, facultyId.trim(), name.trim(), hashedPassword, department ? department.trim() : 'Computer Science & Engineering');

    res.status(201).json({
      success: true,
      message: 'Faculty added successfully.',
      faculty: { id, faculty_id: facultyId.trim(), name: name.trim(), department }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit faculty
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, facultyId, password, department } = req.body;

  if (!name || !facultyId) {
    return res.status(400).json({ error: 'Faculty Name and Faculty ID are required.' });
  }

  try {
    const existing = db.prepare('SELECT * FROM faculty WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Faculty not found.' });
    }

    // Check duplicate facultyId
    const duplicate = db.prepare('SELECT id FROM faculty WHERE faculty_id = ? AND id != ?').get(facultyId.trim(), id);
    if (duplicate) {
      return res.status(400).json({ error: `Faculty ID "${facultyId}" is already in use by another faculty.` });
    }

    if (password && password.trim().length > 0) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      db.prepare(`
        UPDATE faculty
        SET name = ?, faculty_id = ?, password = ?, department = ?
        WHERE id = ?
      `).run(name.trim(), facultyId.trim(), hashedPassword, department || existing.department, id);
    } else {
      db.prepare(`
        UPDATE faculty
        SET name = ?, faculty_id = ?, department = ?
        WHERE id = ?
      `).run(name.trim(), facultyId.trim(), department || existing.department, id);
    }

    res.json({ success: true, message: 'Faculty details updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete faculty
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  try {
    const faculty = db.prepare('SELECT * FROM faculty WHERE id = ?').get(id);
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty not found.' });
    }

    // Check if faculty has judged any teams
    const judged = db.prepare('SELECT COUNT(*) as count FROM scorecards WHERE faculty_id = ?').get(faculty.faculty_id);
    if (judged.count > 0) {
      return res.status(400).json({
        error: `Cannot delete faculty "${faculty.name}" because they have already evaluated ${judged.count} team scorecard(s).`
      });
    }

    db.prepare('DELETE FROM faculty WHERE id = ?').run(id);
    res.json({ success: true, message: 'Faculty deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
