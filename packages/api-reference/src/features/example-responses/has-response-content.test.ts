import { describe, expect, it } from 'vitest'

import { hasResponseContent } from './has-response-content'

describe('has-response-content', () => {
  describe('hasResponseContent', () => {
    it('returns false for undefined', () => {
      expect(hasResponseContent(undefined)).toBe(false)
    })

    it('returns false for empty response', () => {
      expect(hasResponseContent({ description: 'Empty response' })).toBe(false)
    })

    it('returns false for response with empty content', () => {
      expect(
        hasResponseContent({
          description: 'Response with empty content',
          content: {},
        }),
      ).toBe(false)
    })

    it('returns true for application/json with schema', () => {
      expect(
        hasResponseContent({
          description: 'JSON response',
          content: {
            'application/json': {
              schema: { type: 'object' },
            },
          },
        }),
      ).toBe(true)
    })

    it('returns true for application/json with example', () => {
      expect(
        hasResponseContent({
          description: 'JSON response',
          content: {
            'application/json': {
              example: { message: 'Hello' },
            },
          },
        }),
      ).toBe(true)
    })

    it('returns true for application/json with examples', () => {
      expect(
        hasResponseContent({
          description: 'JSON response',
          content: {
            'application/json': {
              examples: {
                example1: { value: { message: 'Hello' } },
              },
            },
          },
        }),
      ).toBe(true)
    })

    it('returns true for application/xml with schema', () => {
      expect(
        hasResponseContent({
          description: 'XML response',
          content: {
            'application/xml': {
              schema: { type: 'string' },
            },
          },
        }),
      ).toBe(true)
    })

    it('returns true for text/plain with example', () => {
      expect(
        hasResponseContent({
          description: 'Plain text response',
          content: {
            'text/plain': {
              example: 'Hello world',
            },
          },
        }),
      ).toBe(true)
    })

    it('returns true for text/html with schema', () => {
      expect(
        hasResponseContent({
          description: 'HTML response',
          content: {
            'text/html': {
              schema: { type: 'string' },
            },
          },
        }),
      ).toBe(true)
    })

    it('returns true for wildcard mimetype with examples', () => {
      expect(
        hasResponseContent({
          description: 'Wildcard response',
          content: {
            '*/*': {
              examples: {
                example1: { value: 'anything' },
              },
            },
          },
        }),
      ).toBe(true)
    })

    it('returns true for custom mimetype with schema', () => {
      expect(
        hasResponseContent({
          description: 'Custom mimetype response',
          content: {
            'application/vnd.api+json': {
              schema: { type: 'object' },
            },
          },
        }),
      ).toBe(true)
    })

    it('prioritizes application/json over other mimetypes', () => {
      expect(
        hasResponseContent({
          description: 'Multiple mimetypes',
          content: {
            'application/json': {
              schema: { type: 'object' },
            },
            'application/xml': {},
          },
        }),
      ).toBe(true)
    })

    it('falls back to first available mimetype when preferred ones have no content', () => {
      expect(
        hasResponseContent({
          description: 'Custom mimetype only',
          content: {
            'application/custom': {
              example: { custom: true },
            },
          },
        }),
      ).toBe(true)
    })

    it('returns false when content exists but has no schema, example, or examples', () => {
      expect(
        hasResponseContent({
          description: 'Response with encoding only',
          content: {
            'application/json': {
              encoding: { field: { contentType: 'text/plain' } },
            },
          },
        }),
      ).toBe(false)
    })

    it('handles null example value as no content', () => {
      expect(
        hasResponseContent({
          description: 'Null example',
          content: {
            'application/json': {
              example: null,
            },
          },
        }),
      ).toBe(false)
    })

    it('returns true for example with falsy value 0', () => {
      expect(
        hasResponseContent({
          description: 'Zero count response',
          content: {
            'application/json': {
              example: 0,
            },
          },
        }),
      ).toBe(true)
    })

    it('returns true for example with falsy value false', () => {
      expect(
        hasResponseContent({
          description: 'Boolean false response',
          content: {
            'application/json': {
              example: false,
            },
          },
        }),
      ).toBe(true)
    })

    it('returns true for example with falsy value empty string', () => {
      expect(
        hasResponseContent({
          description: 'Empty string response',
          content: {
            'application/json': {
              example: '',
            },
          },
        }),
      ).toBe(true)
    })
  })
})
