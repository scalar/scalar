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
 * ⚠️ The check is not free of side effects. `merge` folds two compatible changes into one by
 * merging in place, and the changes a diff carries are live references into the documents it
 * compared, so detecting conflicts can write local values into the `remote` document. Pass a copy
 * whenever the caller needs the remote document to stay untouched.
 *
 * Callers remain responsible for fetching the remote document and for merging
 * and persisting it on the workspace document once the conflicts are settled.
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
