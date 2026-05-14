/**
 * Synthetic placeholder workspace ids used by the picker for non-local
 * teams that do not yet own a real workspace.
 *
 * The picker surfaces a single "Team workspace" entry for these teams so
 * logged-in users can land on a routable URL even before persistence has
 * a record. The selection then bounces through the regular workspace
 * navigation flow, and the route handler creates the workspace on
 * demand.
 *
 * The id is encoded as `pending:<teamSlug>/<slug>` so it round-trips
 * through the picker's `id` channel without colliding with a real
 * `workspaceUid` (which is always a UUID).
 */
const PLACEHOLDER_WORKSPACE_PREFIX = 'pending:'

/** Builds the canonical `pending:<teamSlug>/<slug>` placeholder id. */
export const getPlaceholderWorkspaceId = (teamSlug: string, slug: string): string =>
  `${PLACEHOLDER_WORKSPACE_PREFIX}${teamSlug}/${slug}`

/**
 * Parses a placeholder id back into its slug pair. Returns `undefined`
 * when the input is not a placeholder (real `workspaceUid` values never
 * match) so callers can use this as a type guard.
 */
export const parsePlaceholderWorkspaceId = (id: string): { teamSlug: string; slug: string } | undefined => {
  if (!id.startsWith(PLACEHOLDER_WORKSPACE_PREFIX)) {
    return undefined
  }
  const rest = id.slice(PLACEHOLDER_WORKSPACE_PREFIX.length)
  const slashIndex = rest.indexOf('/')
  if (slashIndex === -1) {
    return undefined
  }
  return { teamSlug: rest.slice(0, slashIndex), slug: rest.slice(slashIndex + 1) }
}
