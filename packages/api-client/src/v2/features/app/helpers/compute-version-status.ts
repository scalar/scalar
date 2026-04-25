/**
 * Sync status surfaced for a registry-backed document version.
 *
 * - `synced`: local commit hash matches the registry's, no local edits since
 *   the last save. Nothing to push or pull.
 * - `push`: local commit hash matches the registry's but the workspace
 *   document is dirty (the user has edited it). Local edits would need to
 *   be pushed for the registry to catch up.
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
  // Unloaded versions have no local state to compare against. Callers
  // typically do not surface a status icon for them.
  if (!isLoaded) {
    return 'unknown'
  }

  // Either side is missing a hash. Treat the version as in sync with the
  // registry and only differentiate based on local edits. Avoids surfacing
  // a misleading "pull" arrow when we cannot actually prove drift.
  if (!localHash || !registryHash || localHash === registryHash) {
    return isDirty ? 'push' : 'synced'
  }

  // Hashes differ. The cached conflict result is only trustworthy while it
  // was computed against the *current* registry hash; otherwise treat the
  // version as a regular pull until a fresh check populates the cache.
  if (hasConflict === true && conflictCheckedAgainstHash === registryHash) {
    return 'conflict'
  }

  return 'pull'
}
