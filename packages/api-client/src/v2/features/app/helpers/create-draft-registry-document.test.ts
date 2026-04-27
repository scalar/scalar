import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { describe, expect, it, vi } from 'vitest'

import { createDraftRegistryDocument } from './create-draft-registry-document'

type FakeDocument = Record<string, unknown>

/**
 * Shape of the first argument the helper passes to `WorkspaceStore.addDocument`.
 * Spelled out here so the tests can assert on cloned bodies and meta blocks
 * without losing type safety.
 */
type AddDocumentInput = {
  name: string
  document: Record<string, unknown> & {
    info?: { title?: string; version?: string }
  }
  meta: { 'x-scalar-registry-meta'?: Record<string, unknown> }
}

/**
 * Build a minimal `WorkspaceStore` stub. `getEditableDocument` mirrors the
 * real store contract and returns a deep clone of the requested document
 * (or `null` when missing) so the helper has something safe to mutate.
 */
const createWorkspaceStore = (documents: Record<string, FakeDocument>) => {
  const addDocument = vi.fn<(input: AddDocumentInput) => Promise<boolean>>(async () => true)
  const getEditableDocument = vi.fn(async (documentName: string) => {
    const doc = documents[documentName]
    if (!doc) {
      return null
    }
    return JSON.parse(JSON.stringify(doc)) as Record<string, unknown>
  })
  const store = {
    workspace: { documents },
    addDocument,
    getEditableDocument,
  } as unknown as WorkspaceStore
  return { store, addDocument, getEditableDocument }
}

describe('createDraftRegistryDocument', () => {
  it('seeds the draft from getEditableDocument and stamps the new info.version', async () => {
    const { store, addDocument, getEditableDocument } = createWorkspaceStore({
      'pets-v1': {
        openapi: '3.1.0',
        info: { title: 'Pets API', version: '1.0.0' },
        paths: { '/pets': { get: { summary: 'List pets' } } },
      },
    })

    const result = await createDraftRegistryDocument({
      workspaceStore: store,
      namespace: 'acme',
      slug: 'pets',
      version: '2.0.0',
      seedDocumentName: 'pets-v1',
    })

    expect(result.ok).toBe(true)
    expect(getEditableDocument).toHaveBeenCalledWith('pets-v1')
    expect(addDocument).toHaveBeenCalledTimes(1)

    const input = addDocument.mock.calls[0]![0]

    // The user-typed version flows onto `info.version` so the rendered
    // OpenAPI lines up with the registry coordinates.
    expect(input.document.info).toEqual({ title: 'Pets API', version: '2.0.0' })

    // The seed body is preserved otherwise.
    expect(input.document.paths).toEqual({ '/pets': { get: { summary: 'List pets' } } })

    expect(input.meta['x-scalar-registry-meta']).toEqual({
      namespace: 'acme',
      slug: 'pets',
      version: '2.0.0',
    })

    // No commitHash on the new meta - that is what makes the document a draft.
    expect(input.meta['x-scalar-registry-meta']).not.toHaveProperty('commitHash')
  })

  it('produces a workspace name that does not collide with existing documents', async () => {
    const { store, addDocument } = createWorkspaceStore({
      'pets-api': {
        openapi: '3.1.0',
        info: { title: 'Pets API', version: '1.0.0' },
      },
    })

    const result = await createDraftRegistryDocument({
      workspaceStore: store,
      namespace: 'acme',
      slug: 'pets',
      version: '2.0.0',
      seedDocumentName: 'pets-api',
    })

    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.documentName).not.toBe('pets-api')
    expect(addDocument.mock.calls[0]![0].name).toBe(result.documentName)
  })

  it('falls back to the registry slug when the seed has no info.title', async () => {
    const { store, addDocument } = createWorkspaceStore({
      'unnamed-doc': {
        openapi: '3.1.0',
      },
    })

    const result = await createDraftRegistryDocument({
      workspaceStore: store,
      namespace: 'acme',
      slug: 'pets',
      version: '2.0.0',
      seedDocumentName: 'unnamed-doc',
    })

    expect(result.ok).toBe(true)
    expect(addDocument.mock.calls[0]![0].name).toBe('pets')
    // Even when the seed has no `info`, the version is still stamped onto a
    // freshly created info block so the draft has valid coordinates.
    expect(addDocument.mock.calls[0]![0].document.info).toEqual({ title: '', version: '2.0.0' })
  })

  it('returns an error when the seed document is missing', async () => {
    const { store, addDocument } = createWorkspaceStore({})

    const result = await createDraftRegistryDocument({
      workspaceStore: store,
      namespace: 'acme',
      slug: 'pets',
      version: '2.0.0',
      seedDocumentName: 'missing',
    })

    expect(result).toEqual({
      ok: false,
      error: expect.stringContaining('missing'),
    })
    expect(addDocument).not.toHaveBeenCalled()
  })

  it('returns an error when addDocument resolves with `false`', async () => {
    const { store } = createWorkspaceStore({
      'pets-v1': {
        openapi: '3.1.0',
        info: { title: 'Pets API', version: '1.0.0' },
      },
    })
    ;(store.addDocument as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false)

    const result = await createDraftRegistryDocument({
      workspaceStore: store,
      namespace: 'acme',
      slug: 'pets',
      version: '2.0.0',
      seedDocumentName: 'pets-v1',
    })

    expect(result.ok).toBe(false)
  })

  it('returns an error when addDocument throws', async () => {
    const { store } = createWorkspaceStore({
      'pets-v1': {
        openapi: '3.1.0',
        info: { title: 'Pets API', version: '1.0.0' },
      },
    })
    ;(store.addDocument as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('boom'))

    const result = await createDraftRegistryDocument({
      workspaceStore: store,
      namespace: 'acme',
      slug: 'pets',
      version: '2.0.0',
      seedDocumentName: 'pets-v1',
    })

    expect(result).toEqual({ ok: false, error: 'boom' })
  })
})
