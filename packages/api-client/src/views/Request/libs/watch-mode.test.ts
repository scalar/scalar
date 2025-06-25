import type { WorkspaceStore } from '@/store'
import type { ActiveEntitiesStore } from '@/store/active-entities'
import json from '@scalar/galaxy/3.1.json'
import {
  type Request,
  type SecurityScheme,
  type Server,
  type Tag,
  collectionSchema,
  operationSchema,
  securityHttpSchema,
  securitySchemeSchema,
  serverSchema,
  tagSchema,
} from '@scalar/oas-utils/entities/spec'
import { parseSchema } from '@scalar/oas-utils/transforms'
import microdiff, { type Difference } from 'microdiff'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import {
  combineRenameDiffs,
  mutateCollectionDiff,
  mutateRequestDiff,
  mutateSecuritySchemeDiff,
  mutateServerDiff,
  mutateTagDiff,
  narrowUnionSchema,
  parseDiff,
  traverseZodSchema,
} from './watch-mode'

const mockRequests: Record<`request${number}uid`, Request> = {
  request1uid: operationSchema.parse({
    uid: 'request1uid',
    method: 'get',
    path: '/planets',
    parameters: [
      {
        name: 'limit',
        in: 'query',
        required: false,
        deprecated: false,
        schema: { type: 'integer', format: 'int64', default: 10 },
      },
      {
        name: 'offset',
        in: 'query',
        required: false,
        deprecated: false,
        schema: { type: 'integer', format: 'int64', default: 0 },
      },
      {
        name: 'else',
        in: 'query',
        required: false,
        deprecated: false,
        schema: { type: 'boolean', default: false },
      },
    ] as const,
    summary: 'Get all planets',
    description: 'Retrieve all planets',
  }),
  request2uid: operationSchema.parse({
    uid: 'request2uid',
    method: 'post',
    path: '/planets',
    requestBody: {
      description: 'Planet',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['id', 'name'],
            properties: {
              id: {
                'type': 'integer',
                'format': 'int64',
                'examples': [1],
                'x-variable': 'planetId',
              },
              name: {
                type: 'string',
                examples: ['Mars'],
              },
              description: {
                type: ['string', 'null'],
                examples: ['The red planet'],
              },
              image: {
                type: 'string',
                nullable: true,
                examples: ['https://cdn.scalar.com/photos/mars.jpg'],
              },
              creator: {
                type: 'object',
                required: ['id', 'name', 'email'],
                properties: {
                  id: {
                    type: 'integer',
                    format: 'int64',
                    examples: [1],
                  },
                  name: {
                    type: 'string',
                    examples: ['Marc'],
                  },
                  email: {
                    type: 'string',
                    format: 'email',
                    examples: ['marc@scalar.com'],
                  },
                },
              },
            },
          },
        },
      },
    },
    selectedSecuritySchemeUids: [],
    selectedServerUid: '',
    servers: [],
    parameters: [],
    summary: 'Create a new planet',
    description: 'Add a new planet to the database',
  }),
  request3uid: operationSchema.parse({
    uid: 'request3uid',
    method: 'get',
    path: '/planets/{planetId}',
    summary: 'Get a planet by ID',
    description: 'Retrieve a single planet by its ID',
  }),
}

const mockCollection = Object.freeze(
  collectionSchema.parse({
    uid: 'collection1',
    openapi: '3.1.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
      description: 'A test API for unit testing',
    },
    requests: Object.keys(mockRequests),
    servers: ['server1', 'server2', 'server3'],
    security: [{ bearerAuth: ['read:users', 'read:events'] }, { apiKeyQuery: [] }],
    tags: ['tag1uid', 'tag2uid', 'tag3uid'],
  }),
)
const mockSecuritySchemes: Record<string, SecurityScheme> = {
  apiKeyUid: securitySchemeSchema.parse({
    uid: 'apiKeyUid',
    nameKey: 'apiKeyHeader',
    type: 'apiKey',
    name: 'api_key',
    in: 'header',
    value: 'test-api-key',
  }),
  oauth2: securitySchemeSchema.parse({
    uid: 'oauth2-uid',
    type: 'oauth2',
    nameKey: 'oauth2',
    flows: {
      implicit: {
        'type': 'implicit',
        'authorizationUrl': 'https://example.com/oauth/authorize',
        'refreshUrl': 'http://referesh.com',
        'selectedScopes': [],
        'x-scalar-redirect-uri': '',
        'x-scalar-client-id': 'random-1',
        'token': 'text-implicit-token',
        'scopes': {
          'write:api': 'modify api',
          'read:api': 'read api',
        },
      },
    },
  }),
}

const mockActiveEntities = {
  activeCollection: { value: mockCollection },
} as unknown as ActiveEntitiesStore

const original = (await parseSchema(json)).schema

