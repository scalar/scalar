import json from '@scalar/galaxy/3.1.json'
import type { Collection, Server, Tag } from '@scalar/oas-utils/entities/spec'
import microdiff, { type Difference } from 'microdiff'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  combineRenameDiffs,
  diffToInfoPayload,
  diffToServerPayload,
  diffToTagPayload,
} from './live-sync'

// describe('combineRenameDiffs', () => {
//   const original = json
//   let mutated: any

//   // Clone fresh schemas
//   beforeEach(() => {
//     mutated = JSON.parse(JSON.stringify(original))
//   })

//   it('creates a change migration for renaming a path with no other changes', () => {
//     // Rename a path
//     mutated.paths['/planoots'] = { ...mutated.paths['/planets'] }
//     delete mutated.paths['/planets']

//     const diff = microdiff(original, mutated)
//     const combinedDiff = combineRenameDiffs(diff)

//     expect(combinedDiff).toEqual([
//       {
//         type: 'CHANGE',
//         path: ['paths', 'path'],
//         oldValue: '/planets',
//         value: '/planoots',
//       } as Difference,
//     ])
//   })

//   it('creates two change migrations for renaming a path with child diffs', () => {
//     // Rename a path and modify a child property
//     mutated.paths['/planoots'] = { ...mutated.paths['/planets'] }
//     mutated.paths['/planoots'].get.summary = 'Get all planoots'
//     delete mutated.paths['/planets']

//     const diff = microdiff(original, mutated)
//     const combinedDiff = combineRenameDiffs(diff)

//     expect(combinedDiff).toEqual([
//       {
//         type: 'CHANGE',
//         path: ['paths', 'path'],
//         oldValue: '/planets',
//         value: '/planoots',
//       } as Difference,
//       {
//         type: 'CHANGE',
//         path: ['paths', '/planoots', 'get', 'summary'],
//         oldValue: 'Get all planets',
//         value: 'Get all planoots',
//       } as Difference,
//     ])
//   })

//   it('creates two change migrations for renaming a path and a method', () => {
//     // Rename a path and a method
//     mutated.paths['/planoots'] = { ...mutated.paths['/planets'] }
//     delete mutated.paths['/planets']

//     mutated.paths['/planoots'].put = { ...mutated.paths['/planoots'].get }
//     delete mutated.paths['/planoots'].get

//     const diff = microdiff(original, mutated)
//     const combinedDiff = combineRenameDiffs(diff)

//     expect(combinedDiff).toEqual([
//       {
//         type: 'CHANGE',
//         path: ['paths', 'path'],
//         oldValue: '/planets',
//         value: '/planoots',
//       } as Difference,
//       {
//         type: 'CHANGE',
//         path: ['paths', '/planoots', 'method'],
//         oldValue: 'get',
//         value: 'put',
//       } as Difference,
//     ])
//   })

//   it('creates a change migration for changing a method with no other changes', () => {
//     // Rename a method
//     mutated.paths['/planets'].put = { ...mutated.paths['/planets'].get }
//     delete mutated.paths['/planets'].get

//     const diff = microdiff(original, mutated)
//     const combinedDiff = combineRenameDiffs(diff)

//     expect(combinedDiff).toEqual([
//       {
//         type: 'CHANGE',
//         path: ['paths', '/planets', 'method'],
//         oldValue: 'get',
//         value: 'put',
//       } as Difference,
//     ])
//   })

//   it('creates a change migration for renaming a method with child diffs', () => {
//     // Rename a method and modify a child property
//     mutated.paths['/planets'].put = { ...mutated.paths['/planets'].get }
//     mutated.paths['/planets'].put.summary = 'Update a planet'
//     delete mutated.paths['/planets'].get

//     const diff = microdiff(original, mutated)
//     const combinedDiff = combineRenameDiffs(diff)

//     expect(combinedDiff).toEqual([
//       {
//         type: 'CHANGE',
//         path: ['paths', '/planets', 'method'],
//         oldValue: 'get',
//         value: 'put',
//       } as Difference,
//       {
//         type: 'CHANGE',
//         path: ['paths', '/planets', 'put', 'summary'],
//         oldValue: 'Get all planets',
//         value: 'Update a planet',
//       } as Difference,
//     ])
//   })

//   it('handles deep changes in the schema', () => {
//     // Modify a deep property in the schema
//     mutated.paths['/planets'].get.responses['200'].content[
//       'application/json'
//     ].schema.allOf[0].properties.data = { type: 'number', examples: [1] }

//     const diff = microdiff(original, mutated)
//     const combinedDiff = combineRenameDiffs(diff)

