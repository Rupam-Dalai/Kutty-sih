import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { initDatabase } from './config/database.js';
import authRoutes from './routes/auth.js';
import facultyRoutes from './routes/faculty.js';
import teamRoutes from './routes/teams.js';
import allocationRoutes from './routes/allocation.js';
import scorecardRoutes from './routes/scorecard.js';
import leaderboardRoutes from './routes/leaderboard.js';
import helpRoutes from './routes/help.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Database & Schemas
initDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/allocation', allocationRoutes);
app.use('/api/scorecard', scorecardRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/help', helpRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), app: 'Kutty SIH' });
});

// Serve Client in Production (for Render & unified deployment)
const clientDistPath = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    if (!req.url.startsWith('/api')) {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    }
  });
}

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`==========================================`);
  console.log(`  KUTTY SIH PORTAL RUNNING ON PORT ${PORT}`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`==========================================`);
});
