import { merge } from '@/diff/merge'
import { diff } from '@/diff/diff'
import { describe, expect, test } from 'vitest'

const deepClone = <T extends object>(obj: T) => JSON.parse(JSON.stringify(obj)) as T

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T

describe('mergeDiff', () => {
  test('should correctly merge the diffs and get conflicting changes', () => {
    const baseDoc = {
      openapi: '3.0.0',
      info: {
        title: 'Simple API',
        description: 'A small OpenAPI specification example',
        version: '1.0.0',
      },
    }

    const doc1 = {
      ...baseDoc,
      info: {
        ...baseDoc.info,
        title: 'New title',
      },
    }

    const clonedBase = deepClone<Partial<typeof baseDoc>>(baseDoc)
    const deletedInformation = clonedBase.info
    delete clonedBase.info

    const doc2 = {
      ...clonedBase,
    }

    expect(merge(diff(baseDoc, doc1), diff(baseDoc, doc2))).toEqual({
      diffs: [],
      conflicts: [
        [
          [
            {
              path: ['info', 'title'],
              changes: doc1.info.title,
              type: 'update',
            },
          ],
          [{ path: ['info'], changes: deletedInformation, type: 'delete' }],
        ],
      ],
    })

    expect(merge(diff(baseDoc, doc2), diff(baseDoc, doc1))).toEqual({
      diffs: [],
      conflicts: [
        [
          [{ path: ['info'], changes: deletedInformation, type: 'delete' }],
          [
            {
              path: ['info', 'title'],
              changes: doc1.info.title,
              type: 'update',
            },
          ],
        ],
      ],
    })
  })

  test('should correctly merge the diffs and get deeply nested conflicting changes', () => {
    const baseDoc = {
      openapi: '3.0.0',
      info: {
        title: 'Simple API',
        description: 'A small OpenAPI specification example',
        version: '1.0.0',
      },
      paths: {
        '/users': {
          get: {
            summary: 'Get a list of users',
            operationId: 'getUsers',
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
                          id: { type: 'integer' },
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

    const doc1 = {
      ...baseDoc,
      paths: {
        ...baseDoc.paths,
        '/users': {
          ...baseDoc.paths?.['/users'],
          delete: {
            summary: 'Delete all users',
            operationId: 'delete',
            responses: {
              '200': {
                description: 'All users deleted successfully',
              },
            },
          },
        },
        '/users/{id}': {
          get: {
            summary: 'Get a user by ID',
            operationId: 'getUserById',
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'integer' },
              },
            ],
            responses: {
              '200': {
                description: 'User details',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                      },
                    },
                  },
                },
              },
              '404': {
                description: 'User not found',
              },
            },
          },
        },
      },
    }

    const clonedBase = deepClone<DeepPartial<typeof baseDoc>>(baseDoc)
    const deletedDescription = clonedBase.info?.description
    delete clonedBase.info?.description

    const doc2 = {
      ...clonedBase,
      paths: {
        ...clonedBase.paths,
        '/users': {
          ...clonedBase.paths?.['/users'],
          delete: {
            summary: 'Delete all users',
            operationId: 'deleteUsers',
            responses: {
              '200': {
                description: 'All users deleted successfully',
              },
            },
          },
        },
      },
    }

    expect(merge(diff(baseDoc, doc1), diff(baseDoc, doc2))).toEqual({
      diffs: [
        {
          path: ['paths', '/users/{id}'],
          changes: doc1.paths['/users/{id}'],
          type: 'add',
        },
        {
          path: ['info', 'description'],
          changes: deletedDescription,
          type: 'delete',
        },
      ],
      conflicts: [
        [
          [
            {
              path: ['paths', '/users', 'delete'],
              changes: doc1.paths['/users'].delete,
              type: 'add',
            },
          ],
          [
            {
              path: ['paths', '/users', 'delete'],
              changes: doc2.paths['/users'].delete,
              type: 'add',
            },
          ],
        ],
      ],
    })

    expect(merge(diff(baseDoc, doc2), diff(baseDoc, doc1))).toEqual({
      diffs: [
        {
          path: ['info', 'description'],
          changes: deletedDescription,
          type: 'delete',
        },
        {
          path: ['paths', '/users/{id}'],
          changes: doc1.paths['/users/{id}'],
          type: 'add',
        },
      ],
      conflicts: [
        [
          [
            {
              path: ['paths', '/users', 'delete'],
              changes: doc2.paths['/users'].delete,
              type: 'add',
            },
          ],
          [
            {
              path: ['paths', '/users', 'delete'],
              changes: doc1.paths['/users'].delete,
              type: 'add',
            },
          ],
        ],
      ],
    })
  })

  test('non conflicting addition of paths', () => {
    const base = {
      openapi: '3.0.0',
      info: {
        title: 'Sample API',
        version: '1.0',
      },
      paths: {
        '/users': {
          get: {
            summary: 'Get users',
            responses: {
              200: {
                description: 'Successful response',
              },
            },
          },
        },
      },
    }

    const doc1 = {
      ...base,
      paths: {
        ...base.paths,
        '/products': {
          get: {
            summary: 'Get products',
            responses: {
              200: {
                description: 'Successful response',
              },
            },
          },
        },
      },
    }

    const doc2 = {
      ...base,
      paths: {
        ...base.paths,
        '/orders': {
          get: {
            summary: 'Get orders',
            responses: {
              200: {
                description: 'Successful response',
              },
            },
          },
        },
      },
    }

    expect(merge(diff(base, doc1), diff(base, doc2))).toEqual({
      diffs: [
        {
          path: ['paths', '/products'],
          changes: doc1.paths['/products'],
          type: 'add',
        },
        {
          path: ['paths', '/orders'],
          changes: doc2.paths['/orders'],
          type: 'add',
        },
      ],
      conflicts: [],
    })

    expect(merge(diff(base, doc2), diff(base, doc1))).toEqual({
      diffs: [
        {
          path: ['paths', '/orders'],
          changes: doc2.paths['/orders'],
          type: 'add',
        },
        {
          path: ['paths', '/products'],
          changes: doc1.paths['/products'],
          type: 'add',
        },
      ],
      conflicts: [],
    })
  })

  test('updates in the same path', () => {
    const base = {
      openapi: '3.0.0',
      info: {
        title: 'Sample API',
        version: '1.0',
      },
      paths: {
        '/users': {
          get: {
            summary: 'Get users',
            responses: {
              200: {
                description: 'Successful response',
              },
            },
          },
        },
      },
    }

    const doc1 = {
      ...base,
      paths: {
        ...base.paths,
        '/users': {
          get: {
            summary: 'Retrieve all users',
            responses: {
              200: {
                description: 'Successful response',
              },
            },
          },
        },
      },
    }

    const doc2 = {
      ...base,
      paths: {
        ...base.paths,
        '/users': {
          get: {
            summary: 'List all users',
            responses: {
              200: {
                description: 'Successful response',
              },
            },
          },
        },
      },
    }

    expect(merge(diff(base, doc1), diff(base, doc2))).toEqual({
      diffs: [],
      conflicts: [
        [
          [
            {
              path: ['paths', '/users', 'get', 'summary'],
              changes: doc1.paths['/users'].get.summary,
              type: 'update',
            },
          ],
          [
            {
              path: ['paths', '/users', 'get', 'summary'],
              changes: doc2.paths['/users'].get.summary,
              type: 'update',
            },
          ],
        ],
      ],
    })

    expect(merge(diff(base, doc2), diff(base, doc1))).toEqual({
      diffs: [],
      conflicts: [
        [
          [
            {
              path: ['paths', '/users', 'get', 'summary'],
              changes: doc2.paths['/users'].get.summary,
              type: 'update',
            },
          ],
          [
            {
              path: ['paths', '/users', 'get', 'summary'],
              changes: doc1.paths['/users'].get.summary,
              type: 'update',
            },
          ],
        ],
      ],
    })
  })

  test('removing and modifying the same path', () => {
    const base = {
      openapi: '3.0.0',
      info: {
        title: 'Sample API',
        version: '1.0',
      },
      paths: {
        '/users': {
          get: {
            summary: 'Get users',
            responses: {
              200: {
                description: 'Successful response',
              },
            },
          },
        },
      },
    }

    const baseClone = deepClone<DeepPartial<typeof base>>(base)
    const removePaths = baseClone.paths?.['/users']?.get?.summary
    delete baseClone.paths?.['/users']?.get?.summary

    const doc1 = {
      ...baseClone,
    }

    const doc2 = {
      ...base,
      paths: {
        ...base.paths,
        '/users': {
          ...base.paths['/users'],
          get: {
            ...base.paths['/users'].get,
            summary: 'Get all registered users',
          },
        },
      },
    }

    expect(merge(diff(base, doc1), diff(base, doc2))).toEqual({
      diffs: [],
      conflicts: [
        [
          [
            {
              path: ['paths', '/users', 'get', 'summary'],
              changes: removePaths,
              type: 'delete',
            },
          ],
          [
            {
              path: ['paths', '/users', 'get', 'summary'],
              changes: doc2.paths['/users'].get.summary,
              type: 'update',
            },
          ],
        ],
      ],
    })

    expect(merge(diff(base, doc2), diff(base, doc1))).toEqual({
      diffs: [],
      conflicts: [
        [
          [
            {
              path: ['paths', '/users', 'get', 'summary'],
              changes: doc2.paths['/users'].get.summary,
              type: 'update',
            },
          ],
          [
            {
              path: ['paths', '/users', 'get', 'summary'],
              changes: removePaths,
              type: 'delete',
            },
          ],
        ],
      ],
    })
  })

  test('delete parent node and inner children node should only keep the higher level change', () => {
    const base = {
      openapi: '3.0.0',
      info: {
        title: 'Sample API',
        version: '1.0',
      },
      paths: {
        '/users': {
          get: {
            summary: 'Get users',
            responses: {
              200: {
                description: 'Successful response',
              },
            },
          },
        },
      },
    }

    const doc1 = deepClone<DeepPartial<typeof base>>(base)
    delete doc1.paths?.['/users']?.get?.summary

    const doc2 = deepClone<DeepPartial<typeof base>>(base)
    const removePaths2 = doc2.paths?.['/users']
    delete doc2.paths?.['/users']

    expect(merge(diff(base, doc1), diff(base, doc2))).toEqual({
      diffs: [
        {
          path: ['paths', '/users'],
          changes: removePaths2,
          type: 'delete',
        },
      ],
      conflicts: [],
    })

    expect(merge(diff(base, doc2), diff(base, doc1))).toEqual({
      diffs: [
        {
          path: ['paths', '/users'],
          changes: removePaths2,
          type: 'delete',
        },
      ],
      conflicts: [],
    })
  })

  test('deleting the same path on both documents should not resolve in a conflict', () => {
    const base = {
      openapi: '3.0.0',
      info: {
        title: 'Sample API',
        version: '1.0',
      },
      paths: {
        '/users': {
          get: {
            summary: 'Get users',
            responses: {
              200: {
                description: 'Successful response',
              },
            },
          },
        },
      },
    }

    const doc1 = deepClone<DeepPartial<typeof base>>(base)
    const doc2 = deepClone<DeepPartial<typeof base>>(base)

    delete doc1.paths?.['/users']?.get
    delete doc2.paths?.['/users']?.get

    expect(merge(diff(base, doc1), diff(base, doc2))).toEqual({
      diffs: [
        {
          type: 'delete',
          changes: base.paths['/users'].get,
          path: ['paths', '/users', 'get'],
        },
      ],
      conflicts: [],
    })

    expect(merge(diff(base, doc2), diff(base, doc1))).toEqual({
      diffs: [
        {
          type: 'delete',
          changes: base.paths['/users'].get,
          path: ['paths', '/users', 'get'],
        },
      ],
      conflicts: [],
    })
  })

  test('adding the same key should not resolve in a conflict', () => {
    const base = {
      openapi: '3.0.0',
      info: {
        title: 'Sample API',
        version: '1.0',
      },
    }

    const doc1 = {
      ...base,
      info: {
        ...base.info,
        description: 'Provides a way to interact with the playground',
      },
    }

    const doc2 = {
      ...base,
      info: {
        ...base.info,
        description: doc1.info.description,
      },
    }

    expect(merge(diff(base, doc1), diff(base, doc2))).toEqual({
      diffs: [
        {
          type: 'add',
          changes: doc1.info.description,
          path: ['info', 'description'],
        },
      ],
      conflicts: [],
    })

    expect(merge(diff(base, doc2), diff(base, doc1))).toEqual({
      diffs: [
        {
          type: 'add',
          changes: doc1.info.description,
          path: ['info', 'description'],
        },
      ],
      conflicts: [],
    })
  })

  test('adding the same object should not resolve in a conflict', () => {
    const base = {
      openapi: '3.0.0',
    }

    const doc1 = {
      ...base,
      info: {
        title: 'Sample API',
        version: '1.0',
      },
    }

    const doc2 = {
      ...base,
      info: {
        title: 'Sample API',
        version: '1.0',
      },
    }

    expect(merge(diff(base, doc1), diff(base, doc2))).toEqual({
      diffs: [
        {
          type: 'add',
          changes: doc1.info,
          path: ['info'],
        },
      ],
      conflicts: [],
    })

    expect(merge(diff(base, doc2), diff(base, doc1))).toEqual({
      diffs: [
        {
          type: 'add',
          changes: doc1.info,
          path: ['info'],
        },
      ],
      conflicts: [],
    })
  })

  test("adding similar object that can't be merged in the same path should result in a conflict", () => {
    const base = {
      openapi: '3.0.0',
    }

    const doc1 = {
      ...base,
      info: {
        title: 'Sample API',
        version: '1.0',
      },
    }

    const doc2 = {
      ...base,
      info: {
        title: 'Sample',
        version: '1.0',
      },
    }

    expect(merge(diff(base, doc1), diff(base, doc2))).toEqual({
      diffs: [],
      conflicts: [
        [
          [
            {
              type: 'add',
              changes: doc1.info,
              path: ['info'],
            },
          ],
          [
            {
              type: 'add',
              changes: doc2.info,
              path: ['info'],
            },
          ],
        ],
      ],
    })

    expect(merge(diff(base, doc2), diff(base, doc1))).toEqual({
      diffs: [],
      conflicts: [
        [
          [
            {
              type: 'add',
              changes: doc2.info,
              path: ['info'],
            },
          ],
          [
            {
              type: 'add',
              changes: doc1.info,
              path: ['info'],
            },
          ],
        ],
      ],
    })
  })

  test('adding the same value on the same path should not result in a conflict', () => {
    const base = {
      openapi: '3.0.0',
      info: {
        title: 'Sample API',
      },
    }

    const doc1 = {
      ...base,
      info: {
        ...base.info,
        version: '1.0',
      },
    }

    const doc2 = {
      ...base,
      info: {
        ...base.info,
        version: '1.0',
      },
    }

    expect(merge(diff(base, doc1), diff(base, doc2))).toEqual({
      diffs: [
        {
          type: 'add',
          changes: doc1.info.version,
          path: ['info', 'version'],
        },
      ],
      conflicts: [],
    })

    expect(merge(diff(base, doc2), diff(base, doc1))).toEqual({
      diffs: [
        {
          type: 'add',
          changes: doc1.info.version,
          path: ['info', 'version'],
        },
      ],
      conflicts: [],
    })
  })

  test('should return multiple one to many conflicts for the related conflicts', () => {
    const base = {
      openapi: '3.0.0',
      info: {
        title: 'Sample API',
        version: '1.0',
      },
      paths: {
        '/users': {
          get: {
            summary: 'Get users',
            responses: {
              200: {
                description: 'Successful response',
              },
            },
          },
        },
        '/pets': {
          get: {
            summary: 'Get pets',
            responses: {
              200: {
                description: 'Successful response',
              },
            },
          },
        },
      },
    }

    const doc1 = deepClone<DeepPartial<typeof base>>(base)
    const deletedUsersChanges = doc1.paths?.['/users']
    const deletedPetsChanges = doc1.paths?.['/pets']
    delete doc1.paths?.['/users']
    delete doc1.paths?.['/pets']

    const doc2 = {
      ...base,
      info: {
        ...base.info,
      },
      paths: {
        ...base.paths,
        '/users': {
          ...base.paths['/users'],
          get: {
            ...base.paths['/users'].get,
            summary: 'Updated summary',
            responses: {
              ...base.paths['/users'].get.responses,
              200: {
                ...base.paths['/users'].get.responses[200],
                description: 'Updated Successful response',
              },
              400: {
                description: 'Error response',
              },
            },
          },
        },
        '/pets': {
          ...base.paths['/pets'],
          get: {
            ...base.paths['/pets'].get,
            summary: 'Updated summary',
            responses: {
              ...base.paths['/pets'].get.responses,
              200: {
                ...base.paths['/pets'].get.responses[200],
                description: 'Updated Successful response',
              },
              400: {
                description: 'Error response',
              },
            },
          },
        },
      },
    }

    expect(merge(diff(base, doc1), diff(base, doc2))).toEqual({
      diffs: [],
      conflicts: [
        [
          [
            {
              type: 'delete',
              changes: deletedUsersChanges,
              path: ['paths', '/users'],
            },
          ],
          [
            {
              type: 'update',
              changes: doc2.paths['/users'].get.summary,
              path: ['paths', '/users', 'get', 'summary'],
            },
            {
              type: 'update',
              changes: doc2.paths['/users'].get.responses[200].description,
              path: ['paths', '/users', 'get', 'responses', '200', 'description'],
            },
            {
              type: 'add',
              changes: doc2.paths['/users'].get.responses[400],
              path: ['paths', '/users', 'get', 'responses', '400'],
            },
          ],
        ],
        [
          [
            {
              type: 'delete',
              changes: deletedPetsChanges,
              path: ['paths', '/pets'],
            },
          ],
          [
            {
              type: 'update',
              changes: doc2.paths['/pets'].get.summary,
              path: ['paths', '/pets', 'get', 'summary'],
            },
            {
              type: 'update',
              changes: doc2.paths['/pets'].get.responses[200].description,
              path: ['paths', '/pets', 'get', 'responses', '200', 'description'],
            },
            {
              type: 'add',
              changes: doc2.paths['/pets'].get.responses[400],
              path: ['paths', '/pets', 'get', 'responses', '400'],
            },
          ],
        ],
      ],
    })

    expect(merge(diff(base, doc2), diff(base, doc1))).toEqual({
      diffs: [],
      conflicts: [
        [
          [
            {
              type: 'update',
              changes: doc2.paths['/users'].get.summary,
              path: ['paths', '/users', 'get', 'summary'],
            },
            {
              type: 'update',
              changes: doc2.paths['/users'].get.responses[200].description,
              path: ['paths', '/users', 'get', 'responses', '200', 'description'],
            },
            {
              type: 'add',
              changes: doc2.paths['/users'].get.responses[400],
              path: ['paths', '/users', 'get', 'responses', '400'],
            },
          ],
          [
            {
              type: 'delete',
              changes: deletedUsersChanges,
              path: ['paths', '/users'],
            },
          ],
        ],
        [
          [
            {
              type: 'update',
              changes: doc2.paths['/pets'].get.summary,
              path: ['paths', '/pets', 'get', 'summary'],
            },
            {
              type: 'update',
              changes: doc2.paths['/pets'].get.responses[200].description,
              path: ['paths', '/pets', 'get', 'responses', '200', 'description'],
            },
            {
              type: 'add',
              changes: doc2.paths['/pets'].get.responses[400],
              path: ['paths', '/pets', 'get', 'responses', '400'],
            },
          ],
          [
            {
              type: 'delete',
              changes: deletedPetsChanges,
              path: ['paths', '/pets'],
            },
          ],
        ],
      ],
    })
  })

  test('inner delete should not conflict with an outer update or addition', () => {
    const base = {
      openapi: '3.0.0',
      info: {
        title: 'Sample API',
        version: '1.0',
      },
      paths: {
        '/users': {
          get: {
            summary: 'Get users',
            responses: {
              200: {
                description: 'Successful response',
              },
            },
          },
        },
        '/pets': {
          get: {
            summary: 'Get pets',
            responses: {
              200: {
                description: 'Successful response',
              },
            },
          },
        },
      },
    }

    const doc1 = deepClone<DeepPartial<typeof base>>(base)
    const deletedUsersChanges = doc1.paths?.['/users']?.get?.responses
    const deletedPetsChanges = doc1.paths?.['/pets']?.get?.responses
    delete doc1.paths?.['/users']?.get?.responses
    delete doc1.paths?.['/pets']?.get?.responses

    const doc2 = {
      ...base,
      info: {
        ...base.info,
      },
      paths: {
        ...base.paths,
        '/users': {
          ...base.paths['/users'],
          post: {
            summary: 'Create a new user',
          },
        },
        '/pets': {
          ...base.paths['/pets'],
        },
      },
    }

    expect(merge(diff(base, doc1), diff(base, doc2))).toEqual({
      diffs: [
        {
          type: 'delete',
          changes: deletedUsersChanges,
          path: ['paths', '/users', 'get', 'responses'],
        },
        {
          type: 'delete',
          changes: deletedPetsChanges,
          path: ['paths', '/pets', 'get', 'responses'],
        },
        {
          type: 'add',
          changes: doc2.paths['/users'].post,
          path: ['paths', '/users', 'post'],
        },
      ],
      conflicts: [],
    })
  })
})
