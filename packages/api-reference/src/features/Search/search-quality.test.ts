import { describe, expect, it } from 'vitest'

import { traverseDocument } from '@/features/traverse-schema'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { apiReferenceConfigurationSchema } from '@scalar/types'
import { ref } from 'vue'
import { createFuseInstance } from './helpers/create-fuse-instance'
import { createSearchIndex } from './helpers/create-search-index'

function search(query: string, document: Partial<OpenAPIV3_1.Document>) {
  const { entries } = traverseDocument(document, {
    config: ref(apiReferenceConfigurationSchema.parse({ hideModels: false })),
    getHeadingId: () => '',
    getOperationId: () => '',
    getWebhookId: () => '',
    getModelId: () => '',
    getTagId: () => '',
    getSectionId: () => '',
  })

  const fuse = createFuseInstance()
  fuse.setCollection(createSearchIndex(entries))

  return fuse.search(query)
}

describe('search quality', () => {
  it('looks up operations by summary', () => {
    const query = 'Get a token'

    const document = {
      paths: {
        '/auth/token': {
          post: {
            tags: ['Authentication'],
            summary: 'Get a token',
            description: 'Yeah, this is the boring security stuff. Just get your super secret token and move on.',
            operationId: 'getToken',
          },
        },
      },
    }

    const result = search(query, document)

    expect(result[0]?.item?.title).toEqual('Get a token')
    expect(result.length).toEqual(1)
  })
})