describe('combineRenameDiffs', () => {
  let mutated: any

  // Clone fresh schemas
  beforeEach(() => {
    mutated = structuredClone(original)
  })

  it('creates a change migration for renaming a path with no other changes', () => {
    // Rename a path
    mutated.paths['/planoots'] = { ...mutated.paths['/planets'] }
    delete mutated.paths['/planets']

    const diff = microdiff(original, mutated)
    const combinedDiff = combineRenameDiffs(diff)

    expect(combinedDiff).toEqual([
      {
        type: 'CHANGE',
        path: ['paths', 'path'],
        oldValue: '/planets',
        value: '/planoots',
      } as Difference,
    ])
  })

  it('creates two change migrations for renaming a path with child diffs', () => {
    // Rename a path and modify a child property
    mutated.paths['/planoots'] = { ...mutated.paths['/planets'] }
    mutated.paths['/planoots'].get.summary = 'Get all planoots'
    delete mutated.paths['/planets']

    const diff = microdiff(original, mutated)
    const combinedDiff = combineRenameDiffs(diff)

    expect(combinedDiff).toEqual([
      {
        type: 'CHANGE',
        path: ['paths', 'path'],
        oldValue: '/planets',
        value: '/planoots',
      } as Difference,
      {
        type: 'CHANGE',
        path: ['paths', '/planoots', 'get', 'summary'],
        oldValue: 'Get all planets',
        value: 'Get all planoots',
      } as Difference,
    ])
  })

  it('creates two change migrations for renaming a path and a method', () => {
    // Rename a path and a method
    mutated.paths['/planoots'] = { ...mutated.paths['/planets'] }
    delete mutated.paths['/planets']

    mutated.paths['/planoots'].put = { ...mutated.paths['/planoots'].get }
    delete mutated.paths['/planoots'].get

    const diff = microdiff(original, mutated)
    const combinedDiff = combineRenameDiffs(diff)

    expect(combinedDiff).toEqual([
      {
        type: 'CHANGE',
        path: ['paths', 'path'],
        oldValue: '/planets',
        value: '/planoots',
      } as Difference,
      {
        type: 'CHANGE',
        path: ['paths', '/planoots', 'method'],
        oldValue: 'get',
        value: 'put',
      } as Difference,
    ])
  })

  it('creates a change migration for adding a new request', () => {
    const newRequest = {
      tags: ['Planets'],
      summary: 'Put all planets',
      description:
        "It's easy to say you know them all, but do you really? Retrieve all the planets and check whether you missed one.",
      operationId: 'putAllData',
      security: [{}],
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: {},
            },
          },
        },
      },
    }

    // Rename a method
    mutated.paths['/planets'].put = newRequest

    const diff = microdiff(original, mutated)
    const combinedDiff = combineRenameDiffs(diff)

    expect(combinedDiff).toEqual([
      {
        type: 'CREATE',
        path: ['paths', '/planets', 'put'],
        value: newRequest,
      } as Difference,
    ])
  })

  it('creates a change migration for changing a method with no other changes', () => {
    // Rename a method
    mutated.paths['/planets'].put = { ...mutated.paths['/planets'].get }
    delete mutated.paths['/planets'].get

    const diff = microdiff(original, mutated)
    const combinedDiff = combineRenameDiffs(diff)

    expect(combinedDiff).toEqual([
      {
        type: 'CHANGE',
        path: ['paths', '/planets', 'method'],
        oldValue: 'get',
        value: 'put',
      } as Difference,
    ])
  })

  it('creates a change migration for renaming a method with child diffs', () => {
    // Rename a method and modify a child property
    mutated.paths['/planets'].put = { ...mutated.paths['/planets'].get }
    mutated.paths['/planets'].put.summary = 'Update a planet'
    delete mutated.paths['/planets'].get

    const diff = microdiff(original, mutated)
    const combinedDiff = combineRenameDiffs(diff)

    expect(combinedDiff).toEqual([
      {
        type: 'CHANGE',
        path: ['paths', '/planets', 'method'],
        oldValue: 'get',
        value: 'put',
      } as Difference,
      {
        type: 'CHANGE',
        path: ['paths', '/planets', 'put', 'summary'],
        oldValue: 'Get all planets',
        value: 'Update a planet',
      } as Difference,
    ])
  })

  it('creates a create diff for adding a parameter to a request', () => {
    mutated.paths['/planets'].get.parameters.push({
      name: 'highroller',
      in: 'query',
      required: false,
      deprecated: false,
      schema: { type: 'integer', format: 'int32' },
    })

    const diff = microdiff(original, mutated)
    const combinedDiff = combineRenameDiffs(diff)

    expect(combinedDiff).toEqual([
      {
        type: 'CREATE',
        path: ['paths', '/planets', 'get', 'parameters', 2],
        value: {
          name: 'highroller',
          in: 'query',
          required: false,
          deprecated: false,
          schema: { type: 'integer', format: 'int32' },
        },
      },
    ])
  })

  it('creates a remove diff for removing a parameter', () => {
    mutated.paths['/planets'].get.parameters.pop()

    const diff = microdiff(original, mutated)
    const combinedDiff = combineRenameDiffs(diff)

    expect(combinedDiff).toEqual([
      {
        type: 'REMOVE',
        path: ['paths', '/planets', 'get', 'parameters', 1],
        oldValue: {
          description: 'The number of items to skip before starting to collect the result set',
          name: 'offset',
          in: 'query',
          required: false,
          schema: { default: 0, type: 'integer', format: 'int64' },
        },
      },
    ])
  })

  it('creates a change diff for changing a parameter', () => {
    mutated.paths['/planets'].get.parameters[0].name = 'highroller'

    const diff = microdiff(original, mutated)
    const combinedDiff = combineRenameDiffs(diff)

    expect(combinedDiff).toEqual([
      {
        type: 'CHANGE',
        path: ['paths', '/planets', 'get', 'parameters', 0, 'name'],
        oldValue: 'limit',
        value: 'highroller',
      },
    ])
  })

  // This one just tests microdiff but we use the value in another test
  it('creates a change diff for changing an oauth2 flow scope', () => {
    const mutatedSecuritySchemes = JSON.parse(JSON.stringify(mockSecuritySchemes))
    mutatedSecuritySchemes.oauth2.flows.implicit.scopes = {
      'write:api': 'modify api',
    }

    const diff = microdiff(mockSecuritySchemes, mutatedSecuritySchemes)
    const combinedDiff = combineRenameDiffs(diff)

    expect(combinedDiff).toEqual([
      {
        type: 'REMOVE',
        path: ['oauth2', 'flows', 'implicit', 'scopes', 'read:api'],
        oldValue: 'read api',
      },
    ])
  })

  it('handles deep changes in the schema', () => {
    // Modify a deep property in the schema
    mutated.paths['/planets'].get.responses['200'].content['application/json'].schema.allOf[0].properties.data.type =
      'number'

    const diff = microdiff(original, mutated)
    const combinedDiff = combineRenameDiffs(diff)
    expect(combinedDiff).toEqual([
      {
        type: 'CHANGE',
        path: [
          'paths',
          '/planets',
          'get',
          'responses',
          '200',
          'content',
          'application/json',
          'schema',
          'allOf',
          0,
          'properties',
          'data',
          'type',
        ],
        oldValue: 'array',
        value: 'number',
      } as Difference,
    ])
  })
})

