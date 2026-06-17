import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'

/**
 * Narrow a navigation entry's children down to a single AsyncAPI node type.
 *
 * The channel renderer needs its operations and the operation renderer needs its messages; both
 * share this type-guarded filter so the cast lives in one place.
 */
export const filterChildrenByType = <T extends TraversedEntry>(
  children: TraversedEntry[] | undefined,
  type: T['type'],
): T[] => (children ?? []).filter((child): child is T => child.type === type)
