import { describe, expect, it, vi } from 'vitest'

import { createWorkspaceStore } from '@/client'
import type { OpenApiDocument } from '@/schemas/v3.1/strict/openapi-document'

import {
  createEmptyDocument,
  deleteDocument,
  updateDocumentExtension,
  updateDocumentIcon,
  updateDocumentInfo,
  updateWatchMode,
} from './document'

type TestDocument = OpenApiDocument & Record<string, unknown>

function createDocument(initial?: Partial<OpenApiDocument> & Record<string, unknown>): TestDocument {
  return {
    openapi: '3.1.0',
    info: { title: 'Test', version: '1.0.0' },
    ...initial,
    'x-scalar-original-document-hash': '123',
  } as TestDocument
}

describe('updateDocumentExtension', () => {
  it('does nothing when document is null', () => {
    updateDocumentExtension(null, { 'x-pre-request': 'console.log("test")' })
  })

  it('adds a new extension field to the document', () => {
    const document = createDocument()

    updateDocumentExtension(document, { 'x-pre-request': 'console.log("pre")' })

    expect(document['x-pre-request']).toBe('console.log("pre")')
  })

  it('adds multiple extension fields at once', () => {
    const document = createDocument()

    updateDocumentExtension(document, {
      'x-pre-request': 'console.log("pre")',
      'x-post-response': 'console.log("post")',
    })

    expect(document['x-pre-request']).toBe('console.log("pre")')
    expect(document['x-post-response']).toBe('console.log("post")')
  })

  it('updates an existing extension field', () => {
    const document = createDocument({
      'x-pre-request': 'old script',
    })

    updateDocumentExtension(document, { 'x-pre-request': 'new script' })

    expect(document['x-pre-request']).toBe('new script')
  })

  it('preserves existing document properties when adding extensions', () => {
    const document = createDocument({
      info: { title: 'My API', version: '2.0.0' },
      paths: { '/users': { get: {} } },
    })

    updateDocumentExtension(document, { 'x-custom-extension': 'value' })

    expect(document.info.title).toBe('My API')
    expect(document.info.version).toBe('2.0.0')
    expect(document.paths).toEqual({ '/users': { get: {} } })
    expect(document['x-custom-extension']).toBe('value')
  })

  it('preserves existing extension fields when adding new ones', () => {
    const document = createDocument({
      'x-pre-request': 'existing pre',
    })

    updateDocumentExtension(document, { 'x-post-response': 'new post' })

    expect(document['x-pre-request']).toBe('existing pre')
    expect(document['x-post-response']).toBe('new post')
  })

  it('handles object extension values', () => {
    const document = createDocument()

    updateDocumentExtension(document, {
      'x-scalar-config': {
        theme: 'dark',
        showSidebar: true,
      },
    })

    expect(document['x-scalar-config']).toEqual({
      theme: 'dark',
      showSidebar: true,
    })
  })

  it('merges nested object extension values', () => {
    const document = createDocument({
      'x-scalar-config': {
        theme: 'light',
        layout: 'default',
      },
    })

    updateDocumentExtension(document, {
      'x-scalar-config': {
        theme: 'dark',
        showSidebar: true,
      },
    })

    expect(document['x-scalar-config']).toEqual({
      theme: 'dark',
      layout: 'default',
      showSidebar: true,
    })
  })

  it('handles array extension values', () => {
    const document = createDocument()

    updateDocumentExtension(document, {
      'x-tags-order': ['users', 'posts', 'comments'],
    })

    expect(document['x-tags-order']).toEqual(['users', 'posts', 'comments'])
  })

  it('handles empty payload', () => {
    const document = createDocument({
      'x-existing': 'value',
    })

    updateDocumentExtension(document, {})

    expect(document['x-existing']).toBe('value')
    expect(document.info.title).toBe('Test')
  })

  it('handles null and undefined extension values', () => {
    const document = createDocument({
      'x-to-nullify': 'existing',
    })

    updateDocumentExtension(document, {
      'x-to-nullify': null,
      'x-undefined-value': undefined,
    })

    expect(document['x-to-nullify']).toBeNull()
    expect(document['x-undefined-value']).toBeUndefined()
  })

  it('updates extensions multiple times correctly', () => {
    const document = createDocument()

    updateDocumentExtension(document, { 'x-version': 1 })
    expect(document['x-version']).toBe(1)

    updateDocumentExtension(document, { 'x-version': 2 })
    expect(document['x-version']).toBe(2)

    updateDocumentExtension(document, { 'x-version': 3, 'x-new-field': 'added' })
    expect(document['x-version']).toBe(3)
    expect(document['x-new-field']).toBe('added')
  })
})

