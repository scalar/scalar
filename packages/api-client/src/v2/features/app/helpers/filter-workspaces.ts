/**
 * Filters workspaces to show only those accessible to the current team.
 *
 * A workspace is accessible if:
 * - Its teamUid matches the current team, OR
 * - Its teamUid is 'local' (local workspaces are always accessible)
 *
 * @param workspaces - Array of workspaces to filter
 * @param currentTeamUid - The currently active team identifier
 * @returns Filtered array of workspaces accessible to the current team
 *
 * @example
 * ```ts
 * const workspaces = [
 *   { id: '1', teamUid: 'local', name: 'Local' },
 *   { id: '2', teamUid: 'team-a', name: 'Team A' },
 *   { id: '3', teamUid: 'team-b', name: 'Team B' },
 * ]
 *
 * filterWorkspacesByTeam(workspaces, 'team-a')
 * // => [{ id: '1', teamUid: 'local' }, { id: '2', teamUid: 'team-a' }]
 * ```
 */
export const filterWorkspacesByTeam = <T extends { teamUid: string }>(workspaces: T[], currentTeamUid: string): T[] => {
  return workspaces.filter((workspace) => canLoadWorkspace(workspace.teamUid, currentTeamUid))
}

/**
 * Checks if a workspace can be loaded by the current team.
 *
 * A workspace can be loaded if:
 * - Its teamUid matches the current team, OR
 * - Its teamUid is 'local' (local workspaces are always accessible)
 *
 * This is used during route changes to prevent users from accessing
 * workspaces that do not belong to their active team.
 *
 * @param workspaceTeamUid - The team identifier of the workspace to check
 * @param currentTeamUid - The currently active team identifier
 * @returns true if the workspace can be loaded, false otherwise
 *
 * @example
 * ```ts
 * canLoadWorkspace('team-a', 'team-a') // => true
 * canLoadWorkspace('local', 'team-a')  // => true
 * canLoadWorkspace('team-b', 'team-a') // => false
 * ```
 */
export const canLoadWorkspace = (workspaceTeamUid: string, currentTeamUid: string): boolean => {
  return workspaceTeamUid === currentTeamUid || workspaceTeamUid === 'local'
}
