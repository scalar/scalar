import json from '@scalar/galaxy/3.1.json'
import {
  type Collection,
  type Request,
  type SecurityScheme,
  type SecuritySchemePayload,
  type Server,
  type Tag,
  collectionSchema,
} from '@scalar/oas-utils/entities/spec'
import { parseSchema } from '@scalar/oas-utils/transforms'
import microdiff, { type Difference } from 'microdiff'
import { beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import {
  combineRenameDiffs,
  diffToCollectionPayload,
  diffToRequestPayload,
  diffToSecuritySchemePayload,
  diffToServerPayload,
  diffToTagPayload,
  narrowUnionSchema,
  parseDiff,
  traverseZodSchema,
} from './live-sync'

const mockRequests: Record<`request${number}uid`, Request> = {
  request1uid: {
    type: 'request',
    uid: 'request1uid',
    method: 'get',
    path: '/planets',
    examples: [],
    selectedSecuritySchemeUids: [],
    selectedServerUid: '',
    servers: [],
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
  },
  request2uid: {
    type: 'request',
    uid: 'request2uid',
    method: 'post',
    path: '/planets',
    examples: [],
    selectedSecuritySchemeUids: [],
    selectedServerUid: '',
    servers: [],
    parameters: [],
    summary: 'Create a new planet',
    description: 'Add a new planet to the database',
  },
  request3uid: {
    type: 'request',
    uid: 'request3uid',
    method: 'get',
    path: '/planets/{planetId}',
    examples: [],
    selectedSecuritySchemeUids: [],
    selectedServerUid: '',
    servers: [],
    parameters: [],
    summary: 'Get a planet by ID',
    description: 'Retrieve a single planet by its ID',
  },
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
    security: [
      { bearerAuth: ['read:users', 'read:events'] },
      { apiKeyQuery: [] },
    ],
    tags: ['tag1uid', 'tag2uid', 'tag3uid'],
  }),
)

const original = (await parseSchema(json)).schema

describe('combineRenameDiffs', () => {
  let mutated: any

  // Clone fresh schemas
  beforeEach(() => {
    mutated = JSON.parse(JSON.stringify(original))
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
        'It’s easy to say you know them all, but do you really? Retrieve all the planets and check whether you missed one.',
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
          description:
            'The number of items to skip before starting to collect the result set',
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

  it('handles deep changes in the schema', () => {
    // Modify a deep property in the schema
    mutated.paths['/planets'].get.responses['200'].content[
      'application/json'
    ].schema.allOf[0].properties.data.type = 'number'

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

describe('diffToCollectionPayload', () => {
  it('generates a payload for updating the title', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['info', 'title'],
      oldValue: 'Test API',
      value: 'Updated Test API',
    }

    const result = diffToCollectionPayload(diff, mockCollection)
    expect(result).toEqual(['collection1', 'info.title', 'Updated Test API'])
  })

  it('generates a payload for updating the version', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['info', 'version'],
      oldValue: '1.0.0',
      value: '2.0.0',
    }

    const result = diffToCollectionPayload(diff, mockCollection)
    expect(result).toEqual(['collection1', 'info.version', '2.0.0'])
  })

  it('generates a payload for updating the description', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['info', 'description'],
      oldValue: 'A test API for unit testing',
      value: 'An updated test API for unit testing',
    }

    const result = diffToCollectionPayload(diff, mockCollection)
    expect(result).toEqual([
      'collection1',
      'info.description',
      'An updated test API for unit testing',
    ])
  })

  it('generates a payload for adding a new property', () => {
    const diff: Difference = {
      type: 'CREATE',
      path: ['info', 'termsOfService'],
      value: 'https://example.com/terms',
    }

    const result = diffToCollectionPayload(diff, mockCollection)
    expect(result).toEqual([
      'collection1',
      'info.termsOfService',
      'https://example.com/terms',
    ])
  })

  it('generates a payload for removing a property', () => {
    const collectionWithExtra = {
      ...mockCollection,
      info: {
        ...mockCollection.info,
        termsOfService: 'https://example.com/terms',
      },
    } as Collection

    const diff: Difference = {
      type: 'REMOVE',
      path: ['info', 'termsOfService'],
      oldValue: 'https://example.com/terms',
    }

    const result = diffToCollectionPayload(diff, collectionWithExtra)
    expect(result).toEqual(['collection1', 'info.termsOfService', undefined])
  })

  it('generates a payload for adding a new security requirement', () => {
    const diff: Difference = {
      type: 'CREATE',
      path: ['security', 2],
      value: { oauth2: ['read:api', 'write:api'] },
    }

    const result = diffToCollectionPayload(diff, mockCollection)
    expect(result).toEqual([
      'collection1',
      'security',
      [...mockCollection.security, { oauth2: ['read:api', 'write:api'] }],
    ])
  })

  it('generates a payload for removing a security requirement', () => {
    const diff: Difference = {
      type: 'REMOVE',
      path: ['security', 1],
      oldValue: { apiKeyQuery: [] },
    }

    const result = diffToCollectionPayload(diff, mockCollection)
    expect(result).toEqual([
      'collection1',
      'security',
      [mockCollection.security[0]],
    ])
  })

  it('generates a payload for adding a security scope to oauth2', () => {
    const diff: Difference = {
      type: 'CREATE',
      path: ['security', 0, 'bearerAuth', 2],
      value: 'write:events',
    }

    const result = diffToCollectionPayload(diff, mockCollection)
    expect(result).toEqual([
      'collection1',
      'security.0.bearerAuth',
      ['read:users', 'read:events', 'write:events'],
    ])
  })

  it('generates a payload for removing a security scope from oauth2', () => {
    const diff: Difference = {
      type: 'REMOVE',
      path: ['security', 0, 'bearerAuth', 1],
      oldValue: 'read:events',
    }

    const result = diffToCollectionPayload(diff, mockCollection)
    expect(result).toEqual([
      'collection1',
      'security.0.bearerAuth',
      ['read:users'],
    ])
  })
})

