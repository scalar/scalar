import { describe, expect, it } from 'vitest'

import { type TraversedEntry, traverseDocument } from '@/features/traverse-schema'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { apiReferenceConfigurationSchema } from '@scalar/types'
import { ref } from 'vue'
import { createSearchIndex } from './create-search-index'

function createEntriesFromDocument(document: Partial<OpenAPIV3_1.Document>): TraversedEntry[] {
  const { entries } = traverseDocument(document, {
    config: ref(apiReferenceConfigurationSchema.parse({ hideModels: false })),
    getHeadingId: () => '',
    getOperationId: () => '',
    getWebhookId: () => '',
    getModelId: () => '',
    getTagId: () => '',
    getSectionId: () => '',
  })

  return entries
}

describe('createSearchIndex', () => {
  describe('operations', () => {
    it('adds a single operation', () => {
      const entries: TraversedEntry[] = createEntriesFromDocument({
        paths: {
          '/users': {
            get: {
              summary: 'Get Users',
            },
          },
        },
      })

      const index = createSearchIndex(entries)

      expect(index.length).toEqual(1)

      expect(index).toMatchObject([
        {
          title: 'Get Users',
        },
      ])
    })
  })

  describe('schemas', () => {
    it('adds a single schema', () => {
      const entries: TraversedEntry[] = createEntriesFromDocument({
        components: {
          schemas: {
            User: {
              type: 'object',
              title: 'User Model',
              description: 'A user object',
            },
          },
        },
      })

      const index = createSearchIndex(entries)

      expect(index).toMatchObject([
        {
          title: 'User Model',
        },
      ])
      expect(index.length).toEqual(1)
    })
  })

  describe('webhooks', () => {
    it('adds a single webhook', () => {
      const entries: TraversedEntry[] = createEntriesFromDocument({
        webhooks: {
          userCreated: {
            post: {
              summary: 'User Created Webhook',
            },
          },
        },
      })

      const index = createSearchIndex(entries)

      expect(index).toMatchObject([
        {
          title: 'User Created Webhook',
        },
      ])
      expect(index.length).toEqual(1)
    })
  })

  describe('document info', () => {
    it('adds headings from the description', () => {
      const entries: TraversedEntry[] = createEntriesFromDocument({
        info: {
          description: '# API Documentation\nThis is the API documentation.',
        },
      })

      const index = createSearchIndex(entries)

      expect(index).toMatchObject([
        {
          title: 'Introduction',
          description: 'API Documentation',
        },
      ])
      expect(index.length).toEqual(1)
    })
  })
})
