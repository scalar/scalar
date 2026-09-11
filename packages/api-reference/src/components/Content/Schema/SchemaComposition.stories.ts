import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { Meta, StoryObj } from '@storybook/vue3-vite'

import SchemaComposition from './SchemaComposition.vue'

/**
 * The composition renderer. `oneOf`/`anyOf` show a selector that switches between mutually exclusive
 * variants, while `allOf` merges its segments into a single property list — the states the snapshots
 * capture.
 */
const meta: Meta<typeof SchemaComposition> = {
  title: 'Schema/SchemaComposition',
  component: SchemaComposition,
  args: {
    // The composition renders nested Schema components, which only need the defaults here.
    level: 0,
    eventBus: null,
    options: {},
  },
  // Wrap in a fixed-width, padded card painted with the Scalar page background (white in light mode)
  // so the snapshot has a stable size and an opaque background instead of a transparent one.
  render: (args) => ({
    components: { SchemaComposition },
    setup: () => ({ args }),
    template:
      '<div style="width: 600px; padding: 16px; background: var(--scalar-background-1)"><SchemaComposition v-bind="args" /></div>',
  }),
}

export default meta

type Story = StoryObj<typeof SchemaComposition>

export const OneOf: Story = {
  args: {
    name: 'PaymentMethod',
    composition: 'oneOf',
    schema: coerceValue(SchemaObjectSchema, {
      oneOf: [
        { type: 'object', title: 'Card', properties: { brand: { type: 'string' }, last4: { type: 'string' } } },
        { type: 'object', title: 'BankTransfer', properties: { iban: { type: 'string' } } },
        { type: 'object', title: 'Cash' },
      ],
    }),
  },
}

/**
 * A `oneOf` whose selected variant `allOf`s back to a shared base — the shape a
 * `discriminator.mapping` infers, and the one a request body most often carries.
 * The merged variant renders one level deeper than a plain object variant, so
 * the snapshot guards that its first field still sits flush under the selector
 * rather than detached below it. See https://github.com/scalar/scalar/issues/9861
 */
export const OneOfAllOfVariant: Story = {
  args: {
    name: 'Config',
    composition: 'oneOf',
    options: { expandAllSchemaProperties: true },
    schema: coerceValue(SchemaObjectSchema, {
      oneOf: [
        {
          title: 'Config_v2_2',
          allOf: [
            {
              type: 'object',
              required: ['formatVersion'],
              properties: { formatVersion: { type: 'string' }, name: { type: 'string' } },
            },
            { type: 'object', properties: { fieldA: { type: 'string' } } },
          ],
        },
        {
          title: 'Config_v2_3',
          allOf: [
            {
              type: 'object',
              required: ['formatVersion'],
              properties: { formatVersion: { type: 'string' }, name: { type: 'string' } },
            },
            { type: 'object', properties: { fieldB: { type: 'string' } } },
          ],
        },
      ],
    }),
  },
}

export const AnyOf: Story = {
  args: {
    name: 'Contact',
    composition: 'anyOf',
    schema: coerceValue(SchemaObjectSchema, {
      anyOf: [
        { type: 'object', title: 'Email', properties: { email: { type: 'string', format: 'email' } } },
        { type: 'object', title: 'Phone', properties: { phone: { type: 'string' } } },
      ],
    }),
  },
}

export const AllOf: Story = {
  args: {
    name: 'Timestamped',
    composition: 'allOf',
    schema: coerceValue(SchemaObjectSchema, {
      allOf: [
        { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
        { type: 'object', properties: { createdAt: { type: 'string', format: 'date-time' } } },
      ],
    }),
  },
}
