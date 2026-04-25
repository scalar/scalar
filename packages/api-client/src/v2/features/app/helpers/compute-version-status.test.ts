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

  it('falls back to dirty-aware sync when one of the hashes is missing', () => {
    // Version exists locally but the registry has not advertised a hash yet.
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
        localHash: undefined,
        registryHash: 'abc',
        isDirty: false,
      }),
    ).toBe('synced')
  })
})
