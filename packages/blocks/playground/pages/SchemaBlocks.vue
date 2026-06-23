<script setup lang="ts">
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { onBeforeUnmount, onMounted, ref } from 'vue'

import { createSchema } from '../../src/schema'

/** A handful of schemas that exercise the different schema renderings. */
const schemas: Array<{ name: string; schema: SchemaObject }> = [
  {
    name: 'User',
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
    name: 'Pet (composition)',
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
    name: 'Pagination',
    schema: {
      type: 'object',
      properties: {
        page: { type: 'integer', minimum: 1, default: 1 },
        perPage: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        total: { type: 'integer', readOnly: true },
      },
    },
  },
]

const grid = ref<HTMLDivElement | null>(null)
const instances: Array<{ destroy: () => void }> = []

onMounted(() => {
  for (const { name, schema } of schemas) {
    const element = document.createElement('div')
    grid.value?.append(element)

    instances.push(createSchema(element, { schema, name }))
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
  gap: 24px;
  padding: 24px;
}
</style>
