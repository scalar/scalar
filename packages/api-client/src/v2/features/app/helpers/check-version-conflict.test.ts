import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { describe, expect, it, vi } from 'vitest'

import type { ImportDocumentFromRegistry } from '@/v2/types/configuration'

import { checkVersionConflict } from './check-version-conflict'

type FakeDocument = {
  'x-scalar-registry-meta'?: {
    namespace: string
    slug: string
    version: string
    commitHash?: string
    conflictCheckedAgainstHash?: string
    hasConflict?: boolean
  }
  [key: string]: unknown
}

const createWorkspaceStore = ({
  documents,
  originals,
}: {
  documents: Record<string, FakeDocument>
  originals?: Record<string, Record<string, unknown> | null>
}) => {
  const getOriginalDocument = vi.fn((name: string) => originals?.[name] ?? null)
  const store = {
    workspace: { documents },
    getOriginalDocument,
  } as unknown as WorkspaceStore
  return { store, getOriginalDocument }
}

describe('checkVersionConflict', () => {
  it('reuses the cached result when the registry hash has not changed', async () => {
    const { store } = createWorkspaceStore({
      documents: {
        pets: {
          info: { title: 'Pets' },
          'x-scalar-registry-meta': {
            namespace: 'team',
            slug: 'pets',
            version: '1.0.0',
            commitHash: 'local',
            conflictCheckedAgainstHash: 'remote-1',
            hasConflict: true,
          },
        },
      },
    })
    const fetcher: ImportDocumentFromRegistry = vi.fn()

    const result = await checkVersionConflict({
      workspaceStore: store,
      fetcher,
      documentName: 'pets',
      namespace: 'team',
      slug: 'pets',
      version: '1.0.0',
      registryCommitHash: 'remote-1',
    })

    expect(result).toEqual({ ok: true, hasConflict: true, fromCache: true })
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('fetches the remote document and writes a fresh `false` result to the meta when there is no conflict', async () => {
    const documents: Record<string, FakeDocument> = {
      pets: {
        info: { title: 'Pets', version: '1.0.0' },
        'x-scalar-registry-meta': {
          namespace: 'team',
          slug: 'pets',
          version: '1.0.0',
          commitHash: 'local',
        },
      },
    }
    const { store } = createWorkspaceStore({
      documents,
      originals: { pets: { info: { title: 'Pets', version: '1.0.0' } } },
    })
    const fetcher: ImportDocumentFromRegistry = vi.fn().mockResolvedValue({
      ok: true,
      data: { info: { title: 'Pets', version: '1.1.0' } },
    })

    const result = await checkVersionConflict({
      workspaceStore: store,
      fetcher,
      documentName: 'pets',
      namespace: 'team',
      slug: 'pets',
      version: '1.0.0',
      registryCommitHash: 'remote-2',
    })

    expect(result).toEqual({ ok: true, hasConflict: false, fromCache: false })
    expect(fetcher).toHaveBeenCalledWith({ namespace: 'team', slug: 'pets', version: '1.0.0' })
    expect(documents.pets?.['x-scalar-registry-meta']).toEqual({
      namespace: 'team',
      slug: 'pets',
      version: '1.0.0',
      commitHash: 'local',
      conflictCheckedAgainstHash: 'remote-2',
      hasConflict: false,
    })
  })

  it('writes `hasConflict: true` when local and remote edits collide on the same path', async () => {
    const documents: Record<string, FakeDocument> = {
      pets: {
        info: { title: 'Local Title', version: '1.0.0' },
        'x-scalar-registry-meta': {
          namespace: 'team',
          slug: 'pets',
          version: '1.0.0',
        },
      },
    }
    const { store } = createWorkspaceStore({
      documents,
      originals: { pets: { info: { title: 'Original Title', version: '1.0.0' } } },
    })
    const fetcher: ImportDocumentFromRegistry = vi.fn().mockResolvedValue({
      ok: true,
      data: { info: { title: 'Remote Title', version: '1.0.0' } },
    })

    const result = await checkVersionConflict({
      workspaceStore: store,
      fetcher,
      documentName: 'pets',
      namespace: 'team',
      slug: 'pets',
      version: '1.0.0',
      registryCommitHash: 'remote-2',
    })

    expect(result).toEqual({ ok: true, hasConflict: true, fromCache: false })
    expect(documents.pets?.['x-scalar-registry-meta']?.hasConflict).toBe(true)
    expect(documents.pets?.['x-scalar-registry-meta']?.conflictCheckedAgainstHash).toBe('remote-2')
  })

  it('returns an error when the document is not loaded', async () => {
    const { store } = createWorkspaceStore({ documents: {} })
    const fetcher: ImportDocumentFromRegistry = vi.fn()

    const result = await checkVersionConflict({
      workspaceStore: store,
      fetcher,
      documentName: 'missing',
      namespace: 'team',
      slug: 'pets',
      version: '1.0.0',
      registryCommitHash: 'remote-1',
    })

    expect(result).toEqual({ ok: false, error: 'Document "missing" is not loaded in the workspace.' })
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('returns an error when no registry commit hash is provided', async () => {
    const { store } = createWorkspaceStore({
      documents: { pets: { info: { title: 'Pets' } } },
    })
    const fetcher: ImportDocumentFromRegistry = vi.fn()

    const result = await checkVersionConflict({
      workspaceStore: store,
      fetcher,
      documentName: 'pets',
      namespace: 'team',
      slug: 'pets',
      version: '1.0.0',
      registryCommitHash: undefined,
    })

    expect(result).toEqual({ ok: false, error: 'No registry commit hash available for this version.' })
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('surfaces fetcher errors without writing to the cache', async () => {
    const documents: Record<string, FakeDocument> = {
      pets: {
        info: { title: 'Pets' },
        'x-scalar-registry-meta': {
          namespace: 'team',
          slug: 'pets',
          version: '1.0.0',
        },
      },
    }
    const { store } = createWorkspaceStore({
      documents,
      originals: { pets: { info: { title: 'Pets' } } },
    })
    const fetcher: ImportDocumentFromRegistry = vi.fn().mockResolvedValue({ ok: false, error: 'network down' })

    const result = await checkVersionConflict({
      workspaceStore: store,
      fetcher,
      documentName: 'pets',
      namespace: 'team',
      slug: 'pets',
      version: '1.0.0',
      registryCommitHash: 'remote-2',
    })

    expect(result).toEqual({ ok: false, error: 'Failed to fetch document: network down' })
    // Cache untouched so the next attempt still has a chance to compute a fresh result.
    expect(documents.pets?.['x-scalar-registry-meta']).toEqual({
      namespace: 'team',
      slug: 'pets',
      version: '1.0.0',
    })
  })
})
