<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'
import { ScalarTeleportRoot } from '@scalar/components/teleport'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import { provideSchemaExpansion, Schema } from '../../src/schema'

const expansion = provideSchemaExpansion()

const examples = [
  {
    name: 'Account',
    description:
      'Nested properties, required fields, constraints, and examples.',
    schema: coerceValue(SchemaObjectSchema, {
      type: 'object',
      required: ['id', 'email'],
      properties: {
        id: { type: 'string', format: 'uuid', readOnly: true },
        email: {
          type: 'string',
          format: 'email',
          description: 'The primary email address for this account.',
          examples: ['ada@example.com'],
        },
        name: { type: 'string', minLength: 1, maxLength: 100 },
        role: {
          type: 'string',
          enum: ['admin', 'member', 'guest'],
          default: 'member',
        },
        settings: {
          type: 'object',
          properties: {
            theme: {
              type: 'string',
              enum: ['system', 'light', 'dark'],
              default: 'system',
            },
            notifications: {
              type: 'object',
              properties: {
                email: { type: 'boolean', default: true },
                digest: { type: 'string', enum: ['daily', 'weekly', 'never'] },
              },
            },
          },
        },
        tags: { type: 'array', items: { type: 'string' }, maxItems: 10 },
      },
    }),
  },
  {
    name: 'Delivery',
    description:
      'Switch between alternative shapes using the composition selector.',
    schema: coerceValue(SchemaObjectSchema, {
      oneOf: [
        {
          title: 'Email',
          type: 'object',
          required: ['address'],
          properties: {
            address: { type: 'string', format: 'email' },
            subject: { type: 'string', maxLength: 200 },
          },
        },
        {
          title: 'Webhook',
          type: 'object',
          required: ['url'],
          properties: {
            url: {
              type: 'string',
              format: 'uri',
              examples: ['https://example.com/events'],
            },
            secret: {
              type: 'string',
              writeOnly: true,
              description: 'Used to sign outgoing events.',
            },
            retries: { type: 'integer', minimum: 0, maximum: 5, default: 3 },
          },
        },
      ],
    }),
  },
]
</script>

<template>
  <div class="scalar-app light-mode mx-auto max-w-3xl">
    <ScalarTeleportRoot>
      <header class="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-c-1 text-xl font-bold">Schema Blocks</h1>
          <p class="text-c-2 mt-2 text-base">
            Explore the shared schema tree without API Reference.
          </p>
        </div>
        <div class="flex gap-2">
          <ScalarButton
            size="sm"
            variant="outlined"
            @click="expansion.expandAll()">
            Expand all
          </ScalarButton>
          <ScalarButton
            size="sm"
            variant="outlined"
            @click="expansion.collapseAll()">
            Collapse all
          </ScalarButton>
        </div>
      </header>
      <section
        v-for="example in examples"
        :key="example.name"
        class="mb-10">
        <h2 class="text-c-1 text-lg font-semibold">{{ example.name }}</h2>
        <p class="text-c-2 mt-1 mb-4 text-sm">{{ example.description }}</p>
        <Schema
          :eventBus="null"
          :name="example.name"
          :options="{ hideModels: true, schemaKeyboardNav: true }"
          :schema="example.schema" />
      </section>
    </ScalarTeleportRoot>
  </div>
</template>