describe('diffToServerPayload', () => {
  const mockServers: Record<string, Server> = {
    server1: {
      uid: 'server1',
      url: 'https://api.example.com',
      description: 'Production server',
    },
    server2: {
      uid: 'server2',
      url: 'https://staging.example.com',
      description: 'Staging server',
    },
    server3: {
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
    },
  }

  it('generates an edit payload for updating a server property', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['servers', 0, 'url'],
      oldValue: 'https://api.example.com',
      value: 'https://new-api.example.com',
    }

    const result = diffToServerPayload(diff, mockCollection, mockServers)
    expect(result).toEqual({
      method: 'edit',
      args: ['server1', 'url', 'https://new-api.example.com'],
    })
  })

  it('generates a delete payload for removing a server', () => {
    const diff: Difference = {
      type: 'REMOVE',
      path: ['servers', 1],
      oldValue: mockServers.server2,
    }

    const result = diffToServerPayload(diff, mockCollection, mockServers)
    expect(result).toEqual({
      method: 'delete',
      args: ['server2', 'collection1'],
    })
  })

  it('generates an add payload for creating a new server', () => {
    const newServer: Server = {
      uid: 'server4',
      url: 'https://test.example.com',
      description: 'Test server',
    }
    const diff: Difference = {
      type: 'CREATE',
      path: ['servers', 3],
      value: newServer,
    }

    const result = diffToServerPayload(diff, mockCollection, mockServers)
    expect(result).toEqual({
      method: 'add',
      args: [newServer, 'collection1'],
    })
  })

  it('generates an edit payload for adding a server variable', () => {
    const diff: Difference = {
      type: 'CREATE',
      path: ['servers', 0, 'variables', 'newVar'],
      value: { default: 'default', enum: ['default', 'other'] },
    }

    const result = diffToServerPayload(diff, mockCollection, mockServers)
    expect(result).toEqual({
      method: 'edit',
      args: [
        'server1',
        'variables.newVar',
        { default: 'default', enum: ['default', 'other'] },
      ],
    })
  })

  it('generates an edit payload for updating a server variable', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['servers', 2, 'variables', 'version', 'default'],
      oldValue: 'v1',
      value: 'v2',
    }

    const result = diffToServerPayload(diff, mockCollection, mockServers)
    expect(result).toEqual({
      method: 'edit',
      args: ['server3', 'variables.version.default', 'v2'],
    })
  })

  it('generates an edit payload for removing a server variable', () => {
    const diff: Difference = {
      type: 'REMOVE',
      path: ['servers', 2, 'variables', 'version'],
      oldValue: { default: 'v1', enum: ['v1', 'v2'] },
    }

    const result = diffToServerPayload(diff, mockCollection, mockServers)
    expect(result).toEqual({
      method: 'edit',
      args: ['server3', 'variables.version', undefined],
    })
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

    const result = diffToServerPayload(diff, mockCollection, mockServers)
    expect(result).toEqual({
      method: 'edit',
      args: [
        'server2',
        'variables',
        {
          version: { default: 'v1', enum: ['v1', 'v2'] },
          environment: { default: 'staging', enum: ['production', 'staging'] },
        },
      ],
    })
  })

  it('generates an edit payload for removing all variables from a server', () => {
    const diff: Difference = {
      type: 'REMOVE',
      path: ['servers', 2, 'variables'],
      oldValue: mockServers.server3.variables,
    }

    const result = diffToServerPayload(diff, mockCollection, mockServers)
    expect(result).toEqual({
      method: 'edit',
      args: ['server3', 'variables', {}],
    })
  })

  it('generates an edit payload for updating a server variable enum', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['servers', 2, 'variables', 'version', 'enum'],
      oldValue: ['v1', 'v2'],
      value: ['v1', 'v2', 'v3'],
    }

    const result = diffToServerPayload(diff, mockCollection, mockServers)
    expect(result).toEqual({
      method: 'edit',
      args: ['server3', 'variables.version.enum', ['v1', 'v2', 'v3']],
    })
  })

  it('returns null when trying to edit a non-existent server', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['servers', 4, 'url'],
      oldValue: 'https://nonexistent.example.com',
      value: 'https://new-nonexistent.example.com',
    }

    const result = diffToServerPayload(diff, mockCollection, mockServers)
    expect(result).toBeNull()
  })

  it('returns null for if a server is not found', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['servers', 99, 'variables', 'port'],
      oldValue: [99],
      value: [99],
    }

    const result = diffToServerPayload(diff, mockCollection, mockServers)
    expect(result).toBeNull()
  })

  it('returns null for unhandled diff types', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['servers'],
      oldValue: [],
      value: [],
    }

    const result = diffToServerPayload(diff, mockCollection, mockServers)
    expect(result).toBeNull()
  })
})