describe('updateWatchMode', () => {
  it('does nothing when document is null', () => {
    updateWatchMode(null, true)
    // Should not throw
  })

  it('sets x-scalar-watch-mode to true', () => {
    const document = createDocument()

    updateWatchMode(document, true)

    expect(document['x-scalar-watch-mode']).toBe(true)
  })

  it('sets x-scalar-watch-mode to false', () => {
    const document = createDocument()

    updateWatchMode(document, false)

    expect(document['x-scalar-watch-mode']).toBe(false)
  })

  it('updates existing x-scalar-watch-mode value', () => {
    const document = createDocument({
      'x-scalar-watch-mode': true,
    })

    updateWatchMode(document, false)

    expect(document['x-scalar-watch-mode']).toBe(false)
  })

  it('updates from false to true', () => {
    const document = createDocument({
      'x-scalar-watch-mode': false,
    })

    updateWatchMode(document, true)

    expect(document['x-scalar-watch-mode']).toBe(true)
  })

  it('overwrites existing value when called multiple times', () => {
    const document = createDocument()

    updateWatchMode(document, true)
    expect(document['x-scalar-watch-mode']).toBe(true)

    updateWatchMode(document, false)
    expect(document['x-scalar-watch-mode']).toBe(false)

    updateWatchMode(document, true)
    expect(document['x-scalar-watch-mode']).toBe(true)
  })
})

describe('updateDocumentIcon', () => {
  it('does nothing when document is null', () => {
    updateDocumentIcon(null, 'new-icon')
    // Should not throw
  })

  it('does nothing when x-scalar-navigation does not exist', () => {
    const document = createDocument()

    updateDocumentIcon(document, 'new-icon')

    expect(document['x-scalar-icon']).toBeUndefined()
  })

  it('updates both x-scalar-icon and x-scalar-navigation.icon', () => {
    const document = createDocument({
      'x-scalar-navigation': {
        type: 'document',
        id: 'test-doc',
        name: 'test-doc',
        title: 'Test Document',
        children: [],
        icon: 'old-icon',
      },
    })

    updateDocumentIcon(document, 'new-icon')

    expect(document['x-scalar-icon']).toBe('new-icon')
    expect(document['x-scalar-navigation']?.icon).toBe('new-icon')
  })

  it('sets icon when x-scalar-icon is undefined', () => {
    const document = createDocument({
      'x-scalar-navigation': {
        type: 'document',
        id: 'test-doc',
        name: 'test-doc',
        title: 'Test Document',
        children: [],
      },
    })

    updateDocumentIcon(document, 'first-icon')

    expect(document['x-scalar-icon']).toBe('first-icon')
    expect(document['x-scalar-navigation']?.icon).toBe('first-icon')
  })

  it('updates icon when x-scalar-icon already exists', () => {
    const document = createDocument({
      'x-scalar-icon': 'old-icon',
      'x-scalar-navigation': {
        type: 'document',
        id: 'test-doc',
        name: 'test-doc',
        title: 'Test Document',
        children: [],
        icon: 'old-icon',
      },
    })

    updateDocumentIcon(document, 'updated-icon')

    expect(document['x-scalar-icon']).toBe('updated-icon')
    expect(document['x-scalar-navigation']?.icon).toBe('updated-icon')
  })

  it('updates icon multiple times correctly', () => {
    const document = createDocument({
      'x-scalar-navigation': {
        type: 'document',
        id: 'test-doc',
        name: 'test-doc',
        title: 'Test Document',
        children: [],
      },
    })

    updateDocumentIcon(document, 'icon-1')
    expect(document['x-scalar-icon']).toBe('icon-1')
    expect(document['x-scalar-navigation']?.icon).toBe('icon-1')

    updateDocumentIcon(document, 'icon-2')
    expect(document['x-scalar-icon']).toBe('icon-2')
    expect(document['x-scalar-navigation']?.icon).toBe('icon-2')

    updateDocumentIcon(document, 'icon-3')
    expect(document['x-scalar-icon']).toBe('icon-3')
    expect(document['x-scalar-navigation']?.icon).toBe('icon-3')
  })

  it('preserves other x-scalar-navigation properties', () => {
    const document = createDocument({
      'x-scalar-navigation': {
        type: 'document',
        id: 'test-doc',
        name: 'test-doc',
        title: 'Test Document',
        children: [
          {
            type: 'tag',
            id: 'tag-1',
            name: 'tag-1',
            title: 'Tag 1',
            isGroup: false,
          },
        ],
        icon: 'old-icon',
      },
    })

    updateDocumentIcon(document, 'new-icon')

    expect(document['x-scalar-navigation']?.type).toBe('document')
    expect(document['x-scalar-navigation']?.id).toBe('test-doc')
    expect(document['x-scalar-navigation']?.name).toBe('test-doc')
    expect(document['x-scalar-navigation']?.title).toBe('Test Document')
    expect(document['x-scalar-navigation']?.children).toHaveLength(1)
    expect(document['x-scalar-navigation']?.icon).toBe('new-icon')
  })

  it('handles empty string icon', () => {
    const document = createDocument({
      'x-scalar-navigation': {
        type: 'document',
        id: 'test-doc',
        name: 'test-doc',
        title: 'Test Document',
        children: [],
        icon: 'old-icon',
      },
    })

    updateDocumentIcon(document, '')

    expect(document['x-scalar-icon']).toBe('')
    expect(document['x-scalar-navigation']?.icon).toBe('')
  })
})

