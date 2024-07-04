// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/vue3'

import { default as ExampleRequest } from './ExampleRequest.vue'

const meta: Meta<typeof ExampleRequest> = {
  title: 'Example/ExampleRequest',
  component: ExampleRequest,
  argTypes: {},
}

export default meta

type Story = StoryObj<typeof ExampleRequest>

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/vue/api/csf
 * to learn how to use render functions.
 */
export const Primary: Story = {
  render: (args) => ({
    components: { ExampleRequest },
    setup() {
      return { args }
    },
    template: '<ExampleRequest v-bind="args" />',
  }),
  args: {
    server: {
      url: 'https://example.com',
    },
    operation: {
      httpVerb: 'put',
      path: '/pet',
      operationId: 'updatePet',
      name: 'Update an existing pet',
      description: 'Update an existing pet by Id',
      responses: {
        '200': {
          description: 'Successful operation',
          content: {
            'application/xml': {
              schema: {
                required: ['name', 'photoUrls'],
                type: 'object',
                properties: {
                  id: { type: 'integer', format: 'int64', example: 10 },
                  name: { type: 'string', example: 'doggie' },
                  category: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer', format: 'int64', example: 1 },
                      name: { type: 'string', example: 'Dogs' },
                    },
                    xml: { name: 'category' },
                  },
                  photoUrls: {
                    type: 'array',
                    xml: { wrapped: true },
                    items: { type: 'string', xml: { name: 'photoUrl' } },
                  },
                  tags: {
                    type: 'array',
                    xml: { wrapped: true },
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer', format: 'int64' },
                        name: { type: 'string' },
                      },
                      xml: { name: 'tag' },
                    },
                  },
                  status: {
                    type: 'string',
                    description: 'pet status in the store',
                    enum: ['available', 'pending', 'sold'],
                  },
                },
                xml: { name: 'pet' },
              },
            },
            'application/json': {
              schema: {
                required: ['name', 'photoUrls'],
                type: 'object',
                properties: {
                  id: { type: 'integer', format: 'int64', example: 10 },
                  name: { type: 'string', example: 'doggie' },
                  category: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer', format: 'int64', example: 1 },
                      name: { type: 'string', example: 'Dogs' },
                    },
                    xml: { name: 'category' },
                  },
                  photoUrls: {
                    type: 'array',
                    xml: { wrapped: true },
                    items: { type: 'string', xml: { name: 'photoUrl' } },
                  },
                  tags: {
                    type: 'array',
                    xml: { wrapped: true },
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer', format: 'int64' },
                        name: { type: 'string' },
                      },
                      xml: { name: 'tag' },
                    },
                  },
                  status: {
                    type: 'string',
                    description: 'pet status in the store',
                    enum: ['available', 'pending', 'sold'],
                  },
                },
                xml: { name: 'pet' },
              },
              example:
                '{\n "id": 10,\n "name": "doggie",\n "category": {\n "id": 1,\n "name": "Dogs"\n },\n "photoUrls": [],\n "tags": [\n {\n "id": 1,\n "name": ""\n }\n ],\n "status": "available"\n}',
            },
          },
        },
        '400': { description: 'Invalid ID supplied' },
        '404': { description: 'Pet not found' },
        '405': { description: 'Validation exception' },
      },
      information: {
        tags: ['pet'],
        summary: 'Update an existing pet',
        description: 'Update an existing pet by Id',
        operationId: 'updatePet',
        requestBody: {
          description: 'Update an existent pet in the store',
          content: {
            'application/json': {
              schema: {
                required: ['name', 'photoUrls'],
                type: 'object',
                properties: {
                  id: { type: 'integer', format: 'int64', example: 10 },
                  name: { type: 'string', example: 'doggie' },
                  category: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer', format: 'int64', example: 1 },
                      name: { type: 'string', example: 'Dogs' },
                    },
                    xml: { name: 'category' },
                  },
                  photoUrls: {
                    type: 'array',
                    xml: { wrapped: true },
                    items: { type: 'string', xml: { name: 'photoUrl' } },
                  },
                  tags: {
                    type: 'array',
                    xml: { wrapped: true },
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer', format: 'int64' },
                        name: { type: 'string' },
                      },
                      xml: { name: 'tag' },
                    },
                  },
                  status: {
                    type: 'string',
                    description: 'pet status in the store',
                    enum: ['available', 'pending', 'sold'],
                  },
                },
                xml: { name: 'pet' },
              },
            },
            'application/xml': {
              schema: {
                required: ['name', 'photoUrls'],
                type: 'object',
                properties: {
                  id: { type: 'integer', format: 'int64', example: 10 },
                  name: { type: 'string', example: 'doggie' },
                  category: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer', format: 'int64', example: 1 },
                      name: { type: 'string', example: 'Dogs' },
                    },
                    xml: { name: 'category' },
                  },
                  photoUrls: {
                    type: 'array',
                    xml: { wrapped: true },
                    items: { type: 'string', xml: { name: 'photoUrl' } },
                  },
                  tags: {
                    type: 'array',
                    xml: { wrapped: true },
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer', format: 'int64' },
                        name: { type: 'string' },
                      },
                      xml: { name: 'tag' },
                    },
                  },
                  status: {
                    type: 'string',
                    description: 'pet status in the store',
                    enum: ['available', 'pending', 'sold'],
                  },
                },
                xml: { name: 'pet' },
              },
            },
            'application/x-www-form-urlencoded': {
              schema: {
                required: ['name', 'photoUrls'],
                type: 'object',
                properties: {
                  id: { type: 'integer', format: 'int64', example: 10 },
                  name: { type: 'string', example: 'doggie' },
                  category: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer', format: 'int64', example: 1 },
                      name: { type: 'string', example: 'Dogs' },
                    },
                    xml: { name: 'category' },
                  },
                  photoUrls: {
                    type: 'array',
                    xml: { wrapped: true },
                    items: { type: 'string', xml: { name: 'photoUrl' } },
                  },
                  tags: {
                    type: 'array',
                    xml: { wrapped: true },
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer', format: 'int64' },
                        name: { type: 'string' },
                      },
                      xml: { name: 'tag' },
                    },
                  },
                  status: {
                    type: 'string',
                    description: 'pet status in the store',
                    enum: ['available', 'pending', 'sold'],
                  },
                },
                xml: { name: 'pet' },
              },
            },
          },
          required: true,
        },
        responses: {
          '200': {
            description: 'Successful operation',
            content: {
              'application/xml': {
                schema: {
                  required: ['name', 'photoUrls'],
                  type: 'object',
                  properties: {
                    id: { type: 'integer', format: 'int64', example: 10 },
                    name: { type: 'string', example: 'doggie' },
                    category: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer', format: 'int64', example: 1 },
                        name: { type: 'string', example: 'Dogs' },
                      },
                      xml: { name: 'category' },
                    },
                    photoUrls: {
                      type: 'array',
                      xml: { wrapped: true },
                      items: { type: 'string', xml: { name: 'photoUrl' } },
                    },
                    tags: {
                      type: 'array',
                      xml: { wrapped: true },
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer', format: 'int64' },
                          name: { type: 'string' },
                        },
                        xml: { name: 'tag' },
                      },
                    },
                    status: {
                      type: 'string',
                      description: 'pet status in the store',
                      enum: ['available', 'pending', 'sold'],
                    },
                  },
                  xml: { name: 'pet' },
                },
              },
              'application/json': {
                schema: {
                  required: ['name', 'photoUrls'],
                  type: 'object',
                  properties: {
                    id: { type: 'integer', format: 'int64', example: 10 },
                    name: { type: 'string', example: 'doggie' },
                    category: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer', format: 'int64', example: 1 },
                        name: { type: 'string', example: 'Dogs' },
                      },
                      xml: { name: 'category' },
                    },
                    photoUrls: {
                      type: 'array',
                      xml: { wrapped: true },
                      items: { type: 'string', xml: { name: 'photoUrl' } },
                    },
                    tags: {
                      type: 'array',
                      xml: { wrapped: true },
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer', format: 'int64' },
                          name: { type: 'string' },
                        },
                        xml: { name: 'tag' },
                      },
                    },
                    status: {
                      type: 'string',
                      description: 'pet status in the store',
                      enum: ['available', 'pending', 'sold'],
                    },
                  },
                  xml: { name: 'pet' },
                },
                example:
                  '{\n "id": 10,\n "name": "doggie",\n "category": {\n "id": 1,\n "name": "Dogs"\n },\n "photoUrls": [],\n "tags": [\n {\n "id": 1,\n "name": ""\n }\n ],\n "status": "available"\n}',
              },
            },
          },
          '400': { description: 'Invalid ID supplied' },
          '404': { description: 'Pet not found' },
          '405': { description: 'Validation exception' },
        },
        security: [{ petstore_auth: ['write:pets', 'read:pets'] }],
      },
    },
  },
}
