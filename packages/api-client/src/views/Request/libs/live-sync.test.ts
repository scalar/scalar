import json from '@scalar/galaxy/3.1.json'
import type {
  Collection,
  Request,
  SecurityScheme,
  SecuritySchemePayload,
  Server,
  Tag,
} from '@scalar/oas-utils/entities/spec'
import microdiff, { type Difference } from 'microdiff'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  combineRenameDiffs,
  diffToCollectionPayload,
  diffToSecuritySchemePayload,
  diffToServerPayload,
  diffToTagPayload,
} from './live-sync'

describe('combineRenameDiffs', () => {
  const original = json
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

  it('handles deep changes in the schema', () => {
    // Modify a deep property in the schema
    mutated.paths['/planets'].get.responses['200'].content[
      'application/json'
    ].schema.allOf[0].properties.data = { type: 'number', examples: [1] }

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
  const mockCollection: Collection = {
    uid: 'collection1',
    info: {
      title: 'Test API',
      version: '1.0.0',
      description: 'A test API for unit testing',
    },
    security: [
      { bearerAuth: ['read:users', 'read:events'] },
      { apiKeyQuery: [] },
    ],
    // ... other required properties
  } as Collection

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
  const mockCollection: Collection = {
    uid: 'collection1',
    servers: ['server1', 'server2', 'server3'],
  } as Collection

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
    expect(result).toEqual([
      'edit',
      'server1',
      'url',
      'https://new-api.example.com',
    ])
  })

  it('generates a delete payload for removing a server', () => {
    const diff: Difference = {
      type: 'REMOVE',
      path: ['servers', 1],
      oldValue: mockServers.server2,
    }

    const result = diffToServerPayload(diff, mockCollection, mockServers)
    expect(result).toEqual(['delete', 'server2', 'collection1'])
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
    expect(result).toEqual(['add', newServer, 'collection1'])
  })

  it('generates an edit payload for adding a server variable', () => {
    const diff: Difference = {
      type: 'CREATE',
      path: ['servers', 0, 'variables', 'newVar'],
      value: { default: 'default', enum: ['default', 'other'] },
    }

    const result = diffToServerPayload(diff, mockCollection, mockServers)
    expect(result).toEqual([
      'edit',
      'server1',
      'variables.newVar',
      { default: 'default', enum: ['default', 'other'] },
    ])
  })

  it('generates an edit payload for updating a server variable', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['servers', 2, 'variables', 'version', 'default'],
      oldValue: 'v1',
      value: 'v2',
    }

    const result = diffToServerPayload(diff, mockCollection, mockServers)
    expect(result).toEqual([
      'edit',
      'server3',
      'variables.version.default',
      'v2',
    ])
  })

  it('generates an edit payload for removing a server variable', () => {
    const diff: Difference = {
      type: 'REMOVE',
      path: ['servers', 2, 'variables', 'version'],
      oldValue: { default: 'v1', enum: ['v1', 'v2'] },
    }

    const result = diffToServerPayload(diff, mockCollection, mockServers)
    expect(result).toEqual(['edit', 'server3', 'variables.version', undefined])
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
    expect(result).toEqual([
      'edit',
      'server2',
      'variables',
      {
        version: { default: 'v1', enum: ['v1', 'v2'] },
        environment: { default: 'staging', enum: ['production', 'staging'] },
      },
    ])
  })

  it('generates an edit payload for removing all variables from a server', () => {
    const diff: Difference = {
      type: 'REMOVE',
      path: ['servers', 2, 'variables'],
      oldValue: mockServers.server3.variables,
    }

    const result = diffToServerPayload(diff, mockCollection, mockServers)
    expect(result).toEqual(['edit', 'server3', 'variables', {}])
  })

  it('generates an edit payload for updating a server variable enum', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['servers', 2, 'variables', 'version', 'enum'],
      oldValue: ['v1', 'v2'],
      value: ['v1', 'v2', 'v3'],
    }

    const result = diffToServerPayload(diff, mockCollection, mockServers)
    expect(result).toEqual([
      'edit',
      'server3',
      'variables.version.enum',
      ['v1', 'v2', 'v3'],
    ])
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
  const mockCollection: Collection = {
    uid: 'collection1',
    tags: ['tag1', 'tag2', 'tag3'],
  } as Collection

  const mockTags: Record<string, Tag> = {
    tag1: {
      'type': 'tag',
      'uid': 'tag1',
      'name': 'Tag 1',
      'description': 'First tag',
      'children': [],
      'x-scalar-children': [],
    },
    tag2: {
      'type': 'tag',
      'uid': 'tag2',
      'name': 'Tag 2',
      'description': 'Second tag',
      'children': [],
      'x-scalar-children': [],
    },
    tag3: {
      'type': 'tag',
      'uid': 'tag3',
      'name': 'Tag 3',
      'description': 'Third tag',
      'children': [],
      'x-scalar-children': [],
    },
  }

  it('generates an add payload for creating a new tag', () => {
    const newTag: Tag = {
      'type': 'tag',
      'uid': 'taguid4',
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
    expect(result).toEqual(['add', newTag, 'collection1'])
  })

  it('generates a remove payload for deleting a tag', () => {
    const diff: Difference = {
      type: 'REMOVE',
      path: ['tags', 1],
      oldValue: mockTags.tag2,
    }

    const result = diffToTagPayload(diff, mockTags, mockCollection)
    expect(result).toEqual([
      'delete',
      {
        'type': 'tag',
        'uid': 'tag2',
        'name': 'Tag 2',
        'description': 'Second tag',
        'children': [],
        'x-scalar-children': [],
      },
      'collection1',
    ])
  })

  it('generates an edit payload for updating a tag name', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['tags', 0, 'name'],
      oldValue: 'Tag 1',
      value: 'Updated Tag 1',
    }

    const result = diffToTagPayload(diff, mockTags, mockCollection)
    expect(result).toEqual(['edit', 'tag1', 'name', 'Updated Tag 1'])
  })

  it('generates an edit payload for updating a tag description', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['tags', 1, 'description'],
      oldValue: 'Second tag',
      value: 'Updated second tag',
    }

    const result = diffToTagPayload(diff, mockTags, mockCollection)
    expect(result).toEqual([
      'edit',
      'tag2',
      'description',
      'Updated second tag',
    ])
  })

  it('generates an edit payload for adding a new property to a tag', () => {
    const diff: Difference = {
      type: 'CREATE',
      path: ['tags', 2, 'externalDocs'],
      value: { url: 'https://example.com/docs' },
    }

    const result = diffToTagPayload(diff, mockTags, mockCollection)
    expect(result).toEqual([
      'edit',
      'tag3',
      'externalDocs',
      { url: 'https://example.com/docs' },
    ])
  })

  it('generates an edit payload for removing a property from a tag', () => {
    const diff: Difference = {
      type: 'REMOVE',
      path: ['tags', 0, 'description'],
      oldValue: 'First tag',
    }

    const result = diffToTagPayload(diff, mockTags, mockCollection)
    expect(result).toEqual(['edit', 'tag1', 'description', undefined])
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
  const mockCollection: Collection = {
    uid: 'collection1',
  } as Collection

  const mockSecuritySchemes: Record<string, SecurityScheme> = {
    apiKeyUid: {
      uid: 'apiKeyUid',
      nameKey: 'apiKeyHeader',
      type: 'apiKey',
      name: 'api_key',
      in: 'header',
    },
    oauth2: {
      uid: 'oauth2',
      type: 'oauth2',
      // @ts-expect-error the spec is flows but we use flow
      flows: {
        implicit: {
          authorizationUrl: 'https://example.com/oauth/authorize',
          scopes: {
            'write:api': 'modify api',
            'read:api': 'read api',
          },
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
    expect(result).toEqual(['add', newScheme, 'collection1'])
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
    expect(result).toEqual(['delete', 'apiKeyUid'])
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
    expect(result).toEqual(['edit', 'apiKeyUid', 'name', 'new_api_key'])
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
    expect(result).toEqual([
      'edit',
      'apiKeyUid',
      'description',
      'API Key for authentication',
    ])
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
    expect(result).toEqual([
      'edit',
      'oauth2',
      'flows.implicit.scopes.write:api',
      undefined,
    ])
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
    expect(result).toEqual([
      'edit',
      'oauth2',
      'flows.implicit.authorizationUrl',
      'https://api.example.com/oauth2/authorize',
    ])
  })
})

describe('diffToRequestPayload', () => {
  const mockCollection: Collection = {
    uid: 'collection1',
    items: ['request1', 'request2', 'request3'],
  } as Collection

  const mockRequests: Record<string, Request> = {
    request1: {
      uid: 'request1',
      method: 'get',
      path: '/planets',
      summary: 'Get all planets',
      description: 'Retrieve all planets',
    },
    request2: {
      uid: 'request2',
      method: 'post',
      path: '/planets',
      summary: 'Create a new planet',
      description: 'Add a new planet to the database',
    },
    request3: {
      uid: 'request3',
      method: 'get',
      path: '/planets/{planetId}',
      summary: 'Get a planet by ID',
      description: 'Retrieve a single planet by its ID',
    },
  }

  it('generates an add payload for creating a new request', () => {
    const newRequest: Request = {
      uid: 'request4',
      method: 'delete',
      path: '/planets/{planetId}',
      summary: 'Delete a planet',
      description: 'Remove a planet by its ID',
    }
    const diff: Difference = {
      type: 'CREATE',
      path: ['paths', '/planets/{planetId}', 'delete'],
      value: newRequest,
    }

    const result = diffToRequestPayload(diff, mockCollection, mockRequests)
    expect(result).toEqual(['add', newRequest, mockCollection.uid])
  })

  it('generates a delete payload for removing a request', () => {
    const diff: Difference = {
      type: 'REMOVE',
      path: ['paths', '/planets', 'post'],
      oldValue: mockRequests.request2,
    }

    const result = diffToRequestPayload(diff, mockCollection, mockRequests)
    expect(result).toEqual(['delete', 'request2', mockCollection.uid])
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
      'edit',
      'request3',
      'summary',
      'Retrieve planet details',
    ])
  })

  it('generates an edit payload for adding a parameter to a request', () => {
    const diff: Difference = {
      type: 'CREATE',
      path: ['paths', '/planets', 'get', 'parameters', 0],
      value: {
        name: 'limit',
        in: 'query',
        required: false,
        schema: { type: 'integer', format: 'int32' },
      },
    }

    const result = diffToRequestPayload(diff, mockCollection, mockRequests)
    expect(result).toEqual([
      'edit',
      'request1',
      'parameters',
      [
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: { type: 'integer', format: 'int32' },
        },
      ],
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
      'edit',
      'request1',
      'description',
      'Get the list of all planets',
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
    expect(result).toBeNull()
  })

  it('handles renaming a request path', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['paths', '/planets', 'path'],
      oldValue: '/planets',
      value: '/planets/list',
    }

    const result = diffToRequestPayload(diff, mockCollection, mockRequests)
    expect(result).toEqual(['rename', 'request1', '/planets', '/planets/list'])
  })

  it('handles changing the method of a request', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['paths', '/planets', 'get', 'method'],
      oldValue: 'get',
      value: 'post',
    }

    const result = diffToRequestPayload(diff, mockCollection, mockRequests)
    expect(result).toEqual(['changeMethod', 'request1', 'get', 'post'])
  })

  it('handles invalid diff paths', () => {
    const diff: Difference = {
      type: 'CHANGE',
      path: ['invalid', 'path'],
      oldValue: 'old',
      value: 'new',
    }

    const result = diffToRequestPayload(diff, mockCollection, mockRequests)
    expect(result).toBeNull()
  })
})
