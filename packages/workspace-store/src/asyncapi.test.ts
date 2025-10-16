import { Value } from '@scalar/typebox/value'
import { describe, expect, it } from 'vitest'

import { createWorkspaceStore } from './client'
import { type AsyncApiDocument, AsyncApiDocumentSchemaStrict } from './schemas/asyncapi/v3.0'
import type { WorkspaceDocument, WorkspaceDocumentMeta } from './schemas/workspace'

const isAsyncApiDocument = (doc: WorkspaceDocument): doc is WorkspaceDocumentMeta & AsyncApiDocument =>
  'asyncapi' in doc

describe('AsyncAPI 3.0', () => {
  const asyncApiDocument = {
    asyncapi: '3.0.0' as const,
    info: {
      title: 'Test AsyncAPI',
      version: '1.0.0',
    },
    channels: {
      'user/signedup': {
        title: 'User signed up',
      },
    },
    operations: {
      publishUserSignedUp: {
        action: 'send' as const,
        channel: 'user/signedup',
        title: 'Publish user signed up event',
      },
    },
    components: {
      schemas: {},
    },
  }

  it('validates basic AsyncAPI 3.0 document', () => {
    const isValid = Value.Check(AsyncApiDocumentSchemaStrict, asyncApiDocument)
    expect(isValid).toBe(true)
  })

  it('identifies AsyncAPI documents correctly', () => {
    expect(isAsyncApiDocument(asyncApiDocument)).toBe(true)
  })

  it('does not identify OpenAPI documents as AsyncAPI', () => {
    const openApiDocument = {
      openapi: '3.0.0',
      info: {
        title: 'Test OpenAPI',
        version: '1.0.0',
      },
      paths: {},
    }
    expect(isAsyncApiDocument(openApiDocument)).toBe(false)
  })

  it('can store and retrieve AsyncAPI documents in workspace', async () => {
    const workspace = createWorkspaceStore()

    // Add AsyncAPI document to workspace
    await workspace.addDocument({
      name: 'asyncapi-test',
      document: asyncApiDocument,
    })

    // Verify document is stored and can be retrieved
    const storedDoc = workspace.workspace.documents['asyncapi-test']
    expect(storedDoc).toBeDefined()

    // Use type guard to access AsyncAPI-specific properties
    if (isAsyncApiDocument(storedDoc!)) {
      expect(storedDoc.asyncapi).toBe('3.0.0')
      expect(storedDoc.info.title).toBe('Test AsyncAPI')
      expect(storedDoc.channels).toBeDefined()
      expect(storedDoc.operations).toBeDefined()
    } else {
      throw new Error('Expected AsyncAPI document')
    }

    // Verify it's properly typed as WorkspaceDocument
    const workspaceDoc: WorkspaceDocument = storedDoc!
    expect(isAsyncApiDocument(workspaceDoc)).toBe(true)
  })

  it('can handle mixed OpenAPI and AsyncAPI documents in workspace', async () => {
    const workspace = createWorkspaceStore()

    const openApiDocument = {
      openapi: '3.0.0',
      info: {
        title: 'Test OpenAPI',
        version: '1.0.0',
      },
      paths: {},
    }

    // Add both document types
    await workspace.addDocument({
      name: 'openapi-test',
      document: openApiDocument,
    })

    await workspace.addDocument({
      name: 'asyncapi-test',
      document: asyncApiDocument,
    })

    // Verify both documents are stored correctly
    const openApiDoc = workspace.workspace.documents['openapi-test']
    const asyncApiDoc = workspace.workspace.documents['asyncapi-test']

    expect(openApiDoc).toBeDefined()
    expect(asyncApiDoc).toBeDefined()

    // Use type guards to access document-specific properties
    if (openApiDoc && !isAsyncApiDocument(openApiDoc)) {
      expect(openApiDoc.openapi).toBe('3.1.1') // OpenAPI documents are upgraded to 3.1.1
    } else {
      throw new Error('Expected OpenAPI document')
    }

    if (isAsyncApiDocument(asyncApiDoc!)) {
      expect(asyncApiDoc.asyncapi).toBe('3.0.0')
    } else {
      throw new Error('Expected AsyncAPI document')
    }

    // Verify type guards work correctly
    expect(isAsyncApiDocument(openApiDoc!)).toBe(false)
    expect(isAsyncApiDocument(asyncApiDoc!)).toBe(true)
  })
})
