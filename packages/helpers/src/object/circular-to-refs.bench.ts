import { bench, describe, expect } from 'vitest'

import { breakCircularReferences, circularToRefs } from './circular-to-refs'

/**
 * Creates a test document with the specified number of circular schemas.
 * Each schema has a self-referencing children array.
 */
const createDocumentWithCircularSchemas = (count: number): Record<string, unknown> => {
  const paths: Record<string, unknown> = {}

  for (let i = 0; i < count; i++) {
    const schema: Record<string, unknown> = {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        children: {
          type: 'array',
          items: {},
        },
      },
    }

    // Create self-referencing circular reference
    ;(schema.properties as Record<string, unknown>).children = {
      type: 'array',
      items: schema,
    }

    paths[`/resource-${i}`] = {
      get: {
        responses: {
          '200': {
            content: {
              'application/json': { schema },
            },
          },
        },
      },
    }
  }

  return {
    openapi: '3.1.0',
    info: { title: 'Benchmark API', version: '1.0.0' },
    paths,
  }
}

/**
 * Creates a deeply nested document with a circular reference at the specified depth.
 */
const createDeeplyNestedCircular = (depth: number): Record<string, unknown> => {
  const buildNested = (level: number, root: Record<string, unknown>): Record<string, unknown> => {
    if (level === 0) {
      return { backToRoot: root }
    }
    return {
      type: 'object',
      properties: {
        [`level${level}`]: buildNested(level - 1, root),
      },
    }
  }

  const schema: Record<string, unknown> = {
    type: 'object',
    properties: {},
  }

  // Build nested structure pointing back to root
  ;(schema.properties as Record<string, unknown>).nested = buildNested(depth, schema)

  return {
    openapi: '3.1.0',
    info: { title: 'Deep Nesting Benchmark', version: '1.0.0' },
    paths: {
      '/deep': {
        get: {
          responses: {
            '200': {
              content: {
                'application/json': { schema },
              },
            },
          },
        },
      },
    },
  }
}

/**
 * Creates a document without any circular references for baseline comparison.
 */
const createNonCircularDocument = (schemaCount: number): Record<string, unknown> => {
  const paths: Record<string, unknown> = {}

  for (let i = 0; i < schemaCount; i++) {
    paths[`/resource-${i}`] = {
      get: {
        summary: `Get resource ${i}`,
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                    tags: {
                      type: 'array',
                      items: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }
  }

  return {
    openapi: '3.1.0',
    info: { title: 'Non-Circular Benchmark', version: '1.0.0' },
    paths,
  }
}

describe('circularToRefs', () => {
  describe('non-circular documents (baseline)', () => {
    const smallDoc = createNonCircularDocument(10)
    const mediumDoc = createNonCircularDocument(50)
    const largeDoc = createNonCircularDocument(100)

    describe('small document (10 schemas)', () => {
      bench('circularToRefs', () => {
        const result = circularToRefs(smallDoc)
        expect(result.openapi).toBe('3.1.0')
      })

      bench('breakCircularReferences', () => {
        const result = breakCircularReferences(smallDoc)
        expect(result.openapi).toBe('3.1.0')
      })
    })

    describe('medium document (50 schemas)', () => {
      bench('circularToRefs', () => {
        const result = circularToRefs(mediumDoc)
        expect(result.openapi).toBe('3.1.0')
      })

      bench('breakCircularReferences', () => {
        const result = breakCircularReferences(mediumDoc)
        expect(result.openapi).toBe('3.1.0')
      })
    })

    describe('large document (100 schemas)', () => {
      bench('circularToRefs', () => {
        const result = circularToRefs(largeDoc)
        expect(result.openapi).toBe('3.1.0')
      })

      bench('breakCircularReferences', () => {
        const result = breakCircularReferences(largeDoc)
        expect(result.openapi).toBe('3.1.0')
      })
    })
  })

  describe('circular references', () => {
    const singleCircular = createDocumentWithCircularSchemas(1)
    const tenCircular = createDocumentWithCircularSchemas(10)
    const fiftyCircular = createDocumentWithCircularSchemas(50)

    describe('single circular schema', () => {
      bench('circularToRefs', () => {
        const result = circularToRefs(singleCircular)
        expect(result.components).toBeDefined()
      })

      bench('breakCircularReferences', () => {
        const result = breakCircularReferences(singleCircular)
        expect(result.components).toBeDefined()
      })
    })

    describe('10 circular schemas', () => {
      bench('circularToRefs', () => {
        const result = circularToRefs(tenCircular)
        expect(result.components).toBeDefined()
      })

      bench('breakCircularReferences', () => {
        const result = breakCircularReferences(tenCircular)
        expect(result.components).toBeDefined()
      })
    })

    describe('50 circular schemas', () => {
      bench('circularToRefs', () => {
        const result = circularToRefs(fiftyCircular)
        expect(result.components).toBeDefined()
      })

      bench('breakCircularReferences', () => {
        const result = breakCircularReferences(fiftyCircular)
        expect(result.components).toBeDefined()
      })
    })
  })

  describe('deeply nested circular references', () => {
    const depth10 = createDeeplyNestedCircular(10)
    const depth50 = createDeeplyNestedCircular(50)
    const depth100 = createDeeplyNestedCircular(100)

    describe('depth 10', () => {
      bench('circularToRefs', () => {
        const result = circularToRefs(depth10)
        expect(result.components).toBeDefined()
      })

      bench('breakCircularReferences', () => {
        const result = breakCircularReferences(depth10)
        expect(result.components).toBeDefined()
      })
    })

    describe('depth 50', () => {
      bench('circularToRefs', () => {
        const result = circularToRefs(depth50)
        expect(result.components).toBeDefined()
      })

      bench('breakCircularReferences', () => {
        const result = breakCircularReferences(depth50)
        expect(result.components).toBeDefined()
      })
    })

    describe('depth 100', () => {
      bench('circularToRefs', () => {
        const result = circularToRefs(depth100)
        expect(result.components).toBeDefined()
      })

      bench('breakCircularReferences', () => {
        const result = breakCircularReferences(depth100)
        expect(result.components).toBeDefined()
      })
    })
  })

  describe('with extra props', () => {
    const doc = createDocumentWithCircularSchemas(10)

    describe('without extra props', () => {
      bench('circularToRefs', () => {
        const result = circularToRefs(doc)
        expect(result.components).toBeDefined()
      })

      bench('breakCircularReferences', () => {
        const result = breakCircularReferences(doc)
        expect(result.components).toBeDefined()
      })
    })

    describe('with extra props', () => {
      bench('circularToRefs', () => {
        const result = circularToRefs(doc, { '$ref-value': {} })
        expect(result.components).toBeDefined()
      })

      bench('breakCircularReferences', () => {
        const result = breakCircularReferences(doc)
        expect(result.components).toBeDefined()
      })
    })
  })
})
