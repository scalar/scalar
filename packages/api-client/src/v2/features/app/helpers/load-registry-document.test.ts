import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas'
import { describe, expect, it, vi } from 'vitest'

import type { ImportDocumentFromRegistry } from '@/v2/types/configuration'

import { loadRegistryDocument } from './load-registry-document'

type FakeDocument = Partial<WorkspaceDocument> & {
  'x-scalar-registry-meta'?: {
    namespace: string
    slug: string
    version?: string
    commitHash?: string
  }
}

/**
 * Builds a minimal `WorkspaceStore` stub. The loader only reads the document
 * map (to dedupe existing imports) and calls `addDocument`, so a full store
 * is unnecessary for these unit-level tests.
 */
const createWorkspaceStore = (documents: Record<string, FakeDocument> = {}) => {
  const addDocument = vi.fn().mockResolvedValue(undefined)
  const store = {
    workspace: { documents },
    addDocument,
  } as unknown as WorkspaceStore
  return { store, addDocument }
}

describe('loadRegistryDocument', () => {
  it('persists the commit hash forwarded by the caller on the document meta', async () => {
    const { store, addDocument } = createWorkspaceStore()

    const fetcher: ImportDocumentFromRegistry = vi.fn().mockResolvedValue({
      ok: true,
      data: { info: { title: 'Pets API' } },
    })

    const result = await loadRegistryDocument({
      workspaceStore: store,
      fetcher,
      namespace: 'acme',
      slug: 'pets',
      version: '1.0.0',
      // Callers (sidebar, version picker, etc.) already know the hash from
      // the registry listing they rendered, so they pass it in directly.
      commitHash: 'abc123',
    })

    expect(result.ok).toBe(true)
    expect(addDocument).toHaveBeenCalledTimes(1)

    // The hash must be carried through verbatim so the sidebar can later
    // compare it to newly advertised hashes and surface drift.
    const passed = addDocument.mock.calls[0]?.[0]
    expect(passed?.meta).toStrictEqual({
      'x-scalar-registry-meta': {
        namespace: 'acme',
        slug: 'pets',
        version: '1.0.0',
        commitHash: 'abc123',
      },
    })
  })

  it('omits commitHash from the meta when the caller does not pass one', async () => {
    const { store, addDocument } = createWorkspaceStore()

    const fetcher: ImportDocumentFromRegistry = vi.fn().mockResolvedValue({
      ok: true,
      data: { info: { title: 'Pets API' } },
    })

    await loadRegistryDocument({
      workspaceStore: store,
      fetcher,
      namespace: 'acme',
      slug: 'pets',
      version: '1.0.0',
    })

    // Leaving the field undefined keeps the persisted meta clean and
    // signals "we never saw a hash" to downstream comparisons rather than
    // pinning the document to an empty string.
    const passed = addDocument.mock.calls[0]?.[0]
    expect(passed?.meta).toStrictEqual({
      'x-scalar-registry-meta': {
        namespace: 'acme',
        slug: 'pets',
        version: '1.0.0',
      },
    })
  })

  it('reuses the existing document name when the version is already imported', async () => {
    // Pre-seeded with the exact namespace/slug/version we are about to
    // request — the loader must short-circuit instead of re-fetching.
    const { store, addDocument } = createWorkspaceStore({
      'pets-v1': {
        'x-scalar-registry-meta': {
          namespace: 'acme',
          slug: 'pets',
          version: '1.0.0',
          commitHash: 'old-hash',
        },
      },
    })

    const fetcher: ImportDocumentFromRegistry = vi.fn()

    const result = await loadRegistryDocument({
      workspaceStore: store,
      fetcher,
      namespace: 'acme',
      slug: 'pets',
      version: '1.0.0',
    })

    expect(result).toStrictEqual({ ok: true, documentName: 'pets-v1' })
    expect(fetcher).not.toHaveBeenCalled()
    expect(addDocument).not.toHaveBeenCalled()
  })

  it('names the imported document as `slug(title)-slug(version)`', async () => {
    const { store, addDocument } = createWorkspaceStore()

    const fetcher: ImportDocumentFromRegistry = vi.fn().mockResolvedValue({
      ok: true,
      data: { info: { title: 'Pets API' } },
    })

    const result = await loadRegistryDocument({
      workspaceStore: store,
      fetcher,
      namespace: 'acme',
      slug: 'pets',
      version: '1.0.0',
    })

    expect(result).toStrictEqual({ ok: true, documentName: 'pets-api-1.0.0' })
    expect(addDocument.mock.calls[0]?.[0]?.name).toBe('pets-api-1.0.0')
  })

  it('falls back to the registry slug when the document has no usable title', async () => {
    const { store, addDocument } = createWorkspaceStore()

    const fetcher: ImportDocumentFromRegistry = vi.fn().mockResolvedValue({
      ok: true,
      // Empty title means the workspace key falls back to the registry
      // slug (`pets`) before getting suffixed with the version.
      data: { info: { title: '   ' } },
    })

    const result = await loadRegistryDocument({
      workspaceStore: store,
      fetcher,
      namespace: 'acme',
      slug: 'pets',
      version: '1.0.0',
    })

    expect(result).toStrictEqual({ ok: true, documentName: 'pets-1.0.0' })
    expect(addDocument.mock.calls[0]?.[0]?.name).toBe('pets-1.0.0')
  })

  it('appends an incrementing suffix when the composite name already exists', async () => {
    // Pre-seed a document keyed by the exact composite name we would
    // otherwise generate. The registry meta intentionally points at a
    // *different* version so the dedupe short-circuit does not fire.
    const { store, addDocument } = createWorkspaceStore({
      'pets-api-1.0.0': {
        'x-scalar-registry-meta': {
          namespace: 'other',
          slug: 'pets',
          version: '1.0.0',
        },
      },
    })

    const fetcher: ImportDocumentFromRegistry = vi.fn().mockResolvedValue({
      ok: true,
      data: { info: { title: 'Pets API' } },
    })

    const result = await loadRegistryDocument({
      workspaceStore: store,
      fetcher,
      namespace: 'acme',
      slug: 'pets',
      version: '1.0.0',
    })

    expect(result).toStrictEqual({ ok: true, documentName: 'pets-api-1.0.0-1' })
    expect(addDocument.mock.calls[0]?.[0]?.name).toBe('pets-api-1.0.0-1')
  })

  it('surfaces fetcher errors without writing to the workspace store', async () => {
    const { store, addDocument } = createWorkspaceStore()

    const fetcher: ImportDocumentFromRegistry = vi.fn().mockResolvedValue({
      ok: false,
      error: 'boom',
    })

    const result = await loadRegistryDocument({
      workspaceStore: store,
      fetcher,
      namespace: 'acme',
      slug: 'pets',
      version: '1.0.0',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('boom')
    }
    expect(addDocument).not.toHaveBeenCalled()
  })
})
