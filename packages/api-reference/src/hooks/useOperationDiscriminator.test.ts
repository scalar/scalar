import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { TransformedOperation } from '@scalar/types/legacy'
import { nextTick } from 'vue'

import { useOperationDiscriminator } from './useOperationDiscriminator'

// Mock Vue's provide function
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    provide: vi.fn(),
  }
})

describe('useOperationDiscriminator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createMockTransformedOperation = (schema?: OpenAPIV3_1.SchemaObject): TransformedOperation =>
    ({
      httpVerb: 'POST',
      path: '/planets',
      operationId: 'create-planet',
      name: 'Create Planet',
      description: 'Create a new planet',
      information: {
        requestBody: {
          content: {
            'application/json': {
              schema: schema,
            },
          },
        },
      },
    }) as unknown as TransformedOperation

  const baseSchema: OpenAPIV3_1.SchemaObject = {
    type: 'object',
    required: ['type', 'name'],
    properties: {
      type: { type: 'string' },
      name: { type: 'string' },
    },
    discriminator: {
      propertyName: 'type',
      mapping: {
        planet: '#/components/schemas/Planet',
        moon: '#/components/schemas/Moon',
      },
    },
  }

  const schemas = {
    Planet: {
      type: 'object',
      required: ['size', 'color'],
      properties: {
        size: { type: 'string' },
        color: { type: 'string' },
        rings: { type: 'boolean' },
      },
    },
    Moon: {
      type: 'object',
      required: ['size', 'phase'],
      properties: {
        size: { type: 'string' },
        phase: { type: 'string' },
        crater_count: { type: 'number' },
      },
    },
  }

  it('detects discriminator in object schema', () => {
    const transformedOperation = createMockTransformedOperation(baseSchema)
    const { hasSchemaDiscriminator } = useOperationDiscriminator(transformedOperation, schemas)

    expect(hasSchemaDiscriminator.value).toBe(true)
  })

  it('detects discriminator in array items', () => {
    const arraySchema: OpenAPIV3_1.SchemaObject = {
      type: 'array',
      items: baseSchema,
    }
    const transformedOperation = createMockTransformedOperation(arraySchema)
    const { hasSchemaDiscriminator } = useOperationDiscriminator(transformedOperation, schemas)

    expect(hasSchemaDiscriminator.value).toBe(true)
  })

  it('returns false when no discriminator present', () => {
    const schemaWithoutDiscriminator: OpenAPIV3_1.SchemaObject = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
      },
    }
    const transformedOperation = createMockTransformedOperation(schemaWithoutDiscriminator)
    const { hasSchemaDiscriminator } = useOperationDiscriminator(transformedOperation, schemas)

    expect(hasSchemaDiscriminator.value).toBe(false)
  })

  describe('context provision with discriminators', () => {
    it('initializes without throwing when discriminators are present', () => {
      const transformedOperation = createMockTransformedOperation(baseSchema)

      expect(() => useOperationDiscriminator(transformedOperation, schemas)).not.toThrow()
    })

    it('initializes without throwing when no discriminators present', () => {
      const schemaWithoutDiscriminator: OpenAPIV3_1.SchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
        },
      }
      const transformedOperation = createMockTransformedOperation(schemaWithoutDiscriminator)

      expect(() => useOperationDiscriminator(transformedOperation, schemas)).not.toThrow()
    })
  })

  it('handles discriminator changes when discriminators are present', async () => {
    const transformedOperation = createMockTransformedOperation(baseSchema)
    const { handleDiscriminatorChange } = useOperationDiscriminator(transformedOperation, schemas)

    expect(() => handleDiscriminatorChange('planet')).not.toThrow()
    expect(() => handleDiscriminatorChange('moon')).not.toThrow()
  })

  it('ignores discriminator changes when no discriminators present', () => {
    const schemaWithoutDiscriminator: OpenAPIV3_1.SchemaObject = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
      },
    }
    const transformedOperation = createMockTransformedOperation(schemaWithoutDiscriminator)
    const { handleDiscriminatorChange } = useOperationDiscriminator(transformedOperation, schemas)

    expect(() => handleDiscriminatorChange('any-type')).not.toThrow()
  })

  it('handles empty type string gracefully', () => {
    const transformedOperation = createMockTransformedOperation(baseSchema)
    const { handleDiscriminatorChange } = useOperationDiscriminator(transformedOperation, schemas)

    expect(() => handleDiscriminatorChange('')).not.toThrow()
  })

  it('updates transformed operation schema when discriminator changes', async () => {
    const transformedOperation = createMockTransformedOperation(baseSchema)
    const { handleDiscriminatorChange } = useOperationDiscriminator(transformedOperation, schemas)

    expect(transformedOperation.information?.requestBody?.content?.['application/json']?.schema).toBe(baseSchema)

    handleDiscriminatorChange('planet')
    await nextTick()

    expect(transformedOperation.information?.requestBody?.content?.['application/json']?.schema).toBeDefined()
  })

  it('handles missing request body gracefully during schema updates', () => {
    const transformedOperationWithoutBody = {
      httpVerb: 'GET',
      path: '/planets',
      operationId: 'create-planet',
      name: 'Create Planet',
      information: {},
    } as unknown as TransformedOperation

    const { handleDiscriminatorChange } = useOperationDiscriminator(transformedOperationWithoutBody, schemas)

    expect(() => handleDiscriminatorChange('planet')).not.toThrow()
  })

  it('returns expected properties', () => {
    const transformedOperation = createMockTransformedOperation(baseSchema)
    const result = useOperationDiscriminator(transformedOperation, schemas)

    expect(result).toHaveProperty('hasSchemaDiscriminator')
    expect(result).toHaveProperty('handleDiscriminatorChange')
    expect(typeof result.handleDiscriminatorChange).toBe('function')
    expect(result.hasSchemaDiscriminator.value).toBe(true)
  })

  it('returns consistent values across multiple calls', () => {
    const transformedOperation = createMockTransformedOperation(baseSchema)
    const result1 = useOperationDiscriminator(transformedOperation, schemas)
    const result2 = useOperationDiscriminator(transformedOperation, schemas)

    expect(result1.hasSchemaDiscriminator.value).toBe(result2.hasSchemaDiscriminator.value)
  })

  it('handles nested object with discriminator in array items', () => {
    const complexSchema: OpenAPIV3_1.SchemaObject = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: baseSchema,
        },
      },
    }
    const transformedOperation = createMockTransformedOperation(complexSchema)
    const { hasSchemaDiscriminator } = useOperationDiscriminator(transformedOperation, schemas)

    expect(hasSchemaDiscriminator.value).toBe(false)
  })

  it('handles array with non-object items', () => {
    const arrayWithPrimitives: OpenAPIV3_1.SchemaObject = {
      type: 'array',
      items: {
        type: 'string',
      },
    }
    const transformedOperation = createMockTransformedOperation(arrayWithPrimitives)
    const { hasSchemaDiscriminator } = useOperationDiscriminator(transformedOperation, schemas)

    expect(hasSchemaDiscriminator.value).toBe(false)
  })
})