//     expect(combinedDiff).toEqual([
//       {
//         type: 'CHANGE',
//         path: [
//           'paths',
//           '/planets',
//           'get',
//           'responses',
//           '200',
//           'content',
//           'application/json',
//           'schema',
//           'allOf',
//           0,
//           'properties',
//           'data',
//           'type',
//         ],
//         oldValue: 'array',
//         value: 'number',
//       } as Difference,
//     ])
//   })
// })

// describe('diffToInfoPayload', () => {
//   const mockCollection: Collection = {
//     uid: 'collection1',
//     info: {
//       title: 'Test API',
//       version: '1.0.0',
//       description: 'A test API for unit testing',
//     },
//     // ... other required properties
//   } as Collection

//   it('generates a payload for updating the title', () => {
//     const diff: Difference = {
//       type: 'CHANGE',
//       path: ['info', 'title'],
//       oldValue: 'Test API',
//       value: 'Updated Test API',
//     }

//     const result = diffToInfoPayload(diff, mockCollection)
//     expect(result).toEqual(['collection1', 'info.title', 'Updated Test API'])
//   })

//   it('generates a payload for updating the version', () => {
//     const diff: Difference = {
//       type: 'CHANGE',
//       path: ['info', 'version'],
//       oldValue: '1.0.0',
//       value: '2.0.0',
//     }

//     const result = diffToInfoPayload(diff, mockCollection)
//     expect(result).toEqual(['collection1', 'info.version', '2.0.0'])
//   })

//   it('generates a payload for updating the description', () => {
//     const diff: Difference = {
//       type: 'CHANGE',
//       path: ['info', 'description'],
//       oldValue: 'A test API for unit testing',
//       value: 'An updated test API for unit testing',
//     }

//     const result = diffToInfoPayload(diff, mockCollection)
//     expect(result).toEqual([
//       'collection1',
//       'info.description',
//       'An updated test API for unit testing',
//     ])
//   })

//   it('generates a payload for adding a new property', () => {
//     const diff: Difference = {
//       type: 'CREATE',
//       path: ['info', 'termsOfService'],
//       value: 'https://example.com/terms',
//     }

//     const result = diffToInfoPayload(diff, mockCollection)
//     expect(result).toEqual([
//       'collection1',
//       'info.termsOfService',
//       'https://example.com/terms',
//     ])
//   })

//   it('generates a payload for removing a property', () => {
//     const collectionWithExtra = {
//       ...mockCollection,
//       info: {
//         ...mockCollection.info,
//         termsOfService: 'https://example.com/terms',
//       },
//     } as Collection

//     const diff: Difference = {
//       type: 'REMOVE',
//       path: ['info', 'termsOfService'],
//       oldValue: 'https://example.com/terms',
//     }

//     const result = diffToInfoPayload(diff, collectionWithExtra)
//     expect(result).toEqual(['collection1', 'info.termsOfService', undefined])
//   })
// })

// describe('diffToServerPayload', () => {
//   const mockCollection: Collection = {
//     uid: 'collection1',
//     servers: ['server1', 'server2', 'server3'],
//   } as Collection

//   const mockServers: Record<string, Server> = {
//     server1: {
//       uid: 'server1',
//       url: 'https://api.example.com',
//       description: 'Production server',
//     },
//     server2: {
//       uid: 'server2',
//       url: 'https://staging.example.com',
//       description: 'Staging server',
//     },
//     server3: {
//       uid: 'server3',
//       url: 'https://{environment}.example.com/{version}/',
//       description: 'Development server',
//       variables: {
//         version: { default: 'v1', enum: ['v1', 'v2'] },
//         environment: {
//           default: 'production',
//           enum: ['production', 'staging'],
//         },
//       },
//     },
//   }

//   it('generates an edit payload for updating a server property', () => {
//     const diff: Difference = {
//       type: 'CHANGE',
//       path: ['servers', 0, 'url'],
//       oldValue: 'https://api.example.com',
//       value: 'https://new-api.example.com',
//     }

//     const result = diffToServerPayload(diff, mockCollection, mockServers)
//     expect(result).toEqual([
//       'edit',
//       'server1',
//       'url',
//       'https://new-api.example.com',
//     ])
//   })

//   it('generates a delete payload for removing a server', () => {
//     const diff: Difference = {
//       type: 'REMOVE',
//       path: ['servers', 1],
//       oldValue: mockServers.server2,
//     }

//     const result = diffToServerPayload(diff, mockCollection, mockServers)
//     expect(result).toEqual(['delete', 'server2', 'collection1'])
//   })