describe('mutateCollectionDiff', () => {
  const mockStore = {
    collectionMutators: {
      edit: vi.fn(),
    },
  } as unknown as WorkspaceStore

  it('generates a payload for updating the title', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['info', 'title'],
      oldValue: 'Test API',
      value: 'Updated Test API',
    }

    const result = mutateCollectionDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.collectionMutators.edit).toHaveBeenCalledWith('collection1', 'info.title', 'Updated Test API')
  })

  it('generates a payload for updating the version', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['info', 'version'],
      oldValue: '1.0.0',
      value: '2.0.0',
    }

    const result = mutateCollectionDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.collectionMutators.edit).toHaveBeenCalledWith('collection1', 'info.version', '2.0.0')
  })

  it('generates a payload for updating the description', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['info', 'description'],
      oldValue: 'A test API for unit testing',
      value: 'An updated test API for unit testing',
    }

    const result = mutateCollectionDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.collectionMutators.edit).toHaveBeenCalledWith(
      'collection1',
      'info.description',
      'An updated test API for unit testing',
    )
  })

  it('generates a payload for adding a new property', () => {
    const diff: Difference = {
      type: 'CREATE',
      path: ['info', 'termsOfService'],
      value: 'https://example.com/terms',
    }
    const result = mutateCollectionDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.collectionMutators.edit).toHaveBeenCalledWith(
      'collection1',
      'info.termsOfService',
      'https://example.com/terms',
    )
  })

  it('generates a payload for removing a property', () => {
    const diff: Difference = {
      type: 'REMOVE',
      path: ['info', 'termsOfService'],
      oldValue: 'https://example.com/terms',
    }

    const result = mutateCollectionDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.collectionMutators.edit).toHaveBeenCalledWith('collection1', 'info.termsOfService', undefined)
  })

  it('generates a payload for adding a new security requirement', () => {
    const diff: Difference = {
      type: 'CREATE',
      path: ['security', 2],
      value: { oauth2: ['read:api', 'write:api'] },
    }

    const result = mutateCollectionDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.collectionMutators.edit).toHaveBeenCalledWith('collection1', 'security', [
      ...mockCollection.security,
      { oauth2: ['read:api', 'write:api'] },
    ])
  })

  it('generates a payload for removing a security requirement', () => {
    const diff: Difference = {
      type: 'REMOVE',
      path: ['security', 1],
      oldValue: { apiKeyQuery: [] },
    }

    const result = mutateCollectionDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.collectionMutators.edit).toHaveBeenCalledWith('collection1', 'security', [
      mockCollection.security[0],
    ])
  })

  it('generates a payload for adding a security scope to oauth2', () => {
    const diff: Difference = {
      type: 'CREATE',
      path: ['security', 0, 'bearerAuth', 2],
      value: 'write:events',
    }

    const result = mutateCollectionDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.collectionMutators.edit).toHaveBeenCalledWith('collection1', 'security.0.bearerAuth', [
      'read:users',
      'read:events',
      'write:events',
    ])
  })

  it('generates a payload for removing a security scope from oauth2', () => {
    const diff: Difference = {
      type: 'REMOVE',
      path: ['security', 0, 'bearerAuth', 1],
      oldValue: 'read:events',
    }

    const result = mutateCollectionDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.collectionMutators.edit).toHaveBeenCalledWith('collection1', 'security.0.bearerAuth', [
      'read:users',
    ])
  })
})