describe('diffToTagPayload', () => {
  const mockTags: Record<string, Tag> = {
    tag1uid: {
      'type': 'tag',
      'uid': 'tag1uid',
      'name': 'Tag 1',
      'description': 'First tag',
      'children': [],
      'x-scalar-children': [],
    },
    tag2uid: {
      'type': 'tag',
      'uid': 'tag2uid',
      'name': 'Tag 2',
      'description': 'Second tag',
      'children': [],
      'x-scalar-children': [],
    },
    tag3uid: {
      'type': 'tag',
      'uid': 'tag3uid',
      'name': 'Tag 3',
      'description': 'Third tag',
      'children': [],
      'x-scalar-children': [],
    },
  }

  it('generates an add payload for creating a new tag', () => {
    const newTag: Tag = {
      'type': 'tag',
      'uid': 'tag4uid',
      'name': 'New Tag',
      'description': 'New tag description',
      'children': [],
      'x-scalar-children': [],
    }
    const diff: Difference = {
      type: 'CREATE',
      path: ['tags', 3],
      value: newTag,
    }

    const result = diffToTagPayload(diff, mockTags, mockCollection)
    expect(result).toEqual({ method: 'add', args: [newTag, 'collection1'] })
  })

  it('generates a remove payload for deleting a tag', () => {
    const diff: Difference = {
      type: 'REMOVE',
      path: ['tags', 1],
      oldValue: mockTags.tag2,
    }

    const result = diffToTagPayload(diff, mockTags, mockCollection)
    expect(result).toEqual({
      method: 'delete',
      args: [
        {
          'type': 'tag',
          'uid': 'tag2uid',
          'name': 'Tag 2',
          'description': 'Second tag',
          'children': [],
          'x-scalar-children': [],
        },
        'collection1',
      ],
    })
  })

  it('generates an edit payload for updating a tag name', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['tags', 0, 'name'],
      oldValue: 'Tag 1',
      value: 'Updated Tag 1',
    }

    const result = diffToTagPayload(diff, mockTags, mockCollection)
    expect(result).toEqual({
      method: 'edit',
      args: ['tag1uid', 'name', 'Updated Tag 1'],
    })
  })

  it('generates an edit payload for updating a tag description', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['tags', 1, 'description'],
      oldValue: 'Second tag',
      value: 'Updated second tag',
    }

    const result = diffToTagPayload(diff, mockTags, mockCollection)
    expect(result).toEqual({
      method: 'edit',
      args: ['tag2uid', 'description', 'Updated second tag'],
    })
  })

  it('generates an edit payload for adding a new property to a tag', () => {
    const diff: Difference = {
      type: 'CREATE',
      path: ['tags', 2, 'externalDocs'],
      value: { url: 'https://example.com/docs' },
    }

    const result = diffToTagPayload(diff, mockTags, mockCollection)
    expect(result).toEqual({
      method: 'edit',
      args: ['tag3uid', 'externalDocs', { url: 'https://example.com/docs' }],
    })
  })

  it('generates an edit payload for removing a property from a tag', () => {
    const diff: Difference = {
      type: 'REMOVE',
      path: ['tags', 0, 'description'],
      oldValue: 'First tag',
    }

    const result = diffToTagPayload(diff, mockTags, mockCollection)
    expect(result).toEqual({
      method: 'edit',
      args: ['tag1uid', 'description', undefined],
    })
  })

  it('returns null when trying to edit a non-existent tag', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['tags', 3, 'name'],
      oldValue: 'Non-existent Tag',
      value: 'Updated Non-existent Tag',
    }

    const result = diffToTagPayload(diff, mockTags, mockCollection)
    expect(result).toBeNull()
  })

  it('returns null for invalid diff paths', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['invalid', 'path'],
      oldValue: 'old',
      value: 'new',
    }

    const result = diffToTagPayload(diff, mockTags, mockCollection)
    expect(result).toBeNull()
  })
})

