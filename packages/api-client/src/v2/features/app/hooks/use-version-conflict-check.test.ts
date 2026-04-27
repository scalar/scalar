import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

import type { SidebarDocumentVersion } from '@/v2/features/app/hooks/use-sidebar-documents'
import { useVersionConflictCheck } from '@/v2/features/app/hooks/use-version-conflict-check'
import type { ImportDocumentFromRegistry } from '@/v2/types/configuration'

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

/**
 * Builds the smallest workspace-store shape the hook (and its inner helper)
 * actually touches. A real store would pull in the rebase machinery which is
 * unrelated to the conflict-check trigger logic exercised here.
 *
 * `getOriginalDocument` returns an empty object so the inner
 * `checkVersionConflict` helper progresses past its early return and reaches
 * the fetcher call — which is what we are asserting on.
 */
const createStore = (documents: Record<string, FakeDocument> = {}): WorkspaceStore =>
  ({
    workspace: { documents },
    getOriginalDocument: (name: string) => (documents[name] ? {} : null),
  }) as unknown as WorkspaceStore

const createVersion = (overrides: Partial<SidebarDocumentVersion> = {}): SidebarDocumentVersion => ({
  key: 'pets',
  version: '1.0.0',
  title: 'Pets',
  documentName: 'pets',
  commitHash: 'local',
  registryCommitHash: 'remote',
  status: 'pull',
  isLatest: false,
  ...overrides,
})

describe('useVersionConflictCheck', () => {
  it('fires a conflict check for every loaded `pull` version in the active group', async () => {
    const store = createStore({
      'pets-v1': {
        'x-scalar-registry-meta': {
          namespace: 'acme',
          slug: 'pets',
          version: '1.0.0',
          commitHash: 'local-1',
        },
      },
      'pets-v2': {
        'x-scalar-registry-meta': {
          namespace: 'acme',
          slug: 'pets',
          version: '2.0.0',
          commitHash: 'local-2',
        },
      },
    })
    const fetcher: ImportDocumentFromRegistry = vi.fn(async () => ({ ok: true, data: {} }) as never)

    useVersionConflictCheck({
      store: () => store,
      fetcher: () => fetcher,
      registry: () => ({ namespace: 'acme', slug: 'pets' }),
      versions: () => [
        createVersion({ key: 'pets-v1', documentName: 'pets-v1', version: '1.0.0' }),
        createVersion({ key: 'pets-v2', documentName: 'pets-v2', version: '2.0.0' }),
      ],
    })

    await nextTick()
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('skips versions that are not in `pull` state', async () => {
    const store = createStore({
      pets: {
        'x-scalar-registry-meta': {
          namespace: 'acme',
          slug: 'pets',
          version: '1.0.0',
          commitHash: 'local',
        },
      },
    })
    const fetcher: ImportDocumentFromRegistry = vi.fn(async () => ({ ok: true, data: {} }) as never)

    useVersionConflictCheck({
      store: () => store,
      fetcher: () => fetcher,
      registry: () => ({ namespace: 'acme', slug: 'pets' }),
      versions: () => [
        createVersion({ status: 'synced' }),
        createVersion({ status: 'push' }),
        createVersion({ status: 'conflict' }),
        createVersion({ status: 'unknown' }),
      ],
    })

    await nextTick()
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('skips versions without a loaded document or a registry hash to compare against', async () => {
    const fetcher: ImportDocumentFromRegistry = vi.fn()

    useVersionConflictCheck({
      store: () => createStore(),
      fetcher: () => fetcher,
      registry: () => ({ namespace: 'acme', slug: 'pets' }),
      versions: () => [createVersion({ documentName: undefined }), createVersion({ registryCommitHash: undefined })],
    })

    await nextTick()
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('does not fire when the registry, store, or fetcher is unavailable', async () => {
    const fetcher: ImportDocumentFromRegistry = vi.fn()

    useVersionConflictCheck({
      store: () => null,
      fetcher: () => fetcher,
      registry: () => ({ namespace: 'acme', slug: 'pets' }),
      versions: () => [createVersion()],
    })

    useVersionConflictCheck({
      store: () => createStore(),
      fetcher: () => undefined,
      registry: () => ({ namespace: 'acme', slug: 'pets' }),
      versions: () => [createVersion()],
    })

    useVersionConflictCheck({
      store: () => createStore(),
      fetcher: () => fetcher,
      registry: () => undefined,
      versions: () => [createVersion()],
    })

    await nextTick()
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('does not fire twice for the same registry hash even when the version objects are rebuilt', async () => {
    const store = createStore({
      pets: {
        'x-scalar-registry-meta': {
          namespace: 'acme',
          slug: 'pets',
          version: '1.0.0',
          commitHash: 'local',
        },
      },
    })
    const fetcher: ImportDocumentFromRegistry = vi.fn(async () => ({ ok: true, data: {} }) as never)
    const versions = ref<SidebarDocumentVersion[]>([createVersion()])

    useVersionConflictCheck({
      store: () => store,
      fetcher: () => fetcher,
      registry: () => ({ namespace: 'acme', slug: 'pets' }),
      versions,
    })

    await nextTick()
    expect(fetcher).toHaveBeenCalledTimes(1)

    // `useSidebarDocuments` rebuilds version objects on every recompute, so
    // the same logical version flows through here as a brand-new object.
    // The in-flight tracker must dedupe by `documentName + registryHash`.
    versions.value = [createVersion()]
    await nextTick()
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('re-fires for a version when its registry hash advances', async () => {
    const store = createStore({
      pets: {
        'x-scalar-registry-meta': {
          namespace: 'acme',
          slug: 'pets',
          version: '1.0.0',
          commitHash: 'local',
        },
      },
    })
    const fetcher: ImportDocumentFromRegistry = vi.fn(async () => ({ ok: true, data: {} }) as never)
    const versions = ref<SidebarDocumentVersion[]>([createVersion({ registryCommitHash: 'remote-1' })])

    useVersionConflictCheck({
      store: () => store,
      fetcher: () => fetcher,
      registry: () => ({ namespace: 'acme', slug: 'pets' }),
      versions,
    })

    await nextTick()
    expect(fetcher).toHaveBeenCalledTimes(1)

    // Registry advanced — the previous in-flight key (`pets|remote-1`) no
    // longer matches, so a fresh request must be allowed through.
    versions.value = [createVersion({ registryCommitHash: 'remote-2' })]
    await nextTick()
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('does nothing when the active group has no versions', async () => {
    const fetcher: ImportDocumentFromRegistry = vi.fn()

    useVersionConflictCheck({
      store: () => createStore(),
      fetcher: () => fetcher,
      registry: () => ({ namespace: 'acme', slug: 'pets' }),
      versions: () => [],
    })

    await nextTick()
    expect(fetcher).not.toHaveBeenCalled()
  })
})