describe('mutateServerDiff', () => {
  const mockServers: Record<string, Server> = {
    server1: serverSchema.parse({
      uid: 'server1',
      url: 'https://api.example.com',
      description: 'Production server',
    }),
    server2: serverSchema.parse({
      uid: 'server2',
      url: 'https://staging.example.com',
      description: 'Staging server',
    }),
    server3: serverSchema.parse({
      uid: 'server3',
      url: 'https://{environment}.example.com/{version}/',
      description: 'Development server',
      variables: {
        version: { default: 'v1', enum: ['v1', 'v2'] },
        environment: {
          default: 'production',
          enum: ['production', 'staging'],
        },
      },
    }),
  }
  const mockStore = {
    servers: mockServers,
    serverMutators: {
      edit: vi.fn(),
      delete: vi.fn(),
      add: vi.fn(),
    },
  } as unknown as WorkspaceStore

  it('generates an edit payload for updating a server property', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['servers', 0, 'url'],
      oldValue: 'https://api.example.com',
      value: 'https://new-api.example.com',
    }

    const result = mutateServerDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.serverMutators.edit).toHaveBeenCalledWith('server1', 'url', 'https://new-api.example.com')
  })

  it('generates a delete payload for removing a server', () => {
    const diff: Difference = {
      type: 'REMOVE',
      path: ['servers', 1],
      oldValue: mockServers.server2,
    }

    const result = mutateServerDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.serverMutators.delete).toHaveBeenCalledWith('server2', 'collection1')
  })

  it('generates an add payload for creating a new server', () => {
    const newServer = serverSchema.parse({
      uid: 'server4',
      url: 'https://test.example.com',
      description: 'Test server',
    })
    const diff: Difference = {
      type: 'CREATE',
      path: ['servers', 3],
      value: newServer,
    }

    const result = mutateServerDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.serverMutators.add).toHaveBeenCalledWith(newServer, 'collection1')
  })

  it('generates an edit payload for adding a server variable', () => {
    const diff: Difference = {
      type: 'CREATE',
      path: ['servers', 0, 'variables', 'newVar'],
      value: { default: 'default', enum: ['default', 'other'] },
    }

    const result = mutateServerDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.serverMutators.edit).toHaveBeenCalledWith('server1', 'variables.newVar', {
      default: 'default',
      enum: ['default', 'other'],
    })
  })

  it('generates an edit payload for updating a server variable', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['servers', 2, 'variables', 'version', 'default'],
      oldValue: 'v1',
      value: 'v2',
    }

    const result = mutateServerDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.serverMutators.edit).toHaveBeenCalledWith('server3', 'variables.version.default', 'v2')
  })

  it('generates an edit payload for removing a server variable', () => {
    const diff: Difference = {
      type: 'REMOVE',
      path: ['servers', 2, 'variables', 'version'],
      oldValue: { default: 'v1', enum: ['v1', 'v2'] },
    }

    const result = mutateServerDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.serverMutators.edit).toHaveBeenCalledWith('server3', 'variables.version', undefined)
  })

  it('generates an edit payload for adding all variables to a server', () => {
    const diff: Difference = {
      type: 'CREATE',
      path: ['servers', 1, 'variables'],
      value: {
        version: { default: 'v1', enum: ['v1', 'v2'] },
        environment: { default: 'staging', enum: ['production', 'staging'] },
      },
    }

    const result = mutateServerDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.serverMutators.edit).toHaveBeenCalledWith('server2', 'variables', {
      version: { default: 'v1', enum: ['v1', 'v2'] },
      environment: { default: 'staging', enum: ['production', 'staging'] },
    })
  })

  it('generates an edit payload for removing all variables from a server', () => {
    const diff: Difference = {
      type: 'REMOVE',
      path: ['servers', 2, 'variables'],
      oldValue: mockServers.server3?.variables,
    }

    const result = mutateServerDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.serverMutators.edit).toHaveBeenCalledWith('server3', 'variables', {})
  })

  it('generates an edit payload for updating a server variable enum', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['servers', 2, 'variables', 'version', 'enum'],
      oldValue: ['v1', 'v2'],
      value: ['v1', 'v2', 'v3'],
    }

    const result = mutateServerDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.serverMutators.edit).toHaveBeenCalledWith('server3', 'variables.version.enum', ['v1', 'v2', 'v3'])
  })

  it('returns false when trying to edit a non-existent server', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['servers', 4, 'url'],
      oldValue: 'https://nonexistent.example.com',
      value: 'https://new-nonexistent.example.com',
    }

    const result = mutateServerDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(false)
  })

  it('returns false for if a server is not found', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['servers', 99, 'variables', 'port'],
      oldValue: [99],
      value: [99],
    }

    const result = mutateServerDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(false)
  })

  it('returns false for unhandled diff types', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['servers', 'what', 'no'],
      oldValue: [],
      value: [],
    }

    const result = mutateServerDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(false)
  })
})

