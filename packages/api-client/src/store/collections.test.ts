import type { Collection } from '@scalar/oas-utils/entities/spec'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import { mutationFactory } from '@scalar/object-utils/mutator-record'
import { describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'

import {
  createStoreCollections,
  extendedCollectionDataFactory,
} from './collections'
import { createStoreServers } from './servers'

// Mock data
vi.mock('@/store', () => ({
  useWorkspace: vi.fn(),
}))

const mockDraftsCollection: Collection = {
  'uid': 'drafts',
  'type': 'collection',
  'children': [],
  'openapi': '3.1.0',
  'security': [],
  'x-scalar-icon': 'interface-content-folder',
  'securitySchemes': [],
  'selectedSecuritySchemeUids': [],
  'servers': [],
  'requests': [],
  'tags': [],
  'selectedServerUid': '',
  'watchMode': false,
  'watchModeStatus': 'IDLE',
}

const mockWorkspace: Workspace = {
  uid: 'workspace1',
  name: 'Mock Workspace',
  description: 'A mock workspace for testing',
  collections: [] as string[],
  environments: {},
  activeEnvironmentId: '',
  cookies: [],
  themeId: 'default' as const,
  selectedHttpClient: {
    targetKey: 'node',
    clientKey: 'undici',
  },
}

const mockCollection: Collection = {
  'uid': 'collection1',
  'info': { title: 'Test Collection', version: '1.0.0' },
  'tags': [],
  'requests': [],
  'servers': [],
  'x-scalar-environments': {},
  'type': 'collection',
  'children': [],
  'openapi': '3.1.0',
  'security': [],
  'x-scalar-icon': 'interface-content-folder',
  'securitySchemes': [],
  'selectedSecuritySchemeUids': [],
  'selectedServerUid': '',
  'watchMode': false,
  'watchModeStatus': 'IDLE',
}

const createStoreContext = () => {
  const { collections, collectionMutators } = createStoreCollections(false)
  collections[mockDraftsCollection.uid] = mockDraftsCollection
  mockWorkspace.collections.push(mockDraftsCollection.uid)
  const { servers, serverMutators } = createStoreServers(false)

  return {
    collections,
    collectionMutators,
    requests: {},
    requestMutators: mutationFactory({}, reactive({})),
    requestExamples: {},
    requestExampleMutators: mutationFactory({}, reactive({})),
    workspaces: { [mockWorkspace.uid]: mockWorkspace },
    workspaceMutators: mutationFactory({}, reactive({})),
    tags: {},
    tagMutators: mutationFactory({}, reactive({})),
    cookies: {},
    cookieMutators: mutationFactory({}, reactive({})),
    environments: {},
    environmentMutators: mutationFactory({}, reactive({})),
    serverMutators,
    servers,
    securitySchemes: {},
    securitySchemeMutators: mutationFactory({}, reactive({})),
  }
}

describe('Collections Store', () => {
  it('should add a collection', () => {
    const storeContext = createStoreContext()
    const { addCollection } = extendedCollectionDataFactory(storeContext)

    // add the collection
    const collection = addCollection(mockCollection, mockWorkspace.uid)

    expect(storeContext.collections[collection.uid]).toBeDefined()
    expect(storeContext.collections[collection.uid]?.info?.title).toEqual(
      'Test Collection',
    )
  })

  describe('should delete a collection', () => {
    const storeContext = createStoreContext()
    const { addCollection, deleteCollection } =
      extendedCollectionDataFactory(storeContext)

    const collectionPayload = {
      ...mockCollection,
      servers: ['collection-server'],
      tags: ['collection-tag'],
      requests: ['collection-request'],
    }

    const anotherCollectionPayload = {
      ...mockCollection,
      uid: 'collection2',
      servers: ['collection-server-2'],
      tags: ['collection-tag-2'],
      requests: ['collection-request-2'],
    }

    // Add the first collection
    const collection = addCollection(collectionPayload, mockWorkspace.uid)

    // Add the second collection
    const anotherCollection = addCollection(
      anotherCollectionPayload,
      mockWorkspace.uid,
    )

    const collectionServer = {
      uid: 'collection-server',
      url: 'https://api.example.com',
      description: 'A collection server',
    }

    const anotherCollectionServer = {
      uid: 'collection-server-2',
      url: 'https://api.example.com/2',
    }

    storeContext.serverMutators.add(collectionServer)
    storeContext.serverMutators.add(anotherCollectionServer)

    // delete the collection
    deleteCollection(collection, mockWorkspace)

    it('should delete its tags', () => {
      expect(storeContext.tags).not.toContain('collection-tag')
    })

    it('should delete its requests', () => {
      expect(storeContext.requests).not.toContain('collection-request')
    })

    it('should delete its servers', () => {
      expect(Object.keys(storeContext.servers)).not.toContain(
        'collection-server',
      )
      expect(Object.keys(storeContext.servers)).toContain('collection-server-2')
    })

    it('should remove the collection from the workspace', () => {
      expect(storeContext.collections[collection.uid]).toBeUndefined()
      expect(storeContext.collections[anotherCollection.uid]).toBeDefined()
    })
  })
})
