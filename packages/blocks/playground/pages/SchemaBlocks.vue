<script setup lang="ts">
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { onBeforeUnmount, onMounted, ref } from 'vue'

import { createSchema } from '../../src/schema'

/** A set of schemas that exercise the different schema renderings. */
const schemas: Array<{ name: string; schema: SchemaObject }> = [
  {
    name: 'User (object)',
    schema: {
      type: 'object',
      required: ['id', 'email'],
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          description: 'Unique identifier',
        },
        email: { type: 'string', format: 'email' },
        name: { type: 'string', description: 'Display name' },
        role: {
          type: 'string',
          enum: ['admin', 'editor', 'viewer'],
          default: 'viewer',
        },
        tags: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  {
    name: 'Pet (oneOf)',
    schema: {
      oneOf: [
        {
          type: 'object',
          title: 'Cat',
          properties: {
            type: { type: 'string', const: 'cat' },
            livesLeft: { type: 'integer' },
          },
        },
        {
          type: 'object',
          title: 'Dog',
          properties: {
            type: { type: 'string', const: 'dog' },
            goodBoy: { type: 'boolean' },
          },
        },
      ],
    },
  },
  {
    name: 'Pagination (constraints)',
    schema: {
      type: 'object',
      properties: {
        page: { type: 'integer', minimum: 1, default: 1 },
        perPage: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        total: { type: 'integer', readOnly: true },
      },
    },
  },
  {
    name: 'Address (nested object)',
    schema: {
      type: 'object',
      required: ['street', 'city'],
      properties: {
        street: { type: 'string' },
        city: { type: 'string' },
        geo: {
          type: 'object',
          description: 'Geographic coordinates',
          properties: {
            lat: { type: 'number', format: 'float' },
            lng: { type: 'number', format: 'float' },
          },
        },
      },
    },
  },
  {
    name: 'Order (array of objects)',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        status: {
          type: 'string',
          enum: ['pending', 'paid', 'shipped', 'cancelled'],
        },
        createdAt: { type: 'string', format: 'date-time' },
        items: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            properties: {
              sku: { type: 'string' },
              quantity: { type: 'integer', minimum: 1 },
            },
          },
        },
      },
    },
  },
  {
    name: 'Animal (allOf)',
    schema: {
      allOf: [
        {
          type: 'object',
          title: 'Base',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
        },
        {
          type: 'object',
          title: 'Traits',
          properties: {
            legs: { type: 'integer', default: 4 },
            sound: { type: 'string' },
          },
        },
      ],
    },
  },
  {
    name: 'Identifier (anyOf)',
    schema: {
      anyOf: [
        { type: 'string', format: 'uuid', title: 'UUID' },
        { type: 'integer', title: 'Numeric id' },
      ],
    },
  },
  {
    name: 'Metadata (dictionary)',
    schema: {
      type: 'object',
      description: 'Free-form key/value labels',
      additionalProperties: { type: 'string' },
    },
  },
  {
    name: 'Article (rich)',
    schema: {
      type: 'object',
      required: ['title'],
      properties: {
        title: {
          type: 'string',
          minLength: 1,
          maxLength: 120,
          examples: ['Hello world'],
        },
        slug: { type: 'string', pattern: '^[a-z0-9-]+$' },
        subtitle: { type: ['string', 'null'] },
        secret: {
          type: 'string',
          writeOnly: true,
          description: 'Only sent on write',
        },
        legacyId: {
          type: 'integer',
          deprecated: true,
          description: 'Use `id` instead',
        },
      },
    },
  },
]

const grid = ref<HTMLDivElement | null>(null)
const instances: Array<{ destroy: () => void }> = []

onMounted(() => {
  for (const { name, schema } of schemas) {
    const mount = document.createElement('div')
    grid.value?.append(mount)

    instances.push(createSchema(mount, { schema, name }))
  }
})

// Each block mounts its own Vue app, so tear them down when leaving the page.
onBeforeUnmount(() => {
  instances.forEach((instance) => instance.destroy())
})
</script>

<template>
  <div
    ref="grid"
    class="schema-grid" />
</template>

<style scoped>
.schema-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  align-items: start;
  gap: 24px;
  padding: 24px;
}
</style>
