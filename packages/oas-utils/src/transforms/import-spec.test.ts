import { importSpecToWorkspace } from '@/transforms/import-spec'
import { describe, expect, test } from 'vitest'

const circular = {
  openapi: '3.0.1',
  info: {
    title: 'Test OpenAPI definition',
    version: '1.0.0',
  },
  paths: {
    '/api/v1/updateEmployee': {
      put: {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Employee',
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
      Employee: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
          },
          manager: {
            $ref: '#/components/schemas/Employee',
          },
          team: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Employee',
            },
          },
        },
      },
    },
  },
}

describe('Import OAS Specs', () => {
  test('Handles circular', async () => {
    const res = await importSpecToWorkspace(circular)
    expect(res.requests[0].path).toEqual('/api/v1/updateEmployee')
  })
})
