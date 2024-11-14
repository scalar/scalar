import type {
  Request,
  RequestExample,
  SecurityScheme,
  Tag,
} from '@/entities/spec'
import { yaml } from '@/helpers'
import { exportSpecFromWorkspace } from '@/transforms/export-spec'
import { importSpecToWorkspace } from '@/transforms/import-spec'
import { describe, expect, test } from 'vitest'

/** Convert an array of objects into a map of objects by UID */
function arrayToUidMap<T extends { uid: string }>(array: T[]) {
  return array.reduce<Record<string, T>>((map, item) => {
    map[item.uid] = item
    return map
  }, {})
}

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

console.log(yaml.stringify(testSpec))
describe('Converts a collection into a spec', () => {
  test('Handles basic spec', async () => {
    const workspace = await importSpecToWorkspace(testSpec)
    if (workspace.error) throw Error('Bad workspace')

    const exported = exportSpecFromWorkspace({
      requests: arrayToUidMap<Request>(workspace.requests),
      collection: workspace.collection,
      requestExamples: arrayToUidMap<RequestExample>(workspace.examples),
      securitySchemes: arrayToUidMap<SecurityScheme>(workspace.securitySchemes),
      tags: arrayToUidMap<Tag>(workspace.tags),
    })

    console.log(yaml.stringify(exported))
  })
})
