import { describe, expect, it } from 'vitest'

import { computeVersionStatus } from './compute-version-status'

describe('computeVersionStatus', () => {
  it('returns `unknown` when the version is not loaded into the workspace', () => {
    expect(
      computeVersionStatus({
        isLoaded: false,
        localHash: 'abc',
        registryHash: 'abc',
      }),
    ).toBe('unknown')
  })

  it('returns `synced` when local and registry hashes match and the document is clean', () => {
    expect(
      computeVersionStatus({
        isLoaded: true,
        localHash: 'abc',
        registryHash: 'abc',
        isDirty: false,
      }),
    ).toBe('synced')
  })

  it('returns `push` when hashes match but the document has local edits', () => {
    expect(
      computeVersionStatus({
        isLoaded: true,
        localHash: 'abc',
        registryHash: 'abc',
        isDirty: true,
      }),
    ).toBe('push')
  })

  it('returns `pull` when hashes differ and no conflict is cached', () => {
    expect(
      computeVersionStatus({
        isLoaded: true,
        localHash: 'abc',
        registryHash: 'def',
      }),
    ).toBe('pull')
  })

  it('returns `conflict` when hashes differ and a conflict was cached for the current registry hash', () => {
    expect(
      computeVersionStatus({
        isLoaded: true,
        localHash: 'abc',
        registryHash: 'def',
        conflictCheckedAgainstHash: 'def',
        hasConflict: true,
      }),
    ).toBe('conflict')
  })

  it('falls back to `pull` when the cached conflict was computed against a different registry hash', () => {
    expect(
      computeVersionStatus({
        isLoaded: true,
        localHash: 'abc',
        registryHash: 'def',
        conflictCheckedAgainstHash: 'ghi',
        hasConflict: true,
      }),
    ).toBe('pull')
  })

  it('falls back to `pull` when the cached conflict result is `false` even if hashes differ', () => {
    expect(
      computeVersionStatus({
        isLoaded: true,
        localHash: 'abc',
        registryHash: 'def',
        conflictCheckedAgainstHash: 'def',
        hasConflict: false,
      }),
    ).toBe('pull')
  })

  it('falls back to dirty-aware sync when the version is loaded with no registry hash advertised yet', () => {
    // Local document is pinned to a commit but the registry has gone silent
    // (or has not caught up). We have nothing remote to merge against, so
    // the only signal is the dirty flag.
    expect(
      computeVersionStatus({
        isLoaded: true,
        localHash: 'abc',
        registryHash: undefined,
        isDirty: true,
      }),
    ).toBe('push')

    expect(
      computeVersionStatus({
        isLoaded: true,
        localHash: 'abc',
        registryHash: undefined,
        isDirty: false,
      }),
    ).toBe('synced')
  })

  it('returns `push` for a brand-new draft when neither side has a hash', () => {
    // Drafts start with no commit hash on either side. Even when clean,
    // they still need to be pushed to the registry because the registry
    // has never seen them.
    expect(
      computeVersionStatus({
        isLoaded: true,
        localHash: undefined,
        registryHash: undefined,
        isDirty: false,
      }),
    ).toBe('push')

    expect(
      computeVersionStatus({
        isLoaded: true,
        localHash: undefined,
        registryHash: undefined,
        isDirty: true,
      }),
    ).toBe('push')
  })

  it('returns `pull` when a draft (no local hash) collides with a registry-advertised version', () => {
    // The user created a draft for a version the registry already advertises.
    // We treat this as a regular drift so the existing three-way merge runs.
    expect(
      computeVersionStatus({
        isLoaded: true,
        localHash: undefined,
        registryHash: 'remote-hash',
        isDirty: false,
      }),
    ).toBe('pull')
  })

  it('returns `conflict` for a draft collision when the cached check against the current registry hash flagged conflicts', () => {
    expect(
      computeVersionStatus({
        isLoaded: true,
        localHash: undefined,
        registryHash: 'remote-hash',
        conflictCheckedAgainstHash: 'remote-hash',
        hasConflict: true,
      }),
    ).toBe('conflict')
  })

  it('falls back to `pull` for a draft collision when the cache was computed against a stale registry hash', () => {
    expect(
      computeVersionStatus({
        isLoaded: true,
        localHash: undefined,
        registryHash: 'remote-hash',
        conflictCheckedAgainstHash: 'old-hash',
        hasConflict: true,
      }),
    ).toBe('pull')
  })
})
