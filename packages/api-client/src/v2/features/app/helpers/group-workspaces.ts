import type { ScalarListboxOption, WorkspaceGroup } from '@scalar/components'

/**
 * Represents a workspace with team information.
 * Used to group workspaces by team or local status.
 */
export type WorkspaceItem = {
  /** Unique identifier for the workspace. */
  id: string
  /** Display name of the workspace. */
  label: string
  /** Team identifier. Use 'local' for local workspaces. */
  teamUid: string
}

/**
 * Groups workspaces into team and local categories.
 * Team workspaces are listed first (if not viewing local workspaces),
 * followed by local workspaces.
 *
 * @param workspaces - Array of workspaces to group
 * @param currentTeamUid - Current team identifier ('local' for local team)
 * @returns Array of workspace groups with labels and options
 */
export function groupWorkspacesByTeam(workspaces: WorkspaceItem[], currentTeamUid: string): WorkspaceGroup[] {
  // Group workspaces by teamUid
  const workspacesByTeam = workspaces.reduce<Record<string, ScalarListboxOption[]>>((acc, workspace) => {
    const teamUid = workspace.teamUid

    if (!acc[teamUid]) {
      acc[teamUid] = []
    }

    acc[teamUid].push({
      id: workspace.id,
      label: workspace.label,
    })

    return acc
  }, {})

  const result: WorkspaceGroup[] = []

  // Add current team workspaces (if not local)
  if (currentTeamUid !== 'local') {
    const teamWorkspaces = workspacesByTeam[currentTeamUid] ?? []

    if (teamWorkspaces.length > 0) {
      result.push({
        label: 'Team Workspaces',
        options: teamWorkspaces,
      })
    }
  }

  // Always add local workspaces section
  result.push({
    label: 'Local Workspaces',
    options: workspacesByTeam['local'] ?? [],
  })

  return result
}
