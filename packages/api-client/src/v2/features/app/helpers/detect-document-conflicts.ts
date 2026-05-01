import { diff, merge } from '@scalar/json-magic/diff'

/**
 * Detect whether merging an upstream document with the local edits would
 * produce conflicts.
 *
 * The check is a classic three-way comparison:
 *  1. Diff the original (last-known remote) document against the local
 *     editable copy - this captures the user's edits.
 *  2. Diff the original against the new remote document - this captures the
 *     upstream changes.
 *  3. Run `merge` from `@scalar/json-magic/diff` over both diff lists. The
 *     merge yields a `conflicts` array for paths that were touched by both
 *     sides in incompatible ways. Any non-empty array means the user must
 *     resolve the conflicts manually.
 *
 * The function is pure - callers are responsible for fetching the remote
 * document and persisting the result on the workspace document.
 */
export const detectDocumentConflicts = ({
  original,
  local,
  remote,
}: {
  /** Last-known remote document (the baseline both sides diverged from). */
  original: Record<string, unknown>
  /** Current editable workspace document, including any local edits. */
  local: Record<string, unknown>
  /** Newly-fetched remote document we want to merge in. */
  remote: Record<string, unknown>
}): boolean => {
  const localChanges = diff(original, local)
  const remoteChanges = diff(original, remote)
  const { conflicts } = merge(localChanges, remoteChanges)
  return conflicts.length > 0
}
