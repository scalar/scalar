import type { ScalarListboxOption, WorkspaceGroup } from '@scalar/components'

import { getPlaceholderWorkspaceId } from './placeholder-workspace-id'

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
  teamSlug: string
}

/**
 * Groups workspaces into team and local categories.
 * Team workspaces are listed first (if not viewing local workspaces),
 * followed by local workspaces.
 *
 * When `placeholder` is provided and the current non-local team has no real
 * workspaces yet, a single synthetic option is added to the team group. Its
 * id uses the `pending:<teamSlug>/<slug>` placeholder format (see
 * `placeholder-workspace-id.ts`) so the picker can route the selection
 * through `resumeOrGetStarted` without colliding with a real `workspaceUid`.
 * The route handler then creates the workspace on demand.
 *
 * @param workspaces - Array of workspaces to group
 * @param currentTeamSlug - Current team identifier ('local' for local team)
 * @param options - Optional grouping behavior
 * @returns Array of workspace groups with labels and options
 */
export function groupWorkspacesByTeam(
  workspaces: WorkspaceItem[],
  currentTeamSlug: string,
  options?: {
    /**
     * Surfaces a synthetic default option for the current non-local team
     * when it has no real workspaces yet. The option's id is built via
     * `getPlaceholderWorkspaceId(currentTeamSlug, slug)` so picker
     * consumers can recognize it as a placeholder and route to the team's
     * get-started page (which then creates the workspace on demand).
     */
    placeholder?: {
      /** Slug used for the on-demand team workspace (e.g. `'default'`). */
      slug: string
      /** Display label for the placeholder option (e.g. `'Team workspace'`). */
      label: string
    }
  },
): WorkspaceGroup[] {
  // Bucket workspaces by their team slug.
  const workspacesByTeam = workspaces.reduce<Record<string, ScalarListboxOption[]>>((acc, workspace) => {
    const teamSlug = workspace.teamSlug

    if (!acc[teamSlug]) {
      acc[teamSlug] = []
    }

    acc[teamSlug].push({
      id: workspace.id,
      label: workspace.label,
    })

    return acc
  }, {})

  const result: WorkspaceGroup[] = []

  // Add current team workspaces (if not local)
  if (currentTeamSlug !== 'local') {
    const teamWorkspaces = workspacesByTeam[currentTeamSlug] ?? []

    if (teamWorkspaces.length > 0) {
      result.push({
        label: 'Team Workspaces',
        options: teamWorkspaces,
      })
    } else if (options?.placeholder) {
      // No real team workspace yet: surface a synthetic option using the
      // `pending:` placeholder id so picker consumers can detect it and
      // route through the team's get-started page. The route handler
      // creates the workspace on demand when it lands there.
      result.push({
        label: 'Team Workspaces',
        options: [
          {
            id: getPlaceholderWorkspaceId(currentTeamSlug, options.placeholder.slug),
            label: options.placeholder.label,
          },
        ],
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
