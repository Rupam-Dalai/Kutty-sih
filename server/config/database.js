import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'kutty_sih.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency and foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  // 1. Admins Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'ADMIN',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Faculty Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS faculty (
      id TEXT PRIMARY KEY,
      faculty_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      department TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Teams Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      team_id TEXT UNIQUE NOT NULL,
      team_name TEXT NOT NULL,
      registered_problem_statements TEXT NOT NULL, -- JSON array of 6 problem statements
      final_problem_statement TEXT,
      allocation_locked INTEGER DEFAULT 0,
      qr_code_token TEXT UNIQUE NOT NULL,
      judged_status TEXT DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, JUDGED
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Team Members Table (Exactly 6 members per team)
  db.exec(`
    CREATE TABLE IF NOT EXISTS team_members (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      member_index INTEGER NOT NULL, -- 1 to 6
      name TEXT NOT NULL,
      role TEXT DEFAULT 'Member', -- 'Team Lead', 'Member'
      email TEXT,
      phone TEXT,
      FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE
    );
  `);

  // 5. Scorecards Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS scorecards (
      id TEXT PRIMARY KEY,
      team_id TEXT UNIQUE NOT NULL,
      faculty_id TEXT NOT NULL,
      faculty_name TEXT NOT NULL,
      
      -- Criteria 1: Problem Understanding (/10)
      c1_score REAL NOT NULL,
      c1_comments TEXT,
      
      -- Criteria 2: Problem-Solving Mindset (/10)
      c2_score REAL NOT NULL,
      c2_comments TEXT,
      
      -- Criteria 3: Team Coordination (/10) [Mandatory comment]
      c3_score REAL NOT NULL,
      c3_comments TEXT NOT NULL,
      
      -- Criteria 4: Individual Contribution (/10 total: Part A /8 + Part B /2)
      c4_general_score REAL NOT NULL, -- Part A: /8
      c4_selected_member TEXT NOT NULL,
      c4_random_member_score REAL NOT NULL, -- Part B: /2
      c4_total_score REAL NOT NULL, -- c4_general_score + c4_random_member_score (max 10)
      c4_comments TEXT NOT NULL, -- Mandatory comment
      
      -- Criteria 5: Research & Validation (/10)
      c5_score REAL NOT NULL,
      c5_comments TEXT,
      
      -- Criteria 6: Innovation & Creativity (/10)
      c6_score REAL NOT NULL,
      c6_comments TEXT,
      
      -- Criteria 7: Execution Thinking (/10)
      c7_score REAL NOT NULL,
      c7_comments TEXT,
      
      -- Criteria 8: Communication & Pitch (/10)
      c8_score REAL NOT NULL,
      c8_comments TEXT,
      
      -- Total Score (/80)
      total_score REAL NOT NULL,
      
      -- Wrong-Perspective Test
      wrong_perspective_reaction TEXT, -- 'Agreed', 'Disagreed', 'Partially agreed', 'Corrected the faculty', 'Could not defend their idea'
      wrong_perspective_observation TEXT,
      
      -- Overall Comments
      overall_comments TEXT,
      
      -- Gemini Sentiment & Qualitative Analysis
      gemini_sentiment TEXT, -- 'Positive', 'Negative', 'Neutral'
      gemini_analysis TEXT, -- JSON summary of qualitative strengths/concerns/tiebreaker
      gemini_processed_at DATETIME,
      
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE
    );
  `);

  // 6. Help Requests Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS help_requests (
      id TEXT PRIMARY KEY,
      faculty_id TEXT NOT NULL,
      faculty_name TEXT NOT NULL,
      team_id TEXT,
      team_name TEXT,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, RESOLVED
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME
    );
  `);

  // Create indexes for fast querying
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_teams_team_id ON teams(team_id);
    CREATE INDEX IF NOT EXISTS idx_teams_qr_token ON teams(qr_code_token);
    CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
    CREATE INDEX IF NOT EXISTS idx_scorecards_team_id ON scorecards(team_id);
    CREATE INDEX IF NOT EXISTS idx_scorecards_total_score ON scorecards(total_score DESC);
    CREATE INDEX IF NOT EXISTS idx_help_requests_status ON help_requests(status);
  `);
}

export default db;