describe('mutateTagDiff', () => {
  const mockTags: Record<string, Tag> = {
    tag1uid: tagSchema.parse({
      uid: 'tag1uid',
      name: 'Tag 1',
      description: 'First tag',
    }),
    tag2uid: tagSchema.parse({
      uid: 'tag2uid',
      name: 'Tag 2',
      description: 'Second tag',
      'x-scalar-children': [],
    }),
    tag3uid: tagSchema.parse({
      uid: 'tag3uid',
      name: 'Tag 3',
      description: 'Third tag',
    }),
  }

  const mockStore = {
    tags: mockTags,
    tagMutators: {
      edit: vi.fn(),
      delete: vi.fn(),
      add: vi.fn(),
    },
  } as unknown as WorkspaceStore

  it('generates an add payload for creating a new tag', () => {
    const newTag = tagSchema.parse({
      'uid': 'tag4uid',
      'name': 'New Tag',
      'description': 'New tag description',
    })
    const diff: Difference = {
      type: 'CREATE',
      path: ['tags', 3],
      value: newTag,
    }

    const result = mutateTagDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.tagMutators.add).toHaveBeenCalledWith(newTag, 'collection1')
  })

  it('generates a remove payload for deleting a tag', () => {
    const diff: Difference = {
      type: 'REMOVE',
      path: ['tags', 1],
      oldValue: mockTags.tag2,
    }

    const result = mutateTagDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.tagMutators.delete).toHaveBeenCalledWith(
      {
        'type': 'tag',
        'uid': 'tag2uid',
        'name': 'Tag 2',
        'description': 'Second tag',
        'children': [],
        'x-scalar-children': [],
      },
      'collection1',
    )
  })

  it('generates an edit payload for updating a tag name', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['tags', 0, 'name'],
      oldValue: 'Tag 1',
      value: 'Updated Tag 1',
    }

    const result = mutateTagDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.tagMutators.edit).toHaveBeenCalledWith('tag1uid', 'name', 'Updated Tag 1')
  })

  it('generates an edit payload for updating a tag description', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['tags', 1, 'description'],
      oldValue: 'Second tag',
      value: 'Updated second tag',
    }

    const result = mutateTagDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.tagMutators.edit).toHaveBeenCalledWith('tag2uid', 'description', 'Updated second tag')
  })

  it('generates an edit payload for adding a new property to a tag', () => {
    const diff: Difference = {
      type: 'CREATE',
      path: ['tags', 2, 'externalDocs'],
      value: { url: 'https://example.com/docs' },
    }

    const result = mutateTagDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.tagMutators.edit).toHaveBeenCalledWith('tag3uid', 'externalDocs', {
      url: 'https://example.com/docs',
    })
  })

  it('generates an edit payload for removing a property from a tag', () => {
    const diff: Difference = {
      type: 'REMOVE',
      path: ['tags', 0, 'description'],
      oldValue: 'First tag',
    }

    const result = mutateTagDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.tagMutators.edit).toHaveBeenCalledWith('tag1uid', 'description', undefined)
  })

  it('returns false when trying to edit a non-existent tag', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['tags', 3, 'name'],
      oldValue: 'Non-existent Tag',
      value: 'Updated Non-existent Tag',
    }

    const result = mutateTagDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(false)
  })

  it('returns false for invalid diff paths', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['invalid', 'stuff', 'what'],
      oldValue: 'old',
      value: 'new',
    }

    const result = mutateTagDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(false)
  })
})