describe('diffToSecuritySchemePayload', () => {
  const mockSecuritySchemes: Record<string, SecurityScheme> = {
    apiKeyUid: {
      uid: 'apiKeyUid',
      nameKey: 'apiKeyHeader',
      type: 'apiKey',
      name: 'api_key',
      in: 'header',
    },
    oauth2: {
      'uid': 'oauth2',
      'type': 'oauth2',
      'nameKey': 'oauth2',
      'x-scalar-client-id': 'random-1',
      'flow': {
        'type': 'implicit',
        'authorizationUrl': 'https://example.com/oauth/authorize',
        'refreshUrl': 'http://referesh.com',
        'selectedScopes': [],
        'x-scalar-redirect-uri': '',
        'scopes': {
          'write:api': 'modify api',
          'read:api': 'read api',
        },
      },
    },
  }

  it('generates an add payload for creating a new security scheme', () => {
    const newScheme: SecuritySchemePayload = {
      uid: 'bearerAuth',
      type: 'http',
      bearerFormat: 'jwt',
      nameKey: 'bearerAuth',
      scheme: 'bearer',
    }
    const diff: Difference = {
      type: 'CREATE',
      path: ['components', 'securitySchemes', 'bearerAuth'],
      value: newScheme,
    }

    const result = diffToSecuritySchemePayload(
      diff,
      mockCollection,
      mockSecuritySchemes,
    )
    expect(result).toEqual({ method: 'add', args: [newScheme, 'collection1'] })
  })

  it('generates a remove payload for deleting a security scheme', () => {
    const diff: Difference = {
      type: 'REMOVE',
      path: ['components', 'securitySchemes', 'apiKeyUid'],
      oldValue: mockSecuritySchemes.apiKey,
    }

    const result = diffToSecuritySchemePayload(
      diff,
      mockCollection,
      mockSecuritySchemes,
    )
    expect(result).toEqual({ method: 'delete', args: ['apiKeyUid'] })
  })

  it('generates an edit payload for updating a security scheme property', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['components', 'securitySchemes', 'apiKeyUid', 'name'],
      oldValue: 'api_key',
      value: 'new_api_key',
    }

    const result = diffToSecuritySchemePayload(
      diff,
      mockCollection,
      mockSecuritySchemes,
    )
    expect(result).toEqual({
      method: 'edit',
      args: ['apiKeyUid', 'name', 'new_api_key'],
    })
  })

  it('generates an edit payload for updating an oauth2 flow property', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: [
        'components',
        'securitySchemes',
        'oauth2',
        'flows',
        'implicit',
        'authorizationUrl',
      ],
      oldValue: 'https://example.com/oauth/authorize',
      value: 'https://example.com/oauth/authorize-admin',
    }

    const result = diffToSecuritySchemePayload(
      diff,
      mockCollection,
      mockSecuritySchemes,
    )
    expect(result).toEqual({
      method: 'edit',
      args: [
        'oauth2',
        'flow.authorizationUrl',
        'https://example.com/oauth/authorize-admin',
      ],
    })
  })

  it('generates an edit payload for adding a new property to a security scheme', () => {
    const diff: Difference = {
      type: 'CREATE',
      path: ['components', 'securitySchemes', 'apiKeyUid', 'description'],
      value: 'API Key for authentication',
    }

    const result = diffToSecuritySchemePayload(
      diff,
      mockCollection,
      mockSecuritySchemes,
    )
    expect(result).toEqual({
      method: 'edit',
      args: ['apiKeyUid', 'description', 'API Key for authentication'],
    })
  })

  it('generates an edit payload for removing a property from a security scheme', () => {
    const diff: Difference = {
      type: 'REMOVE',
      path: [
        'components',
        'securitySchemes',
        'oauth2',
        'flows',
        'implicit',
        'scopes',
        'write:api',
      ],
      oldValue: 'modify api',
    }

    const result = diffToSecuritySchemePayload(
      diff,
      mockCollection,
      mockSecuritySchemes,
    )
    expect(result).toEqual({
      method: 'edit',
      args: ['oauth2', 'flows.implicit.scopes.write:api', undefined],
    })
  })

  it('returns null when trying to edit a non-existent security scheme', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['components', 'securitySchemes', 'nonExistent', 'type'],
      oldValue: 'apiKey',
      value: 'http',
    }

    const result = diffToSecuritySchemePayload(
      diff,
      mockCollection,
      mockSecuritySchemes,
    )
    expect(result).toBeNull()
  })

  it('returns null for invalid diff paths', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['invalid', 'path'],
      oldValue: 'old',
      value: 'new',
    }

    const result = diffToSecuritySchemePayload(
      diff,
      mockCollection,
      mockSecuritySchemes,
    )
    expect(result).toBeNull()
  })

  it('handles nested changes in oauth2 flows', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: [
        'components',
        'securitySchemes',
        'oauth2',
        'flows',
        'implicit',
        'authorizationUrl',
      ],
      oldValue: 'https://example.com/oauth/authorize',
      value: 'https://api.example.com/oauth2/authorize',
    }

    const result = diffToSecuritySchemePayload(
      diff,
      mockCollection,
      mockSecuritySchemes,
    )
    expect(result).toEqual({
      method: 'edit',
      args: [
        'oauth2',
        'flows.implicit.authorizationUrl',
        'https://api.example.com/oauth2/authorize',
      ],
    })
  })
})

