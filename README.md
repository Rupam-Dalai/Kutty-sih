# Kutty SIH — Hackathon Team Management & Judging System

**Kutty SIH** is a minimal, clean, and professional web application designed for organizing Smart India Hackathon (SIH) style internal hackathons, managing teams with 6 members and 6 registered problem statements, randomized collision-free problem statement allocation, scannable QR badge generation, 8-criteria judging scorecards with backend random member verification, Gemini qualitative feedback evaluation, live leaderboard, and real-time faculty help desk.

Built with **Node.js, Express, SQLite, React, Vite, and Tailwind CSS**, structured for 1-click deployment on **Render**.

---

## Key Features

### 1. Admin Control & Dashboard
- **Live Metrics**: Overall Teams, Total Participants (Fixed $6 \times \text{Teams}$), Registered Faculty, Teams Judged, Teams Pending, Cohort Average Score (/80), Score Distribution Brackets.
- **Faculty Management**: Add, edit, delete faculty members with unique Faculty IDs and encrypted passwords.
- **Team Management**: Register teams with exactly 6 members (with designated Team Lead) and exactly 6 candidate problem statements.

### 2. Collision-Free Problem Statement Allocation Engine
- Each team registers 6 potential problem statements.
- **Backend Algorithm**: Implements a randomized backtracking bipartite maximum matching algorithm:
  1. Shuffles the 6 registered statements per team.
  2. Recursively matches each team to one of their choices.
  3. Guarantees **100% uniqueness across all teams** (0 collisions).
  4. Automatically locks allocation once judging starts.

### 3. QR Code Workflow & Print Badges
- Generates high-resolution scannable QR codes for every team with unique tokens.
- **Batch Print Sheet (A4)**: Clean printable format showing Team ID, Name, all 6 Members, Assigned Problem Statement, and Scannable QR Code.
- **Faculty Scanner**: Integrated in-browser camera scanner with instant manual search fallback.

### 4. Faculty Judging Scorecard (8 Criteria, Total /80)
1. **Problem Understanding (/10)** — Helper text, Score, Optional comments.
2. **Problem-Solving Mindset (/10)** — Helper text, Score, Optional comments.
3. **Team Coordination (/10)** — Helper text, **Mandatory** comments, Faculty guideline prompt reminder: *"Ask a different person about the project instead of only asking the person who initially explained the idea."*
4. **Individual Contribution (/10 Marks Total)**:
   - **Part A: General Team Contribution (/8)** — Evaluates whole team grasp.
   - **Part B: Random Member Verification (/2)** — Backend randomly selects **ONE member** from the 6 members. Faculty asks that specific student a question and scores /2.
   - **Mandatory Comment**: Must mention the student's name (e.g., *"Arun was able to clearly explain the backend architecture"*).
   - **Total**: Part A (/8) + Part B (/2) = Max /10 (never exceeds 10).
5. **Research & Validation (/10)**
6. **Innovation & Creativity (/10)**
7. **Execution Thinking (/10)**
8. **Communication & Pitch (/10)**
- **Wrong-Perspective Test**: Deliberately challenge the team with an intentionally incorrect premise to test critical thinking vs blind agreement. Record reaction (`Agreed`, `Disagreed`, `Partially agreed`, `Corrected the faculty`, `Could not defend`) and observation notes.
- **Overall Comments**: Large optional feedback area.

### 5. Gemini Qualitative Sentiment & Tiebreaker Assistant
- Backend evaluation using Gemini API (`gemini-1.5-flash`).
- Categorizes qualitative faculty comments into `Positive`, `Negative`, or `Neutral` sentiment.
- Generates qualitative strengths, concerns, and tiebreaker insights to help administrators distinguish closely scored teams (e.g., 74/80 vs 74/80) without overriding official faculty scores.
- Includes automatic heuristic fallback if `GEMINI_API_KEY` is not provided.

### 6. Floating Faculty Assistance Help Desk
- Unobtrusive floating `?` button on faculty screens.
- Dispatches instant support requests to the admin desk.
- Admin desk allows tracking and marking requests as *In-Progress* or *Resolved*.

---

## Quick Start (Local Setup)

### 1. Install Dependencies
```bash
npm install
npm --prefix client install
```

### 2. Seed Sample Database
Populates default admin, faculty roster, and 6 SIH teams with 6 members and 6 registered problem statements:
```bash
npm run seed
```

### 3. Run Locally
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

---

## Default Test Credentials

| Role | Username / Faculty ID | Password | Access |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Full Convener Panel, Allocation, Badges, Leaderboard, Help Desk |
| **Faculty 1** | `FAC101` | `faculty101` | Dr. Rajesh Kumar (CSE) |
| **Faculty 2** | `FAC102` | `faculty102` | Prof. Ananya Sharma (IT) |
| **Faculty 3** | `FAC103` | `faculty103` | Dr. Suresh Menon (AI & DS) |
| **Faculty 4** | `FAC104` | `faculty104` | Dr. Meenakshi Sundaram (ECE) |

---

## Deploying to Render

This application is configured for continuous deployment on **Render**:

### Option A: 1-Click Blueprint Deploy
1. Push your repository to GitHub.
2. In Render Dashboard, select **New +** → **Blueprint**.
3. Connect your repository. Render will automatically detect `render.yaml` and configure the Web Service:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`

### Option B: Manual Web Service Setup
1. In Render Dashboard, click **New +** → **Web Service**.
2. Set the following settings:
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
3. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `JWT_SECRET`: `<any-secure-random-string>`
   - `GEMINI_API_KEY`: `<your-google-gemini-api-key>` *(Optional)*
4. Click **Deploy Web Service**.

---

## Security & Best Practices
- **Gemini API Key**: Kept strictly on the backend; never exposed to the client bundle.
- **Authentication**: JWT token with role-based route protection on both frontend and backend.
- **Data Integrity**: Foreign keys with SQLite WAL mode for fast concurrent operations.
