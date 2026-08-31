import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { Meta, StoryObj } from '@storybook/vue3-vite'

import SchemaEnums from './SchemaEnums.vue'

/**
 * The enum renderer. Stories cover the plain value list, the labelled/described variant
 * (`x-enum-varnames` + `x-enumDescriptions`), and the collapsed "show all values" state that
 * kicks in once a list grows past the display threshold — which is exactly what the snapshots
 * capture.
 */
const meta: Meta<typeof SchemaEnums> = {
  title: 'Schema/SchemaEnums',
  component: SchemaEnums,
  // Wrap in a fixed-width, padded card painted with the Scalar page background (white in light mode)
  // so the snapshot has a stable size and an opaque background instead of a transparent one.
  render: (args) => ({
    components: { SchemaEnums },
    setup: () => ({ args }),
    template:
      '<div style="width: 460px; padding: 16px; background: var(--scalar-background-1)"><SchemaEnums v-bind="args" /></div>',
  }),
}

export default meta

type Story = StoryObj<typeof SchemaEnums>

export const Values: Story = {
  args: {
    value: coerceValue(SchemaObjectSchema, {
      type: 'string',
      enum: ['active', 'inactive', 'pending'],
    }),
  },
}

export const WithDescriptions: Story = {
  args: {
    value: coerceValue(SchemaObjectSchema, {
      type: 'string',
      enum: ['active', 'inactive', 'pending'],
      'x-enum-varnames': ['Active', 'Inactive', 'Pending'],
      'x-enumDescriptions': [
        'The account is active and can sign in',
        'The account has been disabled',
        'The account is awaiting approval',
      ],
    }),
  },
}

export const LongList: Story = {
  args: {
    value: coerceValue(SchemaObjectSchema, {
      type: 'string',
      // More than the display threshold, so only the first few render and the toggle appears.
      enum: ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'black', 'white', 'gray', 'brown', 'pink'],
    }),
  },
}
