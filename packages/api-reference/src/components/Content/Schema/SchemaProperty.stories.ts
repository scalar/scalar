import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { Meta, StoryObj } from '@storybook/vue3-vite'

import SchemaProperty from './SchemaProperty.vue'

/**
 * A single property row: the heading, an optional Markdown description, and any nested object or
 * array-of-objects block. The stories focus on the states the flat top-level `Schema` story does
 * not emphasize — a described scalar, a nested object, and an array of objects.
 */
const meta: Meta<typeof SchemaProperty> = {
  title: 'Schema/SchemaProperty',
  component: SchemaProperty,
  args: {
    level: 0,
    eventBus: null,
    options: {},
  },
  // Wrap in a fixed-width, padded card painted with the Scalar page background (white in light mode)
  // so the snapshot has a stable size and an opaque background instead of a transparent one.
  render: (args) => ({
    components: { SchemaProperty },
    setup: () => ({ args }),
    template:
      '<div style="width: 600px; padding: 16px; background: var(--scalar-background-1)"><SchemaProperty v-bind="args" /></div>',
  }),
}

export default meta

type Story = StoryObj<typeof SchemaProperty>

export const Described: Story = {
  args: {
    name: 'email',
    schema: coerceValue(SchemaObjectSchema, {
      type: 'string',
      format: 'email',
      description: 'The user’s **primary** email address. Must be unique across the system.',
    }),
  },
}

export const NestedObject: Story = {
  args: {
    name: 'address',
    schema: coerceValue(SchemaObjectSchema, {
      type: 'object',
      description: 'Where the order ships to.',
      properties: {
        street: { type: 'string' },
        city: { type: 'string' },
        zip: { type: 'string', pattern: '^\\d{5}$' },
      },
    }),
  },
}

export const ArrayOfObjects: Story = {
  args: {
    name: 'tags',
    schema: coerceValue(SchemaObjectSchema, {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          label: { type: 'string' },
        },
      },
    }),
  },
}
