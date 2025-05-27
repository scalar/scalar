import { describe, expect, it, vi } from 'vitest'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { nextTick } from 'vue'

import { useDiscriminator } from './useDiscriminator'

describe('useDiscriminator', () => {
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
        rocky: '#/components/schemas/RockyPlanet',
        gas: '#/components/schemas/GasGiant',
      },
    },
  }

  const schemas = {
    RockyPlanet: {
      type: 'object',
      required: ['surfaceGravity', 'atmosphere'],
      properties: {
        surfaceGravity: { type: 'number' },
        atmosphere: { type: 'boolean' },
        moons: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
    GasGiant: {
      type: 'object',
      required: ['radius', 'rings'],
      properties: {
        radius: { type: 'number' },
        rings: { type: 'boolean' },
        composition: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  }

  it('initializes with first mapping type as default', () => {
    const { selectedType } = useDiscriminator({ schema: baseSchema, schemas })
    expect(selectedType.value).toBe('rocky')
  })

  it('provides discriminator mapping from schema', () => {
    const { discriminatorMapping } = useDiscriminator({ schema: baseSchema, schemas })
    expect(discriminatorMapping.value).toEqual({
      rocky: '#/components/schemas/RockyPlanet',
      gas: '#/components/schemas/GasGiant',
    })
  })

  it('provides discriminator property name from schema', () => {
    const { discriminatorPropertyName } = useDiscriminator({ schema: baseSchema, schemas })
    expect(discriminatorPropertyName.value).toBe('type')
  })

  it('detects if schema has discriminator', () => {
    const { hasDiscriminator } = useDiscriminator({ schema: baseSchema, schemas })
    expect(hasDiscriminator.value).toBe(true)
  })

  it('handles array type schemas', () => {
    const arraySchema: OpenAPIV3_1.SchemaObject = {
      type: 'array',
      items: baseSchema,
    }

    const { mergedSchema, selectedType } = useDiscriminator({ schema: arraySchema, schemas })
    expect(selectedType.value).toBe('rocky')
    expect(mergedSchema.value?.type).toBe('array')
    expect((mergedSchema.value?.items as OpenAPIV3_1.SchemaObject)?.properties?.surfaceGravity).toBeDefined()
  })

  it('merges schemas when type is selected', async () => {
    const onSchemaChange = vi.fn()
    const { selectedType, mergedSchema } = useDiscriminator({
      schema: baseSchema,
      schemas,
      onSchemaChange,
    })

    // Should start with rocky planet type
    expect(selectedType.value).toBe('rocky')
    await nextTick() // Wait for mergedSchema to update
    expect(mergedSchema.value?.properties?.surfaceGravity).toBeDefined()
    expect(mergedSchema.value?.properties?.atmosphere).toBeDefined()
    expect(mergedSchema.value?.properties?.moons).toBeDefined()

    // Change to gas giant type
    selectedType.value = 'gas'
    await nextTick()

    // Should now have gas giant properties
    expect(mergedSchema.value?.properties?.radius).toBeDefined()
    expect(mergedSchema.value?.properties?.rings).toBeDefined()
    expect(mergedSchema.value?.properties?.composition).toBeDefined()
    expect(onSchemaChange).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({
          radius: expect.any(Object),
          rings: expect.any(Object),
        }),
      }),
    )
  })

  it('generates example values based on schema type', async () => {
    const { generateExampleValue, selectedType } = useDiscriminator({
      schema: baseSchema,
      schemas,
    })

    await nextTick() // Wait for initial schema resolution

    // Test rocky planet
    const rockyPlanet = generateExampleValue(false)
    expect(rockyPlanet).toEqual({
      type: 'rocky',
      name: '',
      surfaceGravity: 0,
      atmosphere: false,
      moons: [],
    })

    // Test array of rocky planets
    const rockyPlanets = generateExampleValue(true)
    expect(rockyPlanets).toEqual([
      {
        type: 'rocky',
        name: '',
        surfaceGravity: 0,
        atmosphere: false,
        moons: [],
      },
    ])

    // Change to gas giant and test
    selectedType.value = 'gas'
    await nextTick() // Wait for schema to update after type change
    const gasGiant = generateExampleValue(false)
    expect(gasGiant).toEqual({
      type: 'gas',
      name: '',
      radius: 0,
      rings: false,
      composition: [],
    })
  })

  it('preserves schema name/title when merging', () => {
    const schemaWithTitle: OpenAPIV3_1.SchemaObject = {
      ...baseSchema,
      title: 'Solar System Object',
      name: 'Planet',
    }

    const { mergedSchema } = useDiscriminator({
      schema: schemaWithTitle,
      schemas,
    })

    expect(mergedSchema.value?.title).toBe('Solar System Object')
    expect(mergedSchema.value?.name).toBe('Planet')
  })

  it('handles missing or invalid schemas gracefully', () => {
    const { selectedType, mergedSchema } = useDiscriminator({
      schema: undefined,
      schemas: {},
    })

    expect(selectedType.value).toBe('')
    expect(mergedSchema.value).toBeUndefined()
  })
})
