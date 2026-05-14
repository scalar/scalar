import galaxy from '@scalar/galaxy/3.1.json'
import { createNavigation } from '@scalar/workspace-store/navigation'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { bench, describe } from 'vitest'

import { createFuseInstance } from './helpers/create-fuse-instance'
import { createSearchIndex } from './helpers/create-search-index'

/**
 * Attaches the scalar navigation tree to a document in-place so that
 * createSearchIndex can traverse it.
 */
function withNavigation(doc: OpenApiDocument): OpenApiDocument {
  doc['x-scalar-navigation'] = createNavigation('bench', doc, { hideModels: false })
  return doc
}

/**
 * Generates a synthetic OpenAPI document with `operationCount` operations spread
 * across multiple tags. Used to stress-test the search pipeline at a realistic
 * large-API scale without needing a real fixture file.
 */
function buildLargeSpec(operationCount: number): OpenApiDocument {
  const paths: Record<string, Record<string, unknown>> = {}
  const schemas: Record<string, unknown> = {}
  const tags: { name: string; description: string }[] = []

  const tagCount = Math.ceil(operationCount / 5)

  for (let t = 0; t < tagCount; t++) {
    tags.push({ name: `Service${t}`, description: `Operations for Service${t}` })
  }

  const methods: string[] = ['get', 'post', 'put', 'delete', 'patch']
  let count = 0

  for (let t = 0; t < tagCount && count < operationCount; t++) {
    const tagName = `Service${t}`

    for (let m = 0; m < methods.length && count < operationCount; m++) {
      const method = methods[m] as string
      const path = `/service${t}/${method === 'get' ? 'list' : method === 'post' ? 'create' : `item-${m}`}`
      const hasBody = method !== 'get' && method !== 'delete'

      paths[path] = {
        ...paths[path],
        [method]: {
          operationId: `${tagName}_${method}_${count}`,
          summary: `${method.toUpperCase()} ${tagName} operation ${count}`,
          description: `Performs ${method} on ${tagName}. Operation number ${count} in the benchmark suite.`,
          tags: [tagName],
          parameters: [
            {
              in: 'query',
              name: `param${count}`,
              description: `Query parameter for operation ${count}`,
              schema: { type: 'string' },
            },
            {
              in: 'header',
              name: 'X-Request-ID',
              description: 'Unique request identifier',
              schema: { type: 'string' },
            },
          ],
          ...(hasBody && {
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      [`field${count}A`]: { type: 'string', description: `First field for operation ${count}` },
                      [`field${count}B`]: { type: 'number', description: `Second field for operation ${count}` },
                    },
                  },
                },
              },
            },
          }),
          responses: {
            200: {
              description: 'Success',
              content: { 'application/json': { example: { id: count, status: 'ok', service: tagName } } },
            },
            400: { description: 'Bad request' },
          },
        },
      }

      count++
    }

    schemas[`${tagName}Model`] = {
      type: 'object',
      title: `${tagName}Model`,
      description: `Data model for ${tagName}`,
      properties: {
        id: { type: 'string' },
        name: { type: 'string', description: 'Display name' },
        createdAt: { type: 'string', format: 'date-time' },
        serviceTag: { type: 'string', description: `Identifies the ${tagName}` },
      },
    }
  }

  return {
    openapi: '3.1.0',
    info: {
      title: 'Large Benchmark API',
      version: '1.0.0',
      description: '# Introduction\nA large synthetic API used for benchmarking the search pipeline.',
    },
    tags,
    paths,
    components: { schemas },
  } as unknown as OpenApiDocument
}

const galaxyDoc = withNavigation(galaxy as unknown as OpenApiDocument)
const largeDoc = withNavigation(buildLargeSpec(100))

const galaxyIndex = createSearchIndex(galaxyDoc)
const largeIndex = createSearchIndex(largeDoc)

const galaxyFuse = createFuseInstance()
galaxyFuse.setCollection(galaxyIndex)

const largeFuse = createFuseInstance()
largeFuse.setCollection(largeIndex)

describe('search index build', () => {
  bench('galaxy spec', () => {
    createSearchIndex(galaxyDoc)
  })

  bench('large spec (~100 operations)', () => {
    createSearchIndex(largeDoc)
  })
})

describe('search queries – galaxy spec', () => {
  bench('short term ("user")', () => {
    galaxyFuse.search('user')
  })

  bench('multi-word phrase ("create user account")', () => {
    galaxyFuse.search('create user account')
  })

  bench('path segment ("/planets")', () => {
    galaxyFuse.search('/planets')
  })

  bench('no match (term absent from index)', () => {
    galaxyFuse.search('zzz_nonexistent_xyz_abc')
  })
})

describe('search queries – large spec (~100 operations)', () => {
  bench('short term ("service")', () => {
    largeFuse.search('service')
  })

  bench('multi-word phrase ("create service operation")', () => {
    largeFuse.search('create service operation')
  })

  bench('no match (term absent from index)', () => {
    largeFuse.search('zzz_nonexistent_xyz_abc')
  })
})