describe('diffToRequestPayload', () => {
  it('generates an add payload for creating a new request', () => {
    const newRequest: Request = {
      type: 'request',
      uid: 'request4uid',
      method: 'delete',
      path: '/planets/{planetId}',
      summary: 'Delete a planet',
      description: 'Remove a planet by its ID',
      parameters: [],
      examples: [],
      selectedSecuritySchemeUids: [],
      selectedServerUid: '',
      servers: [],
    }
    const diff: Difference = {
      type: 'CREATE',
      path: ['paths', '/planets/{planetId}', 'delete'],
      value: newRequest,
    }

    const result = diffToRequestPayload(diff, mockCollection, mockRequests)
    expect(result).toEqual([
      { method: 'add', args: [newRequest, mockCollection.uid] },
    ])
  })

  it('generates a delete payload for removing a request', () => {
    const diff: Difference = {
      type: 'REMOVE',
      path: ['paths', '/planets', 'post'],
      oldValue: mockRequests.request2uid,
    }

    const result = diffToRequestPayload(diff, mockCollection, mockRequests)
    expect(result).toEqual([
      {
        method: 'delete',
        args: [mockRequests.request2uid, mockCollection.uid],
      },
    ])
  })

  it('generates an edit payload for updating a request summary', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['paths', '/planets/{planetId}', 'get', 'summary'],
      oldValue: 'Get a planet by ID',
      value: 'Retrieve planet details',
    }

    const result = diffToRequestPayload(diff, mockCollection, mockRequests)
    expect(result).toEqual([
      {
        method: 'edit',
        args: ['request3uid', 'summary', 'Retrieve planet details'],
      },
    ])
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

    const result = diffToRequestPayload(diff, mockCollection, mockRequests)
    expect(result).toEqual([
      {
        method: 'edit',
        args: [
          'request1uid',
          'parameters',
          [
            ...(mockRequests.request1uid.parameters ?? []),
            {
              name: 'highroller',
              in: 'query',
              required: false,
              deprecated: false,
              schema: { type: 'integer', format: 'int32' },
            },
          ],
        ],
      },
    ])
  })

  it('generates an edit payload for removing a parameter from a request', () => {
    const diff: Difference = {
      type: 'REMOVE',
      path: ['paths', '/planets', 'get', 'parameters', 1],
      oldValue: {
        description:
          'The number of items to skip before starting to collect the result set',
        name: 'offset',
        in: 'query',
        required: false,
        schema: { default: 0, type: 'integer', format: 'int64' },
      },
    }

    const result = diffToRequestPayload(diff, mockCollection, mockRequests)
    expect(result).toEqual([
      {
        method: 'edit',
        args: [
          'request1uid',
          'parameters',
          mockRequests.request1uid.parameters?.toSpliced(-1),
        ],
      },
    ])
  })

  it('generates an edit payload for updating a request description', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['paths', '/planets', 'get', 'description'],
      oldValue: 'Retrieve all planets',
      value: 'Get the list of all planets',
    }

    const result = diffToRequestPayload(diff, mockCollection, mockRequests)
    expect(result).toEqual([
      {
        method: 'edit',
        args: ['request1uid', 'description', 'Get the list of all planets'],
      },
    ])
  })

  it('returns null when trying to edit a non-existent request', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['paths', '/unknown', 'get', 'summary'],
      oldValue: 'Old Summary',
      value: 'New Summary',
    }

    const result = diffToRequestPayload(diff, mockCollection, mockRequests)
    expect(result).toEqual([])
  })

  it('handles renaming a request path', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['paths', 'path'],
      oldValue: '/planets',
      value: '/planets/list',
    }

    const result = diffToRequestPayload(diff, mockCollection, mockRequests)
    expect(result).toEqual([
      { method: 'edit', args: ['request1uid', 'path', '/planets/list'] },
      { method: 'edit', args: ['request2uid', 'path', '/planets/list'] },
    ])
  })

  it('handles changing the method of a request', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['paths', '/planets', 'get', 'method'],
      oldValue: 'get',
      value: 'post',
    }

    const result = diffToRequestPayload(diff, mockCollection, mockRequests)
    expect(result).toEqual([
      { method: 'edit', args: ['request1uid', 'method', 'post'] },
    ])
  })

  it('handles invalid diff paths', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['invalid', 'path'],
      oldValue: 'old',
      value: 'new',
    }

    const result = diffToRequestPayload(diff, mockCollection, mockRequests)
    expect(result).toEqual([])
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
})

describe('traverseZodSchema', () => {
  const smallSchema = z.record(
    z.string(),
    z.array(z.string()).optional().default([]),
  )
  const testSchema = z.object({
    name: z.string(),
    age: z.number().optional(),
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
})

describe('parseDiff', () => {
  const testSchema = z.object({
    name: z.string(),
    age: z.number().optional(),
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
})
