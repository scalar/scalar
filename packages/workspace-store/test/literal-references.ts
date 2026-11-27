/** Literal payloads must remain unchanged even when their keys resemble references. */
export const literalReferencesDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Literal references',
    version: '1',
    'x-data': { $ref: 'https://example.test/info-data.json', name: 'kept' },
  },
  paths: {
    '/x': {
      post: {
        'x-ms-examples': { sample: { $ref: './example.json', name: 'kept' } },
        requestBody: {
          content: {
            'application/json': {
              examples: {
                local: { value: { $ref: '#/components/schemas/Pet', name: 'kept', id: 7 } },
                remote: { value: { $ref: 'https://example.test/payload.json', name: 'kept', id: 7 } },
                relative: { value: [{ $ref: './payload.json', name: 'kept', id: 7 }] },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
            links: {
              next: {
                operationId: 'next',
                requestBody: { $ref: 'https://example.test/link.json', name: 'kept' },
                parameters: { payload: { $ref: './parameter.json', name: 'kept' } },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Pet: {
        type: 'object',
        default: { $ref: './default.json', name: 'kept' },
        enum: [{ $ref: './enum.json', name: 'kept' }],
        const: { $ref: './const.json', name: 'kept' },
        examples: [{ $ref: './schema-example.json', name: 'kept' }],
      },
    },
    parameters: {
      query: { name: 'query', in: 'query', example: { $ref: './query.json', name: 'kept' } },
    },
  },
}