describe('mutateSecuritySchemeDiff', () => {
  const mockStore = {
    securitySchemes: mockSecuritySchemes,
    securitySchemeMutators: {
      edit: vi.fn(),
      delete: vi.fn(),
      add: vi.fn(),
    },
  } as unknown as WorkspaceStore

  it('generates an add payload for creating a new security scheme', () => {
    const newScheme = securitySchemeSchema.parse({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'jwt',
      uid: 'bearerAuth',
      nameKey: 'bearerAuth',
      username: '',
      password: '',
      token: '',
    })
    const diff: Difference = {
      type: 'CREATE',
      path: ['components', 'securitySchemes', 'bearerAuth'],
      value: newScheme,
    }

    const result = mutateSecuritySchemeDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.securitySchemeMutators.add).toHaveBeenCalledWith(newScheme, 'collection1')
  })

  it('generates a remove payload for deleting a security scheme', () => {
    const diff: Difference = {
      type: 'REMOVE',
      path: ['components', 'securitySchemes', 'apiKeyUid'],
      oldValue: mockSecuritySchemes.apiKey,
    }

    const result = mutateSecuritySchemeDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.securitySchemeMutators.delete).toHaveBeenCalledWith('apiKeyUid')
  })

  it('generates an edit payload for updating a security scheme property', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['components', 'securitySchemes', 'apiKeyUid', 'name'],
      oldValue: 'api_key',
      value: 'new_api_key',
    }

    const result = mutateSecuritySchemeDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.securitySchemeMutators.edit).toHaveBeenCalledWith('apiKeyUid', 'name', 'new_api_key')
  })

  it('generates an edit payload for updating an oauth2 flow property', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['components', 'securitySchemes', 'oauth2', 'flows', 'implicit', 'authorizationUrl'],
      oldValue: 'https://example.com/oauth/authorize',
      value: 'https://example.com/oauth/authorize-admin',
    }

    const result = mutateSecuritySchemeDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.securitySchemeMutators.edit).toHaveBeenCalledWith(
      'oauth2-uid',
      'flows.implicit.authorizationUrl',
      'https://example.com/oauth/authorize-admin',
    )
  })

  it('generates an edit payload for adding a new property to a security scheme', () => {
    const diff: Difference = {
      type: 'CREATE',
      path: ['components', 'securitySchemes', 'apiKeyUid', 'description'],
      value: 'API Key for authentication',
    }

    const result = mutateSecuritySchemeDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.securitySchemeMutators.edit).toHaveBeenCalledWith(
      'apiKeyUid',
      'description',
      'API Key for authentication',
    )
  })

  it('generates an edit payload for removing a scope from an oauth2 flow', () => {
    const diff: Difference = {
      type: 'REMOVE',
      path: ['components', 'securitySchemes', 'oauth2', 'flows', 'implicit', 'scopes', 'read:api'],
      oldValue: 'read api',
    }

    const result = mutateSecuritySchemeDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.securitySchemeMutators.edit).toHaveBeenCalledWith(
      'oauth2-uid',
      'flows.implicit.scopes.read:api',
      undefined,
    )
  })

  it('generates an edit payload for adding a scope to an oauth2 flow', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['components', 'securitySchemes', 'oauth2', 'flows', 'implicit', 'scopes', 'write:users'],
      oldValue: '',
      value: 'write users',
    }

    const result = mutateSecuritySchemeDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.securitySchemeMutators.edit).toHaveBeenCalledWith(
      'oauth2-uid',
      'flows.implicit.scopes.write:users',
      'write users',
    )
  })

  it('generates an edit payload for updating a scope from an oauth2 flow', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['components', 'securitySchemes', 'oauth2', 'flows', 'implicit', 'scopes', 'write:api'],
      oldValue: 'modify api',
      value: 'write the api',
    }

    const result = mutateSecuritySchemeDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.securitySchemeMutators.edit).toHaveBeenCalledWith(
      'oauth2-uid',
      'flows.implicit.scopes.write:api',
      'write the api',
    )
  })

  it('returns false when trying to edit a non-existent security scheme', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['components', 'securitySchemes', 'nonExistent', 'type'],
      oldValue: 'apiKey',
      value: 'http',
    }

    const result = mutateSecuritySchemeDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(false)
  })

  it('returns false for invalid diff paths', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['invalid', 'path', 'what', 'no'],
      oldValue: 'old',
      value: 'new',
    }

    const result = mutateSecuritySchemeDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(false)
  })

  it('handles nested changes in oauth2 flows', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['components', 'securitySchemes', 'oauth2', 'flows', 'implicit', 'authorizationUrl'],
      oldValue: 'https://example.com/oauth/authorize',
      value: 'https://api.example.com/oauth2/authorize',
    }

    const result = mutateSecuritySchemeDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.securitySchemeMutators.edit).toHaveBeenCalledWith(
      'oauth2-uid',
      'flows.implicit.authorizationUrl',
      'https://api.example.com/oauth2/authorize',
    )
  })
})

