/**
 * Filters workspaces to show only those accessible to the current team.
 *
 * A workspace is accessible if:
 * - Its teamSlug matches the current team, OR
 * - Its teamSlug is 'local' (local workspaces are always accessible)
 *
 * @param workspaces - Array of workspaces to filter
 * @param currentTeamSlug - The currently active team identifier
 * @returns Filtered array of workspaces accessible to the current team
 *
 * @example
 * ```ts
 * const workspaces = [
 *   { id: '1', teamSlug: 'local', name: 'Local' },
 *   { id: '2', teamSlug: 'team-a', name: 'Team A' },
 *   { id: '3', teamSlug: 'team-b', name: 'Team B' },
 * ]
 *
 * filterWorkspacesByTeam(workspaces, 'team-a')
 * // => [{ id: '1', teamSlug: 'local' }, { id: '2', teamSlug: 'team-a' }]
 * ```
 */
export const filterWorkspacesByTeam = <T extends { teamSlug: string }>(
  workspaces: T[],
  currentTeamSlug: string,
): T[] => {
  return workspaces.filter((workspace) => canLoadWorkspace(workspace.teamSlug, currentTeamSlug))
}

/**
 * Checks if a workspace can be loaded by the current team.
 *
 * A workspace can be loaded if:
 * - Its teamSlug matches the current team, OR
 * - Its teamSlug is 'local' (local workspaces are always accessible)
 *
 * This is used during route changes to prevent users from accessing
 * workspaces that do not belong to their active team.
 *
 * @param workspaceTeamSlug - The team identifier of the workspace to check
 * @param currentTeamSlug - The currently active team identifier
 * @returns true if the workspace can be loaded, false otherwise
 *
 * @example
 * ```ts
 * canLoadWorkspace('team-a', 'team-a') // => true
 * canLoadWorkspace('local', 'team-a')  // => true
 * canLoadWorkspace('team-b', 'team-a') // => false
 * ```
 */
export const canLoadWorkspace = (workspaceTeamSlug: string, currentTeamSlug: string): boolean => {
  return workspaceTeamSlug === currentTeamSlug || workspaceTeamSlug === 'local'
}
