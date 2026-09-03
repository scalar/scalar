import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { Meta, StoryObj } from '@storybook/vue3-vite'

import Schema from './Schema.vue'

/**
 * The tree layout (`schemaLayout: 'tree'`): a continuous rail per depth with a
 * disclosure control in each property's gutter, replacing the bordered card per
 * level and the Show Child Attributes pill.
 *
 * Story names are globally unique on purpose — every snapshot suite shares one
 * folder keyed by slug alone.
 */
const meta: Meta<typeof Schema> = {
  title: 'Schema/SchemaTree',
  component: Schema,
  render: (args) => ({
    components: { Schema },
    setup: () => ({ args }),
    template:
      '<div style="width: 600px; padding: 16px; background: var(--scalar-background-1)"><Schema v-bind="args" /></div>',
  }),
}

export default meta

type Story = StoryObj<typeof Schema>

export const TreeDeepNesting: Story = {
  args: {
    name: 'Account',
    eventBus: null,
    breadcrumb: ['account'],
    options: { schemaLayout: 'tree', expandAllSchemaProperties: true },
    schema: coerceValue(SchemaObjectSchema, {
      type: 'object',
      properties: {
        id: { type: 'string', maxLength: 32 },
        settings: {
          type: 'object',
          properties: {
            notifications: {
              type: 'object',
              properties: {
                email: {
                  type: 'object',
                  properties: {
                    enabled: { type: 'boolean' },
                    frequency: { type: 'string' },
                  },
                },
                push: { type: 'boolean' },
              },
            },
            theme: { type: 'string' },
          },
        },
        name: { type: 'string', maxLength: 100 },
      },
    }),
  },
}

export const TreeCollapsedPreviews: Story = {
  args: {
    name: 'Response',
    eventBus: null,
    breadcrumb: ['response'],
    options: { schemaLayout: 'tree' },
    schema: coerceValue(SchemaObjectSchema, {
      type: 'object',
      properties: {
        success: { type: 'boolean', description: 'Whether the call worked' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'number', minimum: 1000 },
              message: { type: 'string' },
              documentation_url: { type: 'string' },
              source: {
                type: 'object',
                properties: { pointer: { type: 'string' } },
              },
            },
          },
        },
        result: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string' },
            created_on: { type: 'string', format: 'date-time' },
          },
        },
      },
    }),
  },
}

export const TreeEnumChips: Story = {
  args: {
    name: 'Filters',
    eventBus: null,
    breadcrumb: ['filters'],
    options: { schemaLayout: 'tree' },
    schema: coerceValue(SchemaObjectSchema, {
      type: 'object',
      properties: {
        inline: {
          type: 'string',
          description: 'Two values render inline in the type position',
          enum: ['standard', 'enterprise'],
        },
        chips: {
          type: 'string',
          description: 'A wall of short values wraps as chips',
          enum: [
            'red',
            'orange',
            'yellow',
            'green',
            'cyan',
            'blue',
            'indigo',
            'violet',
            'magenta',
            'pink',
            'brown',
            'black',
            'white',
            'grey',
          ],
        },
      },
    }),
  },
}

export const TreeRecursive: Story = {
  args: {
    name: 'TreeNode',
    eventBus: null,
    breadcrumb: ['treeNode'],
    options: { schemaLayout: 'tree', expandAllSchemaProperties: true },
    schema: coerceValue(SchemaObjectSchema, {
      'type': 'object',
      'properties': {
        value: { type: 'string' },
        children: {
          type: 'array',
          items: { $ref: '#/$defs/node' },
        },
      },
      '$defs': {
        node: {
          type: 'object',
          properties: {
            value: { type: 'string' },
            children: {
              type: 'array',
              items: { $ref: '#/$defs/node' },
            },
          },
        },
      },
    }),
  },
}

export const TreeNarrowReflow: Story = {
  args: {
    name: 'Account',
    eventBus: null,
    breadcrumb: ['account'],
    options: { schemaLayout: 'tree', expandAllSchemaProperties: true },
    schema: coerceValue(SchemaObjectSchema, {
      type: 'object',
      properties: {
        physicalProperties: {
          type: 'object',
          properties: {
            dimensions: {
              type: 'object',
              properties: {
                width: { type: 'number' },
                height: { type: 'number' },
              },
            },
          },
        },
      },
    }),
  },
  // The container declares `narrow-references-container` and is narrower than
  // the 900px query in styles/tailwind.config.css, so this story renders with
  // the tightened gutter and the smaller controls that query switches on.
  render: (args) => ({
    components: { Schema },
    setup: () => ({ args }),
    template:
      '<div style="width: 360px; padding: 16px; background: var(--scalar-background-1); container: narrow-references-container / inline-size"><Schema v-bind="args" /></div>',
  }),
}
