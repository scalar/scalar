import { describe, expect, it } from 'vitest'

import { circularToRefs } from '@/object/circular-to-refs'

describe('circularToRefs', () => {
  describe('Circular Schemas', () => {
    it('converts a self-referencing circular schema into $ref', () => {
      const document = {
        openapi: '3.1.0',
        info: {
          title: 'Tree API',
          version: '1.0.0',
        },
        paths: {
          '/nodes': {
            get: {
              summary: 'Get tree nodes',
              responses: {
                '200': {
                  description: 'A tree node',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          children: {
                            type: 'array',
                            items: {},
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }

      /**
       * Simulate de-referenced legacy data: the old client resolved all $refs
       * inline, creating circular JS objects for self-referencing schemas.
       * TreeNode.children.items → TreeNode (same object reference)
       */
      document.paths['/nodes'].get.responses['200'].content['application/json'].schema.properties.children.items =
        document.paths['/nodes'].get.responses['200'].content['application/json'].schema

      const safeDoc = circularToRefs(document)

      /**
       * The breakCircularReferences function:
       * 1. Keeps the schema inline at its original location
       * 2. Replaces only the back-reference (items) with $ref
       * 3. Extracts the circular schema to components/schemas with a generic name
       */
      expect(safeDoc).toEqual({
        openapi: '3.1.0',
        info: {
          title: 'Tree API',
          version: '1.0.0',
        },
        paths: {
          '/nodes': {
            get: {
              summary: 'Get tree nodes',
              responses: {
                '200': {
                  description: 'A tree node',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '#/components/schemas/CircularSchema1',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        components: {
          schemas: {
            CircularSchema1: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                children: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/CircularSchema1',
                  },
                },
              },
            },
          },
        },
      })
    })

    it('converts mutually circular schemas into $refs', () => {
      const document = {
        openapi: '3.1.0',
        info: {
          title: 'People API',
          version: '1.0.0',
        },
        paths: {
          '/people': {
            get: {
              summary: 'Get people',
              responses: {
                '200': {
                  description: 'A person with their employer',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          employer: {
                            type: 'object',
                            properties: {
                              companyName: { type: 'string' },
                              employees: {
                                type: 'array',
                                items: {},
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }

      /**
       * Simulate de-referenced legacy data with mutually circular schemas:
       * Person.employer → Company, Company.employees.items → Person.
       * The old client inlined these creating a circular JS object graph.
       */
      const personSchema = document.paths['/people'].get.responses['200'].content['application/json'].schema
      const companySchema = personSchema.properties.employer
      companySchema.properties.employees.items = personSchema

      const safeDoc = circularToRefs(document)

      /**
       * The circularToRefs function:
       * 1. Keeps the Person schema inline at its original location
       * 2. Replaces only the back-reference (employees.items → Person) with $ref
       * 3. Extracts the Person schema to components/schemas with a generic name
       */
      expect(safeDoc).toEqual({
        openapi: '3.1.0',
        info: {
          title: 'People API',
          version: '1.0.0',
        },
        paths: {
          '/people': {
            get: {
              summary: 'Get people',
              responses: {
                '200': {
                  description: 'A person with their employer',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '#/components/schemas/CircularSchema1',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        components: {
          schemas: {
            CircularSchema1: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                employer: {
                  type: 'object',
                  properties: {
                    companyName: { type: 'string' },
                    employees: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/CircularSchema1',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })
    })

    it('handles circular references across all component types at once', () => {
      const document: Record<string, any> = {
        openapi: '3.1.0',
        info: {
          title: 'All Circular API',
          version: '1.0.0',
        },
        paths: {
          '/all-circular': {
            post: {
              summary: 'All circular component types',
              parameters: [
                {
                  name: 'filter',
                  in: 'query',
                  schema: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      nested: {},
                    },
                  },
                },
              ],
              requestBody: {
                description: 'Request body with circular reference',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        data: { type: 'string' },
                        related: {},
                      },
                    },
                  },
                },
              },
              responses: {
                '200': {
                  description: 'Success response',
                  headers: {
                    'X-Pagination': {
                      description: 'Pagination metadata',
                      schema: {
                        type: 'object',
                        properties: {
                          page: { type: 'integer' },
                        },
                      },
                    },
                  },
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          children: {
                            type: 'array',
                            items: {},
                          },
                        },
                      },
                      examples: {
                        tree: {
                          summary: 'Recursive tree example',
                          value: {
                            name: 'root',
                            nested: {},
                          },
                        },
                      },
                    },
                  },
                  links: {
                    GetRelated: {
                      operationId: 'getRelated',
                      parameters: { id: '$response.body#/id' },
                    },
                  },
                },
              },
              callbacks: {
                onEvent: {
                  '{$request.body#/callbackUrl}': {
                    post: {
                      summary: 'Event callback',
                      responses: {
                        '200': {
                          description: 'Callback OK',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }

      const operation = document.paths['/all-circular'].post
      const response200 = operation.responses['200']

      // schemas — self-referencing schema (children.items → same schema)
      const responseSchema = response200.content['application/json'].schema
      responseSchema.properties.children.items = responseSchema

      // responses — response object references itself
      response200.content['application/json'].schema.properties.selfResponse = response200

      // parameters — parameter object references itself
      const filterParam = operation.parameters[0]
      filterParam.schema.properties.nested = filterParam

      // examples — example object references itself
      const treeExample = response200.content['application/json'].examples.tree
      treeExample.value.nested = treeExample

      // requestBodies — requestBody object references itself
      const requestBody = operation.requestBody
      requestBody.content['application/json'].schema.properties.related = requestBody

      // headers — header object references itself
      const paginationHeader = response200.headers['X-Pagination']
      paginationHeader.schema.properties.nextPage = paginationHeader

      // links — link object references itself
      const getRelatedLink = response200.links.GetRelated
      getRelatedLink.server = { relatedLink: getRelatedLink }

      // callbacks — callback object references itself
      const onEventCallback = operation.callbacks.onEvent
      onEventCallback['{$request.body#/callbackUrl}'].post.responses['200'].relatedCallback = onEventCallback

      // pathItems — pathItem references itself
      const callbackPathItem = onEventCallback['{$request.body#/callbackUrl}']
      callbackPathItem.post.responses['200'].pathItemRef = callbackPathItem

      const safeDoc = circularToRefs(document)
      expect(safeDoc).toEqual({
        openapi: '3.1.0',
        info: { title: 'All Circular API', version: '1.0.0' },
        paths: {
          '/all-circular': {
            post: {
              summary: 'All circular component types',
              parameters: [
                {
                  $ref: '#/components/parameters/CircularParameter1',
                },
              ],
              requestBody: {
                $ref: '#/components/requestBodies/CircularRequestBody1',
              },
              responses: {
                '200': {
                  $ref: '#/components/responses/CircularResponse1',
                },
              },
              callbacks: {
                onEvent: {
                  $ref: '#/components/callbacks/CircularCallback1',
                },
              },
            },
          },
        },
        components: {
          callbacks: {
            CircularCallback1: {
              '{$request.body#/callbackUrl}': {
                $ref: '#/components/pathItems/CircularPathItem1',
              },
            },
          },
          examples: {
            CircularExample1: {
              summary: 'Recursive tree example',
              value: {
                name: 'root',
                nested: { $ref: '#/components/examples/CircularExample1' },
              },
            },
          },
          headers: {
            CircularHeader1: {
              description: 'Pagination metadata',
              schema: {
                type: 'object',
                properties: {
                  page: { type: 'integer' },
                  nextPage: { $ref: '#/components/headers/CircularHeader1' },
                },
              },
            },
          },
          links: {
            CircularLink1: {
              operationId: 'getRelated',
              parameters: { id: '$response.body#/id' },
              server: {
                relatedLink: { $ref: '#/components/links/CircularLink1' },
              },
            },
          },
          parameters: {
            CircularParameter1: {
              name: 'filter',
              in: 'query',
              schema: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  nested: { $ref: '#/components/parameters/CircularParameter1' },
                },
              },
            },
          },
          pathItems: {
            CircularPathItem1: {
              post: {
                summary: 'Event callback',
                responses: {
                  '200': {
                    description: 'Callback OK',
                    relatedCallback: { $ref: '#/components/callbacks/CircularCallback1' },
                    pathItemRef: { $ref: '#/components/pathItems/CircularPathItem1' },
                  },
                },
              },
            },
          },
          requestBodies: {
            CircularRequestBody1: {
              description: 'Request body with circular reference',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { type: 'string' },
                      related: { $ref: '#/components/requestBodies/CircularRequestBody1' },
                    },
                  },
                },
              },
            },
          },
          responses: {
            CircularResponse1: {
              description: 'Success response',
              headers: {
                'X-Pagination': {
                  $ref: '#/components/headers/CircularHeader1',
                },
              },
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/CircularSchema1' },
                  examples: {
                    tree: {
                      $ref: '#/components/examples/CircularExample1',
                    },
                  },
                },
              },
              links: {
                GetRelated: {
                  $ref: '#/components/links/CircularLink1',
                },
              },
            },
          },
          schemas: {
            CircularSchema1: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                children: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/CircularSchema1' },
                },
                selfResponse: { $ref: '#/components/responses/CircularResponse1' },
              },
            },
          },
        },
      })
    })
  })

  describe('Edge Cases', () => {
    it('returns structurally identical document when no circular references exist', () => {
      const document = {
        openapi: '3.1.0',
        info: {
          title: 'Simple API',
          version: '1.0.0',
        },
        paths: {
          '/users': {
            get: {
              summary: 'Get users',
              responses: {
                '200': {
                  description: 'A list of users',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }

      const result = circularToRefs(document)
      expect(result).toEqual(document)
      expect(result.components).toBeUndefined()
    })

    it('preserves existing components when adding circular refs', () => {
      const document: Record<string, any> = {
        openapi: '3.1.0',
        info: {
          title: 'API with Components',
          version: '1.0.0',
        },
        paths: {
          '/nodes': {
            get: {
              responses: {
                '200': {
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          children: { type: 'array', items: {} },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        components: {
          schemas: {
            ExistingSchema: {
              type: 'object',
              properties: {
                id: { type: 'string' },
              },
            },
          },
        },
      }

      // Create circular reference
      const schema = document.paths['/nodes'].get.responses['200'].content['application/json'].schema
      schema.properties.children.items = schema

      const result = circularToRefs(document)
      expect(result).toEqual({
        openapi: '3.1.0',
        info: { title: 'API with Components', version: '1.0.0' },
        paths: {
          '/nodes': {
            get: {
              responses: {
                '200': {
                  content: {
                    'application/json': {
                      schema: { '$ref': '#/components/schemas/CircularSchema1' },
                    },
                  },
                },
              },
            },
          },
        },
        components: {
          schemas: {
            ExistingSchema: { type: 'object', properties: { id: { type: 'string' } } },
            CircularSchema1: {
              type: 'object',
              properties: {
                children: {
                  type: 'array',
                  items: { '$ref': '#/components/schemas/CircularSchema1' },
                },
              },
            },
          },
        },
      })
    })

    it('handles deeply nested circular references', () => {
      const document: Record<string, any> = {
        openapi: '3.1.0',
        info: { title: 'Deep Nesting API', version: '1.0.0' },
        paths: {
          '/deep': {
            get: {
              responses: {
                '200': {
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          level1: {
                            type: 'object',
                            properties: {
                              level2: {
                                type: 'object',
                                properties: {
                                  level3: {
                                    type: 'object',
                                    properties: {
                                      backToRoot: {},
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }

      const rootSchema = document.paths['/deep'].get.responses['200'].content['application/json'].schema
      rootSchema.properties.level1.properties.level2.properties.level3.properties.backToRoot = rootSchema

      const result = circularToRefs(document)
      expect(result).toEqual({
        openapi: '3.1.0',
        info: { title: 'Deep Nesting API', version: '1.0.0' },
        paths: {
          '/deep': {
            get: {
              responses: {
                '200': {
                  content: {
                    'application/json': {
                      schema: { '$ref': '#/components/schemas/CircularSchema1' },
                    },
                  },
                },
              },
            },
          },
        },
        components: {
          schemas: {
            CircularSchema1: {
              type: 'object',
              properties: {
                level1: {
                  type: 'object',
                  properties: {
                    level2: {
                      type: 'object',
                      properties: {
                        level3: {
                          type: 'object',
                          properties: {
                            backToRoot: {
                              '$ref': '#/components/schemas/CircularSchema1',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })
    })

    it('adds extra properties to $ref when provided', () => {
      const document: Record<string, any> = {
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {
          '/test': {
            get: {
              responses: {
                '200': {
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          self: {},
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }

      const schema = document.paths['/test'].get.responses['200'].content['application/json'].schema
      schema.properties.self = schema

      const result = circularToRefs(document, { '$ref-value': {} })
      expect(result).toEqual({
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {
          '/test': {
            get: {
              responses: {
                '200': {
                  content: {
                    'application/json': {
                      schema: {
                        '$ref': '#/components/schemas/CircularSchema1',
                        '$ref-value': {},
                      },
                    },
                  },
                },
              },
            },
          },
        },
        components: {
          schemas: {
            CircularSchema1: {
              type: 'object',
              properties: {
                self: {
                  '$ref': '#/components/schemas/CircularSchema1',
                  '$ref-value': {},
                },
              },
            },
          },
        },
      })
    })
  })
})
