import { describe, expect, it } from 'vitest'

import { isAsyncApiDocument, isOpenApiDocument } from './type-guards'
import type { WorkspaceDocument } from './workspace'

describe('type-guards', () => {
  const openApiDocument = {
    openapi: '3.1.0',
    info: { title: 'Pet Store', version: '1.0.0' },
  } as unknown as WorkspaceDocument

  const asyncApiDocument = {
    asyncapi: '3.0.0',
    info: { title: 'Streetlights', version: '1.0.0' },
  } as unknown as WorkspaceDocument

  describe('isOpenApiDocument', () => {
    it('returns true for an OpenAPI document', () => {
      expect(isOpenApiDocument(openApiDocument)).toBe(true)
    })

    it('returns false for an AsyncAPI document', () => {
      expect(isOpenApiDocument(asyncApiDocument)).toBe(false)
    })

    it('returns false for undefined and null', () => {
      expect(isOpenApiDocument(undefined)).toBe(false)
      expect(isOpenApiDocument(null)).toBe(false)
    })

    it('narrows the type when used as a guard', () => {
      const document: WorkspaceDocument = openApiDocument

      if (isOpenApiDocument(document)) {
        // Should compile: `openapi` field is accessible after narrowing.
        const version: string = document.openapi
        expect(version).toBe('3.1.0')
      }
    })
  })

  describe('isAsyncApiDocument', () => {
    it('returns true for an AsyncAPI document', () => {
      expect(isAsyncApiDocument(asyncApiDocument)).toBe(true)
    })

    it('returns false for an OpenAPI document', () => {
      expect(isAsyncApiDocument(openApiDocument)).toBe(false)
    })

    it('returns false for undefined and null', () => {
      expect(isAsyncApiDocument(undefined)).toBe(false)
      expect(isAsyncApiDocument(null)).toBe(false)
    })

    it('narrows the type when used as a guard', () => {
      const document: WorkspaceDocument = asyncApiDocument

      if (isAsyncApiDocument(document)) {
        // Should compile: `asyncapi` field is accessible after narrowing.
        const version: string = document.asyncapi
        expect(version).toBe('3.0.0')
      }
    })
  })
})
