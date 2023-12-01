import type { Meta, StoryObj } from '@storybook/vue3'

import Schema from './Schema.vue'

const meta: Meta<typeof Schema> = {
  title: 'Example/Schema',
  component: Schema,
  argTypes: {},
}

export default meta

type Story = StoryObj<typeof Schema>

const schema = {
  required: ['name', 'photoUrls'],
  type: 'object',
  properties: {
    id: {
      type: 'integer',
      format: 'int64',
      example: 10,
    },
    name: {
      type: 'string',
      example: 'doggie',
    },
    category: {
      type: 'object',
      properties: {
        id: {
          type: 'integer',
          format: 'int64',
          example: 1,
        },
        name: {
          type: 'string',
          example: 'Dogs',
        },
      },
      xml: {
        name: 'category',
      },
    },
    photoUrls: {
      type: 'array',
      xml: {
        wrapped: true,
      },
      items: {
        type: 'string',
        xml: {
          name: 'photoUrl',
        },
      },
    },
    tags: {
      type: 'array',
      xml: {
        wrapped: true,
      },
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            format: 'int64',
          },
          name: {
            type: 'string',
          },
        },
        xml: {
          name: 'tag',
        },
      },
    },
    status: {
      type: 'string',
      description: 'pet status in the store',
      enum: ['available', 'pending', 'sold'],
    },

    tensor_data: {
      type: 'array',
      items: {
        oneOf: [{ type: 'number' }, { type: 'string' }, { type: 'boolean' }],
      },
    },
  },

  xml: {
    name: 'pet',
  },
}

export const Default: Story = {
  render: (args) => ({
    components: {
      Schema,
    },
    setup() {
      return { args }
    },
    template: `
        <Schema v-bind="args" />
    `,
  }),
  args: {
    value: schema,
  },
}
