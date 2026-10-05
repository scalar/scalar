import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { isOpenApiDocument } from '@scalar/workspace-store/schemas/type-guards'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import type { Meta, StoryObj } from '@storybook/vue3-vite'

import Schema from './Schema.vue'

/**
 * The top-level schema renderer. One story exercises the whole tree (heading, object properties,
 * and compositions), which is exactly what the visual snapshots capture.
 */
const meta: Meta<typeof Schema> = {
  title: 'Schema/Schema',
  component: Schema,
  // Wrap in a fixed-width, padded card painted with the Scalar page background (white in light mode)
  // so the snapshot has a stable size and an opaque background instead of a transparent one.
  render: (args) => ({
    components: { Schema },
    setup: () => ({ args }),
    template:
      '<div style="width: 600px; padding: 16px; background: var(--scalar-background-1)"><Schema v-bind="args" /></div>',
  }),
}

export default meta

type Story = StoryObj<typeof Schema>

export const Base: Story = {
  args: {
    name: 'User',
    eventBus: null,
    options: {},
    schema: coerceValue(SchemaObjectSchema, {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid', description: 'Unique identifier' },
        name: { type: 'string', description: 'The full name of the user' },
        email: { type: 'string', format: 'email' },
        age: { type: 'integer', minimum: 0 },
        active: { type: 'boolean', default: true },
      },
    }),
  },
}

export const WithRequired: Story = {
  args: {
    name: 'Account',
    eventBus: null,
    options: {},
    schema: coerceValue(SchemaObjectSchema, {
      type: 'object',
      required: ['id', 'email'],
      properties: {
        id: { type: 'string', format: 'uuid', description: 'Unique identifier' },
        email: { type: 'string', format: 'email', description: 'Primary email address' },
        role: { type: 'string', enum: ['admin', 'user', 'guest'], default: 'user' },
        tags: { type: 'array', items: { type: 'string' } },
      },
    }),
  },
}

export const Composition: Story = {
  args: {
    name: 'Pet',
    eventBus: null,
    options: {},
    schema: coerceValue(SchemaObjectSchema, {
      oneOf: [
        { type: 'object', title: 'Cat', properties: { meow: { type: 'boolean' } } },
        { type: 'object', title: 'Dog', properties: { bark: { type: 'boolean' } } },
      ],
    }),
  },
}

/** Keep composed child fields visually nested beneath their named property (#10324). */
export const NestedAllOfObject: Story = {
  // Leave room for the disclosure control, which extends into the schema gutter.
  decorators: [() => ({ template: '<div style="padding-left: 16px"><story /></div>' })],
  args: {
    name: 'Response',
    eventBus: null,
    options: {},
    schema: coerceValue(SchemaObjectSchema, {
      type: 'object',
      properties: {
        requestId: { type: 'string' },
        data: {
          allOf: [
            {
              type: 'object',
              required: ['email'],
              properties: { email: { type: 'string' } },
            },
            {
              type: 'object',
              properties: { userUseTags: { type: 'array', items: { type: 'string' } } },
            },
          ],
        },
      },
    }),
  },
}

/** Independent choice groups remain inside the composed response object (#10454). */
export const NestedAllOfChoices: Story = {
  decorators: [() => ({ template: '<div style="padding-left: 16px"><story /></div>' })],
  args: {
    name: 'Response',
    eventBus: null,
    options: {},
    schema: coerceValue(SchemaObjectSchema, {
      type: 'object',
      properties: {
        title: { const: 'Sign In User' },
        data: {
          allOf: [
            { type: 'object', properties: { userName: { type: 'string' } } },
            {
              allOf: [
                {
                  anyOf: [
                    {
                      type: 'object',
                      title: 'Use tags',
                      properties: { userUseTags: { type: 'array', items: { type: 'string' } } },
                    },
                    { type: 'object', title: 'Empty', properties: {} },
                  ],
                },
                {
                  anyOf: [
                    {
                      type: 'object',
                      title: 'Add tags',
                      properties: { userAddTags: { type: 'array', items: { type: 'string' } } },
                    },
                    { type: 'object', title: 'Empty', properties: {} },
                  ],
                },
              ],
            },
          ],
        },
      },
    }),
  },
}

/** A recursive composed child stays a leaf, including its choices. */
export const RecursiveAllOfChoices: Story = {
  args: {
    name: 'Response',
    eventBus: null,
    options: { expandAllSchemaProperties: true },
  },
  loaders: [
    async () => {
      const store = createWorkspaceStore()
      await store.addDocument({
        name: 'recursive',
        document: {
          openapi: '3.1.0',
          info: { title: 'Recursive choices', version: '1' },
          paths: {},
          components: {
            schemas: {
              Node: {
                allOf: [
                  { type: 'object', properties: { next: { $ref: '#/components/schemas/Node' } } },
                  {
                    anyOf: [
                      { type: 'object', title: 'Value', properties: { value: { type: 'string' } } },
                      { type: 'object', title: 'Empty', properties: {} },
                    ],
                  },
                ],
              },
              Response: { type: 'object', properties: { data: { $ref: '#/components/schemas/Node' } } },
            },
          },
        },
      })
      const document = store.workspace.documents.recursive
      if (!document || !isOpenApiDocument(document)) {
        throw new Error('Expected an OpenAPI document')
      }
      return { schema: getResolvedRef(document.components?.schemas?.Response) }
    },
  ],
  render: (args, { loaded }) => ({
    components: { Schema },
    setup: () => ({ args, schema: loaded.schema }),
    template: '<div class="w-[600px] bg-b-1 p-8"><Schema v-bind="args" :schema="schema" /></div>',
  }),
}
