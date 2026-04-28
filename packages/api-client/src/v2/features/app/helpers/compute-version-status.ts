/**
 * Sync status surfaced for a registry-backed document version.
 *
 * - `synced`: local commit hash matches the registry's, no local edits since
 *   the last save. Nothing to push or pull.
 * - `push`: the workspace document has changes the registry has not seen
 *   yet. This covers two cases:
 *   1. Hashes match but the document is dirty (the user has edited it).
 *   2. The document is a brand-new draft - it has registry coordinates but
 *      no commit hash on either side, meaning it has never been pushed.
 * - `pull`: registry advertises a different commit hash than the locally
 *   stored one *and* we have not detected a merge conflict (or have not
 *   checked yet). Pulling the upstream version is safe.
 * - `conflict`: registry advertises a different commit hash than the local
 *   one *and* a previous conflict check (cached on the document) determined
 *   that merging the upstream version with the local edits would produce
 *   conflicts. The user has to resolve them manually.
 * - `unknown`: the version is not loaded into the workspace store yet, so
 *   there is nothing local to compare against.
 */
export type VersionStatus = 'synced' | 'push' | 'pull' | 'conflict' | 'unknown'

/**
 * Derive the sync status for a single registry-backed version from cached
 * inputs. Pure and synchronous - the conflict check itself is performed
 * elsewhere (`check-version-conflict`) and persisted on the document so this
 * function only has to read the cached result.
 */
export const computeVersionStatus = ({
  isLoaded,
  localHash,
  registryHash,
  isDirty,
  conflictCheckedAgainstHash,
  hasConflict,
}: {
  /** True when the version has a corresponding workspace document. */
  isLoaded: boolean
  /** Commit hash recorded on the local workspace document, if any. */
  localHash?: string
  /** Commit hash advertised by the registry for this version, if any. */
  registryHash?: string
  /** Whether the workspace document has uncommitted local edits. */
  isDirty?: boolean
  /**
   * Registry hash that the cached `hasConflict` flag was computed against.
   * The cache is only valid while it matches `registryHash`.
   */
  conflictCheckedAgainstHash?: string
  /** Cached outcome of the last conflict check. */
  hasConflict?: boolean
}): VersionStatus => {
  // 1. Foundation check
  if (!isLoaded) {
    return 'unknown'
  }

  // 2. Cache Validation: Determine if we have a valid, active conflict
  const isConflictActive = hasConflict && conflictCheckedAgainstHash === registryHash

  // 3. Scenario: Nothing on the Registry
  if (!registryHash) {
    // If no remote hash exists, it's either a fresh draft (push) or a local-only change
    return isDirty || !localHash ? 'push' : 'synced'
  }

  // 4. Scenario: Matches Registry
  if (localHash === registryHash) {
    return isDirty ? 'push' : 'synced'
  }
  // 5. Scenario: Hash Mismatch (or no localHash but registryHash exists)
  // At this point, localHash !== registryHash and registryHash exists.
  return isConflictActive ? 'conflict' : 'pull'
}