describe('mutateRequestDiff', () => {
  const mockStore = {
    activeCollection: { value: mockCollection },
    requests: mockRequests,
    requestMutators: {
      edit: vi.fn(),
      delete: vi.fn(),
      add: vi.fn(),
    },
    requestExamples: {},
    requestExampleMutators: {
      set: vi.fn(),
    },
  } as unknown as WorkspaceStore

  it('generates an add payload for creating a new request', () => {
    const newRequest = operationSchema.parse({
      uid: 'request4uid',
      method: 'delete',
      path: '/planets/{planetId}',
      summary: 'Delete a planet',
      parameters: [],
      description: 'Remove a planet by its ID',
    })
    const diff: Difference = {
      type: 'CREATE',
      path: ['paths', '/planets/{planetId}', 'delete'],
      value: newRequest,
    }

    const result = mutateRequestDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.requestMutators.add).toHaveBeenCalledWith(newRequest, mockCollection.uid)
  })

  it('generates a delete payload for removing a request', () => {
    const diff: Difference = {
      type: 'REMOVE',
      path: ['paths', '/planets', 'post'],
      oldValue: mockRequests.request2uid,
    }

    const result = mutateRequestDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.requestMutators.delete).toHaveBeenCalledWith(mockRequests.request2uid, mockCollection.uid)
  })

  it('generates an edit payload for updating a request summary', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['paths', '/planets/{planetId}', 'get', 'summary'],
      oldValue: 'Get a planet by ID',
      value: 'Retrieve planet details',
    }

    const result = mutateRequestDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.requestMutators.edit).toHaveBeenCalledWith('request3uid', 'summary', 'Retrieve planet details')
  })

  it('generates an edit payload for adding a parameter to a request', () => {
    const diff: Difference = {
      type: 'CREATE',
      path: ['paths', '/planets', 'get', 'parameters', 3],
      value: {
        name: 'highroller',
        in: 'query',
        required: false,
        deprecated: false,
        schema: { type: 'integer', format: 'int32' },
      },
    }

    const result = mutateRequestDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.requestMutators.edit).toHaveBeenCalledWith('request1uid', 'parameters', [
      ...(mockRequests.request1uid?.parameters ?? []),
      {
        name: 'highroller',
        in: 'query',
        required: false,
        deprecated: false,
        schema: { type: 'integer', format: 'int32' },
      },
    ])
  })

  it('generates an edit payload for removing a parameter from a request', () => {
    const diff: Difference = {
      type: 'REMOVE',
      path: ['paths', '/planets', 'get', 'parameters', 1],
      oldValue: {
        description: 'The number of items to skip before starting to collect the result set',
        name: 'offset',
        in: 'query',
        required: false,
        schema: { default: 0, type: 'integer', format: 'int64' },
      },
    }

    const result = mutateRequestDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.requestMutators.edit).toHaveBeenCalledWith(
      'request1uid',
      'parameters',
      mockRequests.request1uid?.parameters?.filter(
        (_, i) => i !== (mockRequests.request1uid?.parameters?.length ?? 0) - 1,
      ),
    )
  })

  it('generates an edit payload for updating a request description', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['paths', '/planets', 'get', 'description'],
      oldValue: 'Retrieve all planets',
      value: 'Get the list of all planets',
    }

    const result = mutateRequestDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.requestMutators.edit).toHaveBeenCalledWith(
      'request1uid',
      'description',
      'Get the list of all planets',
    )
  })

  it('returns false when trying to edit a non-existent request', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['paths', '/unknown', 'get', 'summary'],
      oldValue: 'Old Summary',
      value: 'New Summary',
    }

    const result = mutateRequestDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(false)
  })

  it('handles renaming a request path', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['paths', 'path'],
      oldValue: '/planets',
      value: '/planets/list',
    }

    const result = mutateRequestDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.requestMutators.edit).toHaveBeenCalledWith('request1uid', 'path', '/planets/list')
    expect(mockStore.requestMutators.edit).toHaveBeenCalledWith('request2uid', 'path', '/planets/list')
  })

  it('handles changing the method of a request', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['paths', '/planets', 'get', 'method'],
      oldValue: 'get',
      value: 'post',
    }

    const result = mutateRequestDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.requestMutators.edit).toHaveBeenCalledWith('request1uid', 'method', 'post')
  })

  it('handles invalid diff paths', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['invalid', 'stuff', 'what'],
      oldValue: 'old',
      value: 'new',
    }

    const result = mutateRequestDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(false)
  })

  it('handles updating a request formBody', () => {
    const diff: Difference = {
      path: [
        'paths',
        '/planets',
        'post',
        'requestBody',
        'content',
        'application/json',
        'schema',
        'properties',
        'description',
        'examples',
        0,
      ],
      type: 'CHANGE',
      value: 'The blue planet',
      oldValue: 'The red planet',
    }
    const result = mutateRequestDiff(diff, mockActiveEntities, mockStore)
    expect(result).toBe(true)
    expect(mockStore.requestMutators.edit).toHaveBeenCalledWith(
      'request2uid',
      'requestBody.content.application/json.schema.properties.description.examples.0',
      'The blue planet',
    )
  })
})

describe('narrowUnionSchema', () => {
  const schema1 = z.object({ type: z.literal('one'), value: z.string() })
  const schema2 = z.object({ type: z.literal('two'), value: z.boolean() })
  const unionSchema = z.union([schema1, schema2])
  const discriminatedUnion = z
    .discriminatedUnion('type', [schema1, schema2])
    .optional()
    .default({ type: 'two', value: true })

  it('returns the correct schema from a union 1', () => {
    const result = narrowUnionSchema(unionSchema, 'type', 'one')
    expect(result).equal(schema1)
  })

  it('returns the correct schema from a union 2', () => {
    const result = narrowUnionSchema(unionSchema, 'type', 'two')
    expect(result).equal(schema2)
  })

  it('returns the correct schema from a discriminated union with optional default', () => {
    const result = narrowUnionSchema(discriminatedUnion, 'type', 'two')
    expect(result).equal(schema2)
  })

  it('returns the correct schema from auth discriminated by type', () => {
    const result = narrowUnionSchema(securitySchemeSchema, 'type', 'http')
    expect(result).equal(securityHttpSchema)
  })
})

