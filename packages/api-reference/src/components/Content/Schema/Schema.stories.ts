import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
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
