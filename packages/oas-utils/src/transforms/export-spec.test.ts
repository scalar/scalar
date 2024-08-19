import { exportSpecFromWorkspace } from '@/transforms/export-spec'
import { importSpecToWorkspace } from '@/transforms/import-spec'
import { describe, expect, test } from 'vitest'

const testSpec = {
  'openapi': '3.1.0',
  'info': {
    title: 'Swagger Petstore - OpenAPI 3.1',
    version: '1.0.0',
  },
  'paths': {
    '/pet': {
      put: {
        tags: ['pet'],
        summary: 'Update an existing pet',
        description: 'Update an existing pet by Id',
        operationId: 'updatePet',
        parameters: [
          {
            in: 'query',
            name: 'id',
            schema: {
              type: 'string',
            },
          },
          {
            in: 'query',
            name: 'type',
            schema: {
              type: 'string',
              enum: ['cat', 'dog', 'frog', 'bat'],
            },
          },
        ],
      },
    },
  },
  '/pet': {
    delete: {
      tags: ['pet'],
      summary: 'Delete an existing pet',
      description: 'Delete an existing pet by Id',
      operationId: 'deletePet',
      parameters: [
        {
          in: 'query',
          name: 'id',
          schema: {
            type: 'string',
          },
        },
      ],
    },
  },
}

describe('Converts a collection into a spec', () => {
  test('Handles basic spec', async () => {
    const workspace = await importSpecToWorkspace(testSpec)
    if (workspace.error) throw Error('Bad workspace')

    console.log(
      exportSpecFromWorkspace({
        collection: workspace.collection,
        requests: workspace.requests.reduce(
          (tot, curr) => ({
            ...tot,
            [curr.uid]: curr,
          }),
          {},
        ),
      }),
    )
  })
})