describe('traverseZodSchema', () => {
  const smallSchema = z.record(z.string(), z.array(z.string()).optional().default([]))
  const testSchema = z.object({
    name: z.string(),
    age: z.number().optional(),
    formBody: z.any().optional(),
    small: z.array(smallSchema).optional().default([]),
    address: z
      .object({
        street: z.string(),
        city: z.string(),
        zipCode: z.string().optional(),
      })
      .optional(),
    hobbies: z.array(z.string()),
  })

  it('returns the correct schema for a top-level property', () => {
    const result = traverseZodSchema(testSchema, ['name'])
    expect(result).toBeInstanceOf(z.ZodString)
  })

  it('returns the correct schema for a nested property', () => {
    const result = traverseZodSchema(testSchema, ['address', 'street'])
    expect(result).toBeInstanceOf(z.ZodString)
  })

  it('returns the correct schema for a nested array property', () => {
    const result = traverseZodSchema(testSchema, ['small', 0])
    expect(result).toEqual(smallSchema)
  })

  it('returns the correct schema for a nested record property', () => {
    const result = traverseZodSchema(testSchema, ['small', 0, 'test', 0])
    expect(result).toBeInstanceOf(z.ZodString)
  })

  it('handles optional properties correctly', () => {
    const result = traverseZodSchema(testSchema, ['age'])
    expect(result).toBeInstanceOf(z.ZodNumber)
  })

  it('handles nested optional properties correctly', () => {
    const result = traverseZodSchema(testSchema, ['address', 'zipCode'])
    expect(result).toBeInstanceOf(z.ZodString)
  })

  it('returns the correct schema for an array', () => {
    const result = traverseZodSchema(testSchema, ['hobbies'])
    expect(result).toBeInstanceOf(z.ZodArray)
  })

  it('returns the correct schema for an array element', () => {
    const result = traverseZodSchema(testSchema, ['hobbies', 0])
    expect(result).toBeInstanceOf(z.ZodString)
  })

  it('returns null for a non-existent path', () => {
    const result = traverseZodSchema(testSchema, ['nonexistent'])
    expect(result).toBeNull()
  })

  it('returns null for a partially non-existent path', () => {
    const result = traverseZodSchema(testSchema, ['address', 'nonexistent'])
    expect(result).toBeNull()
  })

  it('returns any for anything nested inside an any', () => {
    const result = traverseZodSchema(testSchema, ['formBody', 'nonexistent'])
    expect(result).toBeInstanceOf(z.ZodAny)
  })
  it('returns any for anything nested inside an any', () => {
    const result = traverseZodSchema(testSchema, ['formBody', 0, 'more', 0])
    expect(result).toBeInstanceOf(z.ZodAny)
  })
})

describe('parseDiff', () => {
  const testSchema = z.object({
    name: z.string(),
    age: z.number().optional(),
    formBody: z.any().optional(),
    address: z
      .object({
        street: z.string(),
        city: z.string(),
        zipCode: z.string().optional(),
      })
      .optional(),
    hobbies: z.array(z.string()),
  })

  it('parses a valid diff for a string property', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['name'],
      oldValue: 'John',
      value: 'Jane',
    }
    const result = parseDiff(testSchema, diff)
    expect(result).toEqual({
      path: 'name',
      pathMinusOne: '',
      value: 'Jane',
    })
  })

  it('parses a valid diff for a number property', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['age'],
      oldValue: 25,
      value: 26,
    }
    const result = parseDiff(testSchema, diff)
    expect(result).toEqual({ path: 'age', pathMinusOne: '', value: 26 })
  })

  it('parses a valid diff for a nested property', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['address', 'street'],
      oldValue: 'Old Street',
      value: 'New Street',
    }
    const result = parseDiff(testSchema, diff)
    expect(result).toEqual({
      path: 'address.street',
      pathMinusOne: 'address',
      value: 'New Street',
    })
  })

  it('parses a valid diff for an array element', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['hobbies', 0],
      oldValue: 'reading',
      value: 'writing',
    }
    const result = parseDiff(testSchema, diff)
    expect(result).toEqual({
      path: 'hobbies.0',
      pathMinusOne: 'hobbies',
      value: 'writing',
    })
  })

  it('returns null for an invalid diff path', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['nonexistent'],
      oldValue: 'old',
      value: 'new',
    }
    const result = parseDiff(testSchema, diff)
    expect(result).toBeNull()
  })

  it('returns null for an invalid diff value', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['age'],
      oldValue: 25,
      value: 'not a number',
    }
    const result = parseDiff(testSchema, diff)
    expect(result).toBeNull()
  })

  it('handles a REMOVE diff correctly', () => {
    const diff: Difference = {
      type: 'REMOVE',
      path: ['address', 'zipCode'],
      oldValue: '12345',
    }
    const result = parseDiff(testSchema, diff)
    expect(result).toEqual({
      path: 'address.zipCode',
      pathMinusOne: 'address',
      value: undefined,
    })
  })

  it('returns null for a CREATE diff with an invalid value', () => {
    const diff: Difference = {
      type: 'CREATE',
      path: ['hobbies', 0],
      value: 123, // Should be a string
    }
    const result = parseDiff(testSchema, diff)
    expect(result).toBeNull()
  })

  it('handles a CHANGE diff on an http security scheme with an empty string value', () => {
    const diff: Difference = {
      oldValue: 'oldVal',
      type: 'CHANGE',
      path: ['token'],
      value: '',
    }
    const result = parseDiff(securityHttpSchema, diff)
    expect(result).not.toBeNull()
  })
})
