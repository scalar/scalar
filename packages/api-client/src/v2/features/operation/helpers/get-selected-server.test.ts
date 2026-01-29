import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'
import { describe, expect, it } from 'vitest'

import { getSelectedServer } from './get-selected-server'

/**
 * Helper to create a minimal WorkspaceDocument for testing.
 */
function createDocument(initial?: Partial<WorkspaceDocument>): WorkspaceDocument {
  return {
    openapi: '3.1.0',
    info: { title: 'Test', version: '1.0.0' },
    ...initial,
    'x-scalar-original-document-hash': '123',
  }
}

describe('getSelectedServer', () => {
  it('returns the server matching x-scalar-selected-server URL', () => {
    const servers = [
      { url: 'https://api.example.com' },
      { url: 'https://staging.example.com' },
      { url: 'https://dev.example.com' },
    ]
    const document = createDocument({
      'x-scalar-selected-server': 'https://staging.example.com',
    })

    const result = getSelectedServer(document, servers)

    expect(result).toEqual({ url: 'https://staging.example.com' })
  })

  it('returns null when x-scalar-selected-server does not match any server URL', () => {
    const servers = [{ url: 'https://api.example.com' }, { url: 'https://staging.example.com' }]
    const document = createDocument({
      'x-scalar-selected-server': 'https://nonexistent.example.com',
    })

    const result = getSelectedServer(document, servers)

    expect(result).toBeNull()
  })

  it('returns null when servers array is null', () => {
    const document = createDocument({
      'x-scalar-selected-server': 'https://api.example.com',
    })

    const result = getSelectedServer(document, null)

    expect(result).toBeNull()
  })

  it('returns first server when x-scalar-selected-server is not set', () => {
    const servers = [{ url: 'https://api.example.com' }, { url: 'https://staging.example.com' }]
    const document = createDocument({})

    const result = getSelectedServer(document, servers)

    expect(result).toEqual({ url: 'https://api.example.com' })
  })
})