describe('updateDocumentInfo', () => {
  it('does nothing when document is null', () => {
    updateDocumentInfo(null, { title: 'New Title' })
    // Should not throw
  })

  it('updates document title and navigation title', () => {
    const document = createDocument({
      info: {
        title: 'Test',
        version: '1.0.0',
      },
      'x-scalar-navigation': {
        type: 'document',
        id: 'test-doc',
        name: 'test-doc',
        title: 'Test',
        children: [],
      },
    })

    expect(document['x-scalar-navigation']?.title).toBe('Test')

    updateDocumentInfo(document, { title: 'Updated Title' })

    expect(document.info.title).toBe('Updated Title')
    expect(document.info.version).toBe('1.0.0')
    expect(document['x-scalar-navigation']?.title).toBe('Updated Title')
  })

  it('updates multiple info properties at once', () => {
    const document = createDocument()

    updateDocumentInfo(document, {
      title: 'New Title',
      version: '2.0.0',
      description: 'A new description',
    })

    expect(document.info.title).toBe('New Title')
    expect(document.info.version).toBe('2.0.0')
    expect(document.info.description).toBe('A new description')
  })

  it('merges nested properties without replacing entire info object', () => {
    const document = createDocument({
      info: {
        title: 'Original Title',
        version: '1.0.0',
        description: 'Original description',
        contact: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
    })

    updateDocumentInfo(document, {
      title: 'Updated Title',
      contact: {
        email: 'newemail@example.com',
      },
    })

    expect(document.info.title).toBe('Updated Title')
    expect(document.info.version).toBe('1.0.0')
    expect(document.info.description).toBe('Original description')
    expect(document.info.contact?.email).toBe('newemail@example.com')
  })
})

describe('createEmptyDocument', () => {
  it('does nothing when store is null', async () => {
    await expect(
      createEmptyDocument(null, {
        name: 'test-doc',
        icon: 'test-icon',
      }),
    ).resolves.toBeUndefined()
  })

  it('creates a new empty document with basic structure', async () => {
    const store = createWorkspaceStore()
    const callback = vi.fn()

    await createEmptyDocument(store, {
      name: 'my-api',
      icon: 'api-icon',
      callback: callback,
    })

    const document = store.workspace.documents['my-api'] as OpenApiDocument | undefined
    expect(document).toBeDefined()
    expect(document?.openapi).toBe('3.1.0')
    expect(document?.info.title).toBe('my-api')
    expect(document?.info.version).toBe('1.0.0')
    expect(document?.paths).toEqual({ '/': { get: {} } })
    expect(document?.['x-scalar-icon']).toBe('api-icon')
    expect(callback).toHaveBeenCalledWith(true)
  })

  it('calls callback with false when document name already exists', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'existing-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'Existing', version: '1.0.0' },
      },
    })

    const callback = vi.fn()

    await createEmptyDocument(store, {
      name: 'existing-doc',
      icon: 'new-icon',
      callback: callback,
    })

    expect(callback).toHaveBeenCalledWith(false)
    expect(store.workspace.documents['existing-doc']?.info.title).toBe('Existing')
  })
})

describe('deleteDocument', () => {
  it('no-ops when store is null', () => {
    expect(() => deleteDocument(null, { name: 'test-doc' })).not.toThrow()
  })

  it('deletes an existing document from the workspace', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'doc-to-delete',
      document: {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
      },
    })

    expect(store.workspace.documents['doc-to-delete']).toBeDefined()

    deleteDocument(store, { name: 'doc-to-delete' })

    expect(store.workspace.documents['doc-to-delete']).toBeUndefined()
  })

  it('does not throw when deleting a non-existent document', () => {
    const store = createWorkspaceStore()

    expect(() => deleteDocument(store, { name: 'non-existent' })).not.toThrow()
  })

  it('deletes only the specified document and leaves others intact', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'doc-1',
      document: {
        openapi: '3.1.0',
        info: { title: 'Doc 1', version: '1.0.0' },
      },
    })
    await store.addDocument({
      name: 'doc-2',
      document: {
        openapi: '3.1.0',
        info: { title: 'Doc 2', version: '1.0.0' },
      },
    })
    await store.addDocument({
      name: 'doc-3',
      document: {
        openapi: '3.1.0',
        info: { title: 'Doc 3', version: '1.0.0' },
      },
    })

    expect(Object.keys(store.workspace.documents)).toHaveLength(3)

    deleteDocument(store, { name: 'doc-2' })

    expect(Object.keys(store.workspace.documents)).toHaveLength(2)
    expect(store.workspace.documents['doc-1']).toBeDefined()
    expect(store.workspace.documents['doc-2']).toBeUndefined()
    expect(store.workspace.documents['doc-3']).toBeDefined()
  })
})
