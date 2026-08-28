/**
 * Problem Statement Allocation Engine
 * 
 * Requirements:
 * 1. Retrieve the 6 problem statements registered by every team.
 * 2. Shuffle the 6 registered problem statements for each team.
 * 3. Select one problem statement for each team.
 * 4. Ensure that NO two teams receive the same final problem statement.
 * 5. If a collision occurs, backtrack/reshuffle until 100% uniqueness is maintained.
 * 6. The final selected problem statement must be saved for that team.
 * 7. Locked once judging begins.
 */

// Fisher-Yates array shuffler
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Solves the unique bipartite matching using randomized backtracking.
 * 
 * @param {Array<{id: string, team_id: string, team_name: string, statements: string[]}>} teams 
 * @returns {{ success: boolean, assignments?: Array<{ teamDbId: string, teamId: string, teamName: string, assignedStatement: string }>, error?: string }}
 */
export function allocateUniqueProblemStatements(teams) {
  if (!teams || teams.length === 0) {
    return { success: false, error: 'No teams provided for allocation.' };
  }

  // 1. Prepare and validate team choices
  const preparedTeams = teams.map(team => {
    let statements = [];
    if (typeof team.registered_problem_statements === 'string') {
      try {
        statements = JSON.parse(team.registered_problem_statements);
      } catch {
        statements = [];
      }
    } else if (Array.isArray(team.registered_problem_statements)) {
      statements = [...team.registered_problem_statements];
    } else if (Array.isArray(team.statements)) {
      statements = [...team.statements];
    }

    // Clean strings and remove duplicates within the same team
    statements = statements
      .map(s => (typeof s === 'string' ? s.trim() : ''))
      .filter(s => s.length > 0);

    return {
      teamDbId: team.id,
      teamId: team.team_id || team.id,
      teamName: team.team_name || 'Team',
      statements: statements
    };
  });

  // Verify all teams have statements
  for (const team of preparedTeams) {
    if (team.statements.length === 0) {
      return {
        success: false,
        error: `Team ${team.teamName} (${team.teamId}) has no registered problem statements.`
      };
    }
  }

  // Total distinct statements across all teams
  const allDistinct = new Set();
  preparedTeams.forEach(t => t.statements.forEach(s => allDistinct.add(s)));
  if (allDistinct.size < preparedTeams.length) {
    return {
      success: false,
      error: `Collision bottleneck: Total ${preparedTeams.length} teams require at least ${preparedTeams.length} distinct problem statements, but only ${allDistinct.size} unique statements were registered in total. Please add more distinct problem statements.`
    };
  }

  // Try randomized backtracking matching up to 50 attempts with different random seed orders
  const MAX_GLOBAL_ATTEMPTS = 50;

  for (let attempt = 1; attempt <= MAX_GLOBAL_ATTEMPTS; attempt++) {
    // Shuffle teams order and their internal statement choices
    const shuffledTeams = shuffleArray(preparedTeams).map(t => ({
      ...t,
      shuffledStatements: shuffleArray(t.statements)
    }));

    const assignedMap = new Map(); // teamDbId -> assignedStatement
    const usedStatements = new Set();

    // Backtracking solver
    function solve(index) {
      if (index === shuffledTeams.length) {
        return true; // Found complete valid unique assignment
      }

      const currentTeam = shuffledTeams[index];
      for (const statement of currentTeam.shuffledStatements) {
        if (!usedStatements.has(statement)) {
          // Tentatively assign
          usedStatements.add(statement);
          assignedMap.set(currentTeam.teamDbId, statement);

          if (solve(index + 1)) {
            return true;
          }

          // Backtrack
          usedStatements.delete(statement);
          assignedMap.delete(currentTeam.teamDbId);
        }
      }

      return false; // No valid statement for this branch
    }

    if (solve(0)) {
      // Successfully found complete unique assignment!
      const assignments = preparedTeams.map(t => ({
        teamDbId: t.teamDbId,
        teamId: t.teamId,
        teamName: t.teamName,
        assignedStatement: assignedMap.get(t.teamDbId)
      }));

      // Double-check verification
      const assignedSet = new Set(assignments.map(a => a.assignedStatement));
      if (assignedSet.size === assignments.length) {
        return {
          success: true,
          assignments,
          stats: {
            totalTeams: assignments.length,
            uniqueAssignedCount: assignedSet.size,
            attemptsUsed: attempt
          }
        };
      }
    }
  }

  return {
    success: false,
    error: 'Could not find a collision-free assignment. The registered statements across teams have severe overlap conflicts. Please review and diversify team statement choices.'
  };
}