//   it('generates an add payload for creating a new server', () => {
//     const newServer: Server = {
//       uid: 'server4',
//       url: 'https://test.example.com',
//       description: 'Test server',
//     }
//     const diff: Difference = {
//       type: 'CREATE',
//       path: ['servers', 3],
//       value: newServer,
//     }

//     const result = diffToServerPayload(diff, mockCollection, mockServers)
//     expect(result).toEqual(['add', newServer, 'collection1'])
//   })

//   it('generates an edit payload for adding a server variable', () => {
//     const diff: Difference = {
//       type: 'CREATE',
//       path: ['servers', 0, 'variables', 'newVar'],
//       value: { default: 'default', enum: ['default', 'other'] },
//     }

//     const result = diffToServerPayload(diff, mockCollection, mockServers)
//     expect(result).toEqual([
//       'edit',
//       'server1',
//       'variables.newVar',
//       { default: 'default', enum: ['default', 'other'] },
//     ])
//   })

//   it('generates an edit payload for updating a server variable', () => {
//     const diff: Difference = {
//       type: 'CHANGE',
//       path: ['servers', 2, 'variables', 'version', 'default'],
//       oldValue: 'v1',
//       value: 'v2',
//     }

//     const result = diffToServerPayload(diff, mockCollection, mockServers)
//     expect(result).toEqual([
//       'edit',
//       'server3',
//       'variables.version.default',
//       'v2',
//     ])
//   })

//   it('generates an edit payload for removing a server variable', () => {
//     const diff: Difference = {
//       type: 'REMOVE',
//       path: ['servers', 2, 'variables', 'version'],
//       oldValue: { default: 'v1', enum: ['v1', 'v2'] },
//     }

//     const result = diffToServerPayload(diff, mockCollection, mockServers)
//     expect(result).toEqual(['edit', 'server3', 'variables.version', undefined])
//   })

//   it('generates an edit payload for adding all variables to a server', () => {
//     const diff: Difference = {
//       type: 'CREATE',
//       path: ['servers', 1, 'variables'],
//       value: {
//         version: { default: 'v1', enum: ['v1', 'v2'] },
//         environment: { default: 'staging', enum: ['production', 'staging'] },
//       },
//     }

//     const result = diffToServerPayload(diff, mockCollection, mockServers)
//     expect(result).toEqual([
//       'edit',
//       'server2',
//       'variables',
//       {
//         version: { default: 'v1', enum: ['v1', 'v2'] },
//         environment: { default: 'staging', enum: ['production', 'staging'] },
//       },
//     ])
//   })

//   it('generates an edit payload for removing all variables from a server', () => {
//     const diff: Difference = {
//       type: 'REMOVE',
//       path: ['servers', 2, 'variables'],
//       oldValue: mockServers.server3.variables,
//     }

//     const result = diffToServerPayload(diff, mockCollection, mockServers)
//     expect(result).toEqual(['edit', 'server3', 'variables', {}])
//   })

//   it('generates an edit payload for updating a server variable enum', () => {
//     const diff: Difference = {
//       type: 'CHANGE',
//       path: ['servers', 2, 'variables', 'version', 'enum'],
//       oldValue: ['v1', 'v2'],
//       value: ['v1', 'v2', 'v3'],
//     }

//     const result = diffToServerPayload(diff, mockCollection, mockServers)
//     expect(result).toEqual([
//       'edit',
//       'server3',
//       'variables.version.enum',
//       ['v1', 'v2', 'v3'],
//     ])
//   })

//   it('returns null when trying to edit a non-existent server', () => {
//     const diff: Difference = {
//       type: 'CHANGE',
//       path: ['servers', 4, 'url'],
//       oldValue: 'https://nonexistent.example.com',
//       value: 'https://new-nonexistent.example.com',
//     }

//     const result = diffToServerPayload(diff, mockCollection, mockServers)
//     expect(result).toBeNull()
//   })

//   it('returns null for if a server is not found', () => {
//     const diff: Difference = {
//       type: 'CHANGE',
//       path: ['servers', 99, 'variables', 'port'],
//       oldValue: [99],
//       value: [99],
//     }

//     const result = diffToServerPayload(diff, mockCollection, mockServers)
//     expect(result).toBeNull()
//   })

//   it('returns null for unhandled diff types', () => {
//     const diff: Difference = {
//       type: 'CHANGE',
//       path: ['servers'],
//       oldValue: [],
//       value: [],
//     }

//     const result = diffToServerPayload(diff, mockCollection, mockServers)
//     expect(result).toBeNull()
//   })
// })

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
