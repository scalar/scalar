import { describe, expect, it } from 'vitest'

import type { TagsMap } from '@/navigation/types'
import type { OpenApiDocument } from '@/schemas/v3.1/strict/openapi-document'

import { traverseWebhooks } from './traverse-webhooks'

describe('traverse-webhooks', () => {
  // const mockGetWebhookId: DocumentConfiguration['x-scalar-reference-config'] = (params, tag) => {
  //   if (!params) {
  //     return 'untagged-unknown-unknown'
  //   }
  //   return `${tag?.name || 'untagged'}-${params.method || 'unknown'}-${params.name}`
  // }

  // const options = getNavigationOptions(
  //   'document-1',
  //   { title: 'Test API', version: '1.0.0' },
  //   {
  //     'x-scalar-reference-config': {
  //       generateWebhookSlug: mockGetWebhookId,
  //     },
  //   },
  // )

  describe('traverseWebhooks', () => {
    it('should handle empty webhooks', () => {
      const document: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {},
      }

      const tagsMap: TagsMap = new Map()

      const result = traverseWebhooks({
        document,
        tagsMap,
        untaggedWebhooksParentId: 'document-id',
        documentId: 'document-id',
        generateId: (options) => {
          if (options.type === 'webhook') {
            return `${options.parentTag?.tag.name ?? 'untagged'}-${options.method || 'unknown'}-${options.name}`
          }
          return 'unknown-id'
        },
      })

      expect(result).toEqual([])
      expect(tagsMap.size).toBe(0)
    })

    it('should process webhooks with tags', () => {
      const document: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {},
        webhooks: {
          'test-webhook': {
            post: {
              summary: 'Test Webhook',
              tags: ['webhook-tag'],
              operationId: 'testWebhook',
            },
          },
        },
      }

      const tagsMap: TagsMap = new Map()

      const result = traverseWebhooks({
        document,
        tagsMap,
        generateId: (options) => {
          if (options.type === 'webhook') {
            return `${options.parentTag?.tag.name ?? 'untagged'}-${options.method || 'unknown'}-${options.name}`
          }
          return 'unknown-id'
        },
        documentId: 'document-id',
        untaggedWebhooksParentId: 'document-id',
      })

      expect(result).toEqual([]) // Should be empty as webhook has a tag
      expect(tagsMap.get('webhook-tag')?.entries).toHaveLength(1)
      expect(tagsMap.get('webhook-tag')?.entries[0]).toEqual({
        type: 'webhook',
        ref: '#/webhooks/test-webhook/post',
        isDeprecated: false,
        id: 'webhook-tag-post-test-webhook',
        title: 'Test Webhook',
        name: 'test-webhook',
        method: 'post',
      })
    })

    it('should process untagged webhooks', () => {
      const document: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {},
        webhooks: {
          'untagged-webhook': {
            post: {
              summary: 'Untagged Webhook',
              operationId: 'untaggedWebhook',
            },
          },
        },
      }

      const tagsMap: TagsMap = new Map()

      const result = traverseWebhooks({
        document,
        tagsMap,
        generateId: (options) => {
          if (options.type === 'webhook') {
            return `${options.parentTag?.tag.name ?? 'untagged'}-${options.method || 'unknown'}-${options.name}`
          }
          return 'unknown-id'
        },
        documentId: 'document-id',
        untaggedWebhooksParentId: 'document-id',
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 'untagged-post-untagged-webhook',
        title: 'Untagged Webhook',
        isDeprecated: false,
        name: 'untagged-webhook',
        method: 'post',
        type: 'webhook',
        ref: '#/webhooks/untagged-webhook/post',
      })
    })

    it('should skip internal webhooks', () => {
      const document: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {},
        webhooks: {
          'internal-webhook': {
            post: {
              summary: 'Internal Webhook',
              'x-internal': true,
              operationId: 'internalWebhook',
            },
          },
        },
      }

      const tagsMap: TagsMap = new Map()

      const result = traverseWebhooks({
        document,
        tagsMap,
        generateId: (options) => {
          if (options.type === 'webhook') {
            return `${options.parentTag?.tag.name ?? 'untagged'}-${options.method || 'unknown'}-${options.name}`
          }
          return 'unknown-id'
        },
        documentId: 'document-id',
        untaggedWebhooksParentId: 'document-id',
      })

      expect(result).toEqual([])
      expect(tagsMap.size).toBe(0)
    })

    it('should skip scalar-ignore webhooks', () => {
      const document: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {},
        webhooks: {
          'ignored-webhook': {
            post: {
              summary: 'Ignored Webhook',
              'x-scalar-ignore': true,
              operationId: 'ignoredWebhook',
            },
          },
        },
      }

      const tagsMap: TagsMap = new Map()

      const result = traverseWebhooks({
        document,
        tagsMap,
        generateId: (options) => {
          if (options.type === 'webhook') {
            return `${options.parentTag?.tag.name ?? 'untagged'}-${options.method || 'unknown'}-${options.name}`
          }
          return 'unknown-id'
        },
        documentId: 'document-id',
        untaggedWebhooksParentId: 'document-id',
      })

      expect(result).toEqual([])
      expect(tagsMap.size).toBe(0)
    })

    it('should handle deprecated webhooks', () => {
      const document: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {},
        webhooks: {
          'deprecated-webhook': {
            post: {
              summary: 'Deprecated Webhook',
              deprecated: true,
              operationId: 'deprecatedWebhook',
            },
          },
        },
      }

      const tagsMap: TagsMap = new Map()

      const result = traverseWebhooks({
        document,
        tagsMap,
        generateId: (options) => {
          if (options.type === 'webhook') {
            return `${options.parentTag?.tag.name ?? 'untagged'}-${options.method || 'unknown'}-${options.name}`
          }
          return 'unknown-id'
        },
        documentId: 'document-id',
        untaggedWebhooksParentId: 'document-id',
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        type: 'webhook',
        ref: '#/webhooks/deprecated-webhook/post',
        id: 'untagged-post-deprecated-webhook',
        isDeprecated: true,
        title: 'Deprecated Webhook',
        name: 'deprecated-webhook',
        method: 'post',
      })
    })

    it('should handle webhooks with multiple methods', () => {
      const document: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {},
        webhooks: {
          'multi-method-webhook': {
            post: {
              summary: 'POST Webhook',
              operationId: 'postWebhook',
            },
            get: {
              summary: 'GET Webhook',
              operationId: 'getWebhook',
            },
          },
        },
      }

      const tagsMap: TagsMap = new Map()

      const result = traverseWebhooks({
        document,
        tagsMap,
        generateId: (options) => {
          if (options.type === 'webhook') {
            return `${options.parentTag?.tag.name ?? 'untagged'}-${options.method || 'unknown'}-${options.name}`
          }
          return 'unknown-id'
        },
        documentId: 'document-id',
        untaggedWebhooksParentId: 'document-id',
      })

      expect(result).toHaveLength(2)
      expect(result).toEqual(
        expect.arrayContaining([
          {
            type: 'webhook',
            ref: '#/webhooks/multi-method-webhook/post',
            isDeprecated: false,
            id: 'untagged-post-multi-method-webhook',
            title: 'POST Webhook',
            name: 'multi-method-webhook',
            method: 'post',
          },
          {
            type: 'webhook',
            ref: '#/webhooks/multi-method-webhook/get',
            isDeprecated: false,
            id: 'untagged-get-multi-method-webhook',
            title: 'GET Webhook',
            name: 'multi-method-webhook',
            method: 'get',
          },
        ]),
      )
    })
  })
})
