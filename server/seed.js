import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db, { initDatabase } from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function seedRealData() {
  initDatabase();
  console.log('[Seed] Initializing database with REAL SIH responses...');

  // 1. Ensure Admin Account
  const adminPasswordHash = bcrypt.hashSync('sudo@neko', 10);
  const existingAdmin = db.prepare('SELECT id FROM admins WHERE username = ?').get('admin');
  if (!existingAdmin) {
    db.prepare(`
      INSERT INTO admins (id, username, password, name, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), 'admin', adminPasswordHash, 'SIH Chief Convener', 'ADMIN');
    console.log('[Seed] Created default admin: username="admin", password="sudo@neko"');
  } else {
    db.prepare('UPDATE admins SET password = ? WHERE username = ?').run(adminPasswordHash, 'admin');
  }

  // 2. Ensure Real/Standard Faculty Roster
  const facultyList = [
    { id: 'FAC101', name: 'Dr. Rajesh Kumar', pass: 'faculty101', dept: 'Computer Science & Engineering' },
    { id: 'FAC102', name: 'Prof. Ananya Sharma', pass: 'faculty102', dept: 'Information Technology' },
    { id: 'FAC103', name: 'Dr. Suresh Menon', pass: 'faculty103', dept: 'Artificial Intelligence & Data Science' },
    { id: 'FAC104', name: 'Dr. Meenakshi Sundaram', pass: 'faculty104', dept: 'Electronics & Communication' }
  ];

  for (const f of facultyList) {
    const existing = db.prepare('SELECT id FROM faculty WHERE faculty_id = ?').get(f.id);
    if (!existing) {
      db.prepare(`
        INSERT INTO faculty (id, faculty_id, name, password, department)
        VALUES (?, ?, ?, ?, ?)
      `).run(uuidv4(), f.id, f.name, bcrypt.hashSync(f.pass, 10), f.dept);
      console.log(`[Seed] Created Faculty: ID="${f.id}", Name="${f.name}", Password="${f.pass}"`);
    }
  }

  // 3. Clear any existing teams & scorecards before loading real Excel data
  db.prepare('DELETE FROM scorecards').run();
  db.prepare('DELETE FROM team_members').run();
  db.prepare('DELETE FROM teams').run();
  console.log('[Seed] Cleared prior mock team records.');

  // 4. Read Excel File
  const excelPath = path.resolve(__dirname, '../SIH Team Details  (Responses).xlsx');
  if (!fs.existsSync(excelPath)) {
    console.error(`[Seed Error] Excel file not found at: ${excelPath}`);
    return;
  }

  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet);

  console.log(`[Seed] Loading ${rows.length} real teams from "${sheetName}"...`);

  const insertTeamStmt = db.prepare(`
    INSERT INTO teams (id, team_id, team_name, registered_problem_statements, qr_code_token, judged_status)
    VALUES (?, ?, ?, ?, ?, 'PENDING')
  `);

  const insertMemberStmt = db.prepare(`
    INSERT INTO team_members (id, team_id, member_index, name, role, email, phone)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const importTx = db.transaction(() => {
    rows.forEach((row, index) => {
      const teamNum = String(index + 1).padStart(2, '0');
      const teamId = `TEAM-${teamNum}`;
      const teamName = String(row['Team Name'] || `Team ${teamNum}`).trim();
      const teamDbId = uuidv4();
      const qrToken = `SIH-${teamId}-${uuidv4().substring(0, 8)}`;

      // 6 Registered Problem Statements
      const statements = [
        String(row['Problem Statement ID 01 with Title'] || '').replace(/[\t\r\n]+/g, ' ').trim(),
        String(row['Problem Statement ID 02 with Title'] || '').replace(/[\t\r\n]+/g, ' ').trim(),
        String(row['Problem Statement ID 03 with Title'] || '').replace(/[\t\r\n]+/g, ' ').trim(),
        String(row['Problem Statement ID 04 With Title'] || '').replace(/[\t\r\n]+/g, ' ').trim(),
        String(row['Problem Statement ID 05 with Title'] || '').replace(/[\t\r\n]+/g, ' ').trim(),
        String(row['Problem Statement ID 06 with Title'] || '').replace(/[\t\r\n]+/g, ' ').trim()
      ].filter(Boolean);

      insertTeamStmt.run(teamDbId, teamId, teamName, JSON.stringify(statements), qrToken);

      // Exactly 6 Members
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

  importTx();
  console.log(`[Seed] Successfully seeded all ${rows.length} real SIH teams with 6 members and 6 problem statements each!`);
}

// Execute if run directly
seedRealData();
