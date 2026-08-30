import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { Meta, StoryObj } from '@storybook/vue3-vite'

import SchemaPropertyHeading from './SchemaPropertyHeading.vue'

/**
 * The property heading line: the type/format, the dotted list of constraints, the deprecated badge,
 * the required marker, the default value, and the pattern hover chip. These are the states that
 * differ visually, which is exactly what the snapshots capture.
 *
 * `label` is not a component prop — it feeds the `name` slot a parent would normally supply, so the
 * heading reads like a real property rather than a bare chip row.
 */
type HeadingArgs = InstanceType<typeof SchemaPropertyHeading>['$props'] & {
  label?: string
}

const meta: Meta<HeadingArgs> = {
  title: 'Schema/SchemaPropertyHeading',
  component: SchemaPropertyHeading,
  // Wrap in a fixed-width, padded card painted with the Scalar page background (white in light mode)
  // so the snapshot has a stable size and an opaque background instead of a transparent one.
  render: ({ label, ...args }) => ({
    components: { SchemaPropertyHeading },
    setup: () => ({ args, label }),
    template:
      '<div style="width: 460px; padding: 16px; background: var(--scalar-background-1)"><SchemaPropertyHeading v-bind="args"><template v-if="label" #name>{{ label }}</template></SchemaPropertyHeading></div>',
  }),
}

export default meta

type Story = StoryObj<HeadingArgs>

export const Constraints: Story = {
  args: {
    label: 'score',
    value: coerceValue(SchemaObjectSchema, {
      type: 'integer',
      minimum: 0,
      maximum: 100,
      multipleOf: 5,
    }),
  },
}

export const StringPattern: Story = {
  args: {
    label: 'email',
    value: coerceValue(SchemaObjectSchema, {
      type: 'string',
      format: 'email',
      pattern: '^\\S+@\\S+\\.\\S+$',
    }),
  },
}

export const Deprecated: Story = {
  args: {
    label: 'legacyId',
    required: true,
    value: coerceValue(SchemaObjectSchema, {
      type: 'string',
      deprecated: true,
      default: 'abc-123',
    }),
  },
}
