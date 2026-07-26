import { describe, expect, it } from 'vitest'

import {
  getDocumentType,
  getDocumentTypeLabel,
  isArazzoDocument,
  isAsyncApiDocument,
  isOpenApiDocument,
} from './type-guards'
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

  const arazzoDocument = {
    arazzo: '1.1.0',
    info: { title: 'A pet purchasing workflow', version: '1.0.1' },
    sourceDescriptions: [],
    workflows: [],
  } as unknown as WorkspaceDocument

  describe('isOpenApiDocument', () => {
    it('returns true for an OpenAPI document', () => {
      expect(isOpenApiDocument(openApiDocument)).toBe(true)
    })

    it('returns false for an AsyncAPI document', () => {
      expect(isOpenApiDocument(asyncApiDocument)).toBe(false)
    })

    it('returns false for an Arazzo document', () => {
      expect(isOpenApiDocument(arazzoDocument)).toBe(false)
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

  describe('getDocumentType', () => {
    it('returns "openapi" for an OpenAPI document', () => {
      expect(getDocumentType(openApiDocument)).toBe('openapi')
    })

    it('returns "asyncapi" for an AsyncAPI document', () => {
      expect(getDocumentType(asyncApiDocument)).toBe('asyncapi')
    })

    it('returns "arazzo" for an Arazzo document', () => {
      expect(getDocumentType(arazzoDocument)).toBe('arazzo')
    })

    it('returns undefined when the value matches neither shape', () => {
      expect(getDocumentType({ info: { title: 'No version' } })).toBeUndefined()
      expect(getDocumentType(undefined)).toBeUndefined()
      expect(getDocumentType(null)).toBeUndefined()
    })
  })

  describe('getDocumentTypeLabel', () => {
    it('returns "AsyncAPI" for "asyncapi"', () => {
      expect(getDocumentTypeLabel('asyncapi')).toBe('AsyncAPI')
    })

    it('returns "Arazzo" for "arazzo"', () => {
      expect(getDocumentTypeLabel('arazzo')).toBe('Arazzo')
    })

    it('defaults to "OpenAPI" for "openapi" and undefined', () => {
      expect(getDocumentTypeLabel('openapi')).toBe('OpenAPI')
      expect(getDocumentTypeLabel(undefined)).toBe('OpenAPI')
    })
  })

  describe('isAsyncApiDocument', () => {
    it('returns true for an AsyncAPI document', () => {
      expect(isAsyncApiDocument(asyncApiDocument)).toBe(true)
    })

    it('returns false for an OpenAPI document', () => {
      expect(isAsyncApiDocument(openApiDocument)).toBe(false)
    })

    it('returns false for an Arazzo document', () => {
      expect(isAsyncApiDocument(arazzoDocument)).toBe(false)
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

  describe('isArazzoDocument', () => {
    it('returns true for an Arazzo document', () => {
      expect(isArazzoDocument(arazzoDocument)).toBe(true)
    })

    it('returns false for an OpenAPI document', () => {
      expect(isArazzoDocument(openApiDocument)).toBe(false)
    })

    it('returns false for an AsyncAPI document', () => {
      expect(isArazzoDocument(asyncApiDocument)).toBe(false)
    })

    it('returns false for undefined and null', () => {
      expect(isArazzoDocument(undefined)).toBe(false)
      expect(isArazzoDocument(null)).toBe(false)
    })

    it('narrows the type when used as a guard', () => {
      const document: WorkspaceDocument = arazzoDocument

      if (isArazzoDocument(document)) {
        // Should compile: `arazzo` field is accessible after narrowing.
        const version: string = document.arazzo
        expect(version).toBe('1.1.0')
      }
    })
  })
})
