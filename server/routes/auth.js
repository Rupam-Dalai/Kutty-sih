import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'kutty-sih-secret-key-2025';

// Admin Login
router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin) {
    return res.status(401).json({ error: 'Invalid admin credentials.' });
  }

  const isMatch = bcrypt.compareSync(password, admin.password);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid admin credentials.' });
  }

  const token = jwt.sign(
    { id: admin.id, username: admin.username, role: 'ADMIN', name: admin.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    token,
    user: {
      id: admin.id,
      username: admin.username,
      name: admin.name,
      role: 'ADMIN'
    }
  });
});

// Faculty Login
router.post('/faculty/login', (req, res) => {
  const { facultyId, password } = req.body;
  if (!facultyId || !password) {
    return res.status(400).json({ error: 'Faculty ID and password are required.' });
  }

  const faculty = db.prepare('SELECT * FROM faculty WHERE faculty_id = ?').get(facultyId.trim());
  if (!faculty) {
    return res.status(401).json({ error: 'Invalid Faculty ID or password.' });
  }

  const isMatch = bcrypt.compareSync(password, faculty.password);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid Faculty ID or password.' });
  }

  const token = jwt.sign(
    { id: faculty.id, facultyId: faculty.faculty_id, role: 'FACULTY', name: faculty.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    token,
    user: {
      id: faculty.id,
      facultyId: faculty.faculty_id,
      name: faculty.name,
      department: faculty.department,
      role: 'FACULTY'
    }
  });
});

// Current User Verification
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ success: true, user: decoded });
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
});

export default router;
